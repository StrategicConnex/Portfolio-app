'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AskAIErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[AskAI] ErrorBoundary caught:', error);
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="console fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] bg-slate-950/95 backdrop-blur-xl border border-red-800/50 shadow-2xl rounded-2xl overflow-hidden">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
              Error en el Copiloto
            </h3>
            <p className="text-xs text-[var(--text-subtle)] mb-4 max-w-xs leading-relaxed">
              El asistente ha encontrado un error inesperado. El resto del portfolio
              funciona con normalidad.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-[var(--border-interactive)] text-[var(--text-muted)] hover:text-white"
                onClick={this.handleReset}
              >
                Reintentar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-[var(--border-interactive)] text-[var(--text-muted)] hover:text-white"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
