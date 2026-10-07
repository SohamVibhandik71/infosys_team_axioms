import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App Uncaught Error:', error, info);
    this.setState({ info });
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neo-cream flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border-3 border-black rounded-2xl p-6 shadow-neo space-y-4">
            <h2 className="text-xl font-black text-rose-600 tracking-tight">
              Application Error Detected
            </h2>
            <p className="text-xs font-bold text-gray-700">
              An unexpected error occurred while rendering the page:
            </p>
            <pre className="p-3 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-mono text-rose-900 overflow-x-auto whitespace-pre-wrap">
              {this.state.error?.stack || this.state.error?.toString()}
            </pre>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-neo-yellow border-2 border-black rounded-xl font-black text-xs shadow-neo-sm hover:bg-yellow-300 cursor-pointer"
            >
              Clear Storage & Return to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
