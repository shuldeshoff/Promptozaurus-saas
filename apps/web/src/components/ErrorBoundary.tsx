import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can log to an error reporting service here
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😞</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-400 text-sm">
                An unexpected error occurred. We're sorry for the inconvenience.
              </p>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <details className="bg-gray-800 rounded-lg p-4">
                  <summary className="text-sm text-gray-300 cursor-pointer hover:text-white">
                    Error details
                  </summary>
                  <pre className="mt-3 text-xs text-red-400 overflow-x-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

