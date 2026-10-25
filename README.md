# ✦ THE EMBER — Luxury 3D Restaurant & Online Ordering Platform

<p align="center">
  <strong>An ultra-luxury dining experience and full-stack gourmet ordering platform.</strong><br>
  Built with Next.js 16, React 19, Tailwind CSS v4, Three.js, and Java Spring Boot 3.3.4.
</p>

---

## ✦ Key Highlights & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| **Styling & Design System** | Tailwind CSS v4, Vanilla CSS Custom Properties, Google Fonts (*Cinzel* & *Plus Jakarta Sans*) |
| **3D & Visual FX** | Three.js (Interactive rotating hero platter with ambient embers & dynamic lighting) |
| **State & Navigation** | React Context (Cart & session persistence), Framer Motion-inspired micro-interactions |
| **Backend Engine** | Spring Boot 3.3.4, Java 21/26, Spring Security 6, Spring Data JPA |
| **Authentication** | Stateless JWT (Json Web Token) with Bearer token authentication & BCrypt password hashing |
| **Database** | H2 In-Memory (Zero-config local development) & PostgreSQL / Supabase production support |
| **Database Migrations** | Flyway schema migrations (`V1__init_schema.sql`, `V2__seed_data.sql`) |

---

## ✦ User Accounts & Administration

Authentication roles are structured into customer access and administrator governance:

| Role | Email Address | Password Configuration | Permissions |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@theember.com` | Configured via registration or local `.env` | Browse menu, cart, checkout, view live order history, profile |
| **Administrator** | `admin@theember.com` | Set via `EMBER_ADMIN_PASSWORD` in `.env` | Admin Control Center, live metrics, menu CRUD, order status management |

*Note: Quick role prefill helpers are available directly on the login screen (`/`).*

---

## ✦ Instant Startup

### Option A: One-Click Launch (Windows PowerShell)
Run the launcher script located in the project root:
```powershell
.\start-all.ps1
```
This opens two independent PowerShell windows:
1. **Backend Server**: Starts Spring Boot on `http://localhost:8080`
2. **Frontend Server**: Starts Next.js on `http://localhost:3000`

---

### Option B: Individual Launchers

#### 1. Backend (Spring Boot)
```powershell
.\start-backend.ps1
```
*Or manually:*
```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.1"
mvn spring-boot:run
```
- API Base URL: `http://localhost:8080/api`
- Actuator Health: `http://localhost:8080/actuator/health`

#### 2. Frontend (Next.js)
```powershell
.\start-frontend.ps1
```
*Or manually:*
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:3000`

---

## ✦ Application Features & Tour

### 1. Customer Experience
- **Cinematic Split-Screen Login (`/`)**: High-contrast dark charcoal `#080808`, ember orange `#FF9F43`, and gold `#D9A441` palette with tabs for Customer Sign-In, Admin Portal, and New Account Registration.
- **Hero & Storytelling (`/home`)**: Interactive 3D platter rendering, restaurant introduction, curated Chef's Specialities carousel, and active promo discounts.
- **Interactive Menu (`/menu`)**: Real-time category filtering (Starters, Main Course, Biryani, Breads, Desserts, Beverages), Veg / Non-Veg toggle, dynamic live search, and sorting by rating/price.
- **Food Detail Modal**: Ingredients list, dietary tags, spice intensity indicator, and customizable notes before adding to order.
- **Cart & Slide-Out Drawer**: Instant calculations, tax & delivery estimation, item counter, and fast navigation to checkout.
- **Gourmet Checkout (`/checkout`)**: Delivery address selection, discount voucher application (e.g., `EMBERWELCOME`, `ROYAL50`), payment mode (Cash on Delivery, UPI, Cards), and order placement.
- **Live Order Tracking (`/orders`)**: Real-time progress bar (Placed → Preparing → Out for Delivery → Delivered) with live time-stamps.
- **About The Ember (`/about`)**: Story of Chef Arjun Mehta, wood-fired hearth philosophy, and dining ambiance showcase.
- **Gourmet Gallery (`/gallery`)**: High-resolution gallery featuring signature dishes and interior decor.
- **Exclusive Offers (`/offers`)**: Copy-to-clipboard coupon cards with discounts up to 50%.
- **Customer Profile (`/profile`)**: Manage saved addresses, order history count, and profile preferences.

