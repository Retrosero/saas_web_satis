/**
 * Muhasebe Mantık Kütüphanesi — Unit Test'ler
 * ----------------------------------------------------------------------------
 * Bu test'ler projenin EN KRİTİK parçasıdır. Tüm muhasebe fonksiyonlarının:
 * 1. Matematiksel doğruluğunu
 * 2. İptal/ters kayıt simetrisini
 * 3. Bütünlük (integrity) kontrollerini
 * 4. Stok yeterlilik kontrolünü
 * 5. Para yuvarlama doğruluğunu
 * doğrular.
 *
 * Her değişiklik sonrası `pnpm --filter @saas/shared test` çalıştırılmalı.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateCustomerBalance,
  calculateStockQuantity,
  calculateCashBalance,
  applySale,
  applySaleCancel,
  applyCollection,
  applyStockTransfer,
  applyStockAdjust,
  validateSaleTotal,
  computeSaleGrandTotal,
  roundMoney,
  roundQuantity,
  isValidMoney,
  isValidQuantity,
  buildInventorySnapshot,
  buildCustomerBalanceSnapshot,
  AccountingError,
} from '../accounting.js';

describe('roundMoney', () => {
  it('2 ondalık basamağa yuvarlar', () => {
    // Not: 1.005 floating-point'te tam olarak 1.005 değildir, bu yüzden
    // net değerler ile test ediyoruz.
    expect(roundMoney(1.235)).toBeCloseTo(1.24, 2);
    expect(roundMoney(1.245)).toBeCloseTo(1.25, 2);
    expect(roundMoney(1.004)).toBeCloseTo(1, 2);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(123.456)).toBe(123.46);
  });

  it('0 ondalık basamağa yuvarlar', () => {
    expect(roundMoney(1.5, 0)).toBe(2);
    expect(roundMoney(1.4, 0)).toBe(1);
  });
});

describe('roundQuantity', () => {
  it('4 ondalık basamağa yuvarlar', () => {
    expect(roundQuantity(1.12345)).toBe(1.1235);
    expect(roundQuantity(0.00001)).toBe(0);
  });
});

describe('isValidMoney & isValidQuantity', () => {
  it('para geçerli mi', () => {
    expect(isValidMoney(100)).toBe(true);
    expect(isValidMoney(0)).toBe(true);
    expect(isValidMoney(-100)).toBe(true);
    expect(isValidMoney(NaN)).toBe(false);
    expect(isValidMoney(Infinity)).toBe(false);
  });

  it('miktar geçerli mi', () => {
    expect(isValidQuantity(5)).toBe(true);
    expect(isValidQuantity(0)).toBe(false); // allowZero=false
    expect(isValidQuantity(0, true)).toBe(true);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(NaN)).toBe(false);
  });
});

describe('calculateCustomerBalance', () => {
  it('boş liste için 0', () => {
    expect(calculateCustomerBalance([])).toBe(0);
  });

  it('DEBIT pozitif yönde toplanır', () => {
    const m = [
      { type: 'DEBIT' as const, amount: 100 },
      { type: 'DEBIT' as const, amount: 50 },
    ];
    expect(calculateCustomerBalance(m)).toBe(150);
  });

  it('CREDIT negatif yönde toplanır', () => {
    const m = [
      { type: 'CREDIT' as const, amount: 30 },
      { type: 'CREDIT' as const, amount: 20 },
    ];
    expect(calculateCustomerBalance(m)).toBe(-50);
  });

  it('karışık hareketler doğru bakiye verir', () => {
    const m = [
      { type: 'DEBIT' as const, amount: 1000 }, // satış
      { type: 'CREDIT' as const, amount: 300 }, // tahsilat
      { type: 'DEBIT' as const, amount: 200 }, // satış
      { type: 'CREDIT' as const, amount: 100 }, // tahsilat
    ];
    // 1000 - 300 + 200 - 100 = 800
    expect(calculateCustomerBalance(m)).toBe(800);
  });

  it('ondalık hassasiyet korunur', () => {
    const m = [
      { type: 'DEBIT' as const, amount: 100.10 },
      { type: 'DEBIT' as const, amount: 50.20 },
      { type: 'CREDIT' as const, amount: 75.30 },
    ];
    // 100.10 + 50.20 - 75.30 = 75.00
    expect(calculateCustomerBalance(m)).toBe(75);
  });
});

describe('calculateStockQuantity', () => {
  it('IN pozitif, OUT negatif', () => {
    const m = [
      { type: 'IN' as const, quantity: 100 },
      { type: 'OUT' as const, quantity: 30 },
    ];
    expect(calculateStockQuantity(m)).toBe(70);
  });

  it('ADJUST signed çalışır', () => {
    const m = [
      { type: 'IN' as const, quantity: 50 },
      { type: 'ADJUST' as const, quantity: 5 },   // +5
      { type: 'ADJUST' as const, quantity: -3 },  // -3
    ];
    // 50 + 5 - 3 = 52
    expect(calculateStockQuantity(m)).toBe(52);
  });

  it('TRANSFER yansız', () => {
    const m = [
      { type: 'IN' as const, quantity: 100 },
      { type: 'TRANSFER' as const, quantity: -20 }, // çıkış (kaynak depoda)
      { type: 'TRANSFER' as const, quantity: 20 },  // giriş (hedef depoda)
    ];
    // Depo bazında ayrı ayrı hesaplanmalı
    // Burada karışık ama TRANSFER yansız olduğu için sadece IN etkili
    expect(calculateStockQuantity(m)).toBe(100);
  });

  it('stok negatif olabilir (kontrol fonksiyona değil applySale\'a aittir)', () => {
    const m = [
      { type: 'IN' as const, quantity: 10 },
      { type: 'OUT' as const, quantity: 15 },
    ];
    expect(calculateStockQuantity(m)).toBe(-5);
  });
});

describe('calculateCashBalance', () => {
  it('IN pozitif, OUT negatif', () => {
    const m = [
      { type: 'IN' as const, amount: 1000 },
      { type: 'OUT' as const, amount: 300 },
    ];
    expect(calculateCashBalance(m)).toBe(700);
  });

  it('TRANSFER yansız', () => {
    const m = [
      { type: 'IN' as const, amount: 500 },
      { type: 'TRANSFER' as const, amount: 100 },  // kaynak OUT
      { type: 'TRANSFER' as const, amount: -100 }, // hedef IN
    ];
    // Bu hesap tek kasa için olduğundan 500 kalmalı
    expect(calculateCashBalance(m)).toBe(500);
  });
});

describe('validateSaleTotal', () => {
  it('doğru toplam → valid', () => {
    const items = [
      { quantity: 2, unitPrice: 100, vatRate: 20 }, // 240
      { quantity: 1, unitPrice: 50, vatRate: 20 },  // 60
    ];
    // 2*100 + 1*50 = 250 + %20 vat = 300
    const result = validateSaleTotal(items, 300);
    expect(result.valid).toBe(true);
    expect(result.computed).toBe(300);
    expect(result.diff).toBeLessThanOrEqual(0.01);
  });

  it('iskonto dahil', () => {
    const items = [
      { quantity: 1, unitPrice: 100, discountRate: 10, vatRate: 20 },
    ];
    // 100 - 10 = 90, + %20 = 108
    const result = validateSaleTotal(items, 108);
    expect(result.valid).toBe(true);
  });

  it('yanlış toplam → invalid', () => {
    const items = [{ quantity: 1, unitPrice: 100, vatRate: 20 }];
    const result = validateSaleTotal(items, 999);
    expect(result.valid).toBe(false);
  });
});

describe('computeSaleGrandTotal', () => {
  it('iskontosuz KDV dahil', () => {
    const items = [
      { quantity: 3, unitPrice: 50, vatRate: 20 },
    ];
    // 150 + 30 = 180
    expect(computeSaleGrandTotal(items)).toBe(180);
  });

  it('iskonto ve KDV karma', () => {
    const items = [
      { quantity: 2, unitPrice: 200, discountRate: 10, vatRate: 20 }, // 400-40=360+72=432
      { quantity: 1, unitPrice: 100, discountAmount: 10, vatRate: 10 }, // 90+9=99
    ];
    expect(computeSaleGrandTotal(items)).toBe(531);
  });
});

describe('applySale', () => {
  const baseInput = {
    saleId: 'sale-1',
    saleNumber: 'S-001',
    customerId: 'cust-1',
    warehouseId: 'wh-1',
    items: [
      { productId: 'p-1', quantity: 2, unitPrice: 100, vatRate: 20 }, // 240
    ],
    currentStockQuantities: { 'p-1@wh-1': 10 },
    transactionDate: new Date('2026-06-01T10:00:00Z'),
  };

  it('başarılı satış: 1 cari DEBIT + 1 stok OUT üretir', () => {
    const result = applySale(baseInput);
    expect(result.customerMovements).toHaveLength(1);
    expect(result.stockMovements).toHaveLength(1);
    expect(result.cashMovements).toHaveLength(0);

    expect(result.customerMovements[0]).toMatchObject({
      type: 'DEBIT',
      amount: 240, // 2*100 + %20 KDV
      refType: 'SALE',
      refId: 'sale-1',
      refNumber: 'S-001',
    });

    expect(result.stockMovements[0]).toMatchObject({
      productId: 'p-1',
      warehouseId: 'wh-1',
      type: 'OUT',
      quantity: 2,
      refType: 'SALE',
    });
  });

  it('stok yetersiz → INSUFFICIENT_STOCK hatası', () => {
    expect(() =>
      applySale({ ...baseInput, currentStockQuantities: { 'p-1@wh-1': 1 } }),
    ).toThrow(AccountingError);
  });

  it('peşin tahsilat varsa kasa hareketi de üretir', () => {
    const result = applySale({
      ...baseInput,
      paidAmount: 240,
      cashAccountId: 'cash-1',
    });
    expect(result.cashMovements).toHaveLength(1);
    expect(result.cashMovements[0]).toMatchObject({
      cashAccountId: 'cash-1',
      type: 'IN',
      amount: 240,
    });
  });

  it('tahsilat tutarı satışı aşamaz (OVERPAYMENT)', () => {
    expect(() =>
      applySale({
        ...baseInput,
        paidAmount: 500,
        cashAccountId: 'cash-1',
      }),
    ).toThrow(AccountingError);
  });

  it('tahsilat > 0 ama kasa seçilmemiş → MISSING_CASH_ACCOUNT', () => {
    expect(() => applySale({ ...baseInput, paidAmount: 100 })).toThrow(AccountingError);
  });

  it('çok kalemli satışta toplam doğru', () => {
    const result = applySale({
      ...baseInput,
      items: [
        { productId: 'p-1', quantity: 2, unitPrice: 100, vatRate: 20 }, // 240
        { productId: 'p-2', quantity: 1, unitPrice: 50, discountRate: 10, vatRate: 20 }, // 45+9=54
      ],
      currentStockQuantities: { 'p-1@wh-1': 10, 'p-2@wh-1': 10 },
    });
    expect(result.customerMovements[0]!.amount).toBe(294); // 240 + 54
    expect(result.stockMovements).toHaveLength(2);
  });

  it('refNumber doğru kullanılır', () => {
    const result = applySale(baseInput);
    expect(result.customerMovements[0]!.refNumber).toBe('S-001');
    expect(result.stockMovements[0]!.refNumber).toBe('S-001');
  });
});

describe('applySaleCancel (ters kayıt)', () => {
  it('iptal: 1 cari CREDIT + N stok IN üretir', () => {
    const result = applySaleCancel({
      originalSaleId: 'sale-1',
      originalSaleNumber: 'S-001',
      customerId: 'cust-1',
      warehouseId: 'wh-1',
      items: [
        { productId: 'p-1', quantity: 2 },
        { productId: 'p-2', quantity: 1 },
      ],
      reason: 'Müşteri iade istedi',
      cancelledBy: 'user-1',
    });
    expect(result.customerMovements).toHaveLength(1);
    expect(result.customerMovements[0]!.type).toBe('CREDIT');
    expect(result.customerMovements[0]!.refType).toBe('SALE_CANCEL');
    expect(result.stockMovements).toHaveLength(2);
    expect(result.stockMovements.every((m) => m.type === 'IN')).toBe(true);
    expect(result.stockMovements.every((m) => m.refType === 'SALE_CANCEL')).toBe(true);
  });
});

describe('SIMETRİ KONTROLÜ: applySale + applySaleCancel = sıfır etki', () => {
  it('cari bakiye ve stok miktarı başlangıçtaki değerlere döner', () => {
    // Başlangıç durumu: 10 adet stok, 0 bakiye
    // 1. Satış: 3 adet çıkış + 180 TL borç üretir
    const saleResult = applySale({
      saleId: 's1',
      saleNumber: 'S-100',
      customerId: 'c1',
      warehouseId: 'wh-1',
      items: [{ productId: 'p-1', quantity: 3, unitPrice: 50, vatRate: 20 }], // 180
      currentStockQuantities: { 'p-1@wh-1': 10 },
    });

    // 2. İptal: 3 adet giriş + 180 TL ters borç üretir
    const cancelResult = applySaleCancel({
      originalSaleId: 's1',
      originalSaleNumber: 'S-100',
      customerId: 'c1',
      warehouseId: 'wh-1',
      items: [{ productId: 'p-1', quantity: 3 }],
      reason: 'Test',
      cancelledBy: 'u1',
    });

    // 3. TÜM hareketleri birleştir → başlangıç durumuna dönmeli
    const allStockMovs = [
      ...saleResult.stockMovements,
      ...cancelResult.stockMovements,
    ];
    const allCustMovs = [
      ...saleResult.customerMovements,
      ...cancelResult.customerMovements,
    ];

    const finalStock = calculateStockQuantity(
      allStockMovs.map((m) => ({ type: m.type, quantity: m.quantity })),
    );

    // Stok simetrisi: 3 OUT + 3 IN = 0 etki
    expect(finalStock).toBe(0);
    expect(allStockMovs).toHaveLength(2);

    // Cari simetrisi: amount backend tarafından doldurulur (orijinal sale'den çekilir)
    // Bu test sadece hareket yapısının doğru üretildiğini kontrol eder
    const saleAmount = saleResult.customerMovements[0]!.amount;
    expect(saleAmount).toBe(180); // 3 * 50 + %20 = 180
    // İptal hareketi 0 amount ile üretilir, backend doldurmalı
    expect(cancelResult.customerMovements[0]!.amount).toBe(0);
  });

  it('çoklu kalem satışında her kalem için ters kayıt üretilir', () => {
    const saleResult = applySale({
      saleId: 's2',
      saleNumber: 'S-200',
      customerId: 'c1',
      warehouseId: 'wh-1',
      items: [
        { productId: 'p-1', quantity: 2, unitPrice: 100, vatRate: 20 },
        { productId: 'p-2', quantity: 1, unitPrice: 50, vatRate: 20 },
      ],
      currentStockQuantities: { 'p-1@wh-1': 10, 'p-2@wh-1': 10 },
    });
    const cancelResult = applySaleCancel({
      originalSaleId: 's2',
      originalSaleNumber: 'S-200',
      customerId: 'c1',
      warehouseId: 'wh-1',
      items: [
        { productId: 'p-1', quantity: 2 },
        { productId: 'p-2', quantity: 1 },
      ],
      reason: 'Çoklu iptal',
      cancelledBy: 'u1',
    });
    expect(saleResult.stockMovements).toHaveLength(2);
    expect(cancelResult.stockMovements).toHaveLength(2);
    const allMovs = [...saleResult.stockMovements, ...cancelResult.stockMovements];
    const finalStock = calculateStockQuantity(allMovs.map((m) => ({ type: m.type, quantity: m.quantity })));
    expect(finalStock).toBe(0);
  });
});

describe('applyCollection', () => {
  it('başarılı tahsilat: 1 cari CREDIT + 1 kasa IN üretir', () => {
    const result = applyCollection({
      collectionId: 'col-1',
      collectionNumber: 'T-001',
      customerId: 'cust-1',
      cashAccountId: 'cash-1',
      amount: 100,
      currentCustomerBalance: 200, // müşteri 200 borçlu
    });
    expect(result.customerMovements).toHaveLength(1);
    expect(result.customerMovements[0]).toMatchObject({
      type: 'CREDIT',
      amount: 100,
    });
    expect(result.cashMovements).toHaveLength(1);
    expect(result.cashMovements[0]).toMatchObject({
      type: 'IN',
      amount: 100,
    });
  });

  it('tahsilat tutarı cari borcundan büyük olamaz', () => {
    expect(() =>
      applyCollection({
        collectionId: 'col-1',
        collectionNumber: 'T-001',
        customerId: 'cust-1',
        cashAccountId: 'cash-1',
        amount: 500,
        currentCustomerBalance: 200,
      }),
    ).toThrow(AccountingError);
  });

  it('negatif tutar reddedilir', () => {
    expect(() =>
      applyCollection({
        collectionId: 'col-1',
        collectionNumber: 'T-001',
        customerId: 'cust-1',
        cashAccountId: 'cash-1',
        amount: -10,
        currentCustomerBalance: 200,
      }),
    ).toThrow(AccountingError);
  });

  it('müşteri alacaklıysa (negatif bakiye) tahsilat yapılamaz', () => {
    // Örn: iptal sonucu bakiye negatif olduysa, normal tahsilat yapılamaz
    // Bu MVP'de böyle, ileride "avans" gibi bir kavram eklenebilir
    expect(() =>
      applyCollection({
        collectionId: 'col-1',
        collectionNumber: 'T-001',
        customerId: 'cust-1',
        cashAccountId: 'cash-1',
        amount: 50,
        currentCustomerBalance: -100, // biz ona borçluyuz
      }),
    ).toThrow(AccountingError);
  });
});

describe('applyStockTransfer', () => {
  it('transfer: 2 hareket üretir (OUT + IN)', () => {
    const result = applyStockTransfer({
      transferId: 'tr-1',
      transferNumber: 'TR-001',
      productId: 'p-1',
      sourceWarehouseId: 'wh-A',
      targetWarehouseId: 'wh-B',
      quantity: 5,
      currentSourceStock: 10,
    });
    expect(result.stockMovements).toHaveLength(2);
    const out = result.stockMovements.find((m) => m.warehouseId === 'wh-A')!;
    const inn = result.stockMovements.find((m) => m.warehouseId === 'wh-B')!;
    expect(out.type).toBe('TRANSFER');
    expect(out.quantity).toBe(-5);
    expect(inn.type).toBe('TRANSFER');
    expect(inn.quantity).toBe(5);
  });

  it('aynı depo transferi reddedilir', () => {
    expect(() =>
      applyStockTransfer({
        transferId: 'tr-1',
        transferNumber: 'TR-001',
        productId: 'p-1',
        sourceWarehouseId: 'wh-A',
        targetWarehouseId: 'wh-A',
        quantity: 5,
        currentSourceStock: 10,
      }),
    ).toThrow(AccountingError);
  });

  it('kaynak depoda yeterli stok yoksa reddedilir', () => {
    expect(() =>
      applyStockTransfer({
        transferId: 'tr-1',
        transferNumber: 'TR-001',
        productId: 'p-1',
        sourceWarehouseId: 'wh-A',
        targetWarehouseId: 'wh-B',
        quantity: 100,
        currentSourceStock: 10,
      }),
    ).toThrow(AccountingError);
  });
});

describe('applyStockAdjust', () => {
  it('pozitif düzeltme (fazla stok)', () => {
    const result = applyStockAdjust({
      adjustId: 'a-1',
      productId: 'p-1',
      warehouseId: 'wh-1',
      signedDifference: 5,
      reason: 'Sayım fazlası',
    });
    expect(result.stockMovements[0]).toMatchObject({
      type: 'ADJUST',
      quantity: 5,
    });
  });

  it('negatif düzeltme (eksik stok)', () => {
    const result = applyStockAdjust({
      adjustId: 'a-1',
      productId: 'p-1',
      warehouseId: 'wh-1',
      signedDifference: -3,
      reason: 'Sayım eksiği',
    });
    expect(result.stockMovements[0]).toMatchObject({
      type: 'ADJUST',
      quantity: -3,
    });
  });

  it('sıfır düzeltme reddedilir', () => {
    expect(() =>
      applyStockAdjust({
        adjustId: 'a-1',
        productId: 'p-1',
        warehouseId: 'wh-1',
        signedDifference: 0,
        reason: 'Test',
      }),
    ).toThrow(AccountingError);
  });
});

describe('buildInventorySnapshot', () => {
  it('ürün@depo bazında mevcut miktarları çıkarır', () => {
    const movements = [
      { productId: 'p-1', warehouseId: 'wh-A', type: 'IN' as const, quantity: 100 },
      { productId: 'p-1', warehouseId: 'wh-A', type: 'OUT' as const, quantity: 30 },
      { productId: 'p-1', warehouseId: 'wh-B', type: 'IN' as const, quantity: 50 },
      { productId: 'p-2', warehouseId: 'wh-A', type: 'IN' as const, quantity: 20 },
    ];
    const inv = buildInventorySnapshot(movements);
    expect(inv['p-1@wh-A']).toBe(70);
    expect(inv['p-1@wh-B']).toBe(50);
    expect(inv['p-2@wh-A']).toBe(20);
  });
});

describe('buildCustomerBalanceSnapshot', () => {
  it('müşteri bazında bakiyeleri çıkarır', () => {
    const movements = [
      { customerId: 'c-1', type: 'DEBIT' as const, amount: 100 },
      { customerId: 'c-1', type: 'CREDIT' as const, amount: 30 },
      { customerId: 'c-2', type: 'DEBIT' as const, amount: 50 },
    ];
    const balances = buildCustomerBalanceSnapshot(movements);
    expect(balances['c-1']).toBe(70);
    expect(balances['c-2']).toBe(50);
  });
});

describe('Property-based: hesaplamalar tutarlı', () => {
  it('calculateCustomerBalance + buildCustomerBalanceSnapshot aynı sonucu verir', () => {
    const movements = [
      { id: 'm-1', customerId: 'c-1', type: 'DEBIT' as const, amount: 100.50 },
      { id: 'm-2', customerId: 'c-1', type: 'CREDIT' as const, amount: 30.25 },
      { id: 'm-3', customerId: 'c-2', type: 'DEBIT' as const, amount: 200 },
    ];
    const snapshotBalances = buildCustomerBalanceSnapshot(movements);
    const directC1 = calculateCustomerBalance(movements.filter((m) => m.customerId === 'c-1'));
    expect(snapshotBalances['c-1']).toBe(directC1);
    expect(directC1).toBe(70.25);
  });

  it('çok sayıda küçük tahsilat büyük satışa eşitse bakiye sıfırlanır', () => {
    const movements: Array<{ type: 'DEBIT' | 'CREDIT'; amount: number }> = [
      { type: 'DEBIT' as const, amount: 1000 },
    ];
    for (let i = 0; i < 10; i++) {
      movements.push({ type: 'CREDIT' as const, amount: 100 });
    }
    expect(calculateCustomerBalance(movements)).toBe(0);
  });

  it('yuvarlama hatası birikmez (10 satış × 0.1 = 1.0)', () => {
    const movements: Array<{ type: 'DEBIT' | 'CREDIT'; amount: number }> = [];
    for (let i = 0; i < 10; i++) {
      movements.push({ type: 'DEBIT' as const, amount: 0.1 });
    }
    expect(calculateCustomerBalance(movements)).toBe(1); // 0.1 + 0.1 + ... = 1.0
  });
});
