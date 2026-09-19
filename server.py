import http.server
import socketserver
import json
import os
import urllib.parse
from datetime import datetime

PORT = 3000
DB_FILE = os.path.join(os.path.dirname(__file__), 'data.json')

DEFAULT_DATA = {
    "users": [
        {
            "id": "u_admin",
            "name": "Organic Milk Admin (Owner)",
            "email": "admin@organicmilk.com",
            "phone": "9876543210",
            "password": "admin123",
            "address": "Central Dairy Hub, Plot 14, Main Road",
            "distance_km": 0,
            "role": "admin",
            "status": "active",
            "gps_lat": 14.1678,
            "gps_lng": 77.8118,
            "last_active_date": "2026-09-19",
            "created_at": "2026-01-01"
        },
        {
            "id": "u_ramesh",
            "name": "Ramesh Sharma",
            "email": "ramesh@example.com",
            "phone": "9014186161",
            "password": "user123",
            "address": "puttaparthi, prasanthi nilayam, sre ram colney",
            "distance_km": 1.0,
            "role": "customer",
            "status": "active",
            "gps_lat": 14.1620,
            "gps_lng": 77.8150,
            "last_active_date": "2026-09-19",
            "created_at": "2026-08-01"
        },
        {
            "id": "u_priya",
            "name": "Priya Patel",
            "email": "priya@example.com",
            "phone": "9823456789",
            "password": "user123",
            "address": "Villa 12, Green Acres, Phase 2",
            "distance_km": 1.8,
            "role": "customer",
            "status": "active",
            "gps_lat": 14.1750,
            "gps_lng": 77.8200,
            "last_active_date": "2026-09-19",
            "created_at": "2026-08-10"
        },
        {
            "id": "u_anita",
            "name": "Anita Rao",
            "email": "anita@example.com",
            "phone": "9834567890",
            "password": "user123",
            "address": "House 45, Royal Enclave",
            "distance_km": 0.8,
            "role": "customer",
            "status": "active",
            "gps_lat": 14.1690,
            "gps_lng": 77.8100,
            "last_active_date": "2026-09-19",
            "created_at": "2026-08-15"
        },
        {
            "id": "u_vikram",
            "name": "Vikram Singh (Inactive Example)",
            "email": "vikram@example.com",
            "phone": "9845678901",
            "password": "user123",
            "address": "Plot 89, Palm Grove Colony",
            "distance_km": 4.5,
            "role": "customer",
            "status": "inactive_removed",
            "gps_lat": 14.1900,
            "gps_lng": 77.8500,
            "last_active_date": "2026-06-10",
            "created_at": "2026-04-01"
        }
    ],
    "products": [
        {
            "id": "p_cow",
            "name": "Organic Pure Cow Milk",
            "price_per_liter": 64,
            "unit": "Liter",
            "description": "100% pure, farm-fresh A2 cow milk, pasteurized & unadulterated."
        },
        {
            "id": "p_buffalo",
            "name": "Organic Rich Buffalo Milk",
            "price_per_liter": 74,
            "unit": "Liter",
            "description": "High-cream rich buffalo milk, perfect for tea, coffee, and curd."
        },
        {
            "id": "p_toned",
            "name": "Organic Toned Milk",
            "price_per_liter": 54,
            "unit": "Liter",
            "description": "Low-fat nutritious organic milk for healthy living."
        }
    ],
    "subscriptions": [
        {
            "id": "sub_ramesh",
            "user_id": "u_ramesh",
            "product_id": "p_buffalo",
            "schedule": "both",
            "morning_qty": 1.0,
            "evening_qty": 1.0,
            "status": "active"
        },
        {
            "id": "sub_priya",
            "user_id": "u_priya",
            "product_id": "p_cow",
            "schedule": "morning_only",
            "morning_qty": 1.5,
            "evening_qty": 0,
            "status": "active"
        },
        {
            "id": "sub_anita",
            "user_id": "u_anita",
            "product_id": "p_buffalo",
            "schedule": "evening_only",
            "morning_qty": 0,
            "evening_qty": 1.0,
            "status": "active"
        },
        {
            "id": "sub_vikram",
            "user_id": "u_vikram",
            "product_id": "p_toned",
            "schedule": "morning_only",
            "morning_qty": 2.0,
            "evening_qty": 0,
            "status": "inactive"
        }
    ],
    "cancelled_dates": [
        {
            "id": "c_1",
            "user_id": "u_ramesh",
            "cancel_date": "2026-09-20",
            "shift": "both",
            "reason": "Out of town for weekend",
            "created_at": "2026-09-18T10:00:00Z"
        }
    ],
    "daily_availability": [
        {
            "date": "2026-09-19",
            "available_liters": 350,
            "notes": "Fresh morning batch delivered from dairy farm"
        }
    ],
    "payments": [
        {
            "id": "pay_101",
            "user_id": "u_ramesh",
            "month_year": "August 2026",
            "milk_cost": 3840,
            "delivery_cost": 600,
            "total_amount": 4440,
            "payment_method": "online",
            "upi_id": "9014186164-4@ibl",
            "payment_status": "paid",
            "receipt_number": "OM-202608-8812",
            "paid_at": "2026-09-02T11:20:00Z"
        }
    ],
    "notifications": [
        {
            "id": "n_1",
            "title": "New Skip Date Submitted",
            "message": "Ramesh Sharma cancelled delivery for 2026-09-20 (Both shifts).",
            "type": "skip_date",
            "is_read": False,
            "created_at": "2026-09-18T10:00:00Z"
        }
    ]
}