### 2. Admin Control Center (`/admin`)
- **Executive Dashboard**: Real-time analytics, revenue trajectory graphs, order volume, and customer growth statistics.
- **Menu Management CRUD**: Full control over menu items — toggle item availability, adjust pricing, edit spice level, and create new culinary offerings.
- **Live Orders Stream**: View incoming customer orders, inspect item details, and transition order states (*Preparing*, *Dispatched*, *Delivered*).
- **Audit Logs & Security**: Track administrative activity and access logs.

---

## ✦ Project Architecture

```
Restaurant/
├── backend/
│   ├── src/main/java/com/theember/
│   │   ├── config/            # SecurityConfig, CorsConfig, DataInitializer
│   │   ├── controller/        # Auth, Menu, Order, Offer, Admin, Customer, Contact
│   │   ├── dto/               # Request/Response data transfer objects
│   │   ├── entity/            # JPA Entities (User, MenuItem, Order, OrderItem, Offer, etc.)
│   │   ├── repository/        # Spring Data JPA Repositories
│   │   ├── security/          # JwtUtils, AuthTokenFilter, UserDetailsServiceImpl
│   │   └── service/           # Business logic layer
│   ├── src/main/resources/
│   │   ├── db/migration/      # Flyway SQL schema and seed files
│   │   └── application.yml    # Database, JWT, Razorpay, CORS configurations
│   └── pom.xml                # Maven configuration (Spring Boot 3.3.4, Java 21 compiler)
│
├── frontend/
│   ├── app/                   # Next.js App Router (pages: /, home, menu, orders, checkout, admin, etc.)
│   ├── components/            # Luxury UI Components (Navbar, FoodCard, CartDrawer, ThreeDishHero, etc.)
│   ├── lib/                   # API client (JWT handling), CartContext state
│   ├── public/images/         # Ultra-sharp food, chef, and ambiance photography
│   ├── next.config.ts         # Turbopack and static asset optimizations
│   └── package.json           # Dependencies and scripts
│
├── docs/                      # Architectural, Security, and Deployment blueprints
├── start-all.ps1              # One-click dual-server launcher
├── start-backend.ps1          # Backend server launcher
├── start-frontend.ps1         # Frontend server launcher
└── README.md                  # This file
```

---

## ✦ API Reference Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate customer or admin, return JWT | No |
| `POST` | `/api/auth/register` | Register new customer account | No |
| `GET` | `/api/menu` | List all menu items with category & rating | No |
| `GET` | `/api/menu/featured` | Fetch top-rated chef specialties | No |
| `GET` | `/api/categories` | Retrieve all active menu categories | No |
| `GET` | `/api/offers` | Retrieve valid promotional coupons | No |
| `POST` | `/api/orders` | Place a new customer order | Yes (Bearer JWT) |
| `GET` | `/api/orders/my-orders`| Fetch order history for authenticated user | Yes (Bearer JWT) |
| `GET` | `/api/admin/dashboard` | Executive KPIs and analytics data | Yes (ADMIN) |
| `POST` | `/api/admin/menu` | Create a new menu item | Yes (ADMIN) |
| `PUT` | `/api/admin/menu/{id}` | Update existing dish attributes | Yes (ADMIN) |
| `DELETE` | `/api/admin/menu/{id}`| Remove a menu item | Yes (ADMIN) |
| `PUT` | `/api/admin/orders/{id}/status` | Advance order preparation status | Yes (ADMIN) |

---

## ✦ Production Deployment (Supabase & Cloud)

1. **Database**: Provision a PostgreSQL instance on [Supabase](https://supabase.com).
2. **Backend**: Deploy the Spring Boot `.jar` to AWS Elastic Beanstalk, Render, or Railway with:
   - `DATABASE_URL`: `jdbc:postgresql://<SUPABASE_HOST>:5432/postgres`
   - `DATABASE_USERNAME`: `postgres`
   - `DATABASE_PASSWORD`: `<PASSWORD>`
   - `JWT_SECRET`: 256-bit secure key
3. **Frontend**: Deploy the `frontend/` folder to [Vercel](https://vercel.com) with:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-domain.com/api`

---

<p align="center">
  Crafted with passion for <strong>The Ember</strong> — <em>Good Food. Better Moments.</em>
</p>
