import { useState, useEffect } from 'react'
import axios from 'axios'

function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/products?status=Active')
      const activeInStock = response.data.filter(p => p.stock > 0)
      setProducts(activeInStock)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching products:', error)
      setLoading(false)
    }
  }

  const getCategoryEmoji = (category) => {
    const emojis = {
      Audio: '🎧',
      Accessories: '🔌',
      Keyboards: '⌨️',
      Cameras: '📷',
      Monitors: '🖥️',
      Laptops: '💻'
    }
    return emojis[category] || '📦'
  }

  const getStockBadge = (stock) => {
    if (stock <= 10) return `<span class="badge badge-amber">${stock} left</span>`
    return `<span class="badge badge-green">In Stock</span>`
  }

  const calculateCompleteness = (product) => {
    let score = 0
    if (product.name) score += 20
    if (product.description) score += 20
    if (product.price !== undefined && product.price !== null) score += 20
    if (product.stock !== undefined && product.stock !== null) score += 20
    if (Object.keys(product.attributes || {}).length >= 2) score += 20
    return score
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <header className="header">
        <div className="page-title">Dummy Store</div>
        <div className="header-actions">
          <span className="badge badge-green">LIVE</span>
        </div>
      </header>

      <div className="card">
        <h3>Live Store Preview</h3>
        <p>Showing {products.length} active products with stock. This is how your PIM data appears in the store.</p>
      </div>

      <div className="grid">
        {products.map(p => {
          const completeness = calculateCompleteness(p)
          const progressClass = completeness < 50 ? 'progress-red' : completeness < 80 ? 'progress-amber' : 'progress-green'
          const attrs = Object.entries(p.attributes || {}).slice(0, 2)
          return (
            <div key={p.id} className="product-card card">
              <div className="product-emoji">{getCategoryEmoji(p.category)}</div>
              <div className="product-category">{p.category}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-price">${p.price.toFixed(2)}</div>
              <div className="product-stock" dangerouslySetInnerHTML={{ __html: getStockBadge(p.stock) }}></div>
              <div className="product-attrs">
                {attrs.map(([k, v]) => (
                  <span key={k} className="attr-chip">{k}: {v}</span>
                ))}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${completeness}%`, background: `var(--${progressClass.split('-')[1]})` }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Store