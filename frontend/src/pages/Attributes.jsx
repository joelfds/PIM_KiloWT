import { useState, useEffect } from 'react'
import axios from 'axios'

function Attributes() {
  const [attributes, setAttributes] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttributes()
  }, [])

  const fetchAttributes = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/attributes')
      setAttributes(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching attributes:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const maxCount = Math.max(...Object.values(attributes).map(a => a.count))

  return (
    <div>
      <header className="header">
        <div className="page-title">Attributes</div>
      </header>

      {Object.entries(attributes).map(([name, data]) => (
        <div key={name} className="attr-card card">
          <div className="attr-name">{name}</div>
          <div className="attr-values">
            {data.values.map(value => (
              <span key={value} className="badge badge-green">{value}</span>
            ))}
          </div>
          <div className="attr-count">{data.count} products</div>
          <div className="usage-bar">
            <div className="usage-fill" style={{ width: `${(data.count / maxCount) * 100}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Attributes