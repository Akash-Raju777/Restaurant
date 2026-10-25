# The Ember — Production Deployment Guide

## 1. Supabase PostgreSQL Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Retrieve your database connection URI under **Project Settings -> Database**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
3. Run the migrations in `backend/src/main/resources/db/migration/`:
   - `V1__init_schema.sql` (Creates relational tables and indexes)
   - `V2__seed_ember_data.sql` (Initial luxury dishes, offers, admin account)

---

## 2. Deploying Backend (Spring Boot on Render / Railway / AWS)
1. Build the self-contained executable JAR:
   ```bash
   mvn clean package -DskipTests
   ```
2. Set Environment Variables:
   ```env
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=jdbc:postgresql://db.[YOUR-REF].supabase.co:5432/postgres
   DATABASE_DRIVER=org.postgresql.Driver
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=[YOUR-SUPABASE-PASSWORD]
   JWT_SECRET=[GENERATE-STRONG-64-BYTE-BASE64-KEY]
   EMBER_ADMIN_EMAIL=admin@theember.com
   EMBER_ADMIN_PASSWORD=[SECURE-ADMIN-PASS]
   RAZORPAY_KEY_ID=[LIVE-KEY-ID]
   RAZORPAY_KEY_SECRET=[LIVE-KEY-SECRET]
   ```
3. Dockerfile (if deploying as container):
   ```dockerfile
   FROM eclipse-temurin:21-jre-alpine
   WORKDIR /app
   COPY target/the-ember-backend-1.0.0.jar app.jar
   EXPOSE 8080
   ENTRYPOINT ["java", "-jar", "app.jar"]
   ```

---

## 3. Deploying Frontend (Next.js on Vercel)
1. Push repository to GitHub/GitLab.
2. Import project into [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Configure Environment Variable:
   ```env
   NEXT_PUBLIC_API_URL=https://[YOUR-DEPLOYED-BACKEND-URL]/api
   ```
5. Deploy. Vercel automatically creates Edge caching, SSL certificates, and optimized image compression.
