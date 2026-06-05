/**
 * MUHASEBE MANTIK KÜTÜPHANESİ
 * ----------------------------------------------------------------------------
 * Bu modül projenin EN KRİTİK parçasıdır.
 *
 * Temel ilkeler:
 * 1. Bakiyeler, miktarlar ve tutarlar ASLA doğrudan güncellenmez. Sadece
 *    hareketler (movements) eklenir. Mevcut değer her zaman hareketlerden
 *    hesaplanır (event sourcing mantığı).
 *
 * 2. İptal / iade / ters kayıt: Orijinal kayıt SILINMEZ, soft delete +
 *    ters hareket eklenir. Bu sayede:
 *    - Geçmiş raporlar tutarlı kalır
 *    - Audit log tutarlı olur
 *    - ERP entegrasyonunda external kayıtlar etkilenmez
 *
 * 3. Bütünlük (integrity):
 *    - Para işlemleri: grandTotal = sum(items.lineTotal) ± discount ± vat
 *    - Stok: applySale öncesi yeterlilik kontrolü
 *    - Tüm hareketler transaction içinde yazılır
 *
 * 4. Tenant izolasyonu: Bu fonksiyonlar tenant_id ile çağrılmalı; hareketler
 *    her zaman tenant'lıdır.
 *
 * Daha fazla detay: docs/muhasebe-mantigi.md
 */

import type { CustomerMovementType, StockMovementType, CashMovementType } from '../enums/common.enum';

// =============================================================================
// TİPLER
// =============================================================================

/** Müşteri/car hareketi (borç/alacak yönünde). */
export interface CustomerMovementInput {
  type: CustomerMovementType; // 'DEBIT' | 'CREDIT'
  amount: number;             // her zaman pozitif; yön type'tan gelir
  currency?: string;          // varsayılan TRY
  refType?: string;           // 'SALE', 'COLLECTION', 'RETURN', 'SALE_CANCEL', 'CANCEL'...
  refId?: string;
  refNumber?: string;
  description?: string;
  transactionDate?: Date;
}

/** Stok hareketi (giriş/çıkış/düzeltme/transfer). */
export interface StockMovementInput {
  productId: string;
  warehouseId: string;
  type: StockMovementType;     // 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST'
  quantity: number;           // IN/OUT için pozitif; ADJUST için signed (+/-)
  unitCost?: number;
  refType?: string;
  refId?: string;
  refNumber?: string;
  description?: string;
  transactionDate?: Date;
  // TRANSFER için: çıkış hareketinde sourceWarehouseId, giriş hareketinde targetWarehouseId
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
}

/** Kasa/banka hareketi. */
export interface CashMovementInput {
  cashAccountId: string;
  type: CashMovementType;     // 'IN' | 'OUT' | 'TRANSFER'
  amount: number;             // her zaman pozitif
  currency?: string;
  refType?: string;
  refId?: string;
  refNumber?: string;
  description?: string;
  transactionDate?: Date;
  sourceAccountId?: string;  // TRANSFER için
  targetAccountId?: string;  // TRANSFER için
}

// =============================================================================
// HESAPLAMA FONKSİYONLARI (Read-only, DB bağımsız)
// =============================================================================

/**
 * Cari bakiyeyi hareketlerden hesapla.
 *
 * Mantık:
 *   - DEBIT (borç): müşterinin bize borcu ARTAR
 *   - CREDIT (alacak): müşterinin bize borcu AZALIR (tahsilat, iade, iptal)
 *
 * Pozitif bakiye = müşteri bize borçlu
 * Negatif bakiye = biz müşteriye borçluyuz (avans, iade fazlası)
 */
export function calculateCustomerBalance(
  movements: Array<{ type: CustomerMovementType; amount: number }>,
  options: { precision?: number } = {},
): number {
  const precision = options.precision ?? 2;
  const total = movements.reduce((sum, m) => {
    return m.type === 'DEBIT' ? sum + m.amount : sum - m.amount;
  }, 0);
  return roundMoney(total, precision);
}

/**
 * Bir ürünün belirli bir depodaki mevcut miktarını hareketlerden hesapla.
 *
 * Mantık:
 *   - IN  : +quantity
 *   - OUT : -quantity
 *   - ADJUST: signed quantity (artı ise +, eksi ise -)
 *   - TRANSFER: Bu fonksiyonda ayrı kalem (çıkış ve giriş ayrı ayrı kaydedilir)
 */
