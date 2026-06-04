import { OnboardingStep, OnboardingStatus, DemoDataSize, VisitStatus, VisitPlanStatus, TargetType, TargetStatus, TargetPeriod, CommissionType } from '../enums/onboarding-demo-visit-target.enum';

export interface OnboardingProgress {
  id: string; tenantId: string; status: OnboardingStatus; currentStep: OnboardingStep;
  completedSteps: OnboardingStep[]; skippedSteps: OnboardingStep[]; data: Record<string, any>;
  startedAt?: string; completedAt?: string; startedById?: string; completedById?: string;
  createdAt: string; updatedAt: string;
}

export interface IndustryTemplate {
  id: string; code: string; name: string; description?: string; icon: string; sectorKey: string;
  config: { activeModules: string[]; defaultRoles: any[]; defaultReports: any[]; defaultDashboards: any[]; salesSettings?: any; notificationRules?: any[] };
  isActive: boolean; isSystem: boolean; usageCount: number; createdAt: string; updatedAt: string;
}

export interface DemoDataTemplate {
  id: string; code: string; name: string; size: DemoDataSize; description?: string;
  config: { customerCount: number; productCount: number; saleCount: number; days: number };
  isActive: boolean; createdAt: string; updatedAt: string;
}

export interface DemoCompany {
  id: string; tenantId: string; size: DemoDataSize; templateCode: string; isActive: boolean;
  resetCount: number; lastResetAt?: string; convertedAt?: string; state: Record<string, any>;
  createdAt: string; updatedAt: string;
}

export interface VisitPlan {
  id: string; tenantId: string; name: string; description?: string; planDate: string;
  salespersonId: string; region?: string; customerGroupId?: string; status: VisitPlanStatus;
  totalCustomers: number; visitedCount: number; orderCount: number; collectionAmount: number;
  startedAt?: string; completedAt?: string; notes?: string; createdAt: string; updatedAt: string;
  customers?: VisitPlanCustomer[]; salespersonName?: string;
}

export interface VisitPlanCustomer {
  id: string; planId: string; customerId: string; customerName: string; customerAddress?: string;
  customerPhone?: string; customerBalance: number; lastOrderDate?: string; order: number;
  status: VisitStatus; plannedTime?: string; arrivedAt?: string; leftAt?: string;
  resultOrderId?: string; resultCollectionId?: string; reason?: string; notes?: string;
  latitude?: number; longitude?: number;
}

export interface VisitCheckin {
  id: string; planId: string; customerId: string; type: 'CHECK_IN' | 'CHECK_OUT';
  latitude: number; longitude: number; address?: string; accuracy?: number; photo?: string; notes?: string;
  createdAt: string;
}

export interface PerformanceTarget {
  id: string; tenantId: string; name: string; description?: string; type: TargetType; period: TargetPeriod;
  startDate: string; endDate: string; assigneeType: string; assigneeId?: string; assigneeName?: string;
  targetValue: number; currency: string; tiers: any[]; filters: Record<string, any>;
  status: TargetStatus; achievedValue: number; achievementRate: number; lastSnapshotAt?: string;
  createdAt: string; updatedAt: string;
}

export interface CommissionRule {
  id: string; tenantId: string; name: string; description?: string; targetType: TargetType;
  minAchievementRate: number; commissionType: CommissionType; config: any;
  maxAmount?: number; minAmount?: number; isActive: boolean;
  effectiveFrom?: string; effectiveTo?: string; createdAt: string; updatedAt: string;
}

export interface CommissionCalculationLog {
  id: string; tenantId: string; ruleId: string; userId: string; userName?: string;
  period: string; targetId?: string; achievedValue: number; achievementRate: number;
  baseAmount: number; calculatedAmount: number; finalAmount: number; status: string;
  notes?: string; calculatedAt: string; approvedAt?: string; paidAt?: string;
}
