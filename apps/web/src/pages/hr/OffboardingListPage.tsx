import { ChecklistListPage } from './ChecklistListPage';
import { useOffboardings, useStartOffboarding } from '@/features/hr/api';

export function OffboardingListPage() {
  return (
    <ChecklistListPage
      mode="offboardings"
      useList={useOffboardings}
      useStart={useStartOffboarding}
      title="İşten Çıkış Süreçleri"
      description="Ayrılan personellerin offboarding checklist'leri"
      pathSegment="offboardings"
      employeeField="terminationDate"
      extraFields={(r) => <span className="text-xs text-fg-muted">{r.reason ?? '—'}</span>}
    />
  );
}
