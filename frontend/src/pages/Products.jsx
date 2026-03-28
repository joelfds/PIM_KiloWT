import { useState, useEffect } from 'react'
import axios from 'axios'

function Products() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [statuses] = useState(['Active', 'Draft', 'Inactive'])

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchQuery, statusFilter, sortColumn, sortDirection])

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

  const filterAndSortProducts = () => {
    let filtered = products.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Object.values(p.attributes || {}).some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus = !statusFilter || p.status === statusFilter
      return matchesSearch && matchesStatus
    })

    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal = a[sortColumn]
        let bVal = b[sortColumn]
        if (sortColumn === 'completeness') {
          aVal = calculateCompleteness(a)
          bVal = calculateCompleteness(b)
        }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredProducts(filtered)
  }

  const calculateCompleteness = (product) => {
    let score = 0
    if (product.name) score += 20
    if (product.description) score += 20
    if (product.price !== undefined && product.price !== null) score += 20
    if (product.stock !== undefined && product.stock !== null) score += 20
    if (Object.keys(product.attributes || {}).length >= 3) score += 20
    return score
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const toggleProductSelection = (id) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProducts(newSelected)
  }

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const deleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:3001/api/products/${id}`)
        fetchProducts()
        window.showSavedIndicator && window.showSavedIndicator()
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const bulkDelete = async () => {
    if (confirm(`Delete ${selectedProducts.size} products?`)) {
      try {
        await axios.delete('http://localhost:3001/api/products', {
          data: { ids: Array.from(selectedProducts) }
        })
        setSelectedProducts(new Set())
        fetchProducts()
        window.showSavedIndicator && window.showSavedIndicator()
      } catch (error) {
        console.error('Error bulk deleting products:', error)
      }
    }
  }

  const bulkStatusUpdate = async (status) => {
    try {
      await axios.put('http://localhost:3001/api/products/bulk/status', {
        ids: Array.from(selectedProducts),
        status
      })
      setSelectedProducts(new Set())
      fetchProducts()
      window.showSavedIndicator && window.showSavedIndicator()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const bulkSync = async (ids = Array.from(selectedProducts)) => {
    try {
      await axios.post('http://localhost:3001/api/products/bulk/sync', {
        ids
      })
      if (ids === Array.from(selectedProducts)) {
        setSelectedProducts(new Set())
      }
      window.showSavedIndicator && window.showSavedIndicator()
    } catch (error) {
      console.error('Error syncing products:', error)
    }
  }

  const syncAllChanges = () => {
    const allIds = filteredProducts.map(p => p.id)
    bulkSync(allIds)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <header className="header">
        <div className="page-title">Products</div>
        <div className="header-actions">
          <input
            type="text"
            className="input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={openAddModal}>Add Product</button>
        </div>
      </header>

      <div className="stats-strip">
        <div>Showing {filteredProducts.length} of {products.length} products</div>
      </div>

      <div className="filters">
        <input
          type="checkbox"
          className="checkbox"
          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
          onChange={selectAll}
        />
        <label>Select All</label>
        <button 
          className="btn btn-secondary" 
          style={{marginLeft: '1rem'}}
          onClick={syncAllChanges}
        >
          Sync All Changes
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th onClick={() => handleSort('sku')}>
              SKU <span className={`sort-arrow ${sortColumn === 'sku' ? 'sort-' + sortDirection : ''}`}>▲</span>
            </th>
            <th onClick={() => handleSort('name')}>
              Name <span className={`sort-arrow ${sortColumn === 'name' ? 'sort-' + sortDirection : ''}`}>▲</span>
            </th>
            <th onClick={() => handleSort('price')}>
              Price <span className={`sort-arrow ${sortColumn === 'price' ? 'sort-' + sortDirection : ''}`}>▲</span>
            </th>
            <th onClick={() => handleSort('stock')}>
              Stock <span className={`sort-arrow ${sortColumn === 'stock' ? 'sort-' + sortDirection : ''}`}>▲</span>
            </th>
            <th onClick={() => handleSort('status')}>
              Status <span className={`sort-arrow ${sortColumn === 'status' ? 'sort-' + sortDirection : ''}`}>▲</span>
            </th>
            <th onClick={() => handleSort('completeness')}>
              Completeness <span className={`sort-arrow ${sortColumn === 'completeness' ? 'sort-' + sortDirection : ''}`}>▲</span>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
{filteredProducts.map(p => {
            const completeness = calculateCompleteness(p)
            const progressClass = completeness < 50 ? 'progress-red' : completeness < 80 ? 'progress-amber' : 'progress-green'
            const isSelected = selectedProducts.has(p.id)
            return (
              <tr 
                key={p.id}
                className={isSelected ? 'table-row-selected' : ''}
                onClick={(e) => {
                  if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                    toggleProductSelection(p.id)
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleProductSelection(p.id)}
                  />
                </td>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>${p.price?.toFixed(2) || 'N/A'}</td>
                <td>{p.stock || 0}</td>
                <td>
                  <span className={`badge badge-${p.status === 'Active' ? 'green' : p.status === 'Draft' ? 'amber' : 'gray'}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completeness}%`, background: `var(--${progressClass.split('-')[1]})` }}></div>
                  </div>
                  {completeness}%
                </td>
                <td>
                  <button className="btn btn-ghost" onClick={(e) => {
                    e.stopPropagation()
                    openEditModal(p)
                  }}>Edit</button>
                  <button className="btn btn-danger" onClick={(e) => {
                    e.stopPropagation()
                    deleteProduct(p.id)
                  }}>Delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {selectedProducts.size > 0 && (
        <div className="bulk-actions show">
          <div className="bulk-selected">{selectedProducts.size} selected</div>
          <div className="bulk-buttons">
            <button className="btn btn-danger" onClick={bulkDelete}>Bulk Delete</button>
            <button className="btn btn-ghost" onClick={() => bulkStatusUpdate('Active')}>Set Active</button>
            <button className="btn btn-ghost" onClick={() => bulkStatusUpdate('Draft')}>Set Draft</button>
            <button className="btn btn-ghost" onClick={() => bulkStatusUpdate('Inactive')}>Set Inactive</button>
            <button className="btn btn-primary" onClick={bulkSync}>Sync Selected</button>
          </div>
          <div className="deselect" onClick={() => setSelectedProducts(new Set())}>Deselect All</div>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={closeModal}
          onSave={() => {
            fetchProducts()
            closeModal()
          }}
        />
      )}
    </div>
  )
}

function ProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    status: product?.status || 'Draft',
    imageUrl: product?.imageUrl || '',
    color: product?.attributes?.Color || '',
    size: product?.attributes?.Size || '',
    material: product?.attributes?.Material || '',
    handle: product?.attributes?.Handle || 'Yes',
    dishwasherSafe: product?.attributes?.Dishwasher || 'Safe'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const attributes = {
      Color: formData.color,
      Size: formData.size,
      Material: formData.material,
      Handle: formData.handle,
      Dishwasher: formData.dishwasherSafe
    }

    const data = { ...formData, attributes }

    try {
      if (product) {
        await axios.put(`http://localhost:3001/api/products/${product.id}`, data)
      } else {
        await axios.post('http://localhost:3001/api/products', data)
      }
      onSave()
      window.showSavedIndicator && window.showSavedIndicator()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{product ? 'Edit' : 'Add'} Product</div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">SKU</label>
            <input
              type="text"
              className="input"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input textarea"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                type="number"
                className="input"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="status-pills">
              {['Active', 'Draft', 'Inactive'].map(status => (
                <div
                  key={status}
                  className={`status-pill ${formData.status === status ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, status})}
                >
                  {status}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Image URL (optional)</label>
            <input
              type="url"
              className="input"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mug Attributes</label>
            <div className="attributes-grid">
              <div className="attribute-field">
                <label>Color</label>
                <select
                  className="input"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                >
                  <option value="">Select Color</option>
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Blue">Blue</option>
                  <option value="Red">Red</option>
                  <option value="Green">Green</option>
                  <option value="Silver">Silver</option>
                  <option value="Clear">Clear</option>
                </select>
              </div>
              <div className="attribute-field">
                <label>Size</label>
                <select
                  className="input"
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                >
                  <option value="">Select Size</option>
                  <option value="8oz">8oz</option>
                  <option value="11oz">11oz</option>
                  <option value="12oz">12oz</option>
                  <option value="16oz">16oz</option>
                  <option value="20oz">20oz</option>
                </select>
              </div>
              <div className="attribute-field">
                <label>Material</label>
                <select
                  className="input"
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                >
                  <option value="">Select Material</option>
                  <option value="Ceramic">Ceramic</option>
                  <option value="Stainless Steel">Stainless Steel</option>
                  <option value="Enamel">Enamel</option>
                  <option value="Glass">Glass</option>
                </select>
              </div>
              <div className="attribute-field">
                <label>Handle</label>
                <select
                  className="input"
                  value={formData.handle}
                  onChange={(e) => setFormData({...formData, handle: e.target.value})}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="attribute-field">
                <label>Dishwasher Safe</label>
                <select
                  className="input"
                  value={formData.dishwasherSafe}
                  onChange={(e) => setFormData({...formData, dishwasherSafe: e.target.value})}
                >
                  <option value="Safe">Safe</option>
                  <option value="Not Safe">Not Safe</option>
                </select>
              </div>
            </div>
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-primary">{product ? 'Update' : 'Create'} Product</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Products