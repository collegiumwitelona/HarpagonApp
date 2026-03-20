# HarpagonApp

## Tech Stack

- .NET 8 (ASP.NET Core)
- PostgreSQL 16
- PGAdmin 4
- Docker & Docker Compose
- Entity Framework Core
- Redis
- Mailpit(later Mailgun)

---

## Getting Started with local development

### 1 Prerequisites

Make sure you have installed:

- Docker  
- Docker Compose  

---

### 2 Environment variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```


Build and start all services:

```bash
docker compose up --build
```

 Services & URLs

- PGAdmin (PostgreSQL UI)
http://localhost:5050/

- Swagger (API docs & testing)
http://localhost:8080/swagger/index.html

- Mailpit (sending emails testing)
http://localhost:8025

## Deployment guide (Render + Mailgun + GitHub Actions)

This guide explains how to deploy the project using **Render.com**, set up **Mailgun email service**, and configure required infrastructure (PostgreSQL, Redis, API service).

---

### 1. Mailgun setup (required before deployment)

Before deploying the backend, you must configure email sending in **Mailgun**.

#### Steps:

1. Go to https://www.mailgun.com/
2. Create an account
3. Add and verify your domain (e.g. a domain purchased from **Namecheap**)
4. Follow Mailgun’s built-in domain setup instructions:
   - DNS records (TXT, MX, CNAME) must be added in Namecheap DNS settings
   - Wait for domain verification

5. After verification:
   - Go to **API Keys**
   - Copy your **Private API Key**
   - Save it securely — you will need it later as `MAILGUN_API_KEY`

---

### 2. Render infrastructure setup

We will use `render.yaml` to automatically create services.

#### Services created:
- PostgreSQL database
- Redis instance
- API backend service

---

### 3. Deploying via render.yaml

1. Push your project to GitHub
2. Connect repository to Render:
   - https://dashboard.render.com/

3. Render will detect `render.yaml`
4. It will automatically create:
   - PostgreSQL
   - Redis
   - API service

---

### 4. API environment variables

After the API service is created in Render, go to:

**Render Dashboard → Your API Service → Environment**

Set the following variables:

MAILGUN_API_KEY=your_mailgun_api_key_here
Frontend__Url=https://your-frontend-domain.com
Jwt__SecretKey=your_secure_jwt_secret

#### Notes:
- `MAILGUN_API_KEY` → from Mailgun (step 1)
- `Frontend__Url` → URL of your frontend
- `Jwt__SecretKey` → long random secure string (use password generator)

---

### 5. Disable auto-deploy (important)

To prevent unwanted redeployments:

1. Go to your API service in Render
2. Open **Settings**
3. Disable **Auto-Deploy**

---

### 6. Create Deploy Hook (for manual deployments)

1. In Render:
   - Go to your API service
   - Open **Settings**
   - Find **Deploy Hook URL**
   - Copy it

---

### 7. GitHub Actions secrets configuration

1. Go to your GitHub repository
2. Navigate to:

Settings → Secrets and variables → Actions

3. Add a new secret:

RENDER_DEPLOY_HOOK_URL = <your deploy hook url>

---

### 8. How deployment works now

After setup:

- Push to GitHub does NOT auto-deploy
- Deployment is triggered manually via:
  - GitHub Actions (using deploy hook)
  - or direct Render deploy hook call

---

### 9. Checklist

- [ ] Domain added in Mailgun (Namecheap DNS configured)
- [ ] Mailgun API key saved
- [ ] render.yaml pushed to GitHub
- [ ] PostgreSQL created
- [ ] Redis created
- [ ] API deployed
- [ ] Environment variables set
- [ ] Auto-deploy disabled
- [ ] Deploy hook saved in GitHub Secrets

---

### Done 🎉

Your backend is now fully configured for deployment on Render.