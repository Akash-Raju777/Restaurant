# The Ember — Security Architecture & Production Hardening Guide

## 1. Authentication & Session Security
- **Algorithm**: Passwords hashed using **BCrypt** with automatic salt generation (`BCryptPasswordEncoder`).
- **Token Signing**: Stateless JWT signed via HMAC-SHA256 (`Keys.hmacShaKeyFor`) with an externally managed `JWT_SECRET`.
- **Role Isolation**: Strict separation between `ROLE_ADMIN` and `ROLE_CUSTOMER`.
  - Admin endpoints (`/api/admin/**`) are safeguarded by `@PreAuthorize("hasRole('ADMIN')")`.
  - Roles supplied by client payloads are ignored during registration (all public self-registrations default strictly to `ROLE_CUSTOMER`).
  - No public endpoint allows self-promotion to `ROLE_ADMIN`.

---

## 2. API & Endpoint Hardening
- **Input Validation**: Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@DecimalMin`, `@Email`) on all request DTOs.
- **SQL Injection Prevention**: Parameterized database queries through Spring Data JPA / Hibernate ORM.
- **CORS Protection**: Whitelist only trusted frontend origins:
  - `http://localhost:3000` (Local dev)
  - `http://127.0.0.1:3000`
  - Explicit production domain (e.g. `https://theember.vercel.app`)
  - Wildcard origins (`*`) are disallowed with credentials.
- **Actuator Security**: Actuator endpoints are restricted to `health` and `info` only. Sensitive actuator metrics and env variables are blocked.

---

## 3. Financial & Order Data Integrity
- **Server-Side Price Recalculation**: The frontend is treated as an untrusted client. When orders are created via `POST /api/orders`, unit prices, subtotals, coupon percentage math, and item availability are looked up directly from database records.
- **Coupon Validation**: Offers verify start date, expiration date, active status, minimum order requirement, and maximum discount caps on the backend.
- **Order State Transitions**: Strict validation prevents illegal state transitions (e.g., delivered orders cannot be cancelled).
- **Payment Verification**: UPI/Razorpay integration architecture requires server-side HMAC signature verification (`razorpay_signature` validation).

---

## 4. Production Checklist
- [x] Rotate `JWT_SECRET` in environment variables before production launch.
- [x] Configure SSL/TLS (HTTPS) terminates at Vercel (frontend) and Cloud Provider (backend).
- [x] Enforce rate limiting on `/api/auth/login` (via Cloudflare or reverse proxy NGINX).
- [x] Connect live Razorpay production keys in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- [x] Configure automated database backups on Supabase PostgreSQL dashboard.
