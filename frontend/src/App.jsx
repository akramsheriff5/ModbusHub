import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PLCSetup from './pages/PLCSetup';
import RegisterSetup from './pages/RegisterSetup';
import Layout from './components/Layout';
import AddPLC from './pages/AddPLC';
import AddRegisters from './pages/AddRegisters';

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <PrivateRoute>
                  <Layout>
                    <PLCSetup />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/plc/:plcId/registers"
              element={
                <PrivateRoute>
                  <Layout>
                    <RegisterSetup />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/add-plc"
              element={
                <PrivateRoute>
                  <Layout>
                    <AddPLC />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/add-registers"
              element={
                <PrivateRoute>
                  <Layout>
                    <AddRegisters />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 