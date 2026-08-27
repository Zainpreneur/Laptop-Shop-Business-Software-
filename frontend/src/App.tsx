import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { Sales } from "./pages/Sales";
import { Customers } from "./pages/Customers";
import { Suppliers } from "./pages/Suppliers";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { Repairs } from "./pages/Repairs";
import { Users } from "./pages/Users";

function Protected({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/inventory"
        element={
          <Protected>
            <Inventory />
          </Protected>
        }
      />
      <Route
        path="/sales"
        element={
          <Protected>
            <Sales />
          </Protected>
        }
      />
      <Route
        path="/customers"
        element={
          <Protected>
            <Customers />
          </Protected>
        }
      />
      <Route
        path="/suppliers"
        element={
          <Protected>
            <Suppliers />
          </Protected>
        }
      />
      <Route
        path="/purchase-orders"
        element={
          <Protected adminOnly>
            <PurchaseOrders />
          </Protected>
        }
      />
      <Route
        path="/repairs"
        element={
          <Protected>
            <Repairs />
          </Protected>
        }
      />
      <Route
        path="/users"
        element={
          <Protected adminOnly>
            <Users />
          </Protected>
        }
      />
      <Route path="*" element={<Protected><Dashboard /></Protected>} />
    </Routes>
  );
}
