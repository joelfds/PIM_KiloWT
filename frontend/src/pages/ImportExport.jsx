import { useState, useEffect } from 'react'
import axios from 'axios'

function ImportExport() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/products')
      setProducts(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching products:', error)
      setLoading(false)
    }
  }

  const exportJSON = () => {
    const data = JSON.stringify(products, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const headers = ['sku', 'name', 'description', 'price', 'stock', 'category', 'status', 'attributes']
    const csv = [headers.join(',')]
    products.forEach(p => {
      const row = [
        p.sku,
        `"${p.name}"`,
        `"${p.description || ''}"`,
        p.price,
        p.stock,
        p.category,
        p.status,
        `"${JSON.stringify(p.attributes || {})}"`
      ]
      csv.push(row.join(','))
    })
    const data = csv.join('\n')
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      if (file.name.endsWith('.json')) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const imported = JSON.parse(e.target.result)
            if (Array.isArray(imported)) {
              for (const product of imported) {
                await axios.post('http://localhost:3001/api/products', product)
              }
              alert(`Imported ${imported.length} products`)
              fetchProducts()
            } else {
              alert('Invalid JSON format')
            }
          } catch (err) {
            alert('Error parsing JSON file')
          }
        }
        reader.readAsText(file)
      } else if (file.name.endsWith('.csv')) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const csv = e.target.result
            const lines = csv.split('\n')
            const headers = lines[0].split(',')
            const imported = []
            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue
              const values = lines[i].split(',')
              const product = {}
              headers.forEach((h, idx) => {
                if (h === 'attributes') {
                  try {
                    product[h] = JSON.parse(values[idx])
                  } catch {
                    product[h] = {}
                  }
                } else if (h === 'price' || h === 'stock') {
                  product[h] = parseFloat(values[idx])
                } else {
                  product[h] = values[idx]
                }
              })
              imported.push(product)
            }
            for (const product of imported) {
              await axios.post('http://localhost:3001/api/products', product)
            }
            alert(`Imported ${imported.length} products`)
            fetchProducts()
          } catch (err) {
            alert('Error parsing CSV file')
          }
        }
        reader.readAsText(file)
      }
    } catch (error) {
      console.error('Error importing file:', error)
      alert('Error importing file')
    }
  }

  const sampleProducts = products.slice(0, 2)
  const jsonPreview = JSON.stringify(sampleProducts, null, 2)

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <header className="header">
        <div className="page-title">Import / Export</div>
      </header>

      <div className="import-export">
        <div className="card">
          <h3>Export</h3>
          <button className="btn btn-primary" onClick={exportJSON}>Export as JSON</button>
          <button className="btn btn-primary" onClick={exportCSV}>Export as CSV</button>
          <div className="export-preview">{jsonPreview}</div>
        </div>
        <div className="card">
          <h3>Import</h3>
          <div className="drop-zone">
            Drop JSON or CSV here<br />
            <small>or click to select file</small>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="fileInput"
            />
          </div>
          <p>Format: JSON array of products or CSV with headers: sku,name,description,price,stock,category,status,attributes (JSON string)</p>
        </div>
      </div>
    </div>
  )
}

export default ImportExport