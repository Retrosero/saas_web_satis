import { ChecklistListPage } from './ChecklistListPage';
import { useOnboardings, useStartOnboarding } from '@/features/hr/api';

export function OnboardingListPage() {
  return (
    <ChecklistListPage
      mode="onboardings"
      useList={useOnboardings}
      useStart={useStartOnboarding}
      title="İşe Giriş Süreçleri"
      description="Yeni personellerin onboarding checklist'leri"
      pathSegment="onboardings"
      employeeField="startDate"
    />
  );
}