def load_data():
    if not os.path.exists(DB_FILE):
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA

def save_data(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

class OrganicMilkHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urllib.parse.urlparse(path)
        clean_path = parsed.path
        if clean_path == '/' or clean_path == '':
            clean_path = '/index.html'
        
        if not clean_path.startswith('/api/'):
            public_dir = os.path.join(os.path.dirname(__file__), 'public')
            target = os.path.join(public_dir, clean_path.lstrip('/'))
            return target
        return super().translate_path(path)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        data = load_data()

        if path == '/api/admin/stats':
            active_customers = [u for u in data['users'] if u['role'] == 'customer' and u['status'] == 'active']
            both_count = 0
            m_only_count = 0
            e_only_count = 0
            m_liters = 0.0
            e_liters = 0.0

            for c in active_customers:
                sub = next((s for s in data['subscriptions'] if s['user_id'] == c['id'] and s['status'] == 'active'), None)
                if sub:
                    if sub['schedule'] == 'both':
                        both_count += 1
                        m_liters += float(sub.get('morning_qty', 0))
                        e_liters += float(sub.get('evening_qty', 0))
                    elif sub['schedule'] == 'morning_only':
                        m_only_count += 1
                        m_liters += float(sub.get('morning_qty', 0))
                    elif sub['schedule'] == 'evening_only':
                        e_only_count += 1
                        e_liters += float(sub.get('evening_qty', 0))

            today_str = datetime.now().strftime('%Y-%m-%d')
            today_stock = next((a for a in data['daily_availability'] if a['date'] == today_str), {'available_liters': 350})

            resp = {
                "total_registered_customers": len(active_customers),
                "both_shifts_count": both_count,
                "morning_only_count": m_only_count,
                "evening_only_count": e_only_count,
                "total_morning_liters": m_liters,
                "total_evening_liters": e_liters,
                "total_daily_liters_demand": m_liters + e_liters,
                "today_available_stock": today_stock['available_liters'],
                "inactive_customers_count": len([u for u in data['users'] if u['role'] == 'customer' and u['status'] == 'inactive_removed'])
            }
            self.send_json(resp)
            return

        elif path == '/api/products':
            self.send_json(data['products'])
            return

        elif path == '/api/admin/deliveries':
            date_filter = query.get('date', [datetime.now().strftime('%Y-%m-%d')])[0]
            active_customers = [u for u in data['users'] if u['role'] == 'customer' and u['status'] == 'active']
            day_skips = [c for c in data['cancelled_dates'] if c['cancel_date'] == date_filter]

            deliveries = []
            for c in active_customers:
                sub = next((s for s in data['subscriptions'] if s['user_id'] == c['id'] and s['status'] == 'active'), None)
                prod = next((p for p in data['products'] if p['id'] == (sub['product_id'] if sub else 'p_cow')), None)
                c_skips = [s for s in day_skips if s['user_id'] == c['id']]

                m_status = 'deliver'
                e_status = 'deliver'

                if sub:
                    if sub['schedule'] == 'morning_only': e_status = 'not_scheduled'
                    if sub['schedule'] == 'evening_only': m_status = 'not_scheduled'

                for s in c_skips:
                    if s['shift'] == 'both':
                        m_status = 'cancelled'
                        e_status = 'cancelled'
                    elif s['shift'] == 'morning':
                        m_status = 'cancelled'
                    elif s['shift'] == 'evening':
                        e_status = 'cancelled'

                dist_km = float(c.get('distance_km', 1.0))
                dist_charge = int(dist_km + 0.99) * 10 if dist_km > 0 else 10

                deliveries.append({
                    "customer_id": c['id'],
                    "name": c['name'],
                    "phone": c['phone'],
                    "address": c['address'],
                    "distance_km": dist_km,
                    "gps_lat": c.get('gps_lat'),
                    "gps_lng": c.get('gps_lng'),
                    "delivery_charge_per_day": dist_charge,
                    "product_name": prod['name'] if prod else 'Organic Cow Milk',
                    "product_price": prod['price_per_liter'] if prod else 64,
                    "schedule": sub['schedule'] if sub else 'both',
                    "morning_qty": sub['morning_qty'] if sub else 0,
                    "evening_qty": sub['evening_qty'] if sub else 0,
                    "morning_status": m_status,
                    "evening_status": e_status,
                    "skip_reasons": ", ".join([s['reason'] for s in c_skips])
                })

            self.send_json({"date": date_filter, "deliveries": deliveries})
            return

        elif path.startswith('/api/customer/cancelled-dates/'):
            user_id = path.split('/')[-1]
            user_skips = [c for c in data['cancelled_dates'] if c['user_id'] == user_id]
            self.send_json(user_skips)
            return

        elif path == '/api/payments/all':
            payments = []
            for p in data['payments']:
                user = next((u for u in data['users'] if u['id'] == p['user_id']), None)
                payments.append({
                    **p,
                    "customer_name": user['name'] if user else 'Unknown',
                    "customer_phone": user['phone'] if user else ''
                })
            self.send_json(payments)
            return

        elif path == '/api/admin/notifications':
            self.send_json(data['notifications'])
            return

        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)
        body = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}

        data = load_data()
        path = urllib.parse.urlparse(self.path).path

        if path == '/api/auth/login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            user = next((u for u in data['users'] if u['email'].lower() == email), None)

            if not user or user['password'] != password:
                self.send_json({"error": "Invalid email or password"}, status=401)
                return

            sub = next((s for s in data['subscriptions'] if s['user_id'] == user['id']), None)
            self.send_json({
                "message": "Login successful",
                "user": user,
                "subscription": sub,
                "products": data['products']
            })
            return

        elif path == '/api/auth/register':
            role = body.get('role', 'customer')
            new_id = f"u_{'admin_' if role == 'admin' else ''}{int(datetime.now().timestamp())}"
            
            new_user = {
                "id": new_id,
                "name": body.get('name'),
                "email": body.get('email'),
                "phone": body.get('phone'),
                "password": body.get('password'),
                "address": body.get('address', 'Main Area'),
                "distance_km": float(body.get('distance_km', 1.0)),
                "gps_lat": body.get('gps_lat'),
                "gps_lng": body.get('gps_lng'),
                "role": role,
                "status": "active",
                "last_active_date": datetime.now().strftime('%Y-%m-%d'),
                "created_at": datetime.now().strftime('%Y-%m-%d')
            }
            data['users'].append(new_user)

            new_sub = None
            if role == 'customer':
                new_sub = {
                    "id": f"sub_{int(datetime.now().timestamp())}",
                    "user_id": new_id,
                    "product_id": body.get('product_id', 'p_cow'),
                    "schedule": body.get('schedule', 'both'),
                    "morning_qty": float(body.get('morning_qty', 1.0)),
                    "evening_qty": float(body.get('evening_qty', 1.0)),
                    "status": "active"
                }
                data['subscriptions'].append(new_sub)

            data['notifications'].insert(0, {
                "id": f"n_{int(datetime.now().timestamp())}",
                "title": "New Admin Registered!" if role == 'admin' else "New Customer Registered!",
                "message": f"{new_user['name']} registered as {role.upper()} ({new_user['address']}).",
                "type": "signup",
                "is_read": False,
                "created_at": datetime.now().isoformat()
            })

            save_data(data)
            self.send_json({"message": f"Registration successful! Welcome to Organic Milk as {role.upper()}.", "user": new_user, "subscription": new_sub}, status=201)
            return

        elif path == '/api/auth/rejoin':
            user_id = body.get('userId')
            user = next((u for u in data['users'] if u['id'] == user_id), None)
            if user:
                user['status'] = 'active'
                user['last_active_date'] = datetime.now().strftime('%Y-%m-%d')
                sub = next((s for s in data['subscriptions'] if s['user_id'] == user_id), None)
                if sub: sub['status'] = 'active'

                data['notifications'].insert(0, {
                    "id": f"n_{int(datetime.now().timestamp())}",
                    "title": "Customer Rejoined!",
                    "message": f"{user['name']} has rejoined Organic Milk service after inactivity.",
                    "type": "rejoin",
                    "is_read": False,
                    "created_at": datetime.now().isoformat()
                })
                save_data(data)
                self.send_json({"message": "Welcome back! Your subscription is reactivated.", "user": user})
            else:
                self.send_json({"error": "User not found"}, status=404)
            return

        elif path.startswith('/api/admin/products/') and path.endswith('/price'):
            prod_id = path.split('/')[4]
            new_price = float(body.get('price', 0))
            prod = next((p for p in data['products'] if p['id'] == prod_id), None)
            if prod:
                old_p = prod['price_per_liter']
                prod['price_per_liter'] = new_price
                data['notifications'].insert(0, {
                    "id": f"n_{int(datetime.now().timestamp())}",
                    "title": "Product Price Updated",
                    "message": f"{prod['name']} price changed from ₹{old_p} to ₹{new_price}/Liter.",
                    "type": "price_update",
                    "is_read": False,
                    "created_at": datetime.now().isoformat()
                })
                save_data(data)
                self.send_json({"message": "Price updated successfully", "product": prod})
            else:
                self.send_json({"error": "Product not found"}, status=404)
            return

        elif path == '/api/admin/availability':
            date_str = body.get('date')
            liters = float(body.get('available_liters', 350))
            notes = body.get('notes', '')

            stock = next((a for a in data['daily_availability'] if a['date'] == date_str), None)
            if stock:
                stock['available_liters'] = liters
                stock['notes'] = notes
            else:
                stock = {"date": date_str, "available_liters": liters, "notes": notes}
                data['daily_availability'].append(stock)

            save_data(data)
            self.send_json({"message": "Daily milk availability updated", "data": stock})
            return

        elif path == '/api/customer/cancel-date':
            user_id = body.get('userId')
            cancel_date = body.get('cancelDate')
            shift = body.get('shift', 'both')
            reason = body.get('reason', 'Not specified')

            user = next((u for u in data['users'] if u['id'] == user_id), None)

            cancel_entry = {
                "id": f"c_{int(datetime.now().timestamp())}",
                "user_id": user_id,
                "cancel_date": cancel_date,
                "shift": shift,
                "reason": reason,
                "created_at": datetime.now().isoformat()
            }
            data['cancelled_dates'].append(cancel_entry)

            data['notifications'].insert(0, {
                "id": f"n_{int(datetime.now().timestamp())}",
                "title": "Delivery Skip Request",
                "message": f"{user['name'] if user else 'Customer'} paused delivery for {cancel_date} ({shift} shift).",
                "type": "skip_date",
                "is_read": False,
                "created_at": datetime.now().isoformat()
            })

            save_data(data)
            self.send_json({"message": "Milk delivery paused/cancelled for selected date", "data": cancel_entry})
            return

        elif path == '/api/payments/checkout-online':
            user_id = body.get('userId')
            month_year = body.get('monthYear')
            amount = float(body.get('amount', 0))
            upi_id = body.get('upiId', '9014186164-4@ibl')
            receipt_num = f"OM-{datetime.now().strftime('%Y%m')}-{int(datetime.now().timestamp()) % 9000 + 1000}"

            user = next((u for u in data['users'] if u['id'] == user_id), None)

            payment = {
                "id": f"pay_{int(datetime.now().timestamp())}",
                "user_id": user_id,
                "month_year": month_year,
                "milk_cost": amount * 0.85,
                "delivery_cost": amount * 0.15,
                "total_amount": amount,
                "payment_method": "online",
                "upi_id": upi_id,
                "payment_status": "paid",
                "receipt_number": receipt_num,
                "paid_at": datetime.now().isoformat()
            }
            data['payments'].append(payment)

            data['notifications'].insert(0, {
                "id": f"n_{int(datetime.now().timestamp())}",
                "title": "Online UPI Payment Completed",
                "message": f"{user['name'] if user else 'Customer'} paid ₹{amount} online via UPI ({upi_id}). Receipt: {receipt_num}",
                "type": "payment",
                "is_read": False,
                "created_at": datetime.now().isoformat()
            })

            save_data(data)
            self.send_json({"message": "Online UPI Payment Successful! Digital receipt generated.", "payment": payment})
            return

        elif path == '/api/admin/payments/offline-status':
            payment_id = body.get('paymentId')
            status_val = body.get('status', 'paid')

            pay = next((p for p in data['payments'] if p['id'] == payment_id), None)
            if pay:
                pay['payment_status'] = status_val
                pay['payment_method'] = 'offline'
                if not pay.get('receipt_number'):
                    pay['receipt_number'] = f"OM-OFF-{int(datetime.now().timestamp()) % 9000 + 1000}"
                save_data(data)
                self.send_json({"message": f"Payment updated to {status_val}", "payment": pay})
            else:
                self.send_json({"error": "Payment not found"}, status=404)
            return

        self.send_json({"error": "Endpoint not found"}, status=404)

    def do_DELETE(self):
        data = load_data()
        path = urllib.parse.urlparse(self.path).path

        if path.startswith('/api/customer/cancel-date/'):
            skip_id = path.split('/')[-1]
            idx = next((i for i, c in enumerate(data['cancelled_dates']) if c['id'] == skip_id), None)
            if idx is not None:
                removed = data['cancelled_dates'].pop(idx)
                save_data(data)
                self.send_json({"message": "Cancelled date restored successfully", "data": removed})
                return
            else:
                self.send_json({"error": "Skip date not found"}, status=404)
                return

        self.send_json({"error": "Endpoint not found"}, status=404)

    def send_json(self, obj, status=200):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    print("====================================================")
    print(" [ONLINE] Organic Milk Application is starting...")
    print(f" [URL] Local Web URL: http://localhost:{PORT}")
    print("====================================================")
    with socketserver.TCPServer(("", PORT), OrganicMilkHandler) as httpd:
        httpd.serve_forever()
