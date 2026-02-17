# How to Deploy Backend to Render

Follow these steps to deploy your Node.js backend to Render.

## 1. Create a New Web Service
1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click on **New +** and select **Web Service**.
3.  Connect your GitHub repository: `abinash818/astrocric`.

## 2. Configure the Service
Fill in the details as follows:

-   **Name:** `astrocric-backend` (or any name you prefer)
-   **Region:** Select the region closest to you (e.g., Singapore or Frankfurt).
-   **Branch:** `master`
-   **Root Directory:** `backend` (⚠️ Important: Do not start with `/`)
-   **Runtime:** `Node`
-   **Build Command:** `npm install`
-   **Start Command:** `node server.js`

## 3. Environment Variables
You need to add the environment variables from your local `.env` file.
Go to the **Environment** tab in your new service setup or "Environment Variables" section.

Click **Add Environment Variable** for each key-value pair:

| Key | Value (Copy from your local .env) |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(Your NeonDB URL)* |
| `JWT_SECRET` | *(Your Secret)* |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_JWT_SECRET` | *(Your Admin Secret)* |
| `PHONEPE_MERCHANT_ID` | ... |
| `PHONEPE_SALT_KEY` | ... |
| `PHONEPE_SALT_INDEX` | ... |
| `PHONEPE_API_URL` | ... |
| `CRICKET_API_KEY` | ... |
| `CRICKET_API_URL` | ... |
| `MSG91_AUTH_KEY` | ... |
| `MSG91_SENDER_ID` | `ASTRO9` |
| `MSG91_TEMPLATE_ID` | `69247b237ae90826a21c51fa` |
| `MSG91_ROUTE` | `4` |
| `ALLOWED_ORIGINS` | `*` (or your frontend URL) |

**Note:**
-   For `API_BASE_URL` in your frontend app (mobile or web), you will use the URL provided by Render (e.g., `https://astrocric-backend.onrender.com`).
-   You do NOT need to set `PORT` variable manually; Render sets it automatically.

## 4. Deploy
Click **Create Web Service**. Render will start building and deploying your application.
You can monitor the logs in the "Logs" tab.

Once deployed, you will see a green "Live" badge.
