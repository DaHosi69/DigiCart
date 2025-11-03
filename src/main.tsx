import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login/Login.tsx";
import Home from "./home/Home.tsx";
import Layout from "./shared/layout/Layout.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RequireAdmin, RequireAuth } from "./shared/components/guards.tsx";
import { AuthProvider } from "./providers/AuthProvider.tsx";
import Lists from "./home/common/Lists/Lists.tsx";
import Products from "./home/common/Products/Products.tsx";
import Billings from "./home/common/Billings/Billings.tsx";
import ShoppingListEdit from "./home/common/Lists/components/ShoppingListEdit.tsx";
import ProductEdit from "./home/common/Products/components/ProductEdit.tsx";
import { RouteHistoryProvider } from "./providers/RouteHistoryProvider.tsx";
import { AppToaster } from "./hooks/useSimpleToasts.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <RouteHistoryProvider>

           <AppToaster />

          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/home" element={<Home />} />
              <Route path="/home/lists/:id" element={<Home />} />
              {/* <Route path="/home/settings" element={<AppSettings />} /> */}
              <Route
                path="/home/admin"
                element={
                  <RequireAdmin>
                    <Home />
                  </RequireAdmin>
                }
              />
              <Route
                path="/lists"
                element={
                  <RequireAdmin>
                    <Lists />
                  </RequireAdmin>
                }
              />
              <Route
                path="/lists/:id/edit"
                element={
                  <RequireAdmin>
                    <ShoppingListEdit />
                  </RequireAdmin>
                }
              />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id/edit" element={<ProductEdit />} />
              <Route path="/billings" element={<Billings />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </RouteHistoryProvider>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);
