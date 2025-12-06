import React, { ErrorInfo, ReactNode } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { hardReset } from '../services/storageService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-red-100 text-center">
            <div className="flex justify-center mb-4 text-red-500">
                <AlertTriangle size={64} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Qualcosa è andato storto</h1>
            <p className="text-gray-600 mb-6 text-sm">
                L'applicazione ha riscontrato un errore critico nei dati salvati o durante l'esecuzione.
                <br/><br/>
                <span className="font-mono text-xs bg-gray-100 p-1 rounded block overflow-hidden text-ellipsis">
                    {this.state.error?.message}
                </span>
            </p>
            
            <div className="flex flex-col gap-3">
                <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                <RefreshCw size={18} /> Ricarica Pagina
                </button>

                <button
                onClick={() => {
                    if(confirm("Sei sicuro? Questo cancellerà tutti i dati locali per ripristinare l'app.")) {
                        hardReset();
                    }
                }}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 py-3 rounded-lg hover:bg-red-50 transition"
                >
                <Trash2 size={18} /> Reset Totale Dati
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}