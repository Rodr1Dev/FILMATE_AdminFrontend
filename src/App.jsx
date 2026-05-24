import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './Component/MainLayout.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/App" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
