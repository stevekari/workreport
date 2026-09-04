# Deployment Guide: Render & Docker for SteveFlow

This guide explains how to deploy **SteveFlow** on **Render.com** to get a public URL you can share with others, as well as how to run the full stack with **Docker** and **Docker Compose**.

---

## 1. Deploying on Render (Free Public URL)

Render allows you to host the application online for free so anyone can access it via a link (e.g., `https://steveflow.onrender.com`).

### Method A: Single-Container Full-Stack (Recommended & Simplest)

1. **Push your code to GitHub / GitLab**.
2. Go to [https://render.com](https://render.com) and log in.
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `steveflow` (or your chosen name)
   - **Language / Runtime**: **Docker**
   - **Dockerfile Path**: `./Dockerfile` (the root Dockerfile)
   - **Docker Context**: `.`
   - **Instance Type**: **Free**
   - **Region**: Choose closest to you (e.g. Frankfurt, Oregon, Ohio)
6. Add Environment Variables (under **Advanced**):
   - `PORT`: `8080`
   - `JWT_SECRET`: Generate a random string (e.g. `my-secure-jwt-key-9284719472`)
7. (Optional for data persistence):
   - Add a **Disk** under Advanced:
     - **Name**: `steveflow-data`
     - **Mount Path**: `/app/data`
     - **Size**: `1 GB`
8. Click **Create Web Service**.
9. Once the build finishes (takes ~2 minutes), Render will give you a public URL like:
   `https://steveflow.onrender.com`
   You can share this link directly with workers and clients!

---

### Method B: Deploy using Blueprint (`render.yaml`)

1. Push your repository containing `render.yaml` to GitHub.
2. In Render, click **New +** → **Blueprint**.
3. Connect your repository.
4. Render will read `render.yaml` and set up the `steveflow-app` service and persistent disk automatically.
5. Click **Apply**.

---

## 2. Running Locally with Docker Compose

If you have Docker Desktop installed, you can spin up the full stack locally with one command:

```bash
# Build and run backend + frontend
docker compose up --build

# Or run in background
docker compose up -d
```

- **Frontend**: [http://localhost:5173](http://localhost:5173) (or [http://localhost:80](http://localhost:80))
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **H2 Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:file:./data/steveflow`)

To stop the containers:
```bash
docker compose down
```

---

## 3. Testing Single Full-Stack Container Locally

To test the single container build before pushing to Render:

```bash
docker build -t steveflow:latest .
docker run -p 8080:8080 -e PORT=8080 steveflow:latest
```

Open [http://localhost:8080](http://localhost:8080) in your browser. Both frontend and backend will be running together smoothly on port 8080!
