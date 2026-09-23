# VendorOS Frontend

VendorOS is a high-speed Retail & Kirana Store Management frontend interface built with **React 19**, **Vite**, and **Tailwind CSS**.

---

## 🚀 Key Features

- **Billing & POS Terminal (T30)**:
  - Hardware Barcode Scanner auto-detection (`useBarcodeScanner.js`).
  - Cashier keyboard shortcuts (`F2`, `F4`, `F8`, `F9`, `Esc`).
  - Fast Category-based quick products grid.
  - Multi-payment support: Cash, UPI, Card, and Credit / Udhaar.
  - Partial payments and split tender.
  - 80mm / 58mm Thermal Printable Receipt preview.
- **Customer Khata & Credit CRM (T29)**:
  - Real-time customer balance tracker.
  - Chronological Khata debit/credit ledger statements.
  - 1-click debt settlement modal (`SettleKhataModal.jsx`).
- **Inventory & Store State Engine (T15–T22)**:
  - Real-time stock valuation and quantities.
  - Immutable movement ledger ("Bank Statement" audit format).
  - Deterministic low-stock notifications and auto-replenishment shortcuts.
  - Stock In (Procurement), Stock Out (Sales/Damage), and Adjust (Audit).
- **Product Catalog & Categories (T7–T14)**:
  - Multi-field search (Name, SKU, Barcode).
  - Live margin calculation (Selling vs Cost Price).
  - Smart SKU auto-generator.
  - Non-destructive soft-delete and restore.
- **Multi-Tenant Onboarding Wizard (T6)**:
  - 3-step store setup (Basics, Location/Pincode, Preferences/Tax Mode).
  - Multi-tenant business context switching.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: `react-hot-toast`
- **HTTP Client**: Axios with multi-tenant interceptors

---

## 💻 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the `Frontend/` folder:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Start Development Server
```bash
npm run dev
```
The frontend will start at **http://localhost:5173**.

### 4. Build for Production
```bash
npm run build
```

---

## ⌨️ POS Keyboard Shortcuts Cheat Sheet

| Hotkey | Action |
|---|---|
| `F2` | Focus Product Search Box |
| `F4` | Open Customer Select / Khata Modal |
| `F8` | Clear Current Cart |
| `F9` | Proceed to Checkout & Settle Payment |
| `F1` | Open Keyboard Shortcuts Guide |
| `Esc` | Close Any Active Modal Dialog |
