import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock, Ban, XCircle, MinusCircle, Loader2, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import {
  HrOnboardingItemStatusLabels,
  HrOnboardingStatusColors,
  HrOnboardingStatusLabels,
  type HrChecklistItem,
  type HrOnboardingItemStatus,
  type HrOnboardingStatus,
} from '@saas/shared';
import {
  useCancelOnboarding,
  useCompleteOnboarding,
  useOnboarding,
  useUpdateOnboardingItem,
} from '@/features/hr/api';
import { useState } from 'react';

const STATUS_ICON: Record<HrOnboardingItemStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Circle,
  IN_PROGRESS: Loader2,
  DONE: CheckCircle2,
  BLOCKED: XCircle,
  NOT_APPLICABLE: MinusCircle,
};

const STATUS_COLOR: Record<HrOnboardingItemStatus, string> = {
  PENDING: 'text-zinc-400',
  IN_PROGRESS: 'text-blue-500',
  DONE: 'text-green-500',
  BLOCKED: 'text-red-500',
  NOT_APPLICABLE: 'text-zinc-300',
};

export function OnboardingChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: checklist, isLoading } = useOnboarding(id!);
  const updateItem = useUpdateOnboardingItem();
  const completeMut = useCompleteOnboarding();
  const cancelMut = useCancelOnboarding();

  if (isLoading || !checklist) return <LoadingState />;

  const isLocked = checklist.status === 'COMPLETED' || checklist.status === 'CANCELLED';

  return (
    <div className="space-y-4">
      <PageHeader
        title="İşe Giriş Süreci"
        description={checklist.employee?.fullName ?? 'Personel'}
        actions={
          <button
            onClick={() => navigate('/hr/checklists/onboardings')}
            className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm hover:bg-bg-subtle"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
        }
      />

      {/* Üst bilgi + Progress */}
      <div className="rounded-lg border border-outline bg-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-fg-muted">
              Başlangıç: {new Date(checklist.startDate).toLocaleDateString('tr-TR')}
              {checklist.targetCompletionDate && ` • Hedef: ${new Date(checklist.targetCompletionDate).toLocaleDateString('tr-TR')}`}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + HrOnboardingStatusColors[checklist.status]}>
                {HrOnboardingStatusLabels[checklist.status]}
              </span>
              {checklist.completedAt && (
                <span className="text-xs text-fg-muted">
                  Tamamlandı: {new Date(checklist.completedAt).toLocaleDateString('tr-TR')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isLocked && checklist.progress.isReadyToComplete && (
              <button
                onClick={() => completeMut.mutate(checklist.id)}
                disabled={completeMut.isPending}
                className="flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" /> Süreci Tamamla
              </button>
            )}
            {!isLocked && (
              <button
                onClick={() => {
                  if (confirm('Süreci iptal etmek istediğinize emin misiniz?')) {
                    cancelMut.mutate(checklist.id);
                  }
                }}
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
              >
                İptal
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-fg-muted">
              {checklist.progress.completed} / {checklist.progress.total} tamamlandı
            </span>
            <span className="font-semibold">{checklist.progress.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${checklist.progress.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            Zorunlu: {checklist.progress.requiredCompleted} / {checklist.progress.required}
            {checklist.progress.isReadyToComplete ? ' ✓ Tamama hazır' : ''}
          </p>
        </div>

        {checklist.notes && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            📝 {checklist.notes}
          </p>
        )}
      </div>

      {/* Maddeler */}
      <div className="space-y-2">
        {checklist.items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            disabled={isLocked}
            onUpdate={(status) => {
              updateItem.mutate({ checklistId: checklist.id, itemId: item.id, status });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChecklistItemRow({
  item,
  disabled,
  onUpdate,
}: {
  item: HrChecklistItem;
  disabled: boolean;
  onUpdate: (status: HrOnboardingItemStatus) => void;
}) {
  const Icon = STATUS_ICON[item.status];
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? '');

  return (
    <div
      className={
        'rounded-lg border bg-surface p-3 transition ' +
        (item.isCompleted ? 'border-green-200 bg-green-50/30' : 'border-outline')
      }
    >
      <div className="flex items-start gap-3">
        <Icon className={'mt-0.5 h-5 w-5 shrink-0 ' + STATUS_COLOR[item.status]} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-fg">{item.title}</p>
            {item.isRequired && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                Zorunlu
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
              {HrOnboardingItemStatusLabels[item.status]}
            </span>
          </div>
          {item.description && <p className="mt-0.5 text-xs text-fg-muted">{item.description}</p>}
          {item.notes && !notesOpen && (
            <p className="mt-1 text-xs italic text-fg-muted">💬 {item.notes}</p>
          )}
          {item.completedAt && (
            <p className="mt-0.5 text-[10px] text-green-700">
              ✓ {new Date(item.completedAt).toLocaleString('tr-TR')}
            </p>
          )}
        </div>

        {!disabled && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onUpdate('DONE')}
              className={
                'rounded p-1.5 hover:bg-green-100 ' +
                (item.status === 'DONE' ? 'bg-green-100 text-green-700' : 'text-fg-muted')
              }
              title="Tamamlandı"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onUpdate('IN_PROGRESS')}
              className={
                'rounded p-1.5 hover:bg-blue-100 ' +
                (item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'text-fg-muted')
              }
              title="Devam Ediyor"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={() => onUpdate('BLOCKED')}
              className={
                'rounded p-1.5 hover:bg-red-100 ' +
                (item.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'text-fg-muted')
              }
              title="Engellendi"
            >
              <XCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => onUpdate('NOT_APPLICABLE')}
              className={
                'rounded p-1.5 hover:bg-zinc-100 ' +
                (item.status === 'NOT_APPLICABLE' ? 'bg-zinc-200 text-zinc-700' : 'text-fg-muted')
              }
              title="Geçerli Değil"
            >
              <Ban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className="rounded p-1.5 text-fg-muted hover:bg-bg-subtle"
              title="Not"
            >
              💬
            </button>
          </div>
        )}
      </div>

      {notesOpen && !disabled && (
        <div className="mt-2 flex gap-2 border-t border-outline pt-2">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Not ekle..."
            className="flex-1 rounded-md border border-outline bg-surface px-2 py-1 text-xs"
          />
          <button
            onClick={() => {
              // Not güncellemesi (update mutation'a notes ekle)
              // burada direkt update yapabiliriz
              setNotesOpen(false);
            }}
            className="rounded-md bg-primary px-2 py-1 text-xs text-on-primary"
          >
            Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
