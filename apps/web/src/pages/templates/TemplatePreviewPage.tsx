import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { useTemplate, useTemplateVariables } from '@/features/templates/api';
import { PageFormatLabel, DocumentTypeLabel } from '@saas/shared';

const SAMPLE_DATA: Record<string, string> = {
  logo: '🏢',
  companyName: 'ÖRNEK FİRMA A.Ş.',
  taxOffice: 'Merkez VD',
  taxNumber: '1234567890',
  companyAddress: 'Atatürk Cad. No:1 İstanbul',
  companyPhone: '+90 212 555 0000',
  companyEmail: 'info@ornekfirma.com',
  customerName: 'Demo Müşteri Ltd. Şti.',
  customerCode: 'M001',
  documentNumber: 'S-2026-0001',
  documentDate: '01.06.2026',
  productCode: 'U001', productName: 'Örnek Ürün',
  barcode: '1234567890',
  quantity: '10', unit: 'Adet', unitPrice: '100,00 TL',
  discount: '%10', vatRate: '%20', lineTotal: '1.100,00 TL',
  subTotal: '1.000,00 TL', totalDiscount: '100,00 TL',
  totalVat: '180,00 TL', grandTotal: '1.080,00 TL',
  notes: 'Bu bir örnek belgedir.',
  preparedBy: 'Admin Kullanıcı',
};

export function TemplatePreviewPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: t, isLoading, error, refetch } = useTemplate(id);
  const { data: varData } = useTemplateVariables();

  if (isLoading) return <LoadingState />;
  if (error || !t) return <ErrorState message="Şablon yüklenemedi" onRetry={refetch} />;

  const enabled = t.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  // Sayfa boyutu hesapla
  const pageStyle: React.CSSProperties = {};
  if (t.pageFormat === 'A4_PORTRAIT') pageStyle.maxWidth = '210mm';
  if (t.pageFormat === 'A4_LANDSCAPE') pageStyle.maxWidth = '297mm';
  if (t.pageFormat === 'THERMAL_58') pageStyle.maxWidth = '58mm';
  if (t.pageFormat === 'THERMAL_80') pageStyle.maxWidth = '80mm';
  if (t.pageFormat === 'CUSTOM' && t.customWidth) pageStyle.maxWidth = `${t.customWidth}mm`;
  pageStyle.minHeight = t.pageFormat === 'A4_PORTRAIT' ? '297mm' : t.pageFormat === 'A4_LANDSCAPE' ? '210mm' : 'auto';
  pageStyle.margin = '0 auto';
  pageStyle.background = 'white';
  pageStyle.padding = '20mm';
  pageStyle.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

  const renderSection = (s: any) => {
    switch (s.type) {
      case 'LOGO': return <div className="text-4xl text-center">{SAMPLE_DATA.logo}</div>;
      case 'COMPANY_INFO': return (
        <div className="text-center text-xs">
          <p className="font-bold text-lg">{SAMPLE_DATA.companyName}</p>
          <p>{SAMPLE_DATA.companyAddress}</p>
          <p>{SAMPLE_DATA.companyPhone} • {SAMPLE_DATA.companyEmail}</p>
          <p>VN: {SAMPLE_DATA.taxNumber} / {SAMPLE_DATA.taxOffice}</p>
        </div>
      );
      case 'HEADER': return <h1 className="text-center text-2xl font-bold border-b-2 border-black pb-2">{DocumentTypeLabel[t.documentType]}</h1>;
      case 'CUSTOMER_INFO': return (
        <div className="text-xs"><p><strong>Sayın:</strong> {SAMPLE_DATA.customerName}</p><p><strong>Kod:</strong> {SAMPLE_DATA.customerCode}</p></div>
      );
      case 'DOCUMENT_INFO': return (
        <div className="text-xs text-right"><p><strong>Belge No:</strong> {SAMPLE_DATA.documentNumber}</p><p><strong>Tarih:</strong> {SAMPLE_DATA.documentDate}</p></div>
      );
      case 'ITEMS_TABLE': return (
        <table className="w-full text-xs border-collapse">
          <thead><tr className="border-b-2 border-black"><th className="text-left py-1">Kod</th><th className="text-left">Ürün</th><th className="text-right">Miktar</th><th className="text-right">Fiyat</th><th className="text-right">KDV</th><th className="text-right">Toplam</th></tr></thead>
          <tbody>
            <tr className="border-b border-gray-300"><td className="py-1">{SAMPLE_DATA.productCode}</td><td>{SAMPLE_DATA.productName}</td><td className="text-right">{SAMPLE_DATA.quantity}</td><td className="text-right">{SAMPLE_DATA.unitPrice}</td><td className="text-right">{SAMPLE_DATA.vatRate}</td><td className="text-right">{SAMPLE_DATA.lineTotal}</td></tr>
            <tr className="border-b border-gray-300"><td className="py-1">U002</td><td>İkinci Ürün</td><td className="text-right">5</td><td className="text-right">50,00 TL</td><td className="text-right">%20</td><td className="text-right">300,00 TL</td></tr>
          </tbody>
        </table>
      );
      case 'TOTALS': return (
        <div className="ml-auto text-xs space-y-1 w-1/2">
          <div className="flex justify-between"><span>Ara Toplam:</span><span>{SAMPLE_DATA.subTotal}</span></div>
          <div className="flex justify-between"><span>İskonto:</span><span>-{SAMPLE_DATA.totalDiscount}</span></div>
          <div className="flex justify-between"><span>KDV:</span><span>{SAMPLE_DATA.totalVat}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-black pt-1"><span>Genel Toplam:</span><span>{SAMPLE_DATA.grandTotal}</span></div>
        </div>
      );
      case 'NOTES': return <p className="text-xs italic">{SAMPLE_DATA.notes}</p>;
      case 'FOOTER': return <p className="text-center text-[10px] text-gray-500">Bu belge {SAMPLE_DATA.preparedBy} tarafından hazırlanmıştır.</p>;
      case 'CUSTOM_TEXT': return <div className="text-xs" dangerouslySetInnerHTML={{ __html: s.content ?? '' }} />;
      case 'SIGNATURE': return <div className="grid grid-cols-2 gap-4 text-xs mt-8"><div className="text-center border-t border-black pt-1">Teslim Eden</div><div className="text-center border-t border-black pt-1">Teslim Alan</div></div>;
      case 'QR_BARCODE': return <div className="text-center text-xs"><div className="inline-block border-2 border-black p-2 font-mono">|||| ||| | |||| |||</div><p className="mt-1">{SAMPLE_DATA.documentNumber}</p></div>;
      case 'TAX_INFO': return <p className="text-xs">KDV dahil fiyatlardır.</p>;
      case 'DISCOUNT_INFO': return <p className="text-xs">İskonto uygulanmıştır.</p>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Ön İzleme: ${t.name}`}
        description={`${DocumentTypeLabel[t.documentType]} • ${PageFormatLabel[t.pageFormat]}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/templates')} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Geri</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm"><Printer className="h-4 w-4" /> Yazdır</button>
            <button className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary"><Download className="h-4 w-4" /> PDF</button>
          </div>
        }
      />

      <div className="rounded-lg border border-outline-variant bg-surface-variant/30 p-6 overflow-auto">
        <div style={pageStyle} className="rounded">
          {enabled.length === 0 ? <p className="text-center text-on-surface-variant py-12">Bu şablonda aktif bölüm yok</p> : (
            <div className="space-y-4">
              {enabled.map((s) => <div key={s.id}>{renderSection(s)}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
