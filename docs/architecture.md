# The Ember Luxury Restaurant Architecture Documentation

## Overview
**The Ember** is a production-oriented, luxury 3D restaurant and online food ordering platform replicating fine-dining charcoal craftsmanship.

---

## 1. System Components

```
+--------------------------------------------------------------+
|               Next.js App Router Frontend (Port 3000)        |
|  - Three.js / React Three Fiber (3D Embers & Platter)        |
|  - Split-screen Authentication (Customer vs Admin)           |
|  - Food Catalog, Ingredients, Spice Customization            |
|  - Cart Management, Delivery Addresses, Checkout             |
|  - Admin Dashboard, Menu & Offer Management, Order Lifecycle |
+------------------------------+-------------------------------+
                               |  HTTP / REST (JWT Bearer)
                               v
+--------------------------------------------------------------+
|            Java Spring Boot 3.3 REST Backend (Port 8080)     |
|  - Spring Web Layer (Controllers + Bean Validation)          |
|  - Spring Security 6 (Stateless JWT + BCrypt + Role RBAC)    |
|  - Business Services Layer (Order, Menu, Offer, Payment)     |
|  - Data Access Layer (Spring Data JPA Repositories)          |
|  - Actuator (Restricted Health & Metrics Endpoints)          |
+------------------------------+-------------------------------+
                               |  JDBC / Hibernate ORM
                               v
+--------------------------------------------------------------+
|              Supabase PostgreSQL Database                    |
|  - Users, Roles, Addresses                                   |
|  - Categories, Menu Items, Ingredients, Spice Levels         |
|  - Offers, Combo Rules, Expiry Dates                         |
|  - Orders, Order Items (Historical Snapshot), Audit Logs     |
+--------------------------------------------------------------+
```

---

## 2. Layered Architecture

### Backend (Spring Boot 3.3.4 + Java 21/26)
1. **Controller Layer**: Exposes secure REST endpoints with DTO validation (`@Valid`), HTTP status codes, and error responses.
2. **Security Layer**: `SecurityConfig` enforces stateless session policies, CORS whitelist, and role-based guards (`hasRole('ADMIN')`, `hasRole('CUSTOMER')`). `AuthTokenFilter` validates HS256 JWT tokens on every inbound request.
3. **Service Layer**: Handles core domain logic. Recalculates all order pricing against database records, enforces valid order transitions (`PLACED` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`), and validates coupon discounts.
4. **Data Access Layer**: JPA repositories utilizing parameterized queries protecting against SQL injection.
5. **Database Initialization**: `DataInitializer` seeds exact luxury dishes, categories, offers, and administrative accounts seamlessly.

---

## 3. Frontend (Next.js 16 + React 19 + Tailwind CSS)
1. **App Router**:
   - `/`: Entry authentication split screen with Customer and Admin separation.
   - `/home`: Cinematic 3D interactive hero, signature dishes, category showcase.
   - `/menu`: Category pills, search, diet filter, price sorting, food details modal.
   - `/checkout`: Address selection, coupon application, COD / UPI modes.
   - `/orders`: Customer real-time order history, tracking stepper, cancellation.
   - `/offers`: Active deals with 1-click coupon code copying.
   - `/about`: Chef Arjun portrait, philosophy, 4 luxury pillars.
   - `/gallery`: High-resolution kitchen and ambience photography.
   - `/contact`: Concierge contact form and restaurant location details.
   - `/profile`: Saved addresses, account details, password updates.
   - `/admin`: Overview statistics, revenue calculation, menu CRUD, order transitions, customer controls.
2. **3D Experience**:
   - Hardware-accelerated Three.js canvas featuring floating amber embers and responsive mouse parallax.
   - Automatic reduction of particle density on low-power devices and `prefers-reduced-motion`.
