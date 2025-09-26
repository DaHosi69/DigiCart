import { createRoot } from 'react-dom/client'
import './index.css'
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './login/Login.tsx';
import Home from './home/Home.tsx';
import Layout from './shared/layout/Layout.tsx';

createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
         <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
      </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);