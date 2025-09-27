import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login/Login.tsx";
import Home from "./home/Home.tsx";
import Layout from "./shared/layout/Layout.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppSettings from "./shared/components/AppSettings.tsx";
import { RequireAdmin, RequireAuth } from "./shared/components/guards.tsx";
import { AuthProvider } from "./providers/AuthProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      {" "}
      {/* <-- WICHTIG */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Login />} />

          {/* geschützter Bereich */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/home/settings" element={<AppSettings />} />
            <Route
              path="/home/admin"
              element={
                <RequireAdmin>
                  <Home />
                </RequireAdmin>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);
