# TaskFlow – Deploy on EC2 with Docker Compose (Assignment Guide)

**Assignment:** Deploy the TaskFlow MERN stack (React frontend, Node.js/Express backend, MongoDB) on an AWS EC2 instance using Docker Compose. This guide uses **Ubuntu Server** and is structured for submission with placeholder slots for required screenshots.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Launch EC2 Instance](#2-launch-ec2-instance)
3. [Connect to EC2 and Install Docker](#3-connect-to-ec2-and-install-docker)
4. [Clone Repository and Configure Environment](#4-clone-repository-and-configure-environment)
5. [Build and Run with Docker Compose](#5-build-and-run-with-docker-compose)
6. [Configure Security Group and Access the App](#6-configure-security-group-and-access-the-app)
7. [Verification and Optional Seed Data](#7-verification-and-optional-seed-data)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### 1.1 AWS Account and EC2 Access

- An active AWS account.
- Basic familiarity with AWS Console (EC2, Security Groups).

**Screenshot placeholder:** [Screenshot: AWS Console logged in, showing the account name or region in the top bar.]

---

### 1.2 Local Tools (Optional)

- **Git** – to clone the repository (or upload code via SCP/SFTP).
- **SSH client** – built-in on macOS/Linux; PuTTY or Windows Terminal on Windows.

**Screenshot placeholder:** [Screenshot: Terminal showing `git --version` and `ssh -V` (or equivalent).]

---

## 2. Launch EC2 Instance

### 2.1 Create an EC2 Instance

1. In AWS Console go to **EC2** → **Instances** → **Launch instance**.
2. Set:
   - **Name:** `taskflow-app` (or any name).
   - **AMI:** **Ubuntu Server 22.04 LTS** (or 24.04 LTS).
   - **Instance type:** `t2.micro` (free tier) or `t3.small` for smoother Docker builds.
   - **Key pair:** Create new or use existing; **download the `.pem` file** and keep it secure.
   - **Network:** Default VPC (or your chosen VPC).
   - **Storage:** 8–20 GB.

3. Under **Network settings**, ensure “Allow SSH” is enabled (port 22). You will add HTTP (80) in a later step.

4. Launch the instance.

**Screenshot placeholder:** [Screenshot: EC2 Launch Instance summary page before clicking “Launch instance”, showing AMI, instance type, and key pair.]

---

### 2.2 Note Public IP and Key

- After launch, note the **Public IPv4 address** (e.g. `3.xxx.xxx.xxx`).
- Ensure you have the **private key file** (e.g. `taskflow-key.pem`) and that its permissions are set correctly before connecting.

**Screenshot placeholder:** [Screenshot: EC2 Instances list with your new instance selected, showing Public IPv4 address and instance state “Running”.]

---

## 3. Connect to EC2 and Install Docker

### 3.1 SSH into the Instance (Ubuntu)

From your local machine (replace with your key path and public IP):

```bash
chmod 400 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Screenshot placeholder:** [Screenshot: Terminal after successful `ssh` login, showing the EC2 prompt (e.g. `ubuntu@ip-172-31-xx-xx:~$`).]

---

### 3.2 Update System and Install Docker (Ubuntu)

```bash
sudo apt update -y
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Log out and log back in (or run `newgrp docker`) so the `docker` group takes effect. If you use `sudo docker compose` you can skip the re-login.

**Screenshot placeholder:** [Screenshot: Terminal showing `docker --version` and `docker compose version` after installation.]

---

### 3.3 Install Git (if not present)

```bash
sudo apt install -y git
```

**Screenshot placeholder:** [Screenshot: Terminal showing `git --version` on the EC2 instance.]

---

## 4. Clone Repository and Configure Environment

### 4.1 Clone the Project

From the home directory (or your chosen directory) on the EC2 instance:

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git eman
cd eman
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub (or Git host) details. If the repo is private, use a deploy key or HTTPS with credentials as per your setup.

**Screenshot placeholder:** [Screenshot: Terminal showing `git clone` success and `ls` inside the `eman` directory (client, server, docker-compose.yml visible).]

---

### 4.2 Create Production Environment File

Create a `.env` file in the project root (same directory as `docker-compose.yml`) with secure values:

```bash
nano .env
```

Add (replace placeholders with your EC2 public IP and strong secrets):

```env
CLIENT_URL=http://3.95.37.5
JWT_ACCESS_SECRET=eman12345
JWT_REFRESH_SECRET=eman12345
```

Save and exit (e.g. Ctrl+O, Enter, Ctrl+X in `nano`).

**Screenshot placeholder:** [Screenshot: Terminal showing `cat .env` with secrets redacted (e.g. only showing variable names and `***` for values), or nano with the three variables visible.]

---

## 5. Build and Run with Docker Compose

### 5.0 (If needed) Free port 5000

The TaskFlow backend uses port **5000**. If you see `address already in use` (e.g. another app like Flask is using 5000), free the port first.

**Find what is using port 5000:**

```bash
sudo lsof -i :5000
```

Or:

```bash
sudo ss -tlnp | grep 5000
```

Note the **PID** (process ID) from the output. Then stop that process:

```bash
sudo kill PID
```

Replace `PID` with the number (e.g. `sudo kill 1234`). If it does not exit, use `sudo kill -9 PID`.

If the app is run by systemd (e.g. a Flask or Gunicorn service), list and stop it:

```bash
sudo systemctl list-units --type=service --state=running
sudo systemctl stop SERVICE_NAME
```

Then run `docker compose up -d` again. If you prefer to keep the other app on 5000, see [Troubleshooting](#8-troubleshooting) for using a different port for TaskFlow.

**Screenshot placeholder:** [Screenshot: Terminal showing `sudo lsof -i :5000` (or `ss`) and then `sudo kill PID` before running `docker compose up -d` successfully.]

---

### 5.1 Build and Start All Services

From the project root (e.g. `~/taskflow` or `~/eman`):

```bash
sudo docker compose build --no-cache
sudo docker compose up -d
```

If your user is in the `docker` group (after `newgrp docker` or re-login), you can omit `sudo` and use `docker compose` instead.

This will:

- Build the **frontend** (React + Nginx) image.
- Build the **backend** (Node.js + Express) image.
- Pull the **MongoDB** image and start the database.
- Start frontend on port **80**, backend on port **5000**, MongoDB on **27017**.

**Screenshot placeholder:** [Screenshot: Terminal during or after `docker compose up -d`, showing “Creating … Done” for frontend, backend, and mongodb containers.]

---

### 5.2 Verify Containers Are Running

```bash
docker compose ps
```

You should see three services: `frontend`, `backend`, `mongodb`, all with state “running”. If you use `sudo` for Docker, run `sudo docker compose ps`.

**Screenshot placeholder:** [Screenshot: Output of `docker compose ps` (or `sudo docker compose ps`) showing all three services and their ports.]

---

### 5.3 Optional: View Logs

```bash
sudo docker compose logs -f
```

Press Ctrl+C to stop following. Use `docker compose logs backend` or `docker compose logs frontend` to inspect a single service.

**Screenshot placeholder:** [Screenshot: Terminal showing `docker compose logs backend` with “MongoDB connected” and “Server running on port 5000”.]

---

## 6. Configure Security Group and Access the App

### 6.1 Open HTTP (Port 80) in Security Group

1. In AWS Console go to **EC2** → **Instances** → select your instance.
2. Open the **Security** tab → click the **Security group** link.
3. **Edit inbound rules** → **Add rule**:
   - **Type:** HTTP
   - **Port:** 80
   - **Source:** Anywhere IPv4 (`0.0.0.0/0`) for assignment; restrict in production.
4. Save rules.

**Screenshot placeholder:** [Screenshot: EC2 Security Group inbound rules showing SSH (22) and HTTP (80) from 0.0.0.0/0.]

---

### 6.2 Access the Application

In a browser open:

```
http://YOUR_EC2_PUBLIC_IP
```

You should see the TaskFlow login/register page. Register a new user and use the app.

**Screenshot placeholder:** [Screenshot: Browser showing TaskFlow app at `http://YOUR_EC2_PUBLIC_IP` (login or dashboard page).]

---

### 6.3 Optional: Open Backend Port for Direct API Access

If you need to call the API directly (e.g. from Postman), add an inbound rule for **port 5000** (TCP) and use `http://YOUR_EC2_PUBLIC_IP:5000/api/...`. For a typical assignment, port 80 is sufficient.

**Screenshot placeholder:** [Screenshot: Optional – Postman or browser calling `http://YOUR_EC2_PUBLIC_IP:5000/api/...` and getting a JSON response.]

---

## 7. Verification and Optional Seed Data

### 7.1 Run Seed Script (Optional)

To load sample users and boards, run the seed script inside the backend container:

```bash
docker compose exec backend node scripts/seed.js
```

Then you can log in with `alice@example.com` or `bob@example.com` (password: `password123`).

**Screenshot placeholder:** [Screenshot: Terminal after running the seed command, showing success message; and browser logged in as one of the seed users.]

---

### 7.2 Summary Checklist

- [ ] EC2 instance launched and running.
- [ ] Docker and Docker Compose installed on EC2.
- [ ] Repository cloned; `.env` created with `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
- [ ] `docker compose up -d` completed; all three containers running.
- [ ] Security group allows HTTP on port 80 (and SSH on 22).
- [ ] Application accessible at `http://YOUR_EC2_PUBLIC_IP`.
- [ ] User registration and login work; dashboard loads.

**Screenshot placeholder:** [Screenshot: Final view of the app in the browser (e.g. dashboard with boards or a board with lists/cards).]

---

## 8. Troubleshooting

| Issue | What to check |
|------|----------------|
| Cannot SSH | Key permissions (`chmod 400 .pem`), correct user **`ubuntu`** on Ubuntu Server, Security Group allows SSH (22). |
| **Port 5000 already in use** | Another app (e.g. Flask) is using 5000. Find it: `sudo lsof -i :5000` or `sudo ss -tlnp \| grep 5000`. Stop with `sudo kill PID` or stop the service: `sudo systemctl stop SERVICE_NAME`. Then run `sudo docker compose up -d` again. To keep the other app on 5000, change TaskFlow’s backend port in `docker-compose.yml` (e.g. `5001:5000`) and in `client/nginx.conf` set `proxy_pass http://backend:5000` (container port stays 5000). |
| “Connection refused” on port 80 | Security Group must allow inbound HTTP (80). Run `sudo docker compose ps` and `sudo docker compose logs frontend`. |
| Permission denied (docker API) | Use `sudo docker compose` for all Docker commands, or add your user to the docker group: `sudo usermod -aG docker $USER`, then log out and back in (or `newgrp docker`). |
| Frontend container “Restarting” in `docker ps` | Port 80 may be in use. Check: `sudo ss -tlnp \| grep :80`. Stop the service using 80 (e.g. Apache: `sudo systemctl stop apache2`) or map frontend to another port (e.g. `8080:80` in `docker-compose.yml` and open `http://EC2_IP:8080`). View logs: `sudo docker logs taskflow-frontend-1`. |
| Frontend loads but API fails | Ensure `CLIENT_URL` in `.env` uses `http://YOUR_EC2_PUBLIC_IP` (no trailing slash). Restart: `sudo docker compose down && sudo docker compose up -d`. |
| Backend “MongoDB connection error” | Ensure `mongodb` container is running (`sudo docker compose ps`). Backend uses `MONGO_URI=mongodb://mongodb:27017/taskflow` in compose; no change needed unless you use external DB. |
| Need to rebuild after code change | On EC2: `git pull`, then `sudo docker compose build --no-cache && sudo docker compose up -d`. |

---

## Quick Reference – Commands on EC2 (Ubuntu)

Use `sudo` if your user is not in the `docker` group.

```bash
cd ~/taskflow   # or ~/eman

# If port 5000 is in use: find and stop the process
sudo lsof -i :5000
sudo kill PID

# Start
sudo docker compose up -d

# Stop
sudo docker compose down

# Rebuild and start
sudo docker compose build --no-cache && sudo docker compose up -d

# Logs
sudo docker compose logs -f
sudo docker compose logs backend
sudo docker compose logs frontend

# Seed data
sudo docker compose exec backend node scripts/seed.js
```

---

**End of deployment guide.** Replace every “Screenshot placeholder” with the corresponding screenshot for your assignment submission.
