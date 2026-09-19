const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Default Seed Data
const defaultData = {
  users: [
    {
      id: "u_admin",
      name: "Organic Milk Admin (Owner)",
      email: "admin@organicmilk.com",
      phone: "9876543210",
      password: "admin123",
      address: "Central Dairy Hub, Plot 14, Main Road",
      distance_km: 0,
      role: "admin",
      status: "active",
      gps_lat: 14.1678,
      gps_lng: 77.8118,
      last_active_date: "2026-09-19",
      created_at: "2026-01-01"
    },
    {
      id: "u_ramesh",
      name: "Ramesh Sharma",
      email: "ramesh@example.com",
      phone: "9014186161",
      password: "user123",
      address: "puttaparthi, prasanthi nilayam, sre ram colney",
      distance_km: 1.0,
      role: "customer",
      status: "active",
      gps_lat: 14.1620,
      gps_lng: 77.8150,
      last_active_date: "2026-09-19",
      created_at: "2026-08-01"
    },
    {
      id: "u_priya",
      name: "Priya Patel",
      email: "priya@example.com",
      phone: "9823456789",
      password: "user123",
      address: "Villa 12, Green Acres, Phase 2",
      distance_km: 1.8,
      role: "customer",
      status: "active",
      gps_lat: 14.1750,
      gps_lng: 77.8200,
      last_active_date: "2026-09-19",
      created_at: "2026-08-10"
    },
    {
      id: "u_anita",
      name: "Anita Rao",
      email: "anita@example.com",
      phone: "9834567890",
      password: "user123",
      address: "House 45, Royal Enclave",
      distance_km: 0.8,
      role: "customer",
      status: "active",
      gps_lat: 14.1690,
      gps_lng: 77.8100,
      last_active_date: "2026-09-19",
      created_at: "2026-08-15"
    },
    {
      id: "u_vikram",
      name: "Vikram Singh (Inactive Example)",
      email: "vikram@example.com",
      phone: "9845678901",
      password: "user123",
      address: "Plot 89, Palm Grove Colony",
      distance_km: 4.5,
      role: "customer",
      status: "inactive_removed",
      gps_lat: 14.1900,
      gps_lng: 77.8500,
      last_active_date: "2026-06-10",
      created_at: "2026-04-01"
    }
  ],
  products: [
    {
      id: "p_cow",
      name: "Organic Pure Cow Milk",
      price_per_liter: 64,
      unit: "Liter",
      description: "100% pure, farm-fresh A2 cow milk, pasteurized & unadulterated."
    },
    {
      id: "p_buffalo",
      name: "Organic Rich Buffalo Milk",
      price_per_liter: 74,
      unit: "Liter",
      description: "High-cream rich buffalo milk, perfect for tea, coffee, and curd."
    },
    {
      id: "p_toned",
      name: "Organic Toned Milk",
      price_per_liter: 54,
      unit: "Liter",
      description: "Low-fat nutritious organic milk for healthy living."
    }
  ],
  subscriptions: [
    {
      id: "sub_ramesh",
      user_id: "u_ramesh",
      product_id: "p_buffalo",
      schedule: "both",
      morning_qty: 1.0,
      evening_qty: 1.0,
      status: "active"
    },
    {
      id: "sub_priya",
      user_id: "u_priya",
      product_id: "p_cow",
      schedule: "morning_only",
      morning_qty: 1.5,
      evening_qty: 0,
      status: "active"
    },
    {
      id: "sub_anita",
      user_id: "u_anita",
      product_id: "p_buffalo",
      schedule: "evening_only",
      morning_qty: 0,
      evening_qty: 1.0,
      status: "active"
    },
    {
      id: "sub_vikram",
      user_id: "u_vikram",
      product_id: "p_toned",
      schedule: "morning_only",
      morning_qty: 2.0,
      evening_qty: 0,
      status: "inactive"
    }
  ],
  cancelled_dates: [
    {
      id: "c_1",
      user_id: "u_ramesh",
      cancel_date: "2026-09-20",
      shift: "both",
      reason: "Out of town for weekend",
      created_at: "2026-09-18T10:00:00Z"
    }
  ],
  daily_availability: [
    {
      date: "2026-09-19",
      available_liters: 350,
      notes: "Fresh morning batch delivered from dairy farm"
    }
  ],
  payments: [
    {
      id: "pay_101",
      user_id: "u_ramesh",
      month_year: "August 2026",
      milk_cost: 3840,
      delivery_cost: 600,
      total_amount: 4440,
      payment_method: "online",
      upi_id: "9014186164-4@ibl",
      payment_status: "paid",
      receipt_number: "OM-202608-8812",
      paid_at: "2026-09-02T11:20:00Z"
    }
  ],
  notifications: [
    {
      id: "n_1",
      title: "New Skip Date Submitted",
      message: "Ramesh Sharma cancelled delivery for 2026-09-20 (Both shifts).",
      type: "skip_date",
      is_read: false,
      created_at: "2026-09-18T10:00:00Z"
    }
  ]
};