export function calculateStockQuantity(
  movements: Array<{ type: StockMovementType; quantity: number }>,
  options: { precision?: number } = {},
): number {
  const precision = options.precision ?? 4;
  const total = movements.reduce((sum, m) => {
    switch (m.type) {
      case 'IN':
        return sum + m.quantity;
      case 'OUT':
        return sum - m.quantity;
      case 'ADJUST':
        return sum + m.quantity; // signed
      case 'TRANSFER':
        return sum; // yansız
      default:
        return sum;
    }
  }, 0);
  return roundQuantity(total, precision);
}

/**
 * Kasa/banka hesabının güncel bakiyesini hareketlerden hesapla.
 *
 * Mantık:
 *   - IN: +amount
 *   - OUT: -amount
 *   - TRANSFER: Bu fonksiyonda ayrı kalem (kaynak OUT, hedef IN ayrı kaydedilir)
 */
export function calculateCashBalance(
  movements: Array<{ type: CashMovementType; amount: number }>,
  options: { precision?: number } = {},
): number {
  const precision = options.precision ?? 2;
  const total = movements.reduce((sum, m) => {
    switch (m.type) {
      case 'IN':
        return sum + m.amount;
      case 'OUT':
        return sum - m.amount;
      case 'TRANSFER':
        return sum; // yansız
      default:
        return sum;
    }
  }, 0);
  return roundMoney(total, precision);
}

// =============================================================================
// İŞLEM UYGULAMA FONKSİYONLARI
// (Bir business action sonucu oluşması gereken hareketleri üretir.
//  Backend bunları transaction içinde DB'ye yazar.)
// =============================================================================

/** Satış sonucu üretilecek hareketler. */
export interface SaleMovementSet {
  customerMovements: CustomerMovementInput[];
  stockMovements: StockMovementInput[];
  /** Eğer satış anında tahsilat da varsa (peşin satış) cash hareketi üretilir. */
  cashMovements: CashMovementInput[];
}

/**
 * Satış işlemi için gerekli tüm hareketleri üretir.
 * DİKKAT: Bu fonksiyon sadece HAREKET ÜRETIR. DB'ye yazmaz.
 *         Yazma işlemi backend tarafında Prisma transaction içinde yapılmalı.
 *
 * @throws {AccountingError} Stok yetersiz veya tutar tutarsızsa
 */
