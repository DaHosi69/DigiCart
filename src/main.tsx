import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login/Login.tsx";
import Home from "./home/Home.tsx";
import Layout from "./shared/layout/Layout.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppSettings from "./shared/components/AppSettings.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/home/settings" element={<AppSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);
