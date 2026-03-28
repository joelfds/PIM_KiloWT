import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Store from './pages/Store'
import SyncLog from './pages/SyncLog'
import Attributes from './pages/Attributes'
import ImportExport from './pages/ImportExport'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [savedIndicator, setSavedIndicator] = useState(false)

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/store', label: 'Dummy Store', icon: '🏪' },
    { path: '/sync', label: 'Sync Log', icon: '🔄' },
    { path: '/attributes', label: 'Attributes', icon: '🏷️' },
    { path: '/import-export', label: 'Import / Export', icon: '📤' }
  ]

  const showSavedIndicator = () => {
    setSavedIndicator(true)
    setTimeout(() => setSavedIndicator(false), 1000)
  }

  useEffect(() => {
    window.showSavedIndicator = showSavedIndicator
  }, [])

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">PIM Studio</div>
          <div className="subtitle">Kilowott Hackathon</div>
        </div>
        <nav className="nav">
          {navItems.map(item => (
            <a
              key={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="ai-badge">
            <span>AI Engine: Active</span>
          </div>
        </div>
        <div className={`saved-indicator ${savedIndicator ? 'show' : ''}`}></div>
      </div>
      <div className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/store" element={<Store />} />
          <Route path="/sync" element={<SyncLog />} />
          <Route path="/attributes" element={<Attributes />} />
          <Route path="/import-export" element={<ImportExport />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
