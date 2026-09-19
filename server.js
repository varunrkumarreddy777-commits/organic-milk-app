const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// AUTH ENDPOINTS
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.getUserByEmail(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check subscription
  const sub = db.data.subscriptions.find(s => s.user_id === user.id);
  const products = db.getProducts();

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      distance_km: user.distance_km,
      role: user.role,
      status: user.status
    },
    subscription: sub,
    products
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, address, distance_km, product_id, schedule, morning_qty, evening_qty } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Please fill all required fields' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered. Please login or rejoin.' });
  }

  const result = db.createUser({
    name,
    email,
    phone,
    password,
    address: address || 'Main Area',
    distance_km: parseFloat(distance_km || 1.0),
    role: 'customer',
    product_id: product_id || 'p_cow',
    schedule: schedule || 'both',
    morning_qty: parseFloat(morning_qty || 1.0),
    evening_qty: parseFloat(evening_qty || 1.0)
  });

  res.status(201).json({
    message: 'Registration successful! Welcome to Organic Milk.',
    user: result.user,
    subscription: result.subscription
  });
});

app.post('/api/auth/rejoin', (req, res) => {
  const { userId } = req.body;
  const user = db.rejoinCustomer(userId);
  if (user) {
    res.json({ message: 'Welcome back! Your subscription is now reactivated.', user });
  } else {
    res.status(404).json({ error: 'Customer account not found' });
  }
});

// ADMIN ANALYTICS
app.get('/api/admin/stats', (req, res) => {
  const stats = db.getAdminStats();
  res.json(stats);
});

// PRODUCTS & PRICES
app.get('/api/products', (req, res) => {
  res.json(db.getProducts());
});

app.post('/api/admin/products/:id/price', (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  
  if (!price || isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Please provide a valid price per liter' });
  }

  const updated = db.updateProductPrice(id, price);
  if (updated) {
    res.json({ message: 'Price updated successfully', product: updated });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// DAILY STOCK AVAILABILITY
app.post('/api/admin/availability', (req, res) => {
  const { date, available_liters, notes } = req.body;
  if (!date || available_liters === undefined) {
    return res.status(400).json({ error: 'Date and available liters are required' });
  }

  const result = db.updateDailyStock(date, available_liters, notes);
  res.json({ message: 'Daily milk availability updated', data: result });
});

// DAILY DELIVERIES MATRIX (Filtering by date, excluding calendar skips!)
app.get('/api/admin/deliveries', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const deliveries = db.getDeliveriesForDate(date);
  res.json({ date, deliveries });
});

// CUSTOMER CALENDAR SKIPS / CANCELLATIONS
app.post('/api/customer/cancel-date', (req, res) => {
  const { userId, cancelDate, shift, reason } = req.body;
  if (!userId || !cancelDate) {
    return res.status(400).json({ error: 'User ID and cancel date are required' });
  }

  const cancelEntry = db.addCancelledDate(userId, cancelDate, shift, reason);
  res.json({ message: 'Milk delivery paused/cancelled for selected date', data: cancelEntry });
});

app.delete('/api/customer/cancel-date/:id', (req, res) => {
  const { id } = req.params;
  const removed = db.removeCancelledDate(id);
  if (removed) {
    res.json({ message: 'Cancelled date restored successfully', data: removed });
  } else {
    res.status(404).json({ error: 'Cancellation record not found' });
  }
});

app.get('/api/customer/cancelled-dates/:userId', (req, res) => {
  const { userId } = req.params;
  res.json(db.getCancelledDatesForUser(userId));
});

// PAYMENTS & DIGITAL RECEIPTS
app.get('/api/payments/user/:userId', (req, res) => {
  const { userId } = req.params;
  res.json(db.getPaymentsForUser(userId));
});

app.get('/api/payments/all', (req, res) => {
  res.json(db.getAllPayments());
});

app.post('/api/payments/checkout-online', (req, res) => {
  const { userId, monthYear, amount } = req.body;
  if (!userId || !monthYear || !amount) {
    return res.status(400).json({ error: 'User ID, Month/Year, and Amount are required' });
  }

  const payment = db.processOnlinePayment(userId, monthYear, amount);
  res.json({
    message: 'Online Payment Successful! Digital receipt generated.',
    payment
  });
});

app.post('/api/admin/payments/offline-status', (req, res) => {
  const { paymentId, status } = req.body;
  if (!paymentId || !status) {
    return res.status(400).json({ error: 'Payment ID and status are required' });
  }

  const payment = db.markOfflinePayment(paymentId, status);
  if (payment) {
    res.json({ message: `Payment status updated to ${status}`, payment });
  } else {
    res.status(404).json({ error: 'Payment record not found' });
  }
});

// ADMIN NOTIFICATIONS
app.get('/api/admin/notifications', (req, res) => {
  res.json(db.getNotifications());
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Organic Milk Application is running live on:`);
  console.log(`👉 Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