// Database Storage Controller
class Database {
  constructor() {
    this.data = defaultData;
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error("Error reading database file, writing seeds:", err);
        this.save();
      }
    }
    this.checkAutoInactivity();
  }

  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // Automatic 60-day inactivity checker
  checkAutoInactivity() {
    const NOW = new Date();
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    let updated = false;

    this.data.users.forEach(user => {
      if (user.role === 'customer' && user.status === 'active') {
        const lastActive = new Date(user.last_active_date || user.created_at);
        if (NOW - lastActive > SIXTY_DAYS_MS) {
          user.status = 'inactive_removed';
          updated = true;
          const sub = this.data.subscriptions.find(s => s.user_id === user.id);
          if (sub) sub.status = 'inactive';
          
          this.data.notifications.unshift({
            id: 'n_' + Date.now(),
            title: 'Customer Auto-Removed (2 Months Inactive)',
            message: `${user.name} set to inactive due to 60 days without activity.`,
            type: 'inactivity',
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }
    });

    if (updated) {
      this.save();
    }
  }

  getUsers() { return this.data.users; }
  getUserById(id) { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  
  createUser(userData) {
    const role = userData.role || 'customer';
    const newId = (role === 'admin' ? 'u_admin_' : 'u_') + Date.now();
    
    const newUser = {
      id: newId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      address: userData.address || 'Main Area',
      distance_km: parseFloat(userData.distance_km || 1.0),
      gps_lat: userData.gps_lat || null,
      gps_lng: userData.gps_lng || null,
      role: role,
      status: 'active',
      last_active_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0]
    };
    this.data.users.push(newUser);

    let sub = null;
    if (role === 'customer') {
      sub = {
        id: 'sub_' + Date.now(),
        user_id: newId,
        product_id: userData.product_id || 'p_cow',
        schedule: userData.schedule || 'both',
        morning_qty: userData.morning_qty || 1.0,
        evening_qty: userData.evening_qty || 1.0,
        status: 'active'
      };
      this.data.subscriptions.push(sub);
    }

    this.addNotification({
      title: role === 'admin' ? 'New Admin Registered!' : 'New Customer Registered!',
      message: `${newUser.name} registered as ${role.toUpperCase()} (${newUser.address}).`,
      type: 'signup'
    });

    this.save();
    return { user: newUser, subscription: sub };
  }

  rejoinCustomer(userId) {
    const user = this.getUserById(userId);
    if (user) {
      user.status = 'active';
      user.last_active_date = new Date().toISOString().split('T')[0];

      const sub = this.data.subscriptions.find(s => s.user_id === userId);
      if (sub) sub.status = 'active';

      this.addNotification({
        title: 'Customer Rejoined!',
        message: `${user.name} has rejoined Organic Milk service after inactivity.`,
        type: 'rejoin'
      });

      this.save();
      return user;
    }
    return null;
  }

  calculateDeliveryCharge(distanceKm) {
    if (!distanceKm || distanceKm <= 0) return 0;
    const range = Math.ceil(distanceKm);
    return range * 10;
  }

  getAdminStats() {
    this.checkAutoInactivity();
    const activeCustomers = this.data.users.filter(u => u.role === 'customer' && u.status === 'active');
    
    let bothCount = 0;
    let morningOnlyCount = 0;
    let eveningOnlyCount = 0;
    let totalMorningLiters = 0;
    let totalEveningLiters = 0;

    activeCustomers.forEach(customer => {
      const sub = this.data.subscriptions.find(s => s.user_id === customer.id && s.status === 'active');
      if (sub) {
        if (sub.schedule === 'both') {
          bothCount++;
          totalMorningLiters += parseFloat(sub.morning_qty || 0);
          totalEveningLiters += parseFloat(sub.evening_qty || 0);
        } else if (sub.schedule === 'morning_only') {
          morningOnlyCount++;
          totalMorningLiters += parseFloat(sub.morning_qty || 0);
        } else if (sub.schedule === 'evening_only') {
          eveningOnlyCount++;
          totalEveningLiters += parseFloat(sub.evening_qty || 0);
        }
      }
    });

    const todayDate = new Date().toISOString().split('T')[0];
    const todayStock = this.data.daily_availability.find(a => a.date === todayDate) || { available_liters: 350 };

    return {
      total_registered_customers: activeCustomers.length,
      both_shifts_count: bothCount,
      morning_only_count: morningOnlyCount,
      evening_only_count: eveningOnlyCount,
      total_morning_liters: totalMorningLiters,
      total_evening_liters: totalEveningLiters,
      total_daily_liters_demand: totalMorningLiters + totalEveningLiters,
      today_available_stock: todayStock.available_liters,
      inactive_customers_count: this.data.users.filter(u => u.role === 'customer' && u.status === 'inactive_removed').length
    };
  }

  getProducts() { return this.data.products; }
  updateProductPrice(productId, newPrice) {
    const product = this.data.products.find(p => p.id === productId);
    if (product) {
      const oldPrice = product.price_per_liter;
      product.price_per_liter = parseFloat(newPrice);
      this.addNotification({
        title: 'Product Price Updated',
        message: `${product.name} price changed from ₹${oldPrice} to ₹${newPrice}/Liter.`,
        type: 'price_update'
      });
      this.save();
      return product;
    }
    return null;
  }

  updateDailyStock(date, stockLiters, notes) {
    let stockObj = this.data.daily_availability.find(a => a.date === date);
    if (stockObj) {
      stockObj.available_liters = parseFloat(stockLiters);
      stockObj.notes = notes || stockObj.notes;
    } else {
      stockObj = { date, available_liters: parseFloat(stockLiters), notes: notes || '' };
      this.data.daily_availability.push(stockObj);
    }
    this.save();
    return stockObj;
  }

  addCancelledDate(userId, cancelDate, shift, reason) {
    const user = this.getUserById(userId);
    const newCancel = {
      id: 'c_' + Date.now(),
      user_id: userId,
      cancel_date: cancelDate,
      shift: shift || 'both',
      reason: reason || 'Not specified',
      created_at: new Date().toISOString()
    };
    this.data.cancelled_dates.push(newCancel);

    this.addNotification({
      title: 'Delivery Skip Request',
      message: `${user ? user.name : 'Customer'} paused delivery for ${cancelDate} (${shift} shift).`,
      type: 'skip_date'
    });

    this.save();
    return newCancel;
  }

  removeCancelledDate(id) {
    const index = this.data.cancelled_dates.findIndex(c => c.id === id);
    if (index !== -1) {
      const removed = this.data.cancelled_dates.splice(index, 1);
      this.save();
      return removed[0];
    }
    return null;
  }

  getCancelledDatesForUser(userId) {
    return this.data.cancelled_dates.filter(c => c.user_id === userId);
  }

  getDeliveriesForDate(date) {
    const activeCustomers = this.data.users.filter(u => u.role === 'customer' && u.status === 'active');
    const daySkips = this.data.cancelled_dates.filter(c => c.cancel_date === date);

    return activeCustomers.map(customer => {
      const sub = this.data.subscriptions.find(s => s.user_id === customer.id && s.status === 'active');
      const product = this.data.products.find(p => p.id === (sub ? sub.product_id : 'p_cow'));
      const customerSkips = daySkips.filter(c => c.user_id === customer.id);
      
      let morningStatus = 'deliver';
      let eveningStatus = 'deliver';

      if (sub) {
        if (sub.schedule === 'morning_only') eveningStatus = 'not_scheduled';
        if (sub.schedule === 'evening_only') morningStatus = 'not_scheduled';
      }

      customerSkips.forEach(skip => {
        if (skip.shift === 'both') {
          morningStatus = 'cancelled';
          eveningStatus = 'cancelled';
        } else if (skip.shift === 'morning') {
          morningStatus = 'cancelled';
        } else if (skip.shift === 'evening') {
          eveningStatus = 'cancelled';
        }
      });

      const distanceChargePerDay = this.calculateDeliveryCharge(customer.distance_km);

      return {
        customer_id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        distance_km: customer.distance_km,
        gps_lat: customer.gps_lat,
        gps_lng: customer.gps_lng,
        delivery_charge_per_day: distanceChargePerDay,
        product_name: product ? product.name : 'Organic Cow Milk',
        product_price: product ? product.price_per_liter : 64,
        schedule: sub ? sub.schedule : 'both',
        morning_qty: sub ? sub.morning_qty : 0,
        evening_qty: sub ? sub.evening_qty : 0,
        morning_status: morningStatus,
        evening_status: eveningStatus,
        skip_reasons: customerSkips.map(s => s.reason).join(', ')
      };
    });
  }

  getPaymentsForUser(userId) {
    return this.data.payments.filter(p => p.user_id === userId);
  }

  getAllPayments() {
    return this.data.payments.map(pay => {
      const user = this.getUserById(pay.user_id);
      return {
        ...pay,
        customer_name: user ? user.name : 'Unknown',
        customer_phone: user ? user.phone : ''
      };
    });
  }

  processOnlinePayment(userId, monthYear, amount, upiId) {
    const user = this.getUserById(userId);
    const receiptNum = 'OM-' + new Date().toISOString().slice(0,7).replace('-','') + '-' + Math.floor(1000 + Math.random() * 9000);
    const upi = upiId || '9014186164-4@ibl';
    
    let pay = this.data.payments.find(p => p.user_id === userId && p.month_year === monthYear);
    if (!pay) {
      pay = {
        id: 'pay_' + Date.now(),
        user_id: userId,
        month_year: monthYear,
        milk_cost: amount * 0.85,
        delivery_cost: amount * 0.15,
        total_amount: amount,
        payment_method: 'online',
        upi_id: upi,
        payment_status: 'paid',
        receipt_number: receiptNum,
        paid_at: new Date().toISOString()
      };
      this.data.payments.push(pay);
    } else {
      pay.payment_method = 'online';
      pay.upi_id = upi;
      pay.payment_status = 'paid';
      pay.receipt_number = receiptNum;
      pay.paid_at = new Date().toISOString();
    }

    this.addNotification({
      title: 'Online UPI Payment Completed',
      message: `${user ? user.name : 'Customer'} paid ₹${amount} online via UPI (${upi}). Receipt: ${receiptNum}`,
      type: 'payment'
    });

    this.save();
    return pay;
  }

  markOfflinePayment(paymentId, status) {
    const pay = this.data.payments.find(p => p.id === paymentId);
    if (pay) {
      pay.payment_status = status;
      pay.payment_method = 'offline';
      if (status === 'paid' && !pay.paid_at) {
        pay.paid_at = new Date().toISOString();
        if (!pay.receipt_number) {
          pay.receipt_number = 'OM-OFF-' + Math.floor(1000 + Math.random() * 9000);
        }
      }
      this.save();
      return pay;
    }
    return null;
  }

  getNotifications() {
    return this.data.notifications;
  }

  addNotification(n) {
    this.data.notifications.unshift({
      id: 'n_' + Date.now(),
      is_read: false,
      created_at: new Date().toISOString(),
      ...n
    });
  }
}

module.exports = new Database();
