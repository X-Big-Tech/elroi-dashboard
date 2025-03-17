import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Dashboard from './components/Dashboard'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App 