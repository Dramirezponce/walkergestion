import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, Arial, sans-serif" }}>
          <h2>Ha ocurrido un error</h2>
          <p style={{ color: "#b00" }}>{this.state.message}</p>
          <button onClick={() => location.reload()} style={{ padding: "8px 12px", marginTop: 12 }}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}