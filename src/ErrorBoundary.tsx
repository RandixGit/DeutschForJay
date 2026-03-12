import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#f87171',
          fontFamily: 'monospace',
          padding: '2rem',
          boxSizing: 'border-box',
        }}>
          <h1 style={{ color: '#fbbf24', fontSize: '1.25rem', marginBottom: '1rem' }}>
            ⚠️ App crashed — check browser console for details
          </h1>
          <pre style={{
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '0.5rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.8rem',
            color: '#fca5a5',
          }}>
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}
