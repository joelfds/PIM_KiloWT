const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'pim.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    status TEXT DEFAULT 'Draft',
    imageUrl TEXT,
    attributes TEXT, -- JSON string
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT,
    message TEXT
  )`);

  // Insert seed data if table is empty
  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (row.count === 0) {
      const seedProducts = [
        {
          sku: 'AUD-0001',
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation.',
          price: 49.99,
          stock: 100,
          category: 'Audio',
          status: 'Active',
          attributes: JSON.stringify({ Color: 'Black', Connectivity: 'Bluetooth 5.0', Battery: '30hr', 'Noise Cancellation': 'Yes' })
        },
        {
          sku: 'ACC-0002',
          name: 'USB-C Hub 7-in-1',
          description: 'Versatile USB-C hub with multiple ports.',
          price: 29.99,
          stock: 50,
          category: 'Accessories',
          status: 'Active',
          attributes: JSON.stringify({ Ports: '7', Color: 'Silver', HDMI: '4K@60Hz', 'Max Power': '100W' })
        },
        {
          sku: 'KEY-0003',
          name: 'Mechanical Keyboard TKL',
          description: 'Tenkeyless mechanical keyboard with RGB lighting.',
          price: 89.99,
          stock: 30,
          category: 'Keyboards',
          status: 'Active',
          attributes: JSON.stringify({ Switch: 'Cherry MX Red', Layout: 'TKL', Backlight: 'RGB', Wireless: 'No' })
        },
        {
          sku: 'CAM-0004',
          name: '4K Webcam Pro',
          description: 'Professional 4K webcam for streaming.',
          price: 119.99,
          stock: 0,
          category: 'Cameras',
          status: 'Inactive',
          attributes: JSON.stringify({ Resolution: '4K', FPS: '30', Autofocus: 'Yes', FOV: '90 degrees' })
        },
        {
          sku: 'MON-0005',
          name: '27" IPS Gaming Monitor',
          description: '27-inch IPS gaming monitor with high refresh rate.',
          price: 299.99,
          stock: 15,
          category: 'Monitors',
          status: 'Draft',
          attributes: JSON.stringify({ Size: '27"', 'Refresh Rate': '144Hz', Panel: 'IPS', Resolution: '2560x1440' })
        },
        {
          sku: 'LAP-0006',
          name: 'UltraBook Pro 14',
          description: 'Lightweight ultrabook with M3 processor.',
          price: 1299.99,
          stock: 8,
          category: 'Laptops',
          status: 'Active',
          attributes: JSON.stringify({ RAM: '16GB', Storage: '512GB SSD', Processor: 'M3', 'Battery Life': '18hr' })
        }
      ];

      const stmt = db.prepare(`INSERT INTO products (sku, name, description, price, stock, category, status, attributes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      seedProducts.forEach(product => {
        stmt.run(product.sku, product.name, product.description, product.price, product.stock, product.category, product.status, product.attributes);
      });
      stmt.finalize();
    }
  });
});

// Routes
app.get('/api/products', (req, res) => {
  const { search, category, status, sort, direction = 'asc' } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR sku LIKE ? OR description LIKE ? OR category LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (sort) {
    const validSorts = ['sku', 'name', 'category', 'price', 'stock', 'status', 'createdAt', 'updatedAt'];
    if (validSorts.includes(sort)) {
      query += ` ORDER BY ${sort} ${direction.toUpperCase()}`;
    }
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse attributes JSON
    rows.forEach(row => {
      if (row.attributes) {
        try {
          row.attributes = JSON.parse(row.attributes);
        } catch (e) {
          row.attributes = {};
        }
      } else {
        row.attributes = {};
      }
    });
    res.json(rows);
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      if (row.attributes) {
        try {
          row.attributes = JSON.parse(row.attributes);
        } catch (e) {
          row.attributes = {};
        }
      } else {
        row.attributes = {};
      }
    }
    res.json(row);
  });
});

