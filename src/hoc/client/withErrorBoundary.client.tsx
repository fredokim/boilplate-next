"use client";

import type { ComponentType, ErrorInfo, PropsWithChildren } from "react";
import { Component } from "react";
import { ErrorState } from "@/components/states/ErrorState";
import { errorReporter } from "@/core/observability/errorReporter";

type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
    errorReporter.capture({
      error,
      context: {
        componentStack: info.componentStack,
        boundary: "client",
      },
    });
  }

  override render() {
    if (this.state.error) {
      return <ErrorState title="Client render failed" message={this.state.error.message} />;
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(Component: ComponentType<P>) {
  return function ErrorBoundaryWrappedComponent(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
