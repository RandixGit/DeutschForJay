import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './services/AuthContext.tsx'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
