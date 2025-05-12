import { createRoot } from "react-dom/client";
import React, { StrictMode, Suspense } from "react";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Simple error boundary component with TypeScript support
interface ErrorFallbackProps {
  children: React.ReactNode;
}

interface ErrorFallbackState {
  hasError: boolean;
  error: Error | null;
}

class ErrorFallback extends React.Component<ErrorFallbackProps, ErrorFallbackState> {
  constructor(props: ErrorFallbackProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorFallbackState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Application crashed:", error, info);
  }
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px', 
          color: '#721c24'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          <details style={{ marginTop: '20px' }}>
            <summary>Error Details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
              {this.state.error && this.state.error.message}
            </pre>
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Add a loading fallback
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '5px solid #f3f3f3', 
        borderTop: '5px solid #582A34', 
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto'
      }} />
      <p style={{ marginTop: '20px', color: '#582A34' }}>Loading Loudfits...</p>
    </div>
  </div>
);

// Add a global style for the spinner animation
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleElement);

// Setup global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Render the app with safety measures
createRoot(document.getElementById("root")!).render(
  <ErrorFallback>
    <Suspense fallback={<LoadingFallback />}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Suspense>
  </ErrorFallback>
);
