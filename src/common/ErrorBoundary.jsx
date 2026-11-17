import { Component } from 'react'

// Without this, one error while drawing any screen removes the whole app and leaves a white page.
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22 }}>Something went wrong</h1>
        <p>Your saved places and settings are safe on this phone.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '12px 24px', fontSize: 16, fontWeight: 700, border: 0, borderRadius: 12, background: '#F4B400' }}>Reload the app</button>
      </div>
    )
  }
}
