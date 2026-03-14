# TaskFlow – Deploy to AWS Elastic Beanstalk (Step-by-Step Guide)

This guide walks you through deploying the TaskFlow MERN stack (Node.js + Express + React + MongoDB) on AWS Elastic Beanstalk. Each step includes a short description, commands, and a placeholder for a screenshot.

---

## Prerequisites

### Step 1: Install the AWS CLI

Install the AWS Command Line Interface so you can authenticate and manage AWS from the terminal.

**Commands:**

```bash
# macOS (Homebrew)
brew install awscli

# Or use the official installer: https://aws.amazon.com/cli/
```

**Screenshot placeholder:** [Screenshot: Terminal showing `aws --version` output.]

---

### Step 2: Configure AWS credentials

Attach your AWS account to the CLI using an access key (Create one in IAM → Users → Security credentials → Access keys).

**Commands:**

```bash
aws configure
# Enter: AWS Access Key ID, Secret Access Key, default region (e.g. us-east-1)
```

**Screenshot placeholder:** [Screenshot: Terminal during `aws configure` or IAM page showing access key created.]

---

### Step 3: Install the Elastic Beanstalk CLI

The EB CLI is used to create applications, environments, and deploy from your machine.

**Commands:**

```bash
# macOS (Homebrew)
brew install awscli
pip install awsebcli

# Or with pip only
pip install awsebcli
eb --version
```

**Screenshot placeholder:** [Screenshot: Terminal showing `eb --version` output.]

---

### Step 4: Set up MongoDB Atlas (production database)