export function applySale(input: {
  saleId: string;
  saleNumber: string;
  customerId: string;
  warehouseId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number;       // 0-100
    discountAmount?: number;    // fixed
    vatRate: number;             // 0-100
  }>;
  /** Mevcut stok miktarları (ürün+depo bazında). applySale öncesi kontrol için. */
  currentStockQuantities: Record<string, number>;
  /** Peşin tahsilat yapıldıysa (varsa). */
  paidAmount?: number;
  cashAccountId?: string;
  paymentType?: 'CASH' | 'CARD' | 'BANK' | 'EFT' | 'CHECK' | 'OTHER';
  transactionDate?: Date;
}): SaleMovementSet {
  const result: SaleMovementSet = {
    customerMovements: [],
    stockMovements: [],
    cashMovements: [],
  };
  const txDate = input.transactionDate ?? new Date();

  // 1) Stok yeterlilik kontrolü (her kalem için)
  for (const item of input.items) {
    const key = `${item.productId}@${input.warehouseId}`;
    const current = input.currentStockQuantities[key] ?? 0;
    if (current < item.quantity) {
      throw new AccountingError(
        'INSUFFICIENT_STOCK',
        `Yetersiz stok: ${item.productId} (mevcut: ${current}, istenen: ${item.quantity})`,
        { productId: item.productId, current, requested: item.quantity },
      );
    }
  }

  // 2) Satış toplamlarını hesapla
  const items = input.items.map((item) => {
    const lineGross = item.quantity * item.unitPrice;
    const discount = item.discountAmount ?? (lineGross * (item.discountRate ?? 0)) / 100;
    const lineNet = lineGross - discount;
    const vat = (lineNet * item.vatRate) / 100;
    return {
      ...item,
      lineGross: roundMoney(lineGross),
      discount: roundMoney(discount),
      lineNet: roundMoney(lineNet),
      vat: roundMoney(vat),
      lineTotal: roundMoney(lineNet + vat),
    };
  });
  const grandTotal = roundMoney(items.reduce((s, i) => s + i.lineTotal, 0));
  const totalVat = roundMoney(items.reduce((s, i) => s + i.vat, 0));
  const totalDiscount = roundMoney(items.reduce((s, i) => s + i.discount, 0));
  const subTotal = roundMoney(items.reduce((s, i) => s + i.lineNet, 0));

  // Bütünlük kontrolü
  const expectedGrand = roundMoney(subTotal + totalVat);
  if (Math.abs(expectedGrand - grandTotal) > 0.01) {
    throw new AccountingError(
      'AMOUNT_MISMATCH',
      `Tutar tutarsız: subTotal+vat=${expectedGrand}, grandTotal=${grandTotal}`,
    );
  }

  // 3) Cari borç (DEBIT) — satılan tutar
  result.customerMovements.push({
    type: 'DEBIT',
    amount: grandTotal,
    refType: 'SALE',
    refId: input.saleId,
    refNumber: input.saleNumber,
    description: `Satış: ${input.saleNumber} (${items.length} kalem)`,
    transactionDate: txDate,
  });

  // 4) Stok çıkışı (her kalem için)
  for (const item of items) {
    result.stockMovements.push({
      productId: item.productId,
      warehouseId: input.warehouseId,
      type: 'OUT',
      quantity: item.quantity,
      unitCost: item.unitPrice,
      refType: 'SALE',
      refId: input.saleId,
      refNumber: input.saleNumber,
      description: `Satış çıkışı: ${input.saleNumber}`,
      transactionDate: txDate,
    });
  }

  // 5) Peşin tahsilat varsa
  if (input.paidAmount && input.paidAmount > 0) {
    if (!input.cashAccountId) {
      throw new AccountingError('MISSING_CASH_ACCOUNT', 'Peşin tahsilat için kasa seçilmelidir');
    }
    if (input.paidAmount > grandTotal) {
      throw new AccountingError(
        'OVERPAYMENT',
        `Tahsilat tutarı satış tutarından büyük olamaz (tahsilat: ${input.paidAmount}, satış: ${grandTotal})`,
      );
    }
    result.cashMovements.push({
      cashAccountId: input.cashAccountId,
      type: 'IN',
      amount: input.paidAmount,
      refType: 'SALE',
      refId: input.saleId,
      refNumber: input.saleNumber,
      description: `Satış tahsilatı: ${input.saleNumber}`,
      transactionDate: txDate,
    });
    // Cari hareket zaten DEBIT olarak eklendi, tahsilat sonradan ayrıca yansıtılır (CREDIT)
    if (input.paidAmount < grandTotal) {
      // Kısmi tahsilat: kalan borç olarak kalır
      // İstersen burada kalan tutar için ayrıca DEBIT oluşturulabilir ama zaten grandTotal DEBIT
    }
  }

  // sonuç meta verisi
  (result as SaleMovementSet & { _meta?: unknown })._meta = {
    grandTotal,
    subTotal,
    totalVat,
    totalDiscount,
    itemCount: items.length,
  };

  return result;
}

/**
 * Satış iptali için ters hareketler üretir.
 * Orijinal satış kaydı SILINMEZ — sadece status=CANCELLED yapılır ve ters hareketler eklenir.
 */
export function applySaleCancel(input: {
  originalSaleId: string;
  originalSaleNumber: string;
  customerId: string;
  warehouseId: string;
  items: Array<{ productId: string; quantity: number }>;
  reason: string;
  cancelledBy: string;
  transactionDate?: Date;
}): SaleMovementSet {
  const result: SaleMovementSet = {
    customerMovements: [],
    stockMovements: [],
    cashMovements: [],
  };
  const txDate = input.transactionDate ?? new Date();

  // 1) Cari alacak (CREDIT) — ters borç
  result.customerMovements.push({
    type: 'CREDIT',
    amount: 0, // backend orijinal sale'den çekip doldurmalı; burada bilinmiyor
    refType: 'SALE_CANCEL',
    refId: input.originalSaleId,
    refNumber: input.originalSaleNumber,
    description: `Satış iptal: ${input.originalSaleNumber} — ${input.reason}`,
    transactionDate: txDate,
  });

  // 2) Stok girişi (her kalem için)
  for (const item of input.items) {
    result.stockMovements.push({
      productId: item.productId,
      warehouseId: input.warehouseId,
      type: 'IN',
      quantity: item.quantity,
      refType: 'SALE_CANCEL',
      refId: input.originalSaleId,
      refNumber: input.originalSaleNumber,
      description: `İptal stok girişi: ${input.originalSaleNumber}`,
      transactionDate: txDate,
    });
  }

  return result;
}

