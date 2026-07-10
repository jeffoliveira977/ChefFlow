import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { ToastContainer } from './components/Toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KitchenPage from './pages/KitchenPage';
import TablesPage from './pages/TablesPage';
import CustomersPage from './pages/CustomersPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import NewOrderPage from './pages/NewOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CacheProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/new" element={<NewOrderPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </CacheProvider>
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
