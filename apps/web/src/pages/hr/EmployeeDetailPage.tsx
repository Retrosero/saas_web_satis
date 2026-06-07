import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Archive, FileText, Upload, Download, Trash2, Eye, EyeOff, FilePlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ConfirmModal } from '@/components/data/ConfirmModal';
import {
  ContractTypeLabels,
  EmploymentStatusLabels,
  HrDocumentTypeLabels,
  WorkingTypeLabels,
  type HrDocumentStatus,
  type HrGender,
  type MaritalStatus,
} from '@saas/shared';
import {
  downloadDocumentUrl,
  useArchiveEmployee,
  useDeleteDocument,
  useEmployee,
  useEmployeeDocuments,
  useEmployeeSensitive,
  useTerminateEmployee,
  useUpdateDocumentStatus,
  useUploadDocument,
} from '@/features/hr/api';
import { usePermission } from '@/lib/usePermission';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-zinc-200 text-zinc-700',
};

export function EmployeeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading } = useEmployee(id!);
  const { data: sensitive } = useEmployeeSensitive(id!);
  const { data: documents } = useEmployeeDocuments(id!);
  const canViewSensitive = usePermission('ik:sensitive_data:view');
  const archiveMut = useArchiveEmployee();
  const terminateMut = useTerminateEmployee();
  const uploadMut = useUploadDocument(id!);
  const updateStatusMut = useUpdateDocumentStatus();
  const deleteDocMut = useDeleteDocument();
  const [showSensitive, setShowSensitive] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminationDate, setTerminationDate] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInput, setUploadInput] = useState<{
    file: File | null;
    documentType: string;
    title: string;
    issueDate: string;
    expiryDate: string;
    description: string;
  }>({ file: null, documentType: 'IDENTITY_COPY', title: '', issueDate: '', expiryDate: '', description: '' });
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<string | null>(null);

  if (isLoading || !employee) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={employee.fullName}
        description={`Personel No: ${employee.employeeNo}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/hr/employees')}
              className="flex items-center gap-1 rounded-md border border-outline bg-surface px-3 py-2 text-sm hover:bg-bg-subtle"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
            <button
              onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              <Edit2 className="h-4 w-4" /> Düzenle
            </button>
            {employee.status !== 'ARCHIVED' && (
              <button
                onClick={() => setConfirmArchive(true)}
                className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
              >
                <Archive className="h-4 w-4" /> Arşivle
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Kişisel Bilgiler */}
        <Card title="Kişisel Bilgiler">
          <Row label="Ad Soyad" value={employee.fullName} />
          <Row label="Personel No" value={employee.employeeNo} mono />
          <SensitiveRow
            label="TC Kimlik No"
            masked={employee.identityNumber}
            full={sensitive?.identityNumber}
            show={showSensitive && canViewSensitive}
          />
          <Row label="Doğum Tarihi" value={employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('tr-TR') : '—'} />
          <Row label="Cinsiyet" value={employee.gender ? genderLabel(employee.gender) : '—'} />
          <Row label="Medeni Durum" value={employee.maritalStatus ? maritalLabel(employee.maritalStatus) : '—'} />
          <Row label="Kan Grubu" value={employee.bloodType ?? '—'} />
          <Row
            label="Durum"
            value={
              <span
                className={
                  'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
                  (employee.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : employee.status === 'ARCHIVED'
                      ? 'bg-zinc-100 text-zinc-600'
                      : 'bg-amber-100 text-amber-700')
                }
              >
                {EmploymentStatusLabels[employee.status]}
              </span>
            }
          />
          {employee.terminationDate && (
            <Row
              label="İşten Çıkış"
              value={`${new Date(employee.terminationDate).toLocaleDateString('tr-TR')} — ${employee.terminationReason ?? ''}`}
            />
          )}
          {employee.status !== 'ARCHIVED' && employee.status !== 'TERMINATED' && (
            <button
              onClick={() => setTerminateOpen(true)}
              className="mt-2 text-xs text-amber-600 hover:underline"
            >
              İşten Çıkış İşlemi →
            </button>
          )}
        </Card>

        {/* İletişim */}
        <Card title="İletişim">
          <Row label="Telefon" value={employee.phone ?? '—'} />
          <Row label="E-posta" value={employee.email ?? '—'} />
          <Row label="Adres" value={employee.address ?? '—'} />
          <Row label="Acil Durum Kişisi" value={employee.emergencyContact ?? '—'} />
          <Row label="Acil Durum Tel" value={employee.emergencyPhone ?? '—'} />
          <SensitiveRow
            label="IBAN"
            masked={employee.iban}
            full={sensitive?.iban}
            show={showSensitive && canViewSensitive}
          />
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="mt-2 flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
          >
            {showSensitive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showSensitive ? 'Hassas verileri gizle' : 'Hassas verileri göster (yetki gerekli)'}
          </button>
        </Card>

        {/* Çalışma */}
        {employee.employment && (
          <Card title="Çalışma Bilgileri">
            <Row label="Departman" value={employee.employment.department ?? '—'} />
            <Row label="Şube" value={employee.employment.branch ?? '—'} />
            <Row label="Görev" value={employee.employment.position ?? '—'} />
            <Row label="Çalışma Tipi" value={WorkingTypeLabels[employee.employment.workingType]} />
            <Row label="Sözleşme Tipi" value={ContractTypeLabels[employee.employment.contractType]} />
            <Row label="İşe Giriş" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('tr-TR') : '—'} />
            <Row label="Sözleşme Başlangıç" value={employee.employment.contractStartDate ? new Date(employee.employment.contractStartDate).toLocaleDateString('tr-TR') : '—'} />
            <Row label="Sözleşme Bitiş" value={employee.employment.contractEndDate ? new Date(employee.employment.contractEndDate).toLocaleDateString('tr-TR') : '—'} />
            <Row label="Deneme Süresi" value={`${employee.employment.probationMonths} ay`} />
            <Row label="Haftalık Saat" value={employee.employment.weeklyHours ?? '—'} />
          </Card>
        )}

        {/* SGK */}
        {employee.employment && (employee.employment.sgkRegistrationNo || employee.employment.sgkEmployerNo) && (
          <Card title="SGK Bilgileri">
            <Row label="SGK Sicil No" value={employee.employment.sgkRegistrationNo ?? '—'} />
            <Row label="SGK İşveren No" value={employee.employment.sgkEmployerNo ?? '—'} />
            <Row label="SGK İşyeri Kodu" value={employee.employment.sgkWorkplaceCode ?? '—'} />
          </Card>
        )}
      </div>

      {/* Evraklar */}
      <div className="rounded-lg border border-outline bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <FileText className="h-4 w-4" /> Evraklar ({documents?.length ?? 0})
          </h3>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-hover"
          >
            <Upload className="h-3 w-3" /> Evrak Yükle
          </button>
        </div>

        {documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-md border border-outline bg-bg-subtle px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-fg-muted">
                    {HrDocumentTypeLabels[d.documentType]} • {d.fileName} ({(d.fileSize / 1024).toFixed(1)} KB)
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={'rounded-full px-2 py-0.5 text-[10px] font-medium ' + STATUS_COLORS[d.status]}>
                    {d.status}
                  </span>
                  <a
                    href={downloadDocumentUrl(d.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded p-1 text-fg-muted hover:bg-bg-subtle hover:text-fg"
                    title="İndir"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {d.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatusMut.mutate({ id: d.id, status: 'APPROVED' })}
                        className="rounded p-1 text-green-600 hover:bg-green-50"
                        title="Onayla"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => updateStatusMut.mutate({ id: d.id, status: 'REJECTED' })}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        title="Reddet"
                      >
                        ✗
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setConfirmDeleteDoc(d.id)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-fg-muted">Henüz evrak yüklenmedi</p>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        open={confirmArchive}
        title="Personeli Arşivle"
        description="Bu personel arşivlenecek. Listede görünmeyecek."
        confirmText="Arşivle"
        variant="danger"
        onClose={() => setConfirmArchive(false)}
        onConfirm={async () => {
          await archiveMut.mutateAsync(employee.id);
          setConfirmArchive(false);
          navigate('/hr/employees');
        }}
      />

      {terminateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">İşten Çıkış İşlemi</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs">Çıkış Tarihi</label>
                <input
                  type="date"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs">Çıkış Nedeni</label>
                <textarea
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setTerminateOpen(false)}
                className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  await terminateMut.mutateAsync({
                    id: employee.id,
                    terminationDate,
                    reason: terminationReason,
                  });
                  setTerminateOpen(false);
                }}
                disabled={!terminationDate || !terminationReason}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                İşten Çıkar
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">Evrak Yükle</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs">Evrak Türü</label>
                <select
                  value={uploadInput.documentType}
                  onChange={(e) => setUploadInput({ ...uploadInput, documentType: e.target.value })}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                >
                  {Object.entries(HrDocumentTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs">Başlık *</label>
                <input
                  value={uploadInput.title}
                  onChange={(e) => setUploadInput({ ...uploadInput, title: e.target.value })}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs">Dosya * (PDF, JPG, PNG, DOC — max 20MB)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setUploadInput({ ...uploadInput, file: e.target.files?.[0] ?? null })}
                  className="w-full text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs">Düzenlenme</label>
                  <input
                    type="date"
                    value={uploadInput.issueDate}
                    onChange={(e) => setUploadInput({ ...uploadInput, issueDate: e.target.value })}
                    className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs">Son Geçerlilik</label>
                  <input
                    type="date"
                    value={uploadInput.expiryDate}
                    onChange={(e) => setUploadInput({ ...uploadInput, expiryDate: e.target.value })}
                    className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs">Açıklama</label>
                <textarea
                  value={uploadInput.description}
                  onChange={(e) => setUploadInput({ ...uploadInput, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-outline bg-surface px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setUploadOpen(false)}
                className="rounded-md border border-outline bg-surface px-3 py-1.5 text-sm hover:bg-bg-subtle"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!uploadInput.file || !uploadInput.title) return;
                  await uploadMut.mutateAsync({
                    file: uploadInput.file,
                    documentType: uploadInput.documentType,
                    title: uploadInput.title,
                    issueDate: uploadInput.issueDate || undefined,
                    expiryDate: uploadInput.expiryDate || undefined,
                    description: uploadInput.description || undefined,
                  });
                  setUploadOpen(false);
                  setUploadInput({ file: null, documentType: 'IDENTITY_COPY', title: '', issueDate: '', expiryDate: '', description: '' });
                }}
                disabled={!uploadInput.file || !uploadInput.title || uploadMut.isPending}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                <FilePlus className="h-3 w-3" />
                {uploadMut.isPending ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDeleteDoc}
        title="Evrak Silinsin mi?"
        description="Evrak soft delete ile arşivlenecek."
        confirmText="Sil"
        variant="danger"
        onClose={() => setConfirmDeleteDoc(null)}
        onConfirm={async () => {
          if (confirmDeleteDoc) {
            await deleteDocMut.mutateAsync(confirmDeleteDoc);
            setConfirmDeleteDoc(null);
          }
        }}
      />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-outline bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-fg">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-xs text-fg-muted">{label}</span>
      <span className={'text-right ' + (mono ? 'font-mono' : '')}>{value}</span>
    </div>
  );
}

function SensitiveRow({
  label,
  masked,
  full,
  show,
}: {
  label: string;
  masked: string | null | undefined;
  full: string | null | undefined;
  show: boolean;
}) {
  const display = show && full ? full : masked ?? '—';
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="flex items-center gap-1 text-xs text-fg-muted">
        🔒 {label}
      </span>
      <span className={'text-right ' + (show ? 'font-mono' : '')}>{display}</span>
    </div>
  );
}

function genderLabel(g: HrGender): string {
  return g === 'MALE' ? 'Erkek' : g === 'FEMALE' ? 'Kadın' : 'Diğer';
}

function maritalLabel(m: MaritalStatus): string {
  return m === 'SINGLE' ? 'Bekar' : m === 'MARRIED' ? 'Evli' : m === 'DIVORCED' ? 'Boşanmış' : 'Dul';
}
