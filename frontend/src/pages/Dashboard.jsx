import { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    syncReady: 0,
    categories: [],
    recentActivity: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const maxCategoryCount = Math.max(...stats.categories.map(c => c.count))

  return (
    <div>
      <header className="header">
        <div className="page-title">Dashboard</div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => window.location.href = '/products'}>Add Product</button>
          <button className="btn btn-ghost" onClick={() => window.location.href = '/sync'}>Sync All</button>
        </div>
      </header>

      <div className="metric-grid">
        <div className="metric-card card">
          <div className="metric-value">{stats.totalProducts}</div>
          <div className="metric-label">Total Products</div>
        </div>
        <div className="metric-card card">
          <div className="metric-value">{stats.activeProducts}</div>
          <div className="metric-label">Active Products</div>
        </div>
        <div className="metric-card card">
          <div className="metric-value">{stats.outOfStock}</div>
          <div className="metric-label">Out of Stock</div>
        </div>
        <div className="metric-card card">
          <div className="metric-value">{stats.syncReady}</div>
          <div className="metric-label">Sync Ready</div>
        </div>
      </div>

      <div className="activity-feed card">
        <h3>Recent Activity</h3>
        {stats.recentActivity.length ? stats.recentActivity.map(entry => (
          <div key={entry.id} className="activity-item">
            <div className="activity-dot" style={{
              background: entry.type.toLowerCase() === 'created' ? 'var(--green)' :
                         entry.type.toLowerCase() === 'updated' ? 'var(--blue)' :
                         entry.type.toLowerCase() === 'deleted' ? 'var(--red)' :
                         entry.type.toLowerCase() === 'synced' ? 'var(--purple)' :
                         entry.type.toLowerCase() === 'skipped' ? 'var(--amber)' : 'var(--gray)'
            }}></div>
            <div className="activity-time">{new Date(entry.time).toLocaleTimeString()}</div>
            <div className="activity-text">{entry.message}</div>
          </div>
        )) : <div className="activity-item">No recent activity</div>}
      </div>

      <div className="card">
        <h3>Category Breakdown</h3>
        <div className="chart">
          {stats.categories.map(({category, count}) => (
            <div key={category} className="chart-bar">
              <div className="bar-label">{category}</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: `${(count / maxCategoryCount) * 100}%` }}></div>
              </div>
              <div className="bar-count">{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <div className="action-card card" onClick={() => window.location.href = '/products'}>
          <div className="action-icon">➕</div>
          <div className="action-title">Add Product</div>
        </div>
        <div className="action-card card" onClick={() => window.location.href = '/sync'}>
          <div className="action-icon">🔄</div>
          <div className="action-title">Sync All to Store</div>
        </div>
        <div className="action-card card" onClick={() => window.location.href = '/import-export'}>
          <div className="action-icon">📤</div>
          <div className="action-title">Export Catalog</div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard