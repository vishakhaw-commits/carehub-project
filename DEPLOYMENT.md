# CareHub Deployment

This project has two deployable apps:

- `carehub`: React frontend
- `carehub-backend`: Express API connected to MySQL

## 1. Create A Hosted MySQL Database

Use any hosted MySQL provider, such as Aiven, Railway, PlanetScale, DigitalOcean, or another managed MySQL host.

Create/import the schema from:

```text
carehub/carehub_vishakha.sql
```

Keep these values ready for the backend service:

```text
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=carehub_vishakha
```

## 2. Deploy Backend

Recommended service: Render Web Service.

Settings:

```text
Root Directory: carehub-backend
Build Command: npm install
Start Command: npm start
Health Check Path: /api/health
```

Environment variables:

```text
PORT=10000
CORS_ORIGIN=https://your-frontend-domain.vercel.app
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=carehub_vishakha
RAZORPAY_KEY_ID=your_live_or_test_key
RAZORPAY_KEY_SECRET=your_live_or_test_secret
```

After deployment, confirm:

```text
https://your-backend-domain.onrender.com/api/health
```

It should return:

```json
{ "status": "ok" }
```

## 3. Deploy Frontend

Recommended service: Vercel.

Settings:

```text
Root Directory: carehub
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
```

Environment variables:

```text
REACT_APP_API_BASE_URL=https://your-backend-domain.onrender.com
```

After the frontend URL is created, update the backend `CORS_ORIGIN` value to that exact frontend URL and redeploy the backend.

## 4. Local Development

Backend:

```bash
cd carehub-backend
npm start
```

Frontend:

```bash
cd carehub
npm start
```

Local defaults still point the frontend to `http://localhost:5000`.