Elastic Beanstalk does not run MongoDB. Use MongoDB Atlas as your hosted database and put its connection string in Beanstalk environment variables.

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), sign up or log in.
2. Create a free cluster (e.g. M0).
3. Create a database user (Database Access) and note the username and password.
4. Add your IP (or `0.0.0.0/0` for testing) under Network Access.
5. Click “Connect” on the cluster → “Connect your application” → copy the connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/taskflow`).

**Screenshot placeholder:** [Screenshot: MongoDB Atlas cluster overview or connection string dialog.]

---

## Prepare the application for production

### Step 5: Build the React client for production

Build the frontend so it can be served by the Node server. Use the same origin for the API so no CORS issues in production.

**Commands (run from project root):**

```bash
cd client
npm run build
cd ..
```

**Screenshot placeholder:** [Screenshot: Terminal after `npm run build` showing “built in … ms”.]

---

### Step 6: Copy the client build into the server

Elastic Beanstalk will run only the Node app. The server must serve the built React files from a folder (e.g. `server/public`).

**Commands (run from project root):**

```bash
mkdir -p server/public
cp -r client/dist/* server/public/
```

**Screenshot placeholder:** [Screenshot: File explorer or terminal showing `server/public` containing `index.html` and `assets`.]

---

### Step 7: Configure the server to serve the React app

The server must serve static files from `server/public` and return `index.html` for non-API routes (SPA fallback). This project already does that in `server/src/app.js` when `NODE_ENV=production`: it serves `express.static(../public)` and uses `GET *` to send `index.html`. Verify that `server/src/app.js` contains the production block (static + SPA fallback); no change needed if you use the provided code.

**Screenshot placeholder:** [Screenshot: Code editor showing the production block in `server/src/app.js` (static and SPA fallback).]

---

### Step 8: Set production environment variables

Your app needs at least: `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and optionally `CLIENT_URL`. Do not commit real secrets; set them in Elastic Beanstalk (Step 14). Locally you can use a `.env` file for testing the production build.

**Screenshot placeholder:** [Screenshot: Example `.env` or list of variable names (values blurred).]

---

## Create the Elastic Beanstalk application

### Step 9: Initialize the EB application in your project

From the **server** directory (the folder that has `package.json` and `server.js`), run the EB init command. This creates the `.elasticbeanstalk` config folder.

**Commands:**

```bash
cd server
eb init
```

When prompted: choose your region, create or pick an application name (e.g. `taskflow`), choose **Node.js** platform, accept or set SSH, and do not set up CodeCommit unless you use it.

**Screenshot placeholder:** [Screenshot: Terminal during `eb init` prompts or `.elasticbeanstalk/config.yml` in the project.]

---

### Step 10: Create the Elastic Beanstalk environment

Create a running environment (e.g. web server) for your application. This provisions EC2 and a load balancer.

**Commands:**

```bash
eb create taskflow-env
# Or: eb create taskflow-env --single  (for a single instance, cheaper for assignments)
```

**Screenshot placeholder:** [Screenshot: Terminal during `eb create` or EB console showing the new environment.]

---

### Step 11: Verify the environment in the AWS Console

Open the Elastic Beanstalk console and confirm the application and environment exist and are “Ok” or “Ready”.

- AWS Console → Elastic Beanstalk → Applications → your app → your environment.

**Screenshot placeholder:** [Screenshot: AWS Elastic Beanstalk console with application and environment selected.]

---

## Configure environment and deploy

### Step 12: Set environment variables in Elastic Beanstalk

Add production secrets and config (e.g. `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `CLIENT_URL` if needed) so the app can connect to MongoDB and sign tokens.

**Commands:**

```bash
eb setenv MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/taskflow" \
  JWT_ACCESS_SECRET="your-long-random-secret-min-32-chars" \
  JWT_REFRESH_SECRET="another-long-random-secret-min-32-chars" \
  NODE_ENV=production
```

Or in the console: Configuration → Software → Environment properties → Add/Edit.

**Screenshot placeholder:** [Screenshot: EB “Environment properties” section or terminal after `eb setenv`.]

---

### Step 13: Ensure the server listens on the correct port

Elastic Beanstalk sets `PORT`; your app should use `process.env.PORT`. Confirm your server uses:

```js
const PORT = process.env.PORT || 5000;
app.listen(PORT, ...);
```

No command; just verify in code.

**Screenshot placeholder:** [Screenshot: Code editor showing `process.env.PORT` in server entry file.]

---

### Step 14: Create a deployment package and deploy

Deploy the server (and the built client inside `server/public`) to Elastic Beanstalk. From the **server** directory:

**Commands:**

```bash
cd server
# Ensure client build is present in server/public (repeat Step 5–6 if needed)
eb deploy
```

**Screenshot placeholder:** [Screenshot: Terminal during `eb deploy` showing “Successfully deployed” or similar.]

---

### Step 15: Open the application URL

After a successful deploy, get the public URL and open it in a browser to confirm the app loads and can call the API.

**Commands:**

```bash
eb open
```

**Screenshot placeholder:** [Screenshot: Browser showing the TaskFlow app (login or dashboard) loaded from the EB URL.]

---

### Step 16: Check health and logs (troubleshooting)

If the app does not load or API calls fail, check environment health and logs from the CLI or the console.

**Commands:**

```bash
eb status
eb health
eb logs
```

**Screenshot placeholder:** [Screenshot: Terminal output of `eb status` or `eb logs`, or EB console “Health” / “Logs” tab.]

---

## Optional: Redeploy after code changes

### Step 17: Rebuild and redeploy after changes

When you change frontend or backend code, rebuild the client, copy into `server/public`, and deploy again.

**Commands (from project root, then server):**

```bash
cd client && npm run build && cd ..
mkdir -p server/public && cp -r client/dist/* server/public/
cd server && eb deploy
```

**Screenshot placeholder:** [Screenshot: Terminal showing full rebuild and deploy sequence.]

---

## Summary checklist

| Step | Action |
|------|--------|
| 1–3 | Install and configure AWS CLI and EB CLI |
| 4 | Create MongoDB Atlas cluster and get connection string |
| 5–6 | Build React app and copy into `server/public` |
| 7–8 | Configure Express to serve static + SPA and set env vars |
| 9–11 | `eb init`, `eb create`, verify in console |
| 12–13 | Set EB environment variables and ensure app uses `PORT` |
| 14–16 | `eb deploy`, `eb open`, check health and logs |
| 17 | Rebuild and redeploy when code changes |

---

**Screenshot placeholder:** [Screenshot: Final browser view of TaskFlow running on your Elastic Beanstalk URL.]
