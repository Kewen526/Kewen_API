import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataSources from './pages/DataSources';
import SqlEditor from './pages/SqlEditor';
import ApiManagement from './pages/ApiManagement';
import ApiCreate from './pages/ApiCreate';
import ApiDetail from './pages/ApiDetail';
import Monitoring from './pages/Monitoring';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="datasources" element={<DataSources />} />
            <Route path="sql-editor" element={<SqlEditor />} />
            <Route path="apis" element={<ApiManagement />} />
            <Route path="apis/create" element={<ApiCreate />} />
            <Route path="apis/:id" element={<ApiDetail />} />
            <Route path="monitoring" element={<Monitoring />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
