import React, { PropsWithChildren } from 'react';

export class ErrorBoundary extends React.Component<PropsWithChildren<Record<string, string>>> {
  state: { error: Error | null; errorInfo: string[] | null } = { error: null, errorInfo: null };

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.errorInfo) {
      return null;
    }

    return this.props.children;
  }
}
