import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let parsedError = this.state.errorMessage;
      try {
        const obj = JSON.parse(this.state.errorMessage) as { error?: string; path?: string };
        if (obj.error) {
          parsedError = `${obj.error}${obj.path ? ` (Path: ${obj.path})` : ''}`;
        }
      } catch {
        // plain text error
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <p className="text-xs font-mono text-red-600 mb-2">Application Recovery</p>
            <h1 className="text-xl font-semibold text-slate-900 mb-3">
              Something interrupted this workspace view
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed break-words">
              {parsedError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
