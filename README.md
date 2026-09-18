# Aurelia Storefront + ShopAdmin Portal (Complete Package)

A ready-to-use e-commerce storefront (Aurelia — Quiet Luxury) connected to a full admin portal with Google Sheets sync and real visitor tracking.

---

## Folder Structure

```
shop-admin-complete/
├── index.html                 ← Aurelia customer storefront
├── assets/
│   └── hero-men.png           ← Hero banner image
├── admin.html                 ← Admin login page
├── dashboard.html             ← Admin dashboard
├── css/
│   ├── login.css
│   └── dashboard.css
├── js/
│   ├── auth.js
│   ├── data.js
│   ├── tracking.js
│   └── app.js
├── google-sheets-sync.gs      ← Apps Script (auto-creates sheets)
└── README.md
```

---

## Quick Start

**Keep this folder structure** (`css/`, `js/`). Open pages from inside `shop-admin-complete/` so styles and scripts load. If the login screen looks unstyled or blank, paths are wrong.

### 1. Open the storefront
- Double-click `index.html` or serve the folder with any local server.
- Starts with **no products** — add them from the Admin portal. Orders are saved as `aurelia_orders`.

### 2. Open the admin portal
- Open `admin.html` in the **same browser** (same origin).
- **Login**
  - Email: `admin@ecommerce.com`
  - Password: `admin123`

### 3. Import storefront orders into admin
- Go to **Settings** → **Storefront Bridge** → click **Import Storefront Orders**.
- Orders placed on the Aurelia site now appear under **Orders**.

### No demo data
- Admin and storefront start **empty** (no sample products, orders, customers, or fake visitors).
- Add products in Admin → they appear on the storefront automatically.
- Live visitor count only reflects real storefront visits (same browser).

### Live features (same browser)
- **Live tracking:** Storefront visits write real hits. Admin **Live Tracking** and the top-bar online count use sessions from the last 5 minutes.
- **Live products:** Add/edit/delete a product in Admin → the storefront updates within ~2 seconds via shared `localStorage`.
- **ImgBB → image link:** Upload a product image and ImgBB returns a public URL (`https://i.ibb.co/...`) stored on the product. You can also paste any image URL instead of uploading.

---

## Google Sheets — Auto-Creates Everything

The included `google-sheets-sync.gs` **creates the Google Sheet structure by itself**. You do not need to create sheets or headers manually.

### One-time setup

1. Create a **new blank Google Spreadsheet**.
2. **Extensions → Apps Script**.
3. Delete any default code and paste the **entire** contents of `google-sheets-sync.gs`.
4. Save the project.
5. In the function dropdown select **`setupSheets`** → click **Run**.
   - Grant permissions when asked.
   - A dialog will confirm: “All 4 sheets created / verified…”.
6. **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the **Web App URL**.
8. In the admin portal go to **Settings → Google Sheets Sync**, paste the URL, click **Save URL**.
9. Use the buttons:
   - Sync Products
   - Sync Orders
   - Sync Customers
   - Sync All

The script automatically creates these 4 sheets with correct headers:

| Sheet      | Purpose                          |
|------------|----------------------------------|
| Products   | Product catalog                  |
| Orders     | All orders                       |



---

## How to Track Real Visitors on the Website

The storefront already contains a lightweight tracker.

1. Deploy the Apps Script (steps above) and save the Web App URL in admin Settings.
2. The tracker reads that URL from `localStorage` (same origin) and sends a hit on every page load / route change.
3. Open the **Tracking** sheet in your Google Spreadsheet — you will see rows with:
   - timestamp
   - page
   - device (Desktop / Mobile / Tablet)
   - note

No extra code is required. If you open the storefront from the same folder / origin as the admin, the URL is picked up automatically. You can also hard-code the URL inside `index.html` (search for `SHEETS_URL`).

The admin **Live Tracking** page still shows a simulated demo. Real data lives in the Google Sheet.

---

## Features Overview

### Storefront (Aurelia)
- Full-screen hero with lifestyle image
- Categories, product grid, filters, search
- Product detail, cart drawer, Buy Now order form
- Orders stored in `localStorage` (`aurelia_orders`)
- Quiet luxury design (cream / caramel / brown)

### Admin Portal
- Dashboard with revenue, orders, live visitors, charts
- Products (CRUD + ImgBB image upload)
- Orders (status filter, phone + full address, detail view)
- Customers (address, phone, spend)
- Inventory (low / out-of-stock alerts)
- Analytics (30-day charts)
- Reviews (approve / reject)
- Coupons
- Settings (profile, store, Google Sheets sync, import storefront orders, reset data)

---

## Important Notes

- All demo data lives in the browser’s `localStorage`.
- Serve both storefront and admin from the **same origin** so they can share storage and the Google Sheet URL.
- ImgBB API key is already set for product images (free tier has daily limits).
- Because of browser CORS, the portal uses `mode: 'no-cors'` when talking to Apps Script. Data is still received and written — check your Sheet after clicking Sync.
- For production: change the default admin password, protect the Apps Script deployment, and move secrets out of client-side code.

---

Enjoy your complete storefront + admin + Google Sheets package.
