"use client";

import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-[#1a1a1a] p-8 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              An unexpected error occurred. This has been logged for investigation.
            </p>
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-[#2a2a2a] p-3 rounded-lg overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-xl bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 px-6 py-2.5 text-sm font-bold text-[#111111] cursor-pointer transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
