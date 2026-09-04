import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "../views/CustomizableDashboard.module.scss";

export class WidgetErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The boundary is the integration point for a future production error reporter.
    void _error;
    void _info;
  }

  override render() {
    return this.state.hasError ? (
      <div className={styles.runtimeError} role="alert">
        This widget could not be displayed.
      </div>
    ) : (
      this.props.children
    );
  }
}
