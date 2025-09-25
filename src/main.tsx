import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './login/Login.tsx';

createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);