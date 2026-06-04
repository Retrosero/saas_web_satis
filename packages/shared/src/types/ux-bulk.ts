import { QuoteStatus, CustomerRiskLevel, RecommendationType, BulkOperationType, BulkOperationStatus, LabelType, LabelPageSize, SegmentType, CleanupType } from '../enums/ux-bulk.enum';

export interface GlobalSearchResult { type: string; title: string; description: string; module: string; date?: string; status?: string; link: string; metadata?: any; }
export interface GlobalSearchResponse { query: string; results: GlobalSearchResult[]; byModule: Record<string, GlobalSearchResult[]>; totalCount: number; durationMs: number; }

export interface CommandDefinition { id: string; code: string; name: string; description?: string; category: string; targetRoute: string; requiredPermission: string; requiredModule?: string; icon: string; shortcut?: string; isActive: boolean; sortOrder: number; }

export interface Quote { id: string; tenantId: string; quoteNumber: string; customerId: string; customerName: string; quoteDate: string; validUntil: string; currency: string; subTotal: number; discountRate: number; discountAmount: number; vatTotal: number; grandTotal: number; paymentTerms?: string; deliveryTerms?: string; notes?: string; status: QuoteStatus; sentAt?: string; viewedAt?: string; acceptedAt?: string; rejectedAt?: string; rejectedReason?: string; convertedAt?: string; convertedRefType?: string; convertedRefId?: string; preparedById?: string; createdAt: string; updatedAt: string; items?: QuoteItem[]; }
export interface QuoteItem { id: string; quoteId: string; productId: string; productCode: string; productName: string; quantity: number; unitPrice: number; discountRate: number; discountAmount: number; vatRate: number; vatAmount: number; lineTotal: number; description?: string; sortOrder: number; }

export interface CustomerRiskSnapshot { id: string; tenantId: string; customerId: string; customerName: string; riskLevel: CustomerRiskLevel; balance: number; overdue30: number; overdue60: number; overdue90: number; daysSinceOrder?: number; daysSincePayment?: number; riskScore: number; reasons: any[]; snapshotAt: string; }
export interface CustomerRiskConfig { id: string; tenantId: string; name: string; description?: string; balanceWarning: number; balanceCritical: number; overdue30Warn: number; overdue60Warn: number; overdue90Crit: number; daysSinceOrderWarn: number; daysSinceOrderCrit: number; daysSincePaymentWarn: number; daysSincePaymentCrit: number; isActive: boolean; isDefault: boolean; }

export interface ProductRecommendation { productId: string; productCode: string; productName: string; brand?: string; category?: string; price: number; stock: number; reason: string; type: RecommendationType; confidence: number; }

export interface BulkOperation { id: string; tenantId: string; name: string; type: BulkOperationType; status: BulkOperationStatus; filters: any; update: any; totalMatched: number; totalProcessed: number; totalSuccess: number; totalFailed: number; batchId?: string; errorMessage?: string; startedAt?: string; completedAt?: string; rolledBackAt?: string; approvedAt?: string; createdById?: string; createdAt: string; updatedAt: string; }

export interface LabelTemplate { id: string; tenantId?: string; name: string; type: LabelType; pageSize: LabelPageSize; widthMm: number; heightMm: number; isGlobal: boolean; isActive: boolean; layout: any; previewSvg?: string; createdAt: string; updatedAt: string; }

export interface CustomerSegment { id: string; tenantId: string; name: string; description?: string; type: SegmentType; rules: any[]; memberCount: number; lastRefreshAt?: string; isActive: boolean; color: string; icon: string; createdAt: string; updatedAt: string; }

export interface CleanupJob { id: string; tenantId?: string; type: CleanupType; status: string; filters: any; totalMatched: number; totalArchived: number; totalDeleted: number; totalFreedMB: number; errorMessage?: string; startedAt?: string; completedAt?: string; createdAt: string; updatedAt: string; }