/** Tahsilat sonucu üretilecek hareketler. */
export function applyCollection(input: {
  collectionId: string;
  collectionNumber: string;
  customerId: string;
  cashAccountId: string;
  amount: number;
  /** Mevcut bakiye (pozitif = müşteri bize borçlu). */
  currentCustomerBalance: number;
  transactionDate?: Date;
}): { customerMovements: CustomerMovementInput[]; cashMovements: CashMovementInput[] } {
  const txDate = input.transactionDate ?? new Date();
  if (input.amount <= 0) {
    throw new AccountingError('INVALID_AMOUNT', 'Tahsilat tutarı pozitif olmalıdır');
  }
  // Bakiye kontrolü: tahsilat borçtan büyük olamaz (avans olarak kalabilir ama MVP'de reddet)
  if (input.amount > Math.max(0, input.currentCustomerBalance)) {
    throw new AccountingError(
      'OVERPAYMENT',
      `Tahsilat tutarı cari borcundan büyük olamaz (borç: ${input.currentCustomerBalance}, tahsilat: ${input.amount})`,
    );
  }
  return {
    customerMovements: [
      {
        type: 'CREDIT',
        amount: input.amount,
        refType: 'COLLECTION',
        refId: input.collectionId,
        refNumber: input.collectionNumber,
        description: `Tahsilat: ${input.collectionNumber}`,
        transactionDate: txDate,
      },
    ],
    cashMovements: [
      {
        cashAccountId: input.cashAccountId,
        type: 'IN',
        amount: input.amount,
        refType: 'COLLECTION',
        refId: input.collectionId,
        refNumber: input.collectionNumber,
        description: `Tahsilat: ${input.collectionNumber}`,
        transactionDate: txDate,
      },
    ],
  };
}

/**
 * Stok transferi (depo A → depo B) için 2 hareket üretir.
 *   - depo A'dan OUT
 *   - depo B'ye IN
 */
export function applyStockTransfer(input: {
  transferId: string;
  transferNumber: string;
  productId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: number;
  currentSourceStock: number;
  transactionDate?: Date;
}): { stockMovements: StockMovementInput[] } {
  const txDate = input.transactionDate ?? new Date();
  if (input.quantity <= 0) {
    throw new AccountingError('INVALID_QUANTITY', 'Transfer miktarı pozitif olmalıdır');
  }
  if (input.sourceWarehouseId === input.targetWarehouseId) {
    throw new AccountingError('SAME_WAREHOUSE', 'Kaynak ve hedef depo aynı olamaz');
  }
  if (input.currentSourceStock < input.quantity) {
    throw new AccountingError(
      'INSUFFICIENT_STOCK',
      `Kaynak depoda yeterli stok yok (mevcut: ${input.currentSourceStock}, istenen: ${input.quantity})`,
    );
  }
  return {
    stockMovements: [
      {
        productId: input.productId,
        warehouseId: input.sourceWarehouseId,
        type: 'TRANSFER',
        quantity: -input.quantity, // çıkış
        refType: 'TRANSFER',
        refId: input.transferId,
        refNumber: input.transferNumber,
        description: `Transfer çıkış: ${input.transferNumber}`,
        transactionDate: txDate,
        sourceWarehouseId: input.sourceWarehouseId,
        targetWarehouseId: input.targetWarehouseId,
      },
      {
        productId: input.productId,
        warehouseId: input.targetWarehouseId,
        type: 'TRANSFER',
        quantity: input.quantity, // giriş
        refType: 'TRANSFER',
        refId: input.transferId,
        refNumber: input.transferNumber,
        description: `Transfer giriş: ${input.transferNumber}`,
        transactionDate: txDate,
        sourceWarehouseId: input.sourceWarehouseId,
        targetWarehouseId: input.targetWarehouseId,
      },
    ],
  };
}

