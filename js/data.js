// ========== STORAGE HELPERS (no demo / seed data) ==========

const Storage = {
  get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const SHOPADMIN_DATA_VERSION = 'v4-categories-form';

function wipeAllBusinessData() {
  [
    'products', 'orders', 'customers', 'reviews', 'coupons',
    'pageViews', 'liveVisitors', 'totalVisits', 'totalPageViews',
    'aurelia_products', 'aurelia_products_updated', 'aurelia_orders',
    'aurelia_live_visitors', 'aurelia_cart'
  ].forEach(k => localStorage.removeItem(k));
}

function initData() {
  if (localStorage.getItem('shopadmin_data_version') !== SHOPADMIN_DATA_VERSION) {
    wipeAllBusinessData();
    localStorage.setItem('shopadmin_data_version', SHOPADMIN_DATA_VERSION);
  }
  if (localStorage.getItem('products') === null) Storage.set('products', []);
  if (localStorage.getItem('orders') === null) Storage.set('orders', []);
  if (localStorage.getItem('customers') === null) Storage.set('customers', []);
  if (localStorage.getItem('reviews') === null) Storage.set('reviews', []);
  if (localStorage.getItem('coupons') === null) Storage.set('coupons', []);
  if (localStorage.getItem('pageViews') === null) Storage.set('pageViews', []);
  if (localStorage.getItem('liveVisitors') === null) Storage.set('liveVisitors', []);
  if (localStorage.getItem('totalVisits') === null) Storage.set('totalVisits', 0);
  if (localStorage.getItem('totalPageViews') === null) Storage.set('totalPageViews', 0);
}

function clearAllData() {
  wipeAllBusinessData();
  localStorage.setItem('shopadmin_data_version', SHOPADMIN_DATA_VERSION);
  initData();
}

initData();
