# The Ember — Local Setup & Development Guide

## Prerequisites
- **Node.js**: v18+ (v22 installed)
- **Java JDK**: 21+ (Java 26 installed)
- **Apache Maven**: 3.9+ (Installed at `~/.maven/apache-maven-3.9.6`)
- **Database**: Supabase PostgreSQL (or local fallback in dev mode)

---

## 1. Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Set environment variables (optional for local dev, defaults to in-memory fallback):
   ```bash
   # Linux / macOS
   export DATABASE_URL="jdbc:postgresql://<SUPABASE_HOST>:5432/postgres?sslmode=require"
   export DATABASE_USERNAME="postgres"
   export DATABASE_PASSWORD="<YOUR_SUPABASE_PASSWORD>"
   export JWT_SECRET="<YOUR_SECURE_256_BIT_BASE64_SECRET>"
   export EMBER_ADMIN_PASSWORD="<YOUR_ADMIN_PASSWORD>"

   # Windows PowerShell
   $env:DATABASE_URL = "jdbc:postgresql://<SUPABASE_HOST>:5432/postgres?sslmode=require"
   $env:DATABASE_USERNAME = "postgres"
   $env:DATABASE_PASSWORD = "<YOUR_SUPABASE_PASSWORD>"
   $env:JWT_SECRET = "<YOUR_SECURE_256_BIT_BASE64_SECRET>"
   $env:EMBER_ADMIN_PASSWORD = "<YOUR_ADMIN_PASSWORD>"
   ```
   *Tip: You can simply copy `.env.example` to `.env` in the project root.*

3. Run Maven and start server:
   ```bash
   mvn spring-boot:run
   ```
   Server boots at `http://localhost:8080`.
   Initial seed users:
   - **Admin**: `admin@theember.com` (password configured via `EMBER_ADMIN_PASSWORD`)
   - **Customer**: `customer@theember.com` (password configured via `EMBER_CUSTOMER_PASSWORD` or registration)

---

## 2. Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already cached):
   ```bash
   npm install
   ```

3. Configure environment (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   Access the web application at `http://localhost:3000`.

---

## 3. Pre-Configured Endpoints
- **Health Check**: `GET http://localhost:8080/actuator/health`
- **Menu Items**: `GET http://localhost:8080/api/menu`
- **Categories**: `GET http://localhost:8080/api/categories`
- **Active Offers**: `GET http://localhost:8080/api/offers`
- **Customer Auth**: `POST http://localhost:8080/api/auth/login`