/**
 * Stok düzeltme (ADJUST) için tek hareket üretir.
 * Pozitif quantity = fazla stok tespit (giriş), negatif = eksik stok tespit (çıkış).
 */
export function applyStockAdjust(input: {
  adjustId: string;
  productId: string;
  warehouseId: string;
  /** İşaretli fark: +5 = 5 adet fazla, -3 = 3 adet eksik. */
  signedDifference: number;
  reason: string;
  transactionDate?: Date;
}): { stockMovements: StockMovementInput[] } {
  const txDate = input.transactionDate ?? new Date();
  if (input.signedDifference === 0) {
    throw new AccountingError('ZERO_ADJUST', 'Sıfır düzeltme yapılamaz');
  }
  return {
    stockMovements: [
      {
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: 'ADJUST',
        quantity: input.signedDifference,
        refType: 'STOCK_ADJUST',
        refId: input.adjustId,
        description: `Stok düzeltme: ${input.reason}`,
        transactionDate: txDate,
      },
    ],
  };
}

// =============================================================================
// VALİDASYON YARDIMCILARI
// =============================================================================

/** Para yuvarlama (banker rounding değil, normal half-up). */
export function roundMoney(value: number, precision: number = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/** Miktar yuvarlama (stok için daha yüksek hassasiyet). */
export function roundQuantity(value: number, precision: number = 4): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/** Para için validasyon. */
export function isValidMoney(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

/** Miktar için validasyon (negatif olamaz, sayı). */
export function isValidQuantity(value: number, allowZero: boolean = false): boolean {
  if (!Number.isFinite(value) || Number.isNaN(value)) return false;
  return allowZero ? value >= 0 : value > 0;
}

/** Tutar bütünlüğü kontrolü: items toplamı grandTotal'a eşit mi? */
export function validateSaleTotal(
  items: Array<{ quantity: number; unitPrice: number; discountAmount?: number; discountRate?: number; vatRate: number }>,
  grandTotal: number,
  tolerance: number = 0.01,
): { valid: boolean; computed: number; diff: number } {
  const computed = computeSaleGrandTotal(items);
  const diff = Math.abs(computed - grandTotal);
  return { valid: diff <= tolerance, computed, diff };
}

/** Sale item listesinden grand total hesapla. */
export function computeSaleGrandTotal(
  items: Array<{ quantity: number; unitPrice: number; discountAmount?: number; discountRate?: number; vatRate: number }>,
): number {
  const total = items.reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice;
    const discount = item.discountAmount ?? (gross * (item.discountRate ?? 0)) / 100;
    const net = gross - discount;
    const vat = (net * item.vatRate) / 100;
    return sum + net + vat;
  }, 0);
  return roundMoney(total);
}

// =============================================================================
// İADE (RETURN) HESAPLAMA
// =============================================================================

export interface ReturnLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
}

export interface ReturnLineCalc {
  productId: string;
  lineSubTotal: number;
  lineVatAmount: number;
  lineGrandTotal: number;
}

export interface ReturnCalcResult {
  lines: ReturnLineCalc[];
  subTotal: number;
  vatTotal: number;
  discountTotal: number;
  grandTotal: number;
}

/**
 * İade satırlarından tutar hesapla.
 * Her satır: lineSubTotal = qty * price * (1 - discountRate/100)
 *           lineVatAmount = lineSubTotal * vatRate/100
 *           lineGrandTotal = lineSubTotal + lineVatAmount
 * Toplamlar: tüm satırların toplamı.
 *
 * NOT: Bu fonksiyon event üretmez; sadece hesap yapar.
 * Stok/cari hareketleri servis katmanında oluşturulur.
 */
