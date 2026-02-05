# TeamManager Deployment Guide

Your project is a **Node.js/Express/MongoDB API** with real-time Socket.io support. Here's a step-by-step deployment guide.

---

## **Option 1: Deploy to Azure App Service (Recommended)**

### Prerequisites

- Azure account ([create free account](https://azure.microsoft.com/free))
- Azure CLI installed
- Git installed

### Step 1: Prepare Your Project

1. **Add a .gitignore file** (if not exists):

```
node_modules/
dist/
.env
.DS_Store
```

2. **Create a production build script** in package.json:

```json
"scripts": {
  "start:dev": "nodemon main.ts",
  "build": "tsc",
  "start": "node dist/main.js"
}
```

3. **Update tsconfig.json** for production:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

4. **Create a .env file** with your production variables:

```
PORT=3000
DBLINK=mongodb+srv://user:password@cluster.mongodb.net/teammanager
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### Step 2: Deploy to Azure

1. **Login to Azure**:

```bash
az login
```

2. **Create a resource group**:

```bash
az group create --name TeamManagerRG --location eastus
```

3. **Create App Service Plan**:

```bash
az appservice plan create --name TeamManagerPlan --resource-group TeamManagerRG --sku B1 --is-linux
```

4. **Create Web App**:

```bash
az webapp create --resource-group TeamManagerRG --plan TeamManagerPlan --name teammanager-api --runtime "NODE|20-lts"
```

5. **Configure environment variables**:

```bash
az webapp config appsettings set --resource-group TeamManagerRG --name teammanager-api --settings DBLINK="mongodb+srv://..." PORT=3000 JWT_SECRET="your-secret"
```

6. **Deploy from Git**:

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Configure deployment
az webapp deployment source config-zip --resource-group TeamManagerRG --name teammanager-api --src package.json

# Or use GitHub Actions (recommended)
```

---

## **Option 2: Deploy to Railway.app (Easiest)**

### Step 1: Prepare Project

- Follow Step 1 from Azure guide (build script, env variables)

### Step 2: Deploy

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway auto-detects Node.js
5. Add environment variables in Railway dashboard
6. Deploy automatically

---

## **Option 3: Deploy to Heroku (Legacy)**

### Step 1: Install Heroku CLI

```bash
npm install -g heroku
heroku login
```

### Step 2: Create Procfile

Create a file named `Procfile` in project root:

```
web: npm run build && npm start
```

### Step 3: Deploy

```bash
heroku create your-app-name
heroku config:set DBLINK="mongodb+srv://..."
git push heroku main
```

---

## **Option 4: Docker + Cloud Run (Google Cloud)**

### Step 1: Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Create .dockerignore

```
node_modules
dist
.env
.git
```

### Step 3: Deploy to Google Cloud Run

```bash
gcloud run deploy teammanager \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## **Important Configuration Checklist**

- [ ] MongoDB Atlas connection string in `.env`
- [ ] JWT secret configured
- [ ] CORS settings updated for production domain
- [ ] Email credentials configured (sendEmail.ts)
- [ ] Socket.io CORS settings for production
- [ ] Environment set to `production` in .env
- [ ] SSL/HTTPS enabled on hosting platform
- [ ] Database backups configured
- [ ] Error logging configured
- [ ] Rate limiting values appropriate

---

## **Post-Deployment Steps**

1. **Test API endpoints**:

```bash
curl https://your-app.com/api/health
```

2. **Monitor logs**:
   - Azure: `az webapp log tail --name teammanager-api`
   - Railway/Heroku: Check dashboard

3. **Set up CI/CD** (GitHub Actions):
   - Automatically deploy on push to main
   - Run tests before deployment

4. **Configure custom domain** (optional):
   - Point your domain to the app URL

---

## **Recommended Platform for You**

**Railway.app** - Best for beginners:

- Free tier with generous limits
- Auto-deploys from GitHub
- Easy environment variable management
- Good for MongoDB Atlas integration

---

## **Questions?**

Which platform would you like to deploy to?
