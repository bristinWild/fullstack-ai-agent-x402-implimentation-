import React from 'react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(err: any) { console.error('UI crash:', err); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: 'tomato' }}>
          <h3>Something went wrong.</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}
