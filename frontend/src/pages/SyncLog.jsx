import { useState, useEffect } from 'react'
import axios from 'axios'

function SyncLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/sync-log')
      setLogs(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching sync logs:', error)
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      await axios.delete('http://localhost:3001/api/sync-log')
      setLogs([])
    } catch (error) {
      console.error('Error clearing logs:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <header className="header">
        <div className="page-title">Sync Log</div>
        <div className="header-actions">
          <button className="btn btn-danger" onClick={clearLogs}>Clear Log</button>
        </div>
      </header>

      <div className="sync-log">
        {logs.length ? logs.map(entry => (
          <div key={entry.id} className="log-entry">
            <div className="log-time">{new Date(entry.time).toLocaleTimeString()}</div>
            <div className="log-type">
              <span className={`badge badge-${
                entry.type.toLowerCase() === 'created' ? 'green' :
                entry.type.toLowerCase() === 'updated' ? 'blue' :
                entry.type.toLowerCase() === 'deleted' ? 'red' :
                entry.type.toLowerCase() === 'synced' ? 'purple' :
                entry.type.toLowerCase() === 'skipped' ? 'amber' : 'gray'
              }`}>
                {entry.type}
              </span>
            </div>
            <div className="log-message">{entry.message}</div>
          </div>
        )) : <div className="log-entry">No sync events yet</div>}
      </div>
    </div>
  )
}

export default SyncLog