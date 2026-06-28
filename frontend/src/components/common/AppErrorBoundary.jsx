import { Component } from "react";

import ErrorState from "@/components/common/ErrorState";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="p-4">
          <ErrorState
            message={this.state.error.message || "Please retry the page."}
            onRetry={this.handleRetry}
            title="Workspace rendering failed"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
