import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStep, OnboardingStepLabel, OnboardingStepOrder, OnboardingStatusLabel, type OnboardingProgress as OnboardingProgressType } from '@saas/shared';
import { useOnboardingProgress, useStartOnboarding, useSaveStepData, useCompleteStep, useSkipStep } from '@/features/onboarding/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { CheckCircle2, SkipForward, ArrowLeft, Save, Play, Sparkles, Building, Image as ImageIcon, Warehouse, Coins, CreditCard, Users, KeyRound, Upload, ShoppingCart, CheckSquare } from 'lucide-react';

const STEP_ICONS: Record<OnboardingStep, any> = {
  [OnboardingStep.START]: Play, [OnboardingStep.COMPANY_INFO]: Building, [OnboardingStep.BRAND]: ImageIcon,
  [OnboardingStep.BRANCHES]: Building, [OnboardingStep.WAREHOUSES]: Warehouse, [OnboardingStep.CASH_ACCOUNTS]: Coins,
  [OnboardingStep.BANKS]: CreditCard, [OnboardingStep.USER_INVITES]: Users, [OnboardingStep.PERMISSION_TEMPLATE]: KeyRound,
  [OnboardingStep.DATA_IMPORT]: Upload, [OnboardingStep.FIRST_SALE_TEST]: ShoppingCart, [OnboardingStep.COMPLETED]: CheckSquare,
};

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const { data: progress, isLoading } = useOnboardingProgress();
  const startMut = useStartOnboarding();
  const saveMut = useSaveStepData();
  const completeMut = useCompleteStep();
  const skipMut = useSkipStep();
  const [stepData, setStepData] = useState<any>({});

  useEffect(() => { if (progress?.data) setStepData(progress.data as any); }, [progress]);

  if (isLoading) return <LoadingState />;
  if (!progress) return null;
  if (progress.status === 'COMPLETED') {
    return <div className="p-6 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-green-600" /><h2 className="mt-4 text-2xl font-bold">Kurulum Tamamlandı!</h2><p className="mt-2 text-sm text-on-surface-variant">Artık kullanıma hazırsınız.</p><button onClick={() => navigate('/dashboard')} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Dashboard'a Git</button></div>;
  }

  const currentStep = progress.currentStep as OnboardingStep;
  const Icon = STEP_ICONS[currentStep] ?? Play;

  const handleSaveAndContinue = async () => {
    if (Object.keys(stepData).length > 0) await saveMut.mutateAsync({ step: currentStep, data: stepData });
    await completeMut.mutateAsync(currentStep);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Kurulum Sihirbazı" description="Firmanızı adım adım hazırlayalım" />

      {/* Stepper */}
      <div className="rounded-lg border border-outline-variant bg-surface p-3">
        <div className="flex flex-wrap gap-1">
          {OnboardingStepOrder.map((s, i) => {
            const Completed = (progress.completedSteps as any[])?.includes(s);
            const Skipped = (progress.skippedSteps as any[])?.includes(s);
            const isCurrent = s === currentStep;
            return (
              <div key={s} className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${isCurrent ? 'bg-primary text-on-primary' : Completed ? 'bg-green-100 text-green-800' : Skipped ? 'bg-gray-100 text-gray-600' : 'bg-surface-variant/50'}`}>
                {Completed ? <CheckCircle2 className="h-3 w-3" /> : <span className="font-bold">{i + 1}</span>}
                <span className="hidden sm:inline">{OnboardingStepLabel[s]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adım İçeriği */}
      <section className="rounded-lg border-2 border-primary bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-primary-container p-3"><Icon className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-xs text-on-surface-variant">Adım {(OnboardingStepOrder.indexOf(currentStep) + 1)} / {OnboardingStepOrder.length}</p>
            <h2 className="text-xl font-bold">{OnboardingStepLabel[currentStep]}</h2>
          </div>
        </div>

        {currentStep === OnboardingStep.START && (
          <div className="space-y-2 text-sm">
            <p>Hoş geldiniz! Kurulumu tamamlamak için aşağıdaki adımları takip edin. <strong>Atla</strong> diyerek istediğiniz adımı sonra yapabilirsiniz.</p>
            <button onClick={() => startMut.mutate()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary inline-flex items-center gap-1"><Sparkles className="h-4 w-4" /> Kurulumu Başlat</button>
          </div>
        )}

        {currentStep === OnboardingStep.COMPANY_INFO && (
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Firma Unvanı *</label><input defaultValue={stepData.companyInfo?.name} onChange={(e) => setStepData({ ...stepData, companyInfo: { ...stepData.companyInfo, name: e.target.value } })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Vergi No</label><input defaultValue={stepData.companyInfo?.taxNumber} onChange={(e) => setStepData({ ...stepData, companyInfo: { ...stepData.companyInfo, taxNumber: e.target.value } })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Vergi Dairesi</label><input defaultValue={stepData.companyInfo?.taxOffice} onChange={(e) => setStepData({ ...stepData, companyInfo: { ...stepData.companyInfo, taxOffice: e.target.value } })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium">Telefon</label><input defaultValue={stepData.companyInfo?.phone} onChange={(e) => setStepData({ ...stepData, companyInfo: { ...stepData.companyInfo, phone: e.target.value } })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs font-medium">Adres</label><input defaultValue={stepData.companyInfo?.address} onChange={(e) => setStepData({ ...stepData, companyInfo: { ...stepData.companyInfo, address: e.target.value } })} className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm" /></div>
          </div>
        )}

        {currentStep === OnboardingStep.BRAND && (
          <div className="space-y-2 text-sm">
            <p className="text-sm">Logo, renk ve tema ayarları firma ayarlarından yapılabilir. İsterseniz sonra tamamlayın.</p>
            <button onClick={() => navigate('/settings/branding')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Marka Ayarlarına Git</button>
          </div>
        )}

        {currentStep === OnboardingStep.BRANCHES && (
          <div className="space-y-2 text-sm">
            <p>Şubelerinizi şube yönetiminden ekleyebilirsiniz.</p>
            <button onClick={() => navigate('/warehouses')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Şube/Depo Yönetimine Git</button>
          </div>
        )}

        {currentStep === OnboardingStep.WAREHOUSES && (
          <div className="space-y-2 text-sm">
            <p>Depo tanımlarınızı depo yönetiminden yapabilirsiniz.</p>
            <button onClick={() => navigate('/warehouses')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Depo Yönetimine Git</button>
          </div>
        )}

        {currentStep === OnboardingStep.CASH_ACCOUNTS && (
          <div className="space-y-2 text-sm">
            <p>Kasa hesaplarınızı kasa yönetiminden tanımlayabilirsiniz.</p>
            <button onClick={() => navigate('/cash')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Kasa Yönetimine Git</button>
          </div>
        )}

        {currentStep === OnboardingStep.BANKS && (
          <div className="space-y-2 text-sm">
            <p>Banka/POS tanımlarınızı banka yönetiminden yapabilirsiniz.</p>
            <button onClick={() => navigate('/banks')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Banka Yönetimine Git</button>
          </div>
        )}

        {currentStep === OnboardingStep.USER_INVITES && (
          <div className="space-y-2 text-sm">
            <p>Çalışanlarınızı kullanıcı yönetiminden davet edebilirsiniz.</p>
            <button onClick={() => navigate('/users')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Kullanıcı Yönetimine Git</button>
          </div>
        )}

        {currentStep === OnboardingStep.PERMISSION_TEMPLATE && (
          <div className="space-y-2 text-sm">
            <p>Hazır rol/izin şablonlarından birini seçebilirsiniz veya kendi rollerinizi oluşturabilirsiniz.</p>
            <button onClick={() => navigate('/industry-templates')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Sektör Şablonlarına Git</button>
          </div>
        )}

        {currentStep === OnboardingStep.DATA_IMPORT && (
          <div className="space-y-2 text-sm">
            <p>Mevcut cari/stok verilerinizi Excel ile aktarabilir veya demo veri yükleyebilirsiniz.</p>
            <div className="flex gap-2">
              <button onClick={() => navigate('/import')} className="rounded-md border border-outline px-3 py-1.5 text-sm">Veri Aktarımı</button>
              <button onClick={() => navigate('/demo-company')} className="rounded-md border border-amber-400 px-3 py-1.5 text-sm text-amber-700">Demo Veri Yükle</button>
            </div>
          </div>
        )}

        {currentStep === OnboardingStep.FIRST_SALE_TEST && (
          <div className="space-y-2 text-sm">
            <p>Sistemi denemek için ilk satışı oluşturun veya demo moduna geçin.</p>
            <div className="flex gap-2">
              <button onClick={() => navigate('/sales/new')} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white inline-flex items-center gap-1"><ShoppingCart className="h-4 w-4" /> İlk Satış</button>
            </div>
          </div>
        )}

        {currentStep !== OnboardingStep.START && currentStep !== OnboardingStep.COMPLETED && (
          <div className="mt-6 flex justify-between border-t border-outline-variant pt-4">
            <button onClick={async () => { await skipMut.mutateAsync(currentStep); }} className="flex items-center gap-1 rounded-md border border-outline px-3 py-1.5 text-sm"><SkipForward className="h-4 w-4" /> Atla</button>
            <button onClick={handleSaveAndContinue} disabled={saveMut.isPending || completeMut.isPending} className="flex items-center gap-1 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-on-primary"><Save className="h-4 w-4" /> Kaydet ve Devam Et</button>
          </div>
        )}
      </section>
    </div>
  );
}
