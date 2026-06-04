import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureError } from '@/lib/sentry';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack });
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="m-4 flex flex-col items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <h2 className="text-lg font-bold text-red-900">Bir şeyler ters gitti</h2>
          <p className="text-sm text-red-700">{this.state.error?.message}</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white"><RefreshCw className="h-4 w-4" /> Sayfayı Yenile</button>
        </div>
      );
    }
    return this.props.children;
  }
}
