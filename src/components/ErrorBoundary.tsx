import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-8">
            <p className="text-xs font-medium tracking-wider text-[#146C53] dark:text-[#2EB88B]">
              Workspace Recovery
            </p>
            <h1 className="font-display text-2xl font-medium mt-2">
              Unable to complete this operation
            </h1>
            <p className="mt-3 text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="mt-6 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold transition-colors"
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