app.post('/api/products', (req, res) => {
  const { sku, name, description, price, stock, category, status, imageUrl, attributes } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

  const attributesJson = JSON.stringify(attributes || {});

  db.run(`INSERT INTO products (sku, name, description, price, stock, category, status, imageUrl, attributes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sku, name, description, price, stock, category, status || 'Draft', imageUrl, attributesJson],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Log the creation
      db.run(`INSERT INTO sync_log (type, message) VALUES (?, ?)`,
        ['CREATED', `Created product ${sku}`]);

      res.json({ id: this.lastID, message: 'Product created successfully' });
    });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { sku, name, description, price, stock, category, status, imageUrl, attributes } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

  const attributesJson = JSON.stringify(attributes || {});

  db.run(`UPDATE products SET
          sku = ?, name = ?, description = ?, price = ?, stock = ?, category = ?,
          status = ?, imageUrl = ?, attributes = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?`,
    [sku, name, description, price, stock, category, status, imageUrl, attributesJson, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Log the update
      db.run(`INSERT INTO sync_log (type, message) VALUES (?, ?)`,
        ['UPDATED', `Updated product ${sku}`]);

      res.json({ message: 'Product updated successfully' });
    });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  // Get product info for logging
  db.get('SELECT sku FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Log the deletion
      db.run(`INSERT INTO sync_log (type, message) VALUES (?, ?)`,
        ['DELETED', `Deleted product ${row?.sku || 'unknown'}`]);

      res.json({ message: 'Product deleted successfully' });
    });
  });
});

app.delete('/api/products', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.run(`DELETE FROM products WHERE id IN (${placeholders})`, ids, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Log bulk deletion
    db.run(`INSERT INTO sync_log (type, message) VALUES (?, ?)`,
      ['DELETED', `Bulk deleted ${this.changes} products`]);

    res.json({ message: `${this.changes} products deleted successfully` });
  });
});

app.put('/api/products/bulk/status', (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ error: 'IDs array and status are required' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.run(`UPDATE products SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
    [status, ...ids], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Log bulk status update
      db.run(`INSERT INTO sync_log (type, message) VALUES (?, ?)`,
        ['UPDATED', `Bulk updated status to ${status}`]);

      res.json({ message: `${this.changes} products updated successfully` });
    });
});

app.post('/api/products/bulk/sync', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  // Get product SKUs for logging
  const placeholders = ids.map(() => '?').join(',');
  db.all(`SELECT sku FROM products WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const skus = rows.map(row => row.sku).join(', ');

    // Log sync
    db.run(`INSERT INTO sync_log (type, message) VALUES (?, ?)`,
      ['SYNCED', `Synced products: ${skus}`]);

    res.json({ message: `${ids.length} products synced successfully` });
  });
});

app.get('/api/sync-log', (req, res) => {
  const { limit = 100 } = req.query;
  db.all('SELECT * FROM sync_log ORDER BY time DESC LIMIT ?', [parseInt(limit)], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.delete('/api/sync-log', (req, res) => {
  db.run('DELETE FROM sync_log', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Sync log cleared successfully' });
  });
});

app.get('/api/dashboard', (req, res) => {
  const queries = {
    totalProducts: 'SELECT COUNT(*) as count FROM products',
    activeProducts: 'SELECT COUNT(*) as count FROM products WHERE status = "Active"',
    outOfStock: 'SELECT COUNT(*) as count FROM products WHERE stock = 0',
    syncReady: 'SELECT COUNT(*) as count FROM products WHERE status = "Active" AND stock > 0',
    categories: 'SELECT category, COUNT(*) as count FROM products GROUP BY category',
    recentActivity: 'SELECT * FROM sync_log ORDER BY time DESC LIMIT 8'
  };

  const results = {};

  const promises = Object.entries(queries).map(([key, query]) => {
    return new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve({ key, rows });
      });
    });
  });

  Promise.all(promises).then(resultsArray => {
    resultsArray.forEach(({ key, rows }) => {
      if (key === 'totalProducts' || key === 'activeProducts' || key === 'outOfStock' || key === 'syncReady') {
        results[key] = rows[0].count;
      } else if (key === 'categories') {
        results[key] = rows;
      } else if (key === 'recentActivity') {
        results[key] = rows;
      }
    });
    res.json(results);
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

app.get('/api/attributes', (req, res) => {
  db.all('SELECT attributes FROM products', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const attrMap = {};
    rows.forEach(row => {
      if (row.attributes) {
        try {
          const attrs = JSON.parse(row.attributes);
          Object.entries(attrs).forEach(([key, value]) => {
            if (!attrMap[key]) attrMap[key] = { values: new Set(), count: 0 };
            attrMap[key].values.add(value);
            attrMap[key].count++;
          });
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    });

    // Convert Sets to Arrays
    Object.keys(attrMap).forEach(key => {
      attrMap[key].values = Array.from(attrMap[key].values);
    });

    res.json(attrMap);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});