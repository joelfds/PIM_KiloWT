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
        // Mugs (original)
        {
          sku: 'MUG-0001',
          name: 'Classic White Ceramic Mug',
          description: 'Timeless white ceramic mug perfect for coffee or tea.',
          price: 12.99,
          stock: 150,
          category: 'Mugs',
          status: 'Active',
          attributes: JSON.stringify({ Color: 'White', Size: '11oz', Material: 'Ceramic', Handle: 'Yes', Dishwasher: 'Safe' })
        },
        {
          sku: 'MUG-0002',
          name: 'Travel Insulated Mug',
          description: 'Stainless steel insulated mug that keeps drinks hot or cold for hours.',
          price: 24.99,
          stock: 75,
          category: 'Mugs',
          status: 'Active',
          attributes: JSON.stringify({ Color: 'Silver', Size: '16oz', Material: 'Stainless Steel', Insulation: 'Double Wall', Lid: 'Yes' })
        },
        {
          sku: 'MUG-0003',
          name: 'Colorful Enamel Mug',
          description: 'Vibrant enamel mug with a retro design.',
          price: 18.99,
          stock: 60,
          category: 'Mugs',
          status: 'Active',
          attributes: JSON.stringify({ Color: 'Blue', Size: '12oz', Material: 'Enamel', Handle: 'Yes', Dishwasher: 'Safe' })
        },
        {
          sku: 'MUG-0004',
          name: 'Large Family Size Mug',
          description: 'Extra large ceramic mug perfect for generous servings.',
          price: 16.99,
          stock: 45,
          category: 'Mugs',
          status: 'Active',
          attributes: JSON.stringify({ Color: 'White', Size: '20oz', Material: 'Ceramic', Handle: 'Yes', Dishwasher: 'Safe' })
        },
        {
          sku: 'MUG-0005',
          name: 'Matte Black Mug',
          description: 'Sleek matte black ceramic mug with modern appeal.',
          price: 14.99,
          stock: 0,
          category: 'Mugs',
          status: 'Inactive',
          attributes: JSON.stringify({ Color: 'Black', Size: '11oz', Material: 'Ceramic', Handle: 'Yes', Dishwasher: 'Safe' })
        },
        {
          sku: 'MUG-0006',
          name: 'Glass Coffee Mug',
          description: 'Elegant clear glass mug that showcases your beverage.',
          price: 9.99,
          stock: 90,
          category: 'Mugs',
          status: 'Draft',
          attributes: JSON.stringify({ Color: 'Clear', Size: '8oz', Material: 'Glass', Handle: 'Yes', Dishwasher: 'Safe' })
        },
        // T-Shirts
        {
          sku: 'TSHIRT-001',
          name: 'Cotton Graphic Tee',
          description: 'Soft cotton t-shirt with bold graphic print.',
          price: 24.99,
          stock: 200,
          category: 'T-Shirts',
          status: 'Active',
          attributes: JSON.stringify({ Size: 'M', Color: 'Black', Material: 'Cotton', Fit: 'Regular' })
        },
        {
          sku: 'TSHIRT-002',
          name: 'Premium Oversized Tee',
          description: 'High-quality oversized t-shirt for casual wear.',
          price: 32.99,
          stock: 120,
          category: 'T-Shirts',
          status: 'Active',
          attributes: JSON.stringify({ Size: 'L', Color: 'White', Material: 'Organic Cotton', Fit: 'Oversized' })
        },
        {
          sku: 'TSHIRT-003',
          name: 'Performance Tech Tee',
          description: 'Breathable performance t-shirt for active lifestyle.',
          price: 28.99,
          stock: 85,
          category: 'T-Shirts',
          status: 'Draft',
          attributes: JSON.stringify({ Size: 'S', Color: 'Navy', Material: 'Polyester Blend', Fit: 'Slim' })
        },
        // Hoodies
        {
          sku: 'HOODIE-001',
          name: 'Cozy Fleece Hoodie',
          description: 'Warm fleece hoodie perfect for cooler days.',
          price: 49.99,
          stock: 95,
          category: 'Hoodies',
          status: 'Active',
          attributes: JSON.stringify({ Size: 'XL', Color: 'Gray', Material: 'Fleece', Hood: 'Yes', Pocket: 'Kangaroo' })
        },
        {
          sku: 'HOODIE-002',
          name: 'Zip-Up Hoodie',
          description: 'Convenient zip-up hoodie with adjustable drawstring.',
          price: 54.99,
          stock: 65,
          category: 'Hoodies',
          status: 'Inactive',
          attributes: JSON.stringify({ Size: 'M', Color: 'Black', Material: 'Cotton Blend', Hood: 'Yes', Zipper: 'Full' })
        },
        // Accessories
        {
          sku: 'CAP-001',
          name: 'Embroidered Baseball Cap',
          description: 'Classic baseball cap with embroidered logo.',
          price: 19.99,
          stock: 180,
          category: 'Accessories',
          status: 'Active',
          attributes: JSON.stringify({ Size: 'One Size', Color: 'Black', Material: 'Cotton Twill', Adjustable: 'Yes' })
        },
        {
          sku: 'BAG-001',
          name: 'Canvas Tote Bag',
          description: 'Durable canvas tote for everyday use.',
          price: 22.99,
          stock: 110,
          category: 'Accessories',
          status: 'Active',
          attributes: JSON.stringify({ Size: 'Medium', Color: 'Natural', Material: 'Canvas', Handles: 'Long' })
        },
        {
          sku: 'PHONE-001',
          name: 'Protective Phone Case',
          description: 'Shockproof phone case with raised edges.',
          price: 15.99,
          stock: 250,
          category: 'Accessories',
          status: 'Draft',
          attributes: JSON.stringify({ Compatible: 'iPhone 15', Color: 'Clear', Material: 'TPU', Drop: '10ft' })
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
  const { search, status, sort, direction = 'asc' } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (sort) {
    const validSorts = ['sku', 'name', 'price', 'stock', 'status', 'createdAt', 'updatedAt'];
    if (validSorts.includes(sort)) {
      query += ` ORDER BY ${sort} ${direction.toUpperCase()}`;
    }
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse attributes JSON and remove category field
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
      delete row.category;
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
  const { sku, name, description, price, stock, status, imageUrl, attributes } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

  const attributesJson = JSON.stringify(attributes || {});

  const fixedCategory = 'Mugs';
  db.run(`INSERT INTO products (sku, name, description, price, stock, category, status, imageUrl, attributes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sku, name, description, price, stock, fixedCategory, status || 'Draft', imageUrl, attributesJson],
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
  const { sku, name, description, price, stock, status, imageUrl, attributes } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

  const attributesJson = JSON.stringify(attributes || {});

  const fixedCategory = 'Mugs';
  db.run(`UPDATE products SET
          sku = ?, name = ?, description = ?, price = ?, stock = ?, category = ?,
          status = ?, imageUrl = ?, attributes = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?`,
    [sku, name, description, price, stock, fixedCategory, status, imageUrl, attributesJson, id],
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