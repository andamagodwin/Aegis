
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Store
// @ts-expect-error - JS file
import useStore from './store/useStore';

// Components
// @ts-expect-error - JSX file
import AuthGuard from './components/auth/AuthGuard';
// @ts-expect-error - JSX file
import Login from './components/auth/Login';
// @ts-expect-error - JSX file
import Register from './components/auth/Register';
// @ts-expect-error - JSX file
import Dashboard from './pages/Dashboard';

function App() {
  const { isAuthenticated, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Register />
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } 
          />

          {/* Catch all route - redirect to login if not authenticated, dashboard if authenticated */}
          <Route 
            path="*" 
            element={
              <Navigate to={isAuthenticated ? "/" : "/login"} replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
