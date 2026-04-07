import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    void error
    return { hasError: true }
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex-1 px-4 py-6 text-left">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--social-bg)] p-4">
            <h1 className="text-2xl font-medium text-[var(--text-h)]">Something went wrong</h1>
            <p className="mt-1 text-sm text-[var(--text)]">Try again, or reload the page.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="button" type="button" onClick={this.reset}>
                Try again
              </button>
              <button className="button" type="button" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
