# Notes Web Application

A full-stack Markdown notes application built with **Next.js**, **NestJS**, and **PostgreSQL**. The complete application runs using Docker Compose.

## Tech Stack

- **Frontend:** Next.js
- **Backend:** NestJS
- **Database:** PostgreSQL
- **Containerization:** Docker & Docker Compose
- **Email:** SMTP
- **Notes:** Markdown (MD)

## Features

### User

- Register and verify email
- Login / logout
- Manage account
- Create, view, edit, and delete notes
- Mark notes as favourite
- Write and view notes in Markdown

### Admin

- All normal user features
- Ban users
- Delete users

## Project Structure

```text
notes-app/
├── frontend/          # Next.js application
├── backend/           # NestJS API
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuration

Create the environment file:

```bash
cp .env.example .env
```

Configure the following in `.env`:

- PostgreSQL credentials
- SMTP server credentials
- Admin credentials
- Application secrets

A valid SMTP configuration is required for email verification.

**Do not commit `.env` or other secrets to Git.**

## Run with Docker Compose

From the project root:

```bash
docker compose up --build
```

To run in the background:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

> PostgreSQL data is stored in a Docker volume. To remove the database volume and its data, run `docker compose down -v`.

## Docker Services

```text
Docker Compose
├── Frontend → Built from frontend/Dockerfile
├── Backend  → Built from backend/Dockerfile
└── PostgreSQL → Docker Hub image
```

The frontend and backend images are built from the project's Dockerfiles, while PostgreSQL is pulled from Docker Hub.

## Future Enhancement

- Support image uploads for Markdown notes and embedded images.