export function applyReturn(items: ReturnLine[]): ReturnCalcResult {
  const lines: ReturnLineCalc[] = items.map((item) => {
    const gross = item.quantity * item.unitPrice;
    const discountRate = item.discountRate ?? 0;
    const discountAmount = (gross * discountRate) / 100;
    const lineSubTotal = roundMoney(gross - discountAmount);
    const lineVatAmount = roundMoney((lineSubTotal * item.vatRate) / 100);
    const lineGrandTotal = roundMoney(lineSubTotal + lineVatAmount);
    return {
      productId: item.productId,
      lineSubTotal,
      lineVatAmount,
      lineGrandTotal,
    };
  });

  const subTotal = roundMoney(lines.reduce((s, l) => s + l.lineSubTotal, 0));
  const vatTotal = roundMoney(lines.reduce((s, l) => s + l.lineVatAmount, 0));
  const discountTotal = roundMoney(
    items.reduce((s, item) => {
      const gross = item.quantity * item.unitPrice;
      return s + (gross * (item.discountRate ?? 0)) / 100;
    }, 0),
  );
  const grandTotal = roundMoney(subTotal + vatTotal);

  return { lines, subTotal, vatTotal, discountTotal, grandTotal };
}

// =============================================================================
// HATA SINIFI
// =============================================================================

export type AccountingErrorCode =
  | 'INSUFFICIENT_STOCK'
  | 'AMOUNT_MISMATCH'
  | 'OVERPAYMENT'
  | 'INVALID_AMOUNT'
  | 'INVALID_QUANTITY'
  | 'ZERO_ADJUST'
  | 'SAME_WAREHOUSE'
  | 'MISSING_CASH_ACCOUNT';

export class AccountingError extends Error {
  public readonly code: AccountingErrorCode;
  public readonly context?: Record<string, unknown>;

  constructor(code: AccountingErrorCode, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'AccountingError';
    this.code = code;
    this.context = context;
  }
}

// =============================================================================
// ENVANTER (Snapshot oluşturmak için yardımcı)
// =============================================================================

/** Mevcut stok miktarlarını hareketlerden envanter olarak çıkar (ürün@depo bazında). */
export function buildInventorySnapshot(
  movements: Array<{ productId: string; warehouseId: string; type: StockMovementType; quantity: number }>,
  options: { precision?: number } = {},
): Record<string, number> {
  const inventory: Record<string, number> = {};
  for (const m of movements) {
    const key = `${m.productId}@${m.warehouseId}`;
    const current = inventory[key] ?? 0;
    switch (m.type) {
      case 'IN':
        inventory[key] = current + m.quantity;
        break;
      case 'OUT':
        inventory[key] = current - m.quantity;
        break;
      case 'ADJUST':
        inventory[key] = current + m.quantity;
        break;
      case 'TRANSFER':
        inventory[key] = current + m.quantity; // signed
        break;
    }
  }
  const precision = options.precision ?? 4;
  for (const key of Object.keys(inventory)) {
    const val = inventory[key] ?? 0;
    inventory[key] = roundQuantity(val, precision);
  }
  return inventory;
}

/** Mevcut cari bakiyeleri (customerId bazında) snapshot olarak çıkar. */
export function buildCustomerBalanceSnapshot(
  movements: Array<{ customerId: string; type: CustomerMovementType; amount: number }>,
  options: { precision?: number } = {},
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const m of movements) {
    const current = balances[m.customerId] ?? 0;
    balances[m.customerId] = current + (m.type === 'DEBIT' ? m.amount : -m.amount);
  }
  const precision = options.precision ?? 2;
  for (const id of Object.keys(balances)) {
    const val = balances[id] ?? 0;
    balances[id] = roundMoney(val, precision);
  }
  return balances;
}

/** Mevcut kasa bakiyeleri (cashAccountId bazında) snapshot. */
export function buildCashBalanceSnapshot(
  movements: Array<{ cashAccountId: string; type: CashMovementType; amount: number }>,
  options: { precision?: number } = {},
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const m of movements) {
    const current = balances[m.cashAccountId] ?? 0;
    switch (m.type) {
      case 'IN':
        balances[m.cashAccountId] = current + m.amount;
        break;
      case 'OUT':
        balances[m.cashAccountId] = current - m.amount;
        break;
      case 'TRANSFER':
        // Yansız: tek kasa bazında bakıldığında etki yok
        balances[m.cashAccountId] = current;
        break;
    }
  }
  const precision = options.precision ?? 2;
  for (const id of Object.keys(balances)) {
    const val = balances[id] ?? 0;
    balances[id] = roundMoney(val, precision);
  }
  return balances;
}
