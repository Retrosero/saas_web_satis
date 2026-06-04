import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, BookOpen, TrendingUp, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { AbsenceTypeLabels, AbsenceTypeColors, DisciplinaryActionTypeLabels, DisciplinaryActionTypeColors, TrainingStatusLabels, PerformanceReviewStatusLabels } from '@saas/shared';
import { useAbsences, useDisciplinaryCases, useCareerRecords, useTrainings, usePerformanceReviews, useCreateAbsence, useCreateDisciplinaryCase, useCreateCareerRecord, useCreateTraining } from '@/features/hr/api';

type Tab = 'absences' | 'disciplinary' | 'career' | 'training' | 'performance';

export function HR567Page() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('absences');

  const { data: absences, isLoading: absenceLoading } = useAbsences();
  const { data: disciplinary, isLoading: disLoading } = useDisciplinaryCases({ isClosed: false });
  const { data: career, isLoading: careerLoading } = useCareerRecords();
  const { data: trainings, isLoading: trainingLoading } = useTrainings();
  const { data: perf, isLoading: perfLoading } = usePerformanceReviews();

  const createAbsenceMut = useCreateAbsence();
  const createDisMut = useCreateDisciplinaryCase();
  const createCareerMut = useCreateCareerRecord();
  const createTrainingMut = useCreateTraining();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({});

  const tabs = [
    { key: 'absences', label: 'Devamsızlık', icon: AlertTriangle, count: ((absences as any[]) ?? []).length },
    { key: 'disciplinary', label: 'Disiplin', icon: AlertTriangle, count: ((disciplinary as any[]) ?? []).length },
    { key: 'career', label: 'Kariyer', icon: TrendingUp, count: ((career as any[]) ?? []).length },
    { key: 'training', label: 'Eğitim', icon: BookOpen, count: ((trainings as any[]) ?? []).length },
    { key: 'performance', label: 'Performans', icon: Users, count: ((perf as any[]) ?? []).length },
  ] as const;

  const absenceColumns: DataTableColumn<any>[] = [
    {
      key: 'employee', label: 'Personel',
      render: (r) => <p className="font-semibold">{r.employee?.fullName ?? '—'}</p>,
    },
    {
      key: 'type', label: 'Tür',
      render: (r) => (
        <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + (AbsenceTypeColors[r.absenceType as keyof typeof AbsenceTypeColors] ?? 'bg-zinc-100')}>
          {AbsenceTypeLabels[r.absenceType as keyof typeof AbsenceTypeLabels] ?? r.absenceType}
        </span>
      ),
    },
    {
      key: 'dates', label: 'Tarih',
      render: (r) => (
        <span className="text-sm">{new Date(r.startDate).toLocaleDateString('tr-TR')} — {new Date(r.endDate).toLocaleDateString('tr-TR')}</span>
      ),
    },
    {
      key: 'days', label: 'Gün',
      render: (r) => <span className="font-semibold">{Number(r.totalDays)} gün</span>,
    },
    {
      key: 'justified', label: 'Durum',
      render: (r) => (
        <span className={r.isJustified ? 'rounded bg-green-100 px-2 py-0.5 text-xs text-green-700' : 'rounded bg-red-100 px-2 py-0.5 text-xs text-red-700'}>
          {r.isJustified ? 'Mazeretli' : 'Mazeretsiz'}
        </span>
      ),
    },
  ];

  const disColumns: DataTableColumn<any>[] = [
    {
      key: 'caseNo', label: 'Dosya No',
      render: (r) => <code className="font-mono text-sm">{r.caseNo}</code>,
    },
    {
      key: 'employee', label: 'Personel',
      render: (r) => <p className="font-semibold">{r.employee?.fullName ?? '—'}</p>,
    },
    {
      key: 'incident', label: 'Olay',
      render: (r) => <p className="text-sm line-clamp-1">{r.incidentDesc}</p>,
    },
    {
      key: 'action', label: 'Yaptırım',
      render: (r) => (
        <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + (DisciplinaryActionTypeColors[r.actionType as keyof typeof DisciplinaryActionTypeColors] ?? 'bg-zinc-100')}>
          {DisciplinaryActionTypeLabels[r.actionType as keyof typeof DisciplinaryActionTypeLabels] ?? r.actionType}
        </span>
      ),
    },
    {
      key: 'status', label: 'Durum',
      render: (r) => (
        <span className={'rounded px-2 py-0.5 text-xs ' + (r.isClosed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
          {r.isClosed ? 'Kapandı' : 'Açık'}
        </span>
      ),
    },
  ];

  const trainingColumns: DataTableColumn<any>[] = [
    {
      key: 'name', label: 'Eğitim Adı',
      render: (r) => <p className="font-semibold">{r.name}</p>,
    },
    {
      key: 'trainer', label: 'Eğitmen',
      render: (r) => <span className="text-sm text-fg-muted">{r.trainer ?? '—'}</span>,
    },
    {
      key: 'dates', label: 'Tarih',
      render: (r) => <span className="text-sm">{new Date(r.startDate).toLocaleDateString('tr-TR')} — {new Date(r.endDate).toLocaleDateString('tr-TR')}</span>,
    },
    {
      key: 'status', label: 'Durum',
      render: (r) => <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs">{TrainingStatusLabels[r.status as keyof typeof TrainingStatusLabels] ?? r.status}</span>,
    },
    {
      key: 'participants', label: 'Katılımcı',
      render: (r) => <span className="text-sm">{r._count?.participants ?? 0} kişi</span>,
    },
  ];

  const perfColumns: DataTableColumn<any>[] = [
    {
      key: 'employee', label: 'Personel',
      render: (r) => <p className="font-semibold">{r.employee?.fullName ?? '—'}</p>,
    },
    {
      key: 'period', label: 'Dönem',
      render: (r) => <span className="font-mono text-sm">{r.period}</span>,
    },
    {
      key: 'score', label: 'Puan',
      render: (r) => r.overallScore != null ? (
        <span className="font-bold">{Number(r.overallScore).toFixed(1)} / 5</span>
      ) : <span className="text-xs text-fg-muted">—</span>,
    },
    {
      key: 'status', label: 'Durum',
      render: (r) => (
        <span className={'rounded-full px-2 py-0.5 text-xs ' + (r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
          {PerformanceReviewStatusLabels[r.status as keyof typeof PerformanceReviewStatusLabels] ?? r.status}
        </span>
      ),
    },
  ];

  const careerColumns: DataTableColumn<any>[] = [
    {
      key: 'employee', label: 'Personel',
      render: (r) => <p className="font-semibold">{r.employee?.fullName ?? '—'}</p>,
    },
    {
      key: 'type', label: 'Tür',
      render: (r) => <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{r.recordType}</span>,
    },
    {
      key: 'effective', label: 'Tarih',
      render: (r) => <span className="text-sm">{new Date(r.effectiveDate).toLocaleDateString('tr-TR')}</span>,
    },
    {
      key: 'changes', label: 'Değişiklik',
      render: (r) => (
        <div className="text-xs">
          {r.oldValue && <p className="text-red-600 line-through">{r.oldValue}</p>}
          {r.newValue && <p className="text-green-600 font-medium">{r.newValue}</p>}
        </div>
      ),
    },
  ];

  const getColumns = () => {
    switch (tab) {
      case 'absences': return absenceColumns;
      case 'disciplinary': return disColumns;
      case 'career': return careerColumns;
      case 'training': return trainingColumns;
      case 'performance': return perfColumns;
    }
  };

  const getData = () => {
    switch (tab) {
      case 'absences': return (absences as any[]) ?? [];
      case 'disciplinary': return (disciplinary as any[]) ?? [];
      case 'career': return (career as any[]) ?? [];
      case 'training': return (trainings as any[]) ?? [];
      case 'performance': return (perf as any[]) ?? [];
    }
  };

  const isLoading = () => {
    switch (tab) {
      case 'absences': return absenceLoading;
      case 'disciplinary': return disLoading;
      case 'career': return careerLoading;
      case 'training': return trainingLoading;
      case 'performance': return perfLoading;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="HR-5/6/7"
        description="Bordro parametreleri, devamsızlık, disiplin, kariyer, eğitim, performans"
      />

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-outline">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={'flex items-center gap-1.5 whitespace-nowrap rounded-t px-3 py-2 text-sm ' + (tab === key ? 'border-b-2 border-primary bg-primary/5 font-medium text-primary' : 'text-fg-muted hover:bg-bg-subtle')}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count > 0 && <span className="rounded-full bg-bg-subtle px-1.5 text-xs">{count}</span>}
          </button>
        ))}
      </div>

      {isLoading() ? <LoadingState /> : (
        <div className="hidden md:block">
          <DataTable
            columns={getColumns()}
            data={getData()}
            rowKey={(r) => r.id}
          />
        </div>
      )}
    </div>
  );
}