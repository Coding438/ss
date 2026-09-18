// ========== ADMIN PORTAL APP ==========

// Auth guard
(function () {
  const session = localStorage.getItem('admin_session') || sessionStorage.getItem('admin_session');
  if (!session) {
    window.location.href = 'admin.html';
    return;
  }
  const user = JSON.parse(session);
  document.getElementById('userName').textContent = user.name || 'Admin';
})();


// Tracking removed from admin — stub keeps dashboard safe
const Tracking = {
  visitors: [],
  init() {},
  getStats() { return { live: 0, totalVisits: 0, totalPageViews: 0, todayViews: 0, todayUnique: 0, byPage: [], byDevice: {}, byLocation: [], isReal: false }; },
  generateInitialVisitors() {},
  formatDuration() { return ''; }
};

// Toast helper
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Modal helpers
function openModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-overlay show"><div class="modal">${html}</div></div>`;
  root.querySelector('.modal-overlay').addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeModal();
  });
  const closeBtn = root.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => { document.getElementById('modalRoot').innerHTML = ''; }, 250);
  }
}

// Format money in PKR
function fmtPKR(n) {
  const num = Number(n) || 0;
  return 'Rs. ' + num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

function escapeHtml(str) {
  if (str == null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ========== PAGE RENDERERS ==========

function renderDashboard() {
  const products = Storage.get('products');
  const orders = Storage.get('orders');
  const customers = Storage.get('customers');
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const stats = Tracking.getStats();

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <h3>Total Revenue</h3>
          <div class="value">${fmtPKR(totalRevenue)}</div>
          <div class="change up">From orders</div>
        </div>
        <div class="stat-icon blue"><i class="fas fa-dollar-sign"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Orders</h3>
          <div class="value">${orders.length}</div>
          <div class="change up"><i class="fas fa-arrow-up"></i> ${pendingOrders} pending</div>
        </div>
        <div class="stat-icon green"><i class="fas fa-shopping-bag"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Customers</h3>
          <div class="value">${customers.length}</div>
          <div class="change up">Registered</div>
        </div>
        <div class="stat-icon purple"><i class="fas fa-users"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Products</h3>
          <div class="value">${products.length}</div>
          <div class="change up">In catalog</div>
        </div>
        <div class="stat-icon yellow"><i class="fas fa-box"></i></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>Sales Overview (30 days)</h3>
        </div>
        <div class="chart-container">
          <canvas id="salesChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Recent Orders</h3>
          <button class="btn btn-sm btn-secondary" onclick="navigate('orders')">View All</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${orders.slice(0, 6).map(o => `
                <tr>
                  <td>#${o.id}</td>
                  <td>${o.customer}</td>
                  <td>${fmtPKR(o.total)}</td>
                  <td><span class="status ${o.status}">${o.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Top Products</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Sales</th><th>Stock</th><th>Revenue</th></tr></thead>
            <tbody>
              ${[...products].sort((a,b)=>b.sales-a.sales).slice(0,5).map(p => `
                <tr>
                  <td>${p.image} ${p.name}</td>
                  <td>${p.sales}</td>
                  <td>${p.stock}</td>
                  <td>${fmtPKR(p.sales * p.price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Quick Stats</h3></div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--text-muted)">Total Visits</span>
            <strong>${stats.totalVisits.toLocaleString()}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--text-muted)">Page Views</span>
            <strong>${stats.totalPageViews.toLocaleString()}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--text-muted)">Low Stock Items</span>
            <strong style="color:var(--danger)">${lowStock}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--text-muted)">Pending Reviews</span>
            <strong>${Storage.get('reviews').filter(r=>r.status==='pending').length}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:var(--text-muted)">Active Coupons</span>
            <strong>${Storage.get('coupons').filter(c=>c.status==='active').length}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function afterDashboardRender() {
  const pageViews = Storage.get('pageViews') || [];
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;
  if (!pageViews.length) {
    ctx.parentElement.innerHTML = '<div class="empty-state" style="padding:40px"><p>No sales data yet</p></div>';
    return;
  }
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: pageViews.map(p => p.date.slice(5)),
      datasets: [{
        label: 'Sales',
        data: pageViews.map(p => p.sales),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8', maxTicksLimit: 8 } },
        y: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

// ----- PRODUCTS -----
const IMGBB_API_KEY = '46329243b16ca7fecaca1a7f2c474201';
const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxmCacHvuuIr0R_wYt9IO6OocclBZMV1nMqgZrMdYbaGbK2i4Mw6LfSsv8GmPLrRlul/exec';
function getSheetsUrl() {
  const u = localStorage.getItem('googleSheetUrl');
  if (u && u.includes('script.google.com')) return u;
  return DEFAULT_SHEETS_URL;
}
// Ensure default URL is stored so Settings shows it
(function ensureSheetUrl() {
  const u = localStorage.getItem('googleSheetUrl');
  if (!u || !u.includes('script.google.com')) {
    localStorage.setItem('googleSheetUrl', DEFAULT_SHEETS_URL);
  }
})();


function productThumb(p) {
  let url = p.imageUrl;
  if (!url && p.imageUrls) {
    url = Array.isArray(p.imageUrls) ? p.imageUrls[0] : String(p.imageUrls).split(',')[0].trim();
  }
  if (url) return `<img src="${url}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px" />`;
  return `<span style="font-size:1.4rem">${p.image || '📦'}</span>`;
}

function renderProducts() {
  const products = Storage.get('products');
  return `
    <div class="card">
      <div class="card-header">
        <h3>All Products (${products.length})</h3>
        <button class="btn btn-primary" onclick="openProductModal()"><i class="fas fa-plus"></i> Add Product</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.length ? products.map(p => `
              <tr>
                <td>${productThumb(p)}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.sku}</td>
                <td>${p.category}</td>
                <td>${fmtPKR(p.price)}</td>
                <td><span class="status ${p.stock <= 10 ? (p.stock === 0 ? 'cancelled' : 'low') : 'ok'}">${p.stock}</span></td>
                <td><span class="status ${p.status}">${p.status}</span></td>
                <td>
                  <button class="btn-icon edit" onclick="openProductModal(${p.id})" title="Edit"><i class="fas fa-edit"></i></button>
                  <button class="btn-icon delete" onclick="deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">No products yet. Click Add Product to create one.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}


const PRODUCT_CATEGORIES = ['Tops', 'Bottoms', 'Watches', 'Shoes', 'House Care', 'Health Care', 'Electronic'];

function openProductModal(id) {
  const products = Storage.get('products');
  const p = id ? products.find(x => x.id === id) : null;
  const imageUrls = p && p.imageUrls
    ? (Array.isArray(p.imageUrls) ? p.imageUrls.join(', ') : String(p.imageUrls))
    : (p && p.imageUrl ? p.imageUrl : '');
  openModal(`
    <div class="modal-header">
      <h3>${p ? 'Edit Product' : 'Add Product'}</h3>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <form id="productForm">
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input class="form-control" name="name" value="${p ? escapeHtml(p.name) : ''}" required placeholder="Product name" />
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select class="form-control" name="category" required>
              ${PRODUCT_CATEGORIES.map(c =>
                `<option value="${c}" ${p && p.category === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Price (number only) *</label>
            <input class="form-control" type="number" step="1" min="0" name="price" value="${p ? p.price : ''}" required placeholder="4499" />
          </div>
          <div class="form-group">
            <label>Stock *</label>
            <input class="form-control" type="number" min="0" name="stock" value="${p ? p.stock : 0}" required />
          </div>
        </div>
        <div class="form-group">
          <label>Upload images (PNG / JPEG) — stored via ImgBB</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input type="file" id="productImageFiles" accept="image/png,image/jpeg,image/jpg,image/webp" multiple class="form-control" style="padding:8px;flex:1" />
            <button type="button" class="btn btn-secondary" id="uploadImgBBBtn">UPLOAD TO IMGBB</button>
          </div>
          <small style="color:var(--text-muted);display:block;margin-top:6px">Upload at least 3 PNG/JPEG images, then click Upload. URLs will be added below.</small>
        </div>
        <div class="form-group">
          <label>Image URL(s) — min 3, comma separated for gallery *</label>
          <input class="form-control" name="imageUrls" id="productImageUrls" value="${escapeHtml(imageUrls)}" required placeholder="url1, url2, url3 (minimum 3 images)" />
          <div id="imagePreview" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px"></div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-control" name="description" rows="3" placeholder="Fabric, GSM, fit notes...">${p && p.description ? escapeHtml(p.description) : ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Sizes (comma separated)</label>
            <input class="form-control" name="sizes" value="${p && p.sizes ? escapeHtml(Array.isArray(p.sizes) ? p.sizes.join(',') : p.sizes) : ''}" placeholder="S,M,L,XL" />
          </div>
          <div class="form-group">
            <label>Badge</label>
            <input class="form-control" name="badge" value="${p && p.badge ? escapeHtml(p.badge) : ''}" placeholder="NEW / SALE / PREMIUM" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Rating</label>
            <input class="form-control" type="number" step="0.1" min="0" max="5" name="rating" value="${p && p.rating != null ? p.rating : '4.5'}" />
          </div>
          <div class="form-group">
            <label>Reviews count</label>
            <input class="form-control" type="number" min="0" name="reviews" value="${p && p.reviews != null ? p.reviews : '0'}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>SKU</label>
            <input class="form-control" name="sku" value="${p && p.sku ? escapeHtml(p.sku) : ''}" placeholder="Auto if empty" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="form-control" name="status">
              <option value="active" ${!p || p.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${p && p.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">CANCEL</button>
      <button class="btn btn-primary" id="saveProductBtn" onclick="saveProduct(${p ? p.id : 'null'})">SAVE PRODUCT</button>
    </div>
  `);

  setTimeout(() => {
    const urlsInput = document.getElementById('productImageUrls');
    const preview = document.getElementById('imagePreview');
    function refreshPreview() {
      const urls = (urlsInput.value || '').split(',').map(s => s.trim()).filter(Boolean);
      preview.innerHTML = urls.map(u =>
        `<img src="${u}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--border)" onerror="this.style.display='none'" />`
      ).join('');
    }
    if (urlsInput) {
      urlsInput.addEventListener('input', refreshPreview);
      refreshPreview();
    }
    const uploadBtn = document.getElementById('uploadImgBBBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', async function () {
        const files = document.getElementById('productImageFiles').files;
        if (!files || !files.length) {
          showToast('Choose image files first', 'error');
          return;
        }
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        try {
          const existing = (urlsInput.value || '').split(',').map(s => s.trim()).filter(Boolean);
          for (let i = 0; i < files.length; i++) {
            showToast('Uploading ' + (i + 1) + '/' + files.length + '...', 'info');
            const link = await uploadToImgBB(files[i]);
            if (link) existing.push(link);
          }
          urlsInput.value = existing.join(', ');
          refreshPreview();
          showToast(files.length + ' image(s) uploaded');
        } catch (err) {
          showToast('Upload failed: ' + err.message, 'error');
        }
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'UPLOAD TO IMGBB';
      });
    }
  }, 50);
}

async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Upload failed');
  return json.data.display_url || json.data.url || (json.data.image && json.data.image.url) || '';
}

/** Publish admin products so the Aurelia storefront can show them live */
function publishProductsToStorefront(products) {
  const catMap = {
    'Tops': 'tops',
    'Bottoms': 'bottoms',
    'Watches': 'watches',
    'Shoes': 'shoes',
    'House Care': 'house-care',
    'Health Care': 'health-care',
    'Electronic': 'electronic'
  };
  const storefront = (products || [])
    .filter(p => p && p.name && p.status !== 'inactive')
    .map(p => {
      let urls = [];
      if (Array.isArray(p.imageUrls)) urls = p.imageUrls.filter(Boolean).map(String);
      else if (typeof p.imageUrls === 'string' && p.imageUrls.trim()) {
        urls = p.imageUrls.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (!urls.length && p.imageUrl) urls = [String(p.imageUrl)];
      const main = urls[0] || '';
      const cat = catMap[p.category] || String(p.category || 'tops').toLowerCase().replace(/\s+/g, '-');
      return {
        id: p.id,
        name: p.name,
        category: cat,
        price: Number(p.price) || 0,
        oldPrice: p.oldPrice || null,
        rating: Number(p.rating) || 4.5,
        reviews: Number(p.reviews) || 0,
        badge: p.badge || null,
        bestseller: (Number(p.sales) || 0) > 50,
        image: main,
        images: urls,
        imageUrl: main,
        imageUrls: urls,
        description: p.description || p.name,
        sizes: p.sizes || '',
        sku: p.sku || '',
        stock: p.stock,
        status: p.status || 'active',
        sales: p.sales || 0
      };
    });
  localStorage.setItem('aurelia_products', JSON.stringify(storefront));
  localStorage.setItem('aurelia_products_updated', String(Date.now()));
  // also mirror into products key shape for sheets re-read consistency
  try {
    const stamp = String(Date.now());
    localStorage.setItem('aurelia_products_stamp', stamp);
  } catch (e) {}
}


async function saveProduct(id) {
  const form = document.getElementById('productForm');
  const data = Object.fromEntries(new FormData(form));
  data.price = parseFloat(data.price);
  data.stock = parseInt(data.stock, 10) || 0;
  data.rating = parseFloat(data.rating) || 4.5;
  data.reviews = parseInt(data.reviews, 10) || 0;
  data.sales = 0;
  data.image = '📦';

  const urlsRaw = (data.imageUrls || '').trim();
  const urls = urlsRaw.split(',').map(s => s.trim()).filter(Boolean);
  if (urls.length < 1) {
    showToast('Add at least 1 image URL (3 recommended)', 'error');
    return;
  }
  data.imageUrls = urls;
  data.imageUrl = urls[0];
  delete data.imageUrls; // will re-add as array
  data.imageUrls = urls;

  if (!data.sku || !String(data.sku).trim()) {
    data.sku = 'SKU-' + Date.now().toString(36).toUpperCase();
  }

  const btn = document.getElementById('saveProductBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    let products = Storage.get('products');
    if (id) {
      const idx = products.findIndex(p => p.id === id);
      data.id = id;
      data.sales = products[idx] ? products[idx].sales || 0 : 0;
      products[idx] = { ...products[idx], ...data };
      showToast('Product updated');
    } else {
      data.id = products.length ? Math.max(...products.map(p => Number(p.id) || 0)) + 1 : 1;
      products.push(data);
      showToast('Product added');
    }
    Storage.set('products', products);
    publishProductsToStorefront(products);
    closeModal();
    navigate('products');
    if (getSheetsUrl()) {
      syncToSheets('products').catch(function () {});
    }
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'SAVE PRODUCT';
  }
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  let products = Storage.get('products').filter(p => p.id !== id);
  Storage.set('products', products);
  publishProductsToStorefront(products);
  showToast('Product deleted', 'info');
  navigate('products');
  if (getSheetsUrl()) {
    syncToSheets('products').catch(function () {});
  }
}

// ----- ORDERS -----
function renderOrders() {
  const orders = Storage.get('orders');
  return `
    <div class="card">
      <div class="card-header">
        <h3>Orders (${orders.length})</h3>
        <div style="display:flex;gap:8px">
          <select class="form-control" style="width:auto" id="orderFilter" onchange="filterOrders()">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Address</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody id="ordersBody">
            ${orders.map(o => orderRow(o)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function orderRow(o) {
  // Quote IDs — storefront orders use string IDs like "AR42091084"
  const idJs = JSON.stringify(String(o.id));
  return `
    <tr data-status="${o.status}">
      <td><strong>#${o.id}</strong></td>
      <td>${o.customer}<br><small style="color:var(--text-muted)">${o.phone || o.email || ''}</small>${o.product ? `<br><small style="color:var(--primary)">${o.product}</small>` : ''}</td>
      <td style="max-width:220px;font-size:0.85rem;color:var(--text-muted)">${o.address || '—'}</td>
      <td>${o.date}</td>
      <td>${fmtPKR(o.total)}</td>
      <td>
        <select class="form-control" style="width:auto;padding:4px 8px;font-size:0.8rem" onchange="updateOrderStatus(${idJs}, this.value)">
          ${['pending','processing','shipped','delivered','cancelled'].map(s => 
            `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>
        <button class="btn-icon" onclick="viewOrder(${idJs})" title="View"><i class="fas fa-eye"></i></button>
      </td>
    </tr>
  `;
}

function filterOrders() {
  const val = document.getElementById('orderFilter').value;
  document.querySelectorAll('#ordersBody tr').forEach(tr => {
    tr.style.display = (val === 'all' || tr.dataset.status === val) ? '' : 'none';
  });
}

function updateOrderStatus(id, status) {
  const orders = Storage.get('orders');
  const o = orders.find(x => String(x.id) === String(id));
  if (o) {
    o.status = status;
    Storage.set('orders', orders);
    showToast(`Order #${id} → ${status}`);
  }
}

function viewOrder(id) {
  const o = Storage.get('orders').find(x => String(x.id) === String(id));
  if (!o) {
    showToast('Order not found', 'error');
    return;
  }
  // Enrich from storefront history if fields missing
  let extra = {};
  try {
    const aurelia = JSON.parse(localStorage.getItem('aurelia_orders') || '[]');
    const match = aurelia.find(x => String(x.id) === String(id));
    if (match) {
      extra = {
        product: o.product || match.product || '',
        unitPrice: o.unitPrice != null ? o.unitPrice : match.price,
        items: o.items != null ? o.items : match.qty,
        phone: o.phone || match.phone || '',
        city: o.city || match.city || '',
        address: o.address || ((match.address || '') + (match.city ? ', ' + match.city : '')),
        customer: o.customer || match.name || ''
      };
    }
  } catch (e) {}

  const product = extra.product || o.product || '';
  const unitPrice = extra.unitPrice != null ? extra.unitPrice : o.unitPrice;
  const items = extra.items != null ? extra.items : o.items;
  const phone = extra.phone || o.phone || '—';
  const city = extra.city || o.city || '';
  const address = extra.address || o.address || '—';
  const customer = extra.customer || o.customer || '—';
  const lineTotal = (Number(unitPrice) || 0) * (Number(items) || 1);

  const productIdHtml = o.productId != null
    ? '<div style="font-size:0.8rem;color:var(--text-muted)">ID: ' + o.productId + '</div>'
    : '';
  const cityHtml = city
    ? '<p style="margin:6px 0 0;color:var(--text-muted)">City: <strong>' + city + '</strong></p>'
    : '';
  const lineHtml = (product || unitPrice != null)
    ? '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between"><span>Line total</span><strong>' + fmtPKR(lineTotal || o.total) + '</strong></div>'
    : '';
  const sourceHtml = o.source
    ? '<p style="margin-top:14px;font-size:0.8rem;color:var(--text-muted)">Source: ' + o.source + '</p>'
    : '';
  const unitLabel = (unitPrice != null && unitPrice !== '') ? fmtPKR(unitPrice) : '—';
  const itemsLabel = items != null ? items : '—';

  openModal(
    '<div class="modal-header"><h3>Order #' + o.id + '</h3><button class="modal-close">&times;</button></div>' +
    '<div class="modal-body" style="max-height:70vh;overflow-y:auto">' +
      '<div style="margin-bottom:16px">' +
        '<div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Customer</div>' +
        '<p style="margin:0 0 8px"><strong>' + customer + '</strong></p>' +
        '<p style="margin:0 0 4px;color:var(--text-muted)"><i class="fas fa-envelope" style="width:18px"></i> ' + (o.email || '—') + '</p>' +
        '<p style="margin:0 0 4px"><i class="fas fa-phone" style="width:18px;color:var(--primary)"></i> <strong>' + phone + '</strong></p>' +
      '</div>' +
      '<div style="margin-bottom:16px">' +
        '<div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Shipping Address</div>' +
        '<p style="margin:0;line-height:1.5;white-space:pre-wrap;word-break:break-word">' + address + '</p>' +
        cityHtml +
      '</div>' +
      '<hr style="border-color:var(--border);margin:14px 0" />' +
      '<div style="margin-bottom:16px">' +
        '<div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Order Items</div>' +
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px 14px">' +
          '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
            '<div><strong>' + (product || 'Product') + '</strong>' + productIdHtml + '</div>' +
            '<div style="text-align:right;font-size:0.9rem">' +
              '<div>Qty: <strong>' + itemsLabel + '</strong></div>' +
              '<div>Unit: <strong>' + unitLabel + '</strong></div>' +
            '</div>' +
          '</div>' +
          lineHtml +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<p style="margin:0"><strong>Date:</strong><br>' + (o.date || '—') + '</p>' +
        '<p style="margin:0"><strong>Payment:</strong><br>' + (o.payment || '—') + '</p>' +
        '<p style="margin:0"><strong>Total:</strong><br><span style="font-size:1.15rem;color:var(--primary)">' + fmtPKR(o.total) + '</span></p>' +
        '<p style="margin:0"><strong>Status:</strong><br><span class="status ' + o.status + '">' + o.status + '</span></p>' +
      '</div>' +
      sourceHtml +
    '</div>' +
    '<div class="modal-footer">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Close</button>' +
    '</div>'
  );
}

// ----- CUSTOMERS -----
function renderCustomers() {
  const customers = Storage.get('customers');
  return `
    <div class="card">
      <div class="card-header">
        <h3>Customers (${customers.length})</h3>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email / Phone</th><th>Address</th><th>Orders</th><th>Total Spent</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${customers.map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.email}<br><small style="color:var(--text-muted)">${c.phone || ''}</small></td>
                <td style="max-width:200px;font-size:0.85rem;color:var(--text-muted)">${c.address || '—'}</td>
                <td>${c.orders}</td>
                <td>${fmtPKR(c.spent)}</td>
                <td><span class="status ${c.status}">${c.status}</span></td>
                <td><button class="btn-icon" onclick="viewCustomer(${c.id})" title="View"><i class="fas fa-eye"></i></button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function viewCustomer(id) {
  const c = Storage.get('customers').find(x => x.id === id);
  if (!c) return;
  openModal(`
    <div class="modal-header"><h3>${c.name}</h3><button class="modal-close">&times;</button></div>
    <div class="modal-body">
      <p><strong>Email:</strong> ${c.email}</p>
      <p><strong>Phone:</strong> ${c.phone || '—'}</p>
      <p><strong>Address:</strong><br>${c.address || '—'}</p>
      <hr style="border-color:var(--border);margin:14px 0" />
      <p><strong>Orders:</strong> ${c.orders}</p>
      <p><strong>Total Spent:</strong> ${fmtPKR(c.spent)}</p>
      <p><strong>Joined:</strong> ${c.joined}</p>
      <p><strong>Status:</strong> <span class="status ${c.status}">${c.status}</span></p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}

// ----- INVENTORY -----
function renderInventory() {
  const products = Storage.get('products');
  const low = products.filter(p => p.stock <= 10);
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <h3>Total SKUs</h3>
          <div class="value">${products.length}</div>
        </div>
        <div class="stat-icon blue"><i class="fas fa-boxes"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Low Stock</h3>
          <div class="value" style="color:var(--warning)">${low.filter(p=>p.stock>0).length}</div>
        </div>
        <div class="stat-icon yellow"><i class="fas fa-exclamation-triangle"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Out of Stock</h3>
          <div class="value" style="color:var(--danger)">${products.filter(p=>p.stock===0).length}</div>
        </div>
        <div class="stat-icon red"><i class="fas fa-times-circle"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Total Units</h3>
          <div class="value">${products.reduce((s,p)=>s+p.stock,0)}</div>
        </div>
        <div class="stat-icon green"><i class="fas fa-warehouse"></i></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Stock Levels</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td style="display:flex;align-items:center;gap:10px">${productThumb(p)} ${p.name}</td>
                <td>${p.sku}</td>
                <td><strong>${p.stock}</strong></td>
                <td><span class="status ${p.stock===0?'cancelled':p.stock<=10?'low':'ok'}">${p.stock===0?'Out of Stock':p.stock<=10?'Low Stock':'In Stock'}</span></td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="adjustStock(${p.id})"><i class="fas fa-plus"></i> Adjust</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function adjustStock(id) {
  const amount = prompt('Enter new stock quantity:');
  if (amount === null) return;
  const val = parseInt(amount);
  if (isNaN(val) || val < 0) {
    showToast('Invalid quantity', 'error');
    return;
  }
  const products = Storage.get('products');
  const p = products.find(x => x.id === id);
  if (p) {
    p.stock = val;
    Storage.set('products', products);
    if (typeof publishProductsToStorefront === 'function') publishProductsToStorefront(products);
    showToast(`Stock updated to ${val}`);
    navigate('inventory');
  }
}

// ----- LIVE TRACKING -----
function renderTrackingPage(silent) {
  const stats = Tracking.getStats();
  const sourceLabel = stats.isReal ? 'From storefront (real)' : 'Waiting for storefront visits';
  const html = `
    <div data-page-content="tracking">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <h3>Live Right Now</h3>
            <div class="value" style="color:var(--success)">${stats.live}</div>
            <div class="change up">${sourceLabel}</div>
          </div>
          <div class="stat-icon green"><i class="fas fa-circle"></i></div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>Total Visits</h3>
            <div class="value">${stats.totalVisits.toLocaleString()}</div>
            <div class="change up">All time</div>
          </div>
          <div class="stat-icon blue"><i class="fas fa-globe"></i></div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>Page Views</h3>
            <div class="value">${stats.totalPageViews.toLocaleString()}</div>
            <div class="change up">All time</div>
          </div>
          <div class="stat-icon purple"><i class="fas fa-eye"></i></div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>Today's Views</h3>
            <div class="value">${stats.todayViews}</div>
            <div class="change up">${stats.todayUnique} unique</div>
          </div>
          <div class="stat-icon yellow"><i class="fas fa-calendar-day"></i></div>
        </div>
      </div>

      <div class="tracking-grid">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-users" style="color:var(--success);margin-right:8px"></i> Currently Online</h3>
            <span class="status active">${stats.live} visitors</span>
          </div>
          <div class="visitor-list">
            ${Tracking.visitors.length === 0 ? '<div class="empty-state"><i class="fas fa-user-slash"></i><p>No visitors online</p></div>' :
              Tracking.visitors.map(v => `
                <div class="visitor-item">
                  <div class="online-dot"></div>
                  <div class="visitor-avatar"><i class="fas fa-${v.device==='Mobile'?'mobile-alt':v.device==='Tablet'?'tablet-alt':'desktop'}"></i></div>
                  <div class="visitor-info">
                    <div class="page">${v.page}</div>
                    <div class="meta">${v.location} · ${v.device} · ${Tracking.formatDuration(Date.now()-v.enteredAt)}</div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Active Pages</h3></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Page</th><th>Visitors</th></tr></thead>
              <tbody>
                ${stats.byPage.map(([page, count]) => `
                  <tr><td>${page}</td><td><strong>${count}</strong></td></tr>
                `).join('') || '<tr><td colspan="2">No data</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="card-header" style="margin-top:20px"><h3>By Device</h3></div>
          <div style="display:flex;gap:20px;padding:0 4px">
            ${Object.entries(stats.byDevice).map(([dev, cnt]) => `
              <div style="text-align:center">
                <div style="font-size:1.5rem;font-weight:700">${cnt}</div>
                <div style="font-size:0.8rem;color:var(--text-muted)">${dev}</div>
              </div>
            `).join('')}
          </div>
          <div class="card-header" style="margin-top:20px"><h3>Top Locations</h3></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Location</th><th>Visitors</th></tr></thead>
              <tbody>
                ${stats.byLocation.map(([loc, count]) => `
                  <tr><td>${loc}</td><td><strong>${count}</strong></td></tr>
                `).join('') || '<tr><td colspan="2">No data</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  if (silent) {
    const existing = document.querySelector('[data-page-content="tracking"]');
    if (existing) {
      existing.outerHTML = html;
      return;
    }
  }
  return html;
}

// ----- ANALYTICS -----
function renderAnalytics() {
  const pageViews = Storage.get('pageViews') || [];
  const stats = Tracking.getStats();
  const len = pageViews.length || 1;
  const sumViews = pageViews.reduce((s,p)=>s+p.views,0);
  const sumSales = pageViews.reduce((s,p)=>s+p.sales,0);
  const sumUnique = pageViews.reduce((s,p)=>s+p.unique,0) || 1;
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <h3>Avg. Daily Views</h3>
          <div class="value">${pageViews.length ? Math.round(sumViews/len) : 0}</div>
        </div>
        <div class="stat-icon blue"><i class="fas fa-chart-bar"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Avg. Daily Sales</h3>
          <div class="value">${pageViews.length ? Math.round(sumSales/len) : 0}</div>
        </div>
        <div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Conversion Rate</h3>
          <div class="value">${pageViews.length ? ((sumSales/sumUnique)*100).toFixed(1) : '0.0'}%</div>
        </div>
        <div class="stat-icon purple"><i class="fas fa-percentage"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Total Visits</h3>
          <div class="value">${stats.totalVisits.toLocaleString()}</div>
        </div>
        <div class="stat-icon yellow"><i class="fas fa-users"></i></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Page Views (30 days)</h3></div>
        <div class="chart-container"><canvas id="viewsChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Sales (30 days)</h3></div>
        <div class="chart-container"><canvas id="salesChart2"></canvas></div>
      </div>
    </div>
  `;
}

function afterAnalyticsRender() {
  const pageViews = Storage.get('pageViews') || [];
  if (!pageViews.length) {
    const c1 = document.getElementById('viewsChart');
    const c2 = document.getElementById('salesChart2');
    if (c1) c1.parentElement.innerHTML = '<div class="empty-state" style="padding:40px"><p>No data yet</p></div>';
    if (c2) c2.parentElement.innerHTML = '<div class="empty-state" style="padding:40px"><p>No data yet</p></div>';
    return;
  }
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8', maxTicksLimit: 8 } },
      y: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8' } }
    }
  };
  const ctx1 = document.getElementById('viewsChart');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: pageViews.map(p => p.date.slice(5)),
        datasets: [{
          data: pageViews.map(p => p.views),
          backgroundColor: 'rgba(56,189,248,0.6)',
          borderRadius: 4
        }]
      },
      options: opts
    });
  }
  const ctx2 = document.getElementById('salesChart2');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'line',
      data: {
        labels: pageViews.map(p => p.date.slice(5)),
        datasets: [{
          data: pageViews.map(p => p.sales),
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74,222,128,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: opts
    });
  }
}

// ----- REVIEWS -----
function renderReviews() {
  const reviews = Storage.get('reviews');
  return `
    <div class="card">
      <div class="card-header"><h3>Product Reviews (${reviews.length})</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${reviews.map(r => `
              <tr>
                <td>${r.product}</td>
                <td>${r.customer}</td>
                <td>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.comment}</td>
                <td>${r.date}</td>
                <td><span class="status ${r.status==='approved'?'active':'pending'}">${r.status}</span></td>
                <td>
                  ${r.status==='pending' ? `
                    <button class="btn btn-sm btn-primary" onclick="approveReview(${r.id})">Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectReview(${r.id})">Reject</button>
                  ` : '<span style="color:var(--text-muted)">—</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function approveReview(id) {
  const reviews = Storage.get('reviews');
  const r = reviews.find(x => x.id === id);
  if (r) { r.status = 'approved'; Storage.set('reviews', reviews); showToast('Review approved'); navigate('reviews'); }
}

function rejectReview(id) {
  let reviews = Storage.get('reviews').filter(x => x.id !== id);
  Storage.set('reviews', reviews);
  showToast('Review rejected', 'info');
  navigate('reviews');
}

// ----- COUPONS -----
function renderCoupons() {
  const coupons = Storage.get('coupons');
  return `
    <div class="card">
      <div class="card-header">
        <h3>Coupons (${coupons.length})</h3>
        <button class="btn btn-primary" onclick="openCouponModal()"><i class="fas fa-plus"></i> New Coupon</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Discount</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${coupons.map(c => `
              <tr>
                <td><strong style="font-family:monospace;letter-spacing:1px">${c.code}</strong></td>
                <td>${c.type==='percent'?c.discount+'%':c.type==='fixed'?'Rs. '+c.discount:c.type==='shipping'?'Free Shipping':c.discount}</td>
                <td>${c.uses} / ${c.maxUses}</td>
                <td>${c.expires}</td>
                <td><span class="status ${c.status}">${c.status}</span></td>
                <td>
                  <button class="btn-icon delete" onclick="deleteCoupon(${c.id})"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openCouponModal() {
  openModal(`
    <div class="modal-header"><h3>Create Coupon</h3><button class="modal-close">&times;</button></div>
    <div class="modal-body">
      <form id="couponForm">
        <div class="form-group"><label>Code</label><input class="form-control" name="code" required style="text-transform:uppercase" /></div>
        <div class="form-row">
          <div class="form-group">
            <label>Type</label>
            <select class="form-control" name="type">
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="shipping">Free Shipping</option>
            </select>
          </div>
          <div class="form-group"><label>Discount Value</label><input class="form-control" type="number" name="discount" value="10" required /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Max Uses</label><input class="form-control" type="number" name="maxUses" value="100" /></div>
          <div class="form-group"><label>Expires</label><input class="form-control" type="date" name="expires" value="2026-12-31" /></div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCoupon()">Create</button>
    </div>
  `);
}

function saveCoupon() {
  const form = document.getElementById('couponForm');
  const data = Object.fromEntries(new FormData(form));
  data.discount = parseFloat(data.discount);
  data.maxUses = parseInt(data.maxUses);
  data.uses = 0;
  data.status = 'active';
  data.code = data.code.toUpperCase();
  const coupons = Storage.get('coupons');
  data.id = coupons.length ? Math.max(...coupons.map(c => c.id)) + 1 : 1;
  coupons.push(data);
  Storage.set('coupons', coupons);
  closeModal();
  showToast('Coupon created');
  navigate('coupons');
}

function deleteCoupon(id) {
  if (!confirm('Delete this coupon?')) return;
  Storage.set('coupons', Storage.get('coupons').filter(c => c.id !== id));
  showToast('Coupon deleted', 'info');
  navigate('coupons');
}

// ----- SETTINGS -----
function renderSettings() {
  const session = JSON.parse(localStorage.getItem('admin_session') || sessionStorage.getItem('admin_session') || '{}');
  const sheetUrl = getSheetsUrl();
  return `
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Profile</h3></div>
        <div class="form-group"><label>Name</label><input class="form-control" id="setName" value="${session.name || 'Admin'}" /></div>
        <div class="form-group"><label>Email</label><input class="form-control" id="setEmail" value="${session.email || ''}" disabled /></div>
        <button class="btn btn-primary" onclick="saveProfile()">Save Profile</button>
      </div>
      <div class="card">
        <div class="card-header"><h3>Store Settings</h3></div>
        <div class="form-group"><label>Store Name</label><input class="form-control" id="storeName" value="${localStorage.getItem('storeName') || 'My E-Commerce Store'}" /></div>
        <div class="form-group"><label>Currency</label>
          <select class="form-control" id="currency">
            <option>PKR</option><option>USD</option><option>EUR</option><option>GBP</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="saveStoreSettings()">Save Settings</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3><i class="fab fa-google" style="margin-right:8px"></i> Google Sheets Sync</h3></div>
      <p style="color:var(--text-muted);margin-bottom:14px;font-size:0.9rem">
        Only <strong>Products</strong> and <strong>Orders</strong> sheets. Paste your Apps Script Web App URL from <code>google-sheets-sync.gs</code>.
        Products are sent automatically when you save a product.
      </p>
      <div class="form-group">
        <label>Web App URL</label>
        <input class="form-control" id="googleSheetUrl" value="${sheetUrl}" placeholder="https://script.google.com/macros/s/XXXX/exec" />
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px">
        <button class="btn btn-primary" onclick="saveSheetUrl()"><i class="fas fa-save"></i> Save URL</button>
        <button class="btn btn-secondary" onclick="syncToSheets('products')"><i class="fas fa-cloud-upload-alt"></i> Sync Products</button>
        <button class="btn btn-secondary" onclick="syncToSheets('orders')"><i class="fas fa-cloud-upload-alt"></i> Sync Orders</button>
        <button class="btn btn-secondary" onclick="syncAllToSheets()"><i class="fas fa-sync"></i> Sync Both</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Storefront Bridge</h3></div>
      <p style="color:var(--text-muted);margin-bottom:16px">Import orders placed on the Aurelia storefront (saved in the same browser as <code>aurelia_orders</code>).</p>
      <button class="btn btn-secondary" onclick="importAureliaOrders()"><i class="fas fa-download"></i> Import Storefront Orders</button>
    </div>

    <div class="card">
      <div class="card-header"><h3>Danger Zone</h3></div>
      <p style="color:var(--text-muted);margin-bottom:16px">Clear all products, orders, customers, reviews, coupons, and tracking. This cannot be undone.</p>
      <button class="btn btn-danger" onclick="resetAllData()"><i class="fas fa-trash-alt"></i> Clear All Data</button>
    </div>
  `;
}

function saveProfile() {
  const name = document.getElementById('setName').value.trim();
  if (!name) return showToast('Name required', 'error');
  const session = JSON.parse(localStorage.getItem('admin_session') || sessionStorage.getItem('admin_session') || '{}');
  session.name = name;
  if (localStorage.getItem('admin_session')) localStorage.setItem('admin_session', JSON.stringify(session));
  else sessionStorage.setItem('admin_session', JSON.stringify(session));
  document.getElementById('userName').textContent = name;
  showToast('Profile updated');
}

function saveStoreSettings() {
  localStorage.setItem('storeName', document.getElementById('storeName').value);
  showToast('Store settings saved');
}

function saveSheetUrl() {
  let url = document.getElementById('googleSheetUrl').value.trim();
  if (!url) url = DEFAULT_SHEETS_URL;
  localStorage.setItem('googleSheetUrl', url);
  showToast('Google Sheet URL saved');
}

async function syncToSheets(type) {
  const url = getSheetsUrl();
  if (!url || !url.includes('script.google.com')) {
    return showToast('Google Sheet Web App URL is missing', 'error');
  }
  if (type !== 'products' && type !== 'orders') {
    return showToast('Only products and orders can be synced', 'error');
  }
  let data = Storage.get(type) || [];
  if (type === 'products') {
    data = data.map(p => {
      let urls = p.imageUrls;
      if (Array.isArray(urls)) urls = urls.join(', ');
      else if (urls == null) urls = '';
      return {
        id: p.id,
        name: p.name || '',
        sku: p.sku || '',
        category: p.category || '',
        price: p.price != null ? p.price : '',
        stock: p.stock != null ? p.stock : 0,
        status: p.status || 'active',
        imageUrl: p.imageUrl || '',
        imageUrls: urls,
        description: p.description || '',
        sizes: Array.isArray(p.sizes) ? p.sizes.join(',') : (p.sizes || ''),
        badge: p.badge || '',
        rating: p.rating != null ? p.rating : '',
        reviews: p.reviews != null ? p.reviews : 0,
        sales: p.sales != null ? p.sales : 0
      };
    });
  }
  if (type === 'orders') {
    data = data.map(o => ({
      id: o.id,
      customer: o.customer || '',
      email: o.email || '',
      phone: o.phone || '',
      address: o.address || '',
      total: o.total != null ? o.total : 0,
      items: o.items != null ? o.items : 1,
      status: o.status || 'pending',
      date: o.date || '',
      payment: o.payment || ''
    }));
  }
  showToast('Syncing ' + type + ' (' + data.length + ' rows)...', 'info');
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'sync', type: type, data: data })
    });
    showToast(type.charAt(0).toUpperCase() + type.slice(1) + ' sent to Google Sheets (' + data.length + ' rows). Open the sheet and refresh.');
  } catch (err) {
    showToast('Sync failed: ' + err.message, 'error');
  }
}

async function syncAllToSheets() {
  await syncToSheets('products');
  await syncToSheets('orders');
  showToast('Products and Orders synced to Google Sheets');
}


function importAureliaOrders() {
  const aurelia = JSON.parse(localStorage.getItem('aurelia_orders') || '[]');
  if (!aurelia.length) {
    showToast('No Aurelia storefront orders found in this browser', 'info');
    return;
  }
  let orders = Storage.get('orders');
  let added = 0;
  aurelia.forEach(o => {
    const exists = orders.find(x => String(x.id) === String(o.id));
    if (!exists) {
      orders.unshift({
        id: o.id,
        customer: o.name || 'Customer',
        email: o.email || '',
        phone: o.phone || '',
        address: (o.address || '') + (o.city ? ', ' + o.city : ''),
        city: o.city || '',
        total: typeof o.total === 'number' ? o.total : 0,
        items: o.qty || 1,
        product: o.product || '',
        productId: o.productId != null ? o.productId : null,
        unitPrice: o.price != null ? o.price : (o.unitPrice != null ? o.unitPrice : 0),
        status: 'pending',
        date: o.at ? String(o.at).slice(0, 10) : new Date().toISOString().slice(0, 10),
        payment: 'Form / COD',
        source: 'storefront'
      });
      added++;
    }
  });
  Storage.set('orders', orders);
  showToast(added ? (added + ' order(s) imported from storefront') : 'All storefront orders already imported');
  navigate('orders');
}

function resetAllData() {
  if (!confirm('Clear ALL data? Products, orders, customers, and tracking will be emptied. This cannot be undone.')) return;
  if (typeof clearAllData === 'function') clearAllData();
  else {
    ['products','orders','customers','reviews','coupons','pageViews','liveVisitors','totalVisits','totalPageViews','aurelia_products','aurelia_products_updated','aurelia_orders','aurelia_live_visitors','aurelia_cart'].forEach(k => localStorage.removeItem(k));
    initData();
  }
  Tracking.generateInitialVisitors();
  if (typeof publishProductsToStorefront === 'function') publishProductsToStorefront([]);
  showToast('All data cleared');
  navigate('dashboard');
}

// ========== NAVIGATION ==========
const pages = {
  dashboard: { title: 'Dashboard', render: renderDashboard, after: afterDashboardRender },
  products: { title: 'Products', render: renderProducts },
  orders: { title: 'Orders', render: renderOrders },
  customers: { title: 'Customers', render: renderCustomers },
  inventory: { title: 'Inventory', render: renderInventory },
  analytics: { title: 'Analytics', render: renderAnalytics, after: afterAnalyticsRender },
  reviews: { title: 'Reviews', render: renderReviews },
  coupons: { title: 'Coupons', render: renderCoupons },
  settings: { title: 'Settings', render: renderSettings }
};

function navigate(page) {
  const p = pages[page];
  if (!p) return;
  document.getElementById('pageTitle').textContent = p.title;
  document.getElementById('content').innerHTML = p.render();
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  if (p.after) setTimeout(p.after, 50);
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

// ========== EVENTS ==========
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    navigate(el.dataset.page);
  });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('admin_session');
  sessionStorage.removeItem('admin_session');
  window.location.href = 'admin.html';
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

document.getElementById('mobileMenu').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.getElementById('notifBtn').addEventListener('click', () => {
  showToast('You have 3 new notifications: 2 pending reviews, 1 low stock alert', 'info');
  document.getElementById('notifBadge').style.display = 'none';
});

// ========== INIT ==========
if (typeof Tracking !== "undefined" && Tracking.init) Tracking.init();
// Push current products to storefront so website stays in sync
try {
  if (typeof publishProductsToStorefront === 'function') {
    publishProductsToStorefront(Storage.get('products'));
  }
} catch (e) {}
navigate('dashboard');
