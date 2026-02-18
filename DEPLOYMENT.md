# 🚀 Deployment Guide - Production Ready

## Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration (comma-separated list of allowed origins)
ALLOWED_ORIGINS=https://pixalbotics.com,https://www.pixalbotics.com

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Email Configuration
EMAIL_USER=info@pixalbotics.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM_NAME=Pixal Botics
SMTP_HOST=mail.pixalbotics.com
SMTP_PORT=465
SMTP_SECURE=true

# JWT Secret
JWT_SECRET=your_strong_jwt_secret_key_here

# Keep-Alive Configuration (for Render - prevents server from sleeping)
RENDER_EXTERNAL_URL=https://your-app.onrender.com
KEEP_ALIVE_INTERVAL=300000

# Persistent uploads on Render (optional – use Cloudinary instead, see below)
# UPLOADS_BASE_PATH=/data

# Cloudinary – images & PDFs (recommended for Render)
# Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# CLOUDINARY_URL=cloudinary://xxx:xxx@xxx
```

## Render.com Deployment

### Step 1: Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the `pixal` repository

### Step 2: Configure Build Settings
- **Name**: `pixal-api` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Choose your plan (Free tier available)

### Step 3: Set Environment Variables
Add all environment variables from the `.env` example above in Render's Environment Variables section.

**Important for Keep-Alive:**
- Set `RENDER_EXTERNAL_URL` to your Render service URL (e.g., `https://pixal-api.onrender.com`)
- The server will automatically ping itself every 5 minutes to prevent sleeping

### Step 4: Deploy
Click "Create Web Service" and wait for deployment to complete.

## CORS Configuration

The server now uses production-ready CORS configuration:

- **Allowed Origins**: Set via `ALLOWED_ORIGINS` environment variable (comma-separated)
- **Default**: `https://pixalbotics.com,https://www.pixalbotics.com`
- **Development**: All origins allowed when `NODE_ENV=development`
- **Production**: Only specified origins allowed

## Keep-Alive Mechanism

The server includes automatic keep-alive functionality to prevent Render from putting it to sleep:

1. **External URL Method** (Recommended):
   - Set `RENDER_EXTERNAL_URL` environment variable
   - Server will ping itself via external URL every 5 minutes

2. **Internal Method** (Fallback):
   - If no external URL is set, server pings itself internally
   - Works but less effective for preventing sleep

3. **Custom Interval**:
   - Set `KEEP_ALIVE_INTERVAL` (in milliseconds)
   - Default: 300000 (5 minutes)

## Health Check Endpoints

- **Health Check**: `GET /health` - Returns server status
- **Keep-Alive Ping**: `GET /ping` - Returns pong response

## Production Checklist

- [ ] All environment variables set
- [ ] CORS origins configured correctly
- [ ] MongoDB connection string verified
- [ ] Email SMTP settings tested
- [ ] JWT secret is strong and secure
- [ ] Keep-alive URL configured (for Render)
- [ ] Persistent Disk added on Render + `UPLOADS_BASE_PATH=/data` set (so images survive redeploys)
- [ ] Server tested and running
- [ ] API documentation accessible at `/api-docs`

## Troubleshooting

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your frontend domain
- Check that frontend is sending requests from allowed origin
- Ensure `credentials: true` is set in frontend fetch/axios config

### Server Sleeping on Render
- Verify `RENDER_EXTERNAL_URL` is set correctly
- Check logs for keep-alive ping messages
- Consider upgrading to paid plan (no sleep on paid plans)

### Email Not Sending
- Verify SMTP credentials
- Check SMTP_HOST and SMTP_PORT
- Test with `node test-email.js` locally first

## Security Notes

- Never commit `.env` file to repository
- Use strong JWT secret (minimum 32 characters)
- Keep CORS origins restricted to your domains only
- Regularly update dependencies for security patches
