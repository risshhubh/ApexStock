import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================================================
// SVG ICONS (Inline for maximum compatibility and zero external dependencies)
// ============================================================================
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
);
const IconInventory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
);
const IconOrders = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
);
const IconCustomers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" /></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Filter & Search states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');

  // Modals status
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Edit objects
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form inputs
  const [productForm, setProductForm] = useState({
    sku: '', name: '', description: '', price: '', quantity: '', minStockLevel: '5', category: ''
  });
  const [customerForm, setCustomerForm] = useState({
    name: '', email: '', phone: ''
  });
  const [orderForm, setOrderForm] = useState({
    customerId: '', cartItems: []
  });
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '', email: '', phone: ''
  });

  // Product selection is handled directly through a unified dropdown list

  // Status Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Data
  const fetchData = async () => {
    try {
      const [resAnal, resProd, resCust, resOrd] = await Promise.all([
        fetch(`${API_URL}/analytics`).then(r => r.json()),
        fetch(`${API_URL}/products`).then(r => r.json()),
        fetch(`${API_URL}/customers`).then(r => r.json()),
        fetch(`${API_URL}/orders`).then(r => r.json())
      ]);
      setAnalytics(resAnal);
      setProducts(resProd);
      setCustomers(resCust);
      setOrders(resOrd);
    } catch (err) {
      console.error('API Error:', err);
      showTemporaryAlert('Failed to load data from backend server.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showTemporaryAlert = (msg, type = 'success') => {
    if (type === 'error') {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Unique Product Categories for filter dropdown
  const categories = [...new Set(products.map(p => p.category))];

  // ============================================================================
  // PRODUCT HANDLERS
  // ============================================================================
  const handleOpenProductAdd = () => {
    setEditingProduct(null);
    setProductForm({
      sku: '',
      name: '',
      description: '',
      price: '',
      quantity: '',
      minStockLevel: '5',
      category: ''
    });
    setShowProductModal(true);
  };

  const handleOpenProductEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      category: product.category
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;
    const method = editingProduct ? 'PUT' : 'POST';

    // UI Validations
    if (parseFloat(productForm.price) < 0) {
      showTemporaryAlert('Price cannot be negative', 'error');
      return;
    }
    if (parseInt(productForm.quantity) < 0) {
      showTemporaryAlert('Quantity in stock cannot be negative', 'error');
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || data.error || 'Server error occurred');

      showTemporaryAlert(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowProductModal(false);
      fetchData();
    } catch (err) {
      showTemporaryAlert(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Failed to delete');

      showTemporaryAlert('Product deleted successfully');
      fetchData();
    } catch (err) {
      showTemporaryAlert(err.message, 'error');
    }
  };

  // ============================================================================
  // CUSTOMER HANDLERS
  // ============================================================================
  const handleOpenCustomerAdd = () => {
    setEditingCustomer(null);
    setCustomerForm({ name: '', email: '', phone: '' });
    setShowCustomerModal(true);
  };

  const handleOpenCustomerEdit = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const url = editingCustomer ? `${API_URL}/customers/${editingCustomer.id}` : `${API_URL}/customers`;
    const method = editingCustomer ? 'PUT' : 'POST';

    // Simple Email Form Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email)) {
      showTemporaryAlert('Please enter a valid email address', 'error');
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Failed to save customer');

      showTemporaryAlert(editingCustomer ? 'Customer updated successfully' : 'Customer added successfully');
      setShowCustomerModal(false);
      fetchData();
    } catch (err) {
      showTemporaryAlert(err.message, 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Failed to delete customer');

      showTemporaryAlert('Customer deleted successfully');
      fetchData();
    } catch (err) {
      showTemporaryAlert(err.message, 'error');
    }
  };

  // ============================================================================
  // ORDER (CHECKOUT) HANDLERS
  // ============================================================================
  const handleOpenOrderAdd = () => {
    setOrderForm({ customerId: customers[0]?.id || '', cartItems: [] });
    setIsNewCustomer(true);
    setNewCustomerForm({ name: '', email: '', phone: '' });
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setShowOrderModal(true);
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      showTemporaryAlert(`"${product.name}" is out of stock!`, 'error');
      return;
    }

    const existingCartItem = orderForm.cartItems.find(item => item.productId === product.id);
    if (existingCartItem) {
      if (existingCartItem.quantity >= product.quantity) {
        showTemporaryAlert(`Cannot order more than available stock (${product.quantity}) for "${product.name}"`, 'error');
        return;
      }
      const updatedCart = orderForm.cartItems.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setOrderForm({ ...orderForm, cartItems: updatedCart });
    } else {
      const newItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        maxStock: product.quantity,
        quantity: 1
      };
      setOrderForm({ ...orderForm, cartItems: [...orderForm.cartItems, newItem] });
    }
  };

  const updateCartQuantity = (productId, newQty, maxStock) => {
    const qty = parseInt(newQty) || 0;
    if (qty > maxStock) {
      showTemporaryAlert(`Requested quantity exceeds available stock (${maxStock})`, 'error');
      return;
    }
    const updatedCart = orderForm.cartItems.map(item =>
      item.productId === productId ? { ...item, quantity: Math.max(1, qty) } : item
    );
    setOrderForm({ ...orderForm, cartItems: updatedCart });
  };

  const removeCartItem = (productId) => {
    const updatedCart = orderForm.cartItems.filter(item => item.productId !== productId);
    setOrderForm({ ...orderForm, cartItems: updatedCart });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (orderForm.cartItems.length === 0) {
      showTemporaryAlert('Please add at least one product to the checkout cart', 'error');
      return;
    }

    let customerId = orderForm.customerId;

    try {
      if (isNewCustomer) {
        if (!newCustomerForm.name.trim() || !newCustomerForm.email.trim() || !newCustomerForm.phone.trim()) {
          showTemporaryAlert('Please fill out all new customer fields', 'error');
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newCustomerForm.email)) {
          showTemporaryAlert('Please enter a valid email address', 'error');
          return;
        }

        // Post customer first
        const custRes = await fetch(`${API_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomerForm)
        });
        const custData = await custRes.json();
        if (!custRes.ok) {
          throw new Error(custData.detail || custData.error || 'Failed to register customer');
        }
        customerId = custData.id;
      } else {
        if (!customerId) {
          showTemporaryAlert('Please select a customer reference', 'error');
          return;
        }
      }

      const payload = {
        customerId,
        items: orderForm.cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Checkout failed');

      showTemporaryAlert('Order placed successfully! Stock levels updated.');
      setShowOrderModal(false);
      fetchData();
    } catch (err) {
      showTemporaryAlert(err.message, 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Failed to update order status');

      showTemporaryAlert(`Order status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      showTemporaryAlert(err.message, 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this order? Stock will be restored.')) return;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Failed to delete order');

      showTemporaryAlert('Order deleted and stock levels restored.');
      fetchData();
    } catch (err) {
      showTemporaryAlert(err.message, 'error');
    }
  };

  // Helper calculation for checkout total
  const cartTotal = orderForm.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ============================================================================
  // FRONTEND RENDER FILTERS
  // ============================================================================
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()));
    
    const matchesCategory = productCategoryFilter ? p.category === productCategoryFilter : true;
    const matchesStatus = productStatusFilter ? p.status === productStatusFilter : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="app-container">
      {/* Mobile Top Header Bar */}
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <span className="logo-text">ApexStock</span>
        <div style={{ width: '24px' }}></div>
      </header>

      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay-backdrop" onClick={() => setMobileSidebarOpen(false)}></div>
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><polyline points="12 22 12 12"/><polyline points="2 8.5 12 12 22 8.5"/></svg>
          </div>
          <span className="logo-text">ApexStock</span>
        </div>

        <ul className="nav-links">
          <li>
            <div 
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('dashboard'); fetchData(); setMobileSidebarOpen(false); }}
            >
              <IconDashboard />
              Dashboard
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${currentView === 'customers' ? 'active' : ''}`}
              onClick={() => { setCurrentView('customers'); fetchData(); setMobileSidebarOpen(false); }}
            >
              <IconCustomers />
              Customers
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
              onClick={() => { setCurrentView('orders'); fetchData(); setMobileSidebarOpen(false); }}
            >
              <IconOrders />
              Orders
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${currentView === 'inventory' ? 'active' : ''}`}
              onClick={() => { setCurrentView('inventory'); fetchData(); setMobileSidebarOpen(false); }}
            >
              <IconInventory />
              Products
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Administrator</span>
            <span className="user-role">Operations Lead</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTENT */}
      <main className="main-content">
        
        {/* Floating Notification System */}
        {errorMsg && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'var(--danger-glow)',
            color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '12px 24px', borderRadius: '12px', zIndex: '9999', display: 'flex', gap: '10px',
            alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)'
          }}>
            <IconAlert />
            <strong>Error:</strong> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'var(--success-glow)',
            color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '12px 24px', borderRadius: '12px', zIndex: '9999', display: 'flex', gap: '10px',
            alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)'
          }}>
            <span style={{ color: 'var(--success)', fontSize: '1.2rem', lineHeight: 1 }}>✓</span>
            <strong>Success:</strong> {successMsg}
          </div>
        )}

        {/* ====================================================================
            VIEW A: DASHBOARD VIEW
            ==================================================================== */}
        {currentView === 'dashboard' && analytics && (
          <div>
            <div className="page-header">
              <div className="page-title-desc">
                <h1 className="page-title">Operation Dashboard</h1>
                <p className="page-desc">Real-time indicators, stock levels, and revenue summary</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenOrderAdd}>
                <IconPlus /> Create Order Wizard
              </button>
            </div>

            {/* KPI Metrics */}
            <div className="kpi-grid">
              <div className="card kpi-card">
                <div className="kpi-icon total">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.89 2.24a2 2 0 0 0-1.78 0L2.96 6A2 2 0 0 0 2 7.76v8.48A2 2 0 0 0 2.96 18l8.15 3.76a2 2 0 0 0 1.78 0L21.04 18a2 2 0 0 0 .96-1.76V7.76A2 2 0 0 0 21.04 6z"></path></svg>
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Products</span>
                  <span className="kpi-value">{analytics.metrics.totalProducts}</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-icon sales">
                  <IconCustomers />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Customers</span>
                  <span className="kpi-value">{analytics.metrics.totalCustomers}</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-icon pending">
                  <IconOrders />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Orders</span>
                  <span className="kpi-value">{analytics.metrics.totalOrders}</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-icon alert">
                  <IconAlert />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Low Stock Products</span>
                  <span className="kpi-value">{analytics.metrics.lowStockAlerts}</span>
                </div>
              </div>
            </div>

            {/* Dashboard Graphs & Tables */}
            <div className="dashboard-details-grid">
              
              {/* Sales Revenue Trend Chart */}
              <div className="card">
                <div className="chart-header">
                  <h3 className="chart-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    Daily Revenue Trend
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 7 Days (Completed)</span>
                </div>
                
                <div className="chart-container">
                  {analytics.salesTrend.map((day, idx) => {
                    const maxVal = Math.max(...analytics.salesTrend.map(d => d.sales), 500);
                    const heightPct = (day.sales / maxVal) * 90;
                    return (
                      <div className="chart-bar-wrapper" key={idx}>
                        <div className="chart-bar" style={{ height: `${Math.max(5, heightPct)}%` }}>
                          <div className="chart-tooltip">
                            ${day.sales.toFixed(2)} ({day.count} orders)
                          </div>
                        </div>
                        <span className="chart-label">{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Critical Low Stock Warning Panel */}
              <div className="card">
                <div className="panel-header">
                  <h3 className="panel-title" style={{ color: 'var(--danger)' }}>
                    <IconAlert /> Critical Stock Alerts
                  </h3>
                  <span className="badge badge-out_of_stock">{analytics.lowStockProducts.length} Items</span>
                </div>

                <div className="item-list">
                  {analytics.lowStockProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '24px 0' }}>
                      ✓ All stock levels optimal
                    </div>
                  ) : (
                    analytics.lowStockProducts.map(p => (
                      <div className="item-row" key={p.id}>
                        <div className="item-meta">
                          <span className="item-title">{p.name}</span>
                          <span className="item-subtitle">SKU: {p.sku}</span>
                        </div>
                        <span className={`badge badge-${p.status.toLowerCase()}`}>
                          {p.quantity} left
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Selling Products List */}
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="panel-header">
                <h3 className="panel-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  Top Selling Products
                </h3>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Units Sold</th>
                      <th>Generated Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dark)' }}>
                          No sales data recorded yet.
                        </td>
                      </tr>
                    ) : (
                      analytics.topProducts.map(prod => (
                        <tr key={prod.id}>
                          <td style={{ fontWeight: 600 }}>{prod.name}</td>
                          <td>{prod.sku}</td>
                          <td>{prod.unitsSold} units</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                            ${prod.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW B: INVENTORY DIRECTORY
            ==================================================================== */}
        {currentView === 'inventory' && (
          <div>
            <div className="page-header">
              <div className="page-title-desc">
                <h1 className="page-title">Products</h1>
                <p className="page-desc">Add, edit, filter, and track product stock limits</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenProductAdd}>
                <IconPlus /> Add Product
              </button>
            </div>

            {/* Filter and Search Controls */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: '1', minWidth: '240px' }}>
                  <span style={{ position: 'absolute', left: '12px', color: 'var(--text-dark)' }}><IconSearch /></span>
                  <input 
                    type="text"
                    className="search-input"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    placeholder="Search by SKU, Product name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                <select 
                  className="filter-select"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat, idx) => (
                    <option value={cat} key={idx}>{cat}</option>
                  ))}
                </select>

                <select 
                  className="filter-select"
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                >
                  <option value="">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock Alert</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>

                {(productSearch || productCategoryFilter || productStatusFilter) && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setProductSearch('');
                      setProductCategoryFilter('');
                      setProductStatusFilter('');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Inventory Table List */}
            <div className="card">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th className="hide-mobile">Category</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dark)' }}>
                          No products found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--secondary)' }}>{p.sku}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description || 'No description'}</div>
                          </td>
                          <td className="hide-mobile"><span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px' }}>{p.category}</span></td>
                          <td style={{ fontWeight: 600 }}>${p.price.toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>{p.quantity} <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>/ min: {p.minStockLevel}</span></td>
                          <td>
                            <span className={`badge badge-${p.status.toLowerCase()}`}>
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px' }}
                                onClick={() => handleOpenProductEdit(p)}
                              >
                                <IconEdit />
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '6px 10px' }}
                                onClick={() => handleDeleteProduct(p.id)}
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW C: ORDER REGISTRY
            ==================================================================== */}
        {currentView === 'orders' && (
          <div>
            <div className="page-header">
              <div className="page-title-desc">
                <h1 className="page-title">Orders</h1>
                <p className="page-desc">Track sales, update shipping status, and create client checkouts</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenOrderAdd}>
                <IconPlus /> Create Order Wizard
              </button>
            </div>

            {/* Orders Database Table */}
            <div className="card">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th className="hide-mobile">Date</th>
                      <th>Customer Details</th>
                      <th className="hide-mobile">Items Count</th>
                      <th className="hide-mobile">Order Details</th>
                      <th>Invoice Total</th>
                      <th>Fulfillment Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dark)' }}>
                          No orders registered in system database.
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {order.id.slice(0, 8).toUpperCase()}...
                          </td>
                          <td className="hide-mobile">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.customer?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.email || 'N/A'}</div>
                          </td>
                          <td className="hide-mobile" style={{ fontWeight: 600 }}>
                            {order.orderItems.reduce((s, i) => s + i.quantity, 0)} units
                          </td>
                          <td className="hide-mobile">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                              {order.orderItems.map((item, idx) => (
                                <div key={idx} style={{ color: 'var(--text-muted)' }}>
                                  • {item.product?.name} <span style={{ color: 'var(--text-dark)' }}>(x{item.quantity})</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                            ${order.totalAmount.toFixed(2)}
                          </td>
                          <td>
                            <select
                              className={`filter-select badge badge-${order.status}`}
                              style={{ border: 'none', appearance: 'auto', cursor: 'pointer', paddingRight: '20px' }}
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            >
                              <option value="PENDING" style={{ backgroundColor: '#0f1422', color: 'var(--warning)' }}>PENDING</option>
                              <option value="SHIPPED" style={{ backgroundColor: '#0f1422', color: 'var(--info)' }}>SHIPPED</option>
                              <option value="DELIVERED" style={{ backgroundColor: '#0f1422', color: 'var(--success)' }}>DELIVERED</option>
                              <option value="CANCELLED" style={{ backgroundColor: '#0f1422', color: 'var(--danger)' }}>CANCELLED</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '6px 10px' }}
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <IconTrash /> Cancel & Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW D: CUSTOMER DIRECTORY
            ==================================================================== */}
        {currentView === 'customers' && (
          <div>
            <div className="page-header">
              <div className="page-title-desc">
                <h1 className="page-title">Customers</h1>
                <p className="page-desc">Manage customer accounts, details, and order metrics</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenCustomerAdd}>
                <IconPlus /> Add Customer
              </button>
            </div>

            <div className="card">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th className="hide-mobile">Email Address</th>
                      <th className="hide-mobile">Phone Line</th>
                      <th>Orders Placed</th>
                      <th className="hide-mobile">Registered On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dark)' }}>
                          No customers currently registered in the database.
                        </td>
                      </tr>
                    ) : (
                      customers.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--secondary)' }}>{c.name}</td>
                          <td className="hide-mobile">
                            <a href={`mailto:${c.email}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                              {c.email}
                            </a>
                          </td>
                          <td className="hide-mobile" style={{ fontFamily: 'monospace' }}>{c.phone}</td>
                          <td style={{ fontWeight: 600 }}>
                            <span style={{ fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                              {c._count?.orders !== undefined ? c._count.orders : 0} invoices
                            </span>
                          </td>
                          <td className="hide-mobile" style={{ color: 'var(--text-dark)', fontSize: '0.8rem' }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px' }}
                                onClick={() => handleOpenCustomerEdit(c)}
                              >
                                <IconEdit />
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '6px 10px' }}
                                onClick={() => handleDeleteCustomer(c.id)}
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ====================================================================
          PRODUCT MODAL (ADD & EDIT)
          ==================================================================== */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Inventory Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSaveProduct}>
              
              <div className="form-group row">
                <div>
                  <label className="form-label">SKU Code *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. EL-3992"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="form-label">Product Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. Ergonomic Desk"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="Details, dimensions, or technical specifications..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div className="form-group row">
                <div>
                  <label className="form-label">Unit Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    min="0"
                    className="form-input" 
                    placeholder="0.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Quantity in Warehouse *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    className="form-input" 
                    placeholder="0"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group row">
                <div>
                  <label className="form-label">Minimum Stock Alert Threshold *</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="form-input" 
                    placeholder="5"
                    value={productForm.minStockLevel}
                    onChange={(e) => setProductForm({ ...productForm, minStockLevel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Category Group *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. Electronics, Furniture"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Apply Adjustments' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          CUSTOMER MODAL (ADD & EDIT)
          ==================================================================== */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingCustomer ? 'Adjust Customer Details' : 'Register Customer Account'}</h2>
              <button className="modal-close" onClick={() => setShowCustomerModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSaveCustomer}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="e.g. John Doe"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>

              <div className="form-group row">
                <div>
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    placeholder="name@email.com"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="+1-555-0100"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Save Updates' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          ORDER REGISTRY CHECKOUT MODAL
          ==================================================================== */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create Order Invoice Wizard</h2>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit}>
              
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label">Select Customer Reference *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className={`btn ${!isNewCustomer ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setIsNewCustomer(false)}
                    >
                      Existing Customer
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${isNewCustomer ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setIsNewCustomer(true)}
                    >
                      + Register New
                    </button>
                  </div>
                </div>

                {!isNewCustomer ? (
                  <select 
                    className="form-input" 
                    required={!isNewCustomer}
                    value={orderForm.customerId}
                    onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                  >
                    <option value="" disabled>Select registered customer</option>
                    {customers.map(c => (
                      <option value={c.id} key={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ border: '1px solid var(--border-mute)', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Full Name *</label>
                        <input 
                          type="text" 
                          required={isNewCustomer}
                          className="form-input"
                          style={{ width: '100%', marginTop: '4px' }}
                          placeholder="Client Name"
                          value={newCustomerForm.name}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Email Address *</label>
                        <input 
                          type="email" 
                          required={isNewCustomer}
                          className="form-input"
                          style={{ width: '100%', marginTop: '4px' }}
                          placeholder="client@email.com"
                          value={newCustomerForm.email}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Phone Number *</label>
                      <input 
                        type="text" 
                        required={isNewCustomer}
                        className="form-input"
                        style={{ width: '100%', marginTop: '4px' }}
                        placeholder="+1-555-0100"
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Searchable Product Dropdown */}
              <div className="form-group autocomplete-container" style={{ marginTop: '16px' }}>
                <label className="form-label">Lookup Products to Add</label>
                
                <div style={{ position: 'relative' }}>
                  {/* Dropdown Trigger/Search Input */}
                  <input 
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingRight: '40px', cursor: 'pointer' }}
                    placeholder="Search and select product by name, SKU..."
                    value={productSearchQuery}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                  />
                  <div style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-dark)', pointerEvents: 'none'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>

                  {/* Dropdown Menu List */}
                  {showProductDropdown && (
                    <>
                      <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                        onClick={() => setShowProductDropdown(false)}
                      />
                      <ul className="suggestions-list" style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-active)',
                        borderRadius: 'var(--radius-md)', marginTop: '6px', maxHeight: '240px',
                        overflowY: 'auto', zIndex: 999, padding: '6px 0',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', listStyle: 'none'
                      }}>
                        {products
                          .filter(p => 
                            p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                            p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(productSearchQuery.toLowerCase())
                          )
                          .length === 0 ? (
                            <li style={{ padding: '12px 16px', color: 'var(--text-dark)', textAlign: 'center', fontSize: '0.85rem' }}>
                              No matching products found
                            </li>
                          ) : (
                            products
                              .filter(p => 
                                p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                p.category.toLowerCase().includes(productSearchQuery.toLowerCase())
                              )
                              .map(p => {
                                const isOutOfStock = p.quantity <= 0;
                                return (
                                  <li 
                                    key={p.id}
                                    style={{
                                      padding: '10px 16px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                                      opacity: isOutOfStock ? 0.5 : 1,
                                      transition: 'background-color 0.15s ease'
                                    }}
                                    className={isOutOfStock ? "" : "custom-dropdown-item"}
                                    onClick={() => {
                                      if (!isOutOfStock) {
                                        addToCart(p);
                                        setProductSearchQuery('');
                                        setShowProductDropdown(false);
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isOutOfStock) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isOutOfStock) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                                      <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>{p.name}</span>
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.sku}</span>
                                        <span style={{
                                          fontSize: '0.65rem',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                          color: 'var(--text-muted)'
                                        }}>{p.category}</span>
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>${p.price.toFixed(2)}</span>
                                      <span style={{
                                        fontSize: '0.7rem',
                                        color: isOutOfStock ? 'var(--danger)' : p.quantity <= p.minStockLevel ? 'var(--warning)' : 'var(--text-dark)'
                                      }}>
                                        {isOutOfStock ? 'Out of stock' : `${p.quantity} left`}
                                      </span>
                                    </div>
                                  </li>
                                );
                              })
                          )}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Shopping Cart List */}
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Invoice Cart Items</h4>
                
                {orderForm.cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed var(--border-mute)', borderRadius: '8px', color: 'var(--text-dark)', fontSize: '0.875rem' }}>
                    No products added to invoice cart yet. Look up products above.
                  </div>
                ) : (
                  <div className="cart-items-list">
                    {orderForm.cartItems.map(item => (
                      <div className="cart-item" key={item.productId}>
                        <div className="cart-item-details">
                          <span className="cart-item-name">{item.name}</span>
                          <span className="cart-item-price-info">SKU: {item.sku} | Unit price: ${item.price.toFixed(2)}</span>
                        </div>
                        
                        <div className="cart-item-actions">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginRight: '4px' }}>Qty:</span>
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              style={{ padding: '2px 8px', minWidth: '24px', height: '24px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.maxStock)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min="1"
                              className="form-input cart-quantity-input"
                              style={{ width: '40px', padding: '2px', textAlign: 'center', height: '24px', fontSize: '0.8rem' }}
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.productId, e.target.value, item.maxStock)}
                            />
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              style={{ padding: '2px 8px', minWidth: '24px', height: '24px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.maxStock)}
                              disabled={item.quantity >= item.maxStock}
                            >
                              +
                            </button>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginLeft: '4px' }}>/ {item.maxStock}</span>
                          </div>
                          
                          <button 
                            type="button"
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px' }}
                            onClick={() => removeCartItem(item.productId)}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Invoice Subtotal */}
              {orderForm.cartItems.length > 0 && (
                <div className="cart-total-section">
                  <span>Grand Subtotal:</span>
                  <span style={{ color: 'var(--success)' }}>${cartTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={orderForm.cartItems.length === 0}
                >
                  Confirm Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
