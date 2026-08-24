# WorkFlow Pro — Enterprise Employee & Task Management System

[![CI Pipeline](https://github.com/organization/workflow-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/organization/workflow-pro/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker)](https://www.docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)

**WorkFlow Pro** is a full-stack, enterprise-grade multi-tenant SaaS platform engineered for organizational workforce management, project execution, time tracking, leave approvals, and executive analytics.

---

## 1. Features & Architecture Overview

### 🏢 Multi-Tenant Enterprise Core
- **Company-Level Tenant Isolation**: Every entity belongs to a `company_id`. Strict query filters and foreign keys prevent cross-tenant data leakage.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for `admin`, `manager`, and `employee` roles.
- **JWT Authentication & Security**: Stateless bearer tokens, bcrypt password hashing, and active session validation.

### 📦 Completed Business Modules
1. **Authentication & Identity**: Tenant registration, login, JWT issuance, password reset, and profile management.
2. **Employee Directory**: Profile tracking, role management, department assignment, and status controls.
3. **Department Organization**: Department hierarchy, managerial oversight, and headcount aggregation.
4. **Project Pipeline**: Project lifecycle management (Planning, Active, On Hold, Completed), department associations, and budget tracking.
5. **Task Management & Kanban**: Priority matrix (Low, Medium, High, Urgent), status progression (Todo, In Progress, In Review, Completed), auto-timestamping (`completed_at`), and real-time assignee notifications.
6. **Leave Management**: Annual, Sick, and Unpaid leave requests with multi-level approval workflows and audit trails.
7. **Attendance & Time Tracking**: Daily check-in/check-out, working minutes calculation, grace period tolerance, and monthly summaries.
8. **In-App Notification Center**: Instant alert popovers, unread count badges, auto-generated events for task assignments and leave reviews.
9. **Real-Time Analytics Dashboard**: Live metrics, task distribution charts, project progress meters, department workforce distributions, and digital timecard.
10. **Global Search**: Debounced, case-insensitive multi-category search across Employees, Departments, Projects, and Tasks with RBAC masking.
11. **Enterprise Excel Reports**: Openpyxl `.xlsx` exports for Employee directories, Project pipelines, Task breakdowns, and Attendance logs.

---

## 2. Technology Stack

```
┌───────────────────────────────────────────────────────────┐
│                    Frontend (SPA)                         │
│   React 18 • TypeScript • Vite • Tailwind CSS • Lucide    │
│            TanStack Query • React Router v6               │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP / JSON (REST API)
┌─────────────────────────────▼─────────────────────────────┐
│                    Backend API                            │
│    FastAPI • Python 3.12 • Pydantic v2 • SQLAlchemy 2.0   │
│             Alembic • Pytest • Structured Logging         │
└─────────────────────────────┬─────────────────────────────┘
                              │ SQL (ACID)
┌─────────────────────────────▼─────────────────────────────┐
│                    Database & Cache                       │
│             PostgreSQL 16 • Named Volumes                 │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
workflow-pro/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI pipeline
├── backend/
│   ├── alembic/
│   │   └── versions/              # Migration scripts (base -> 562f5aa37a21)
│   ├── app/
│   │   ├── api/                   # REST API routes (v1 & health)
│   │   ├── auth/                  # JWT and authentication dependencies
│   │   ├── core/                  # Config, security, logging
│   │   ├── db/                    # Session & Base ORM models
│   │   ├── middleware/            # Error handling & request logging
│   │   ├── models/                # SQLAlchemy database models
│   │   ├── repositories/          # Database query abstractions
│   │   ├── schemas/               # Pydantic validation models
│   │   ├── services/              # Domain business logic
│   │   ├── tests/                 # Pytest test suite (65 tests)
│   │   └── main.py                # FastAPI application entrypoint
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile                 # Backend production container
│   ├── requirements.txt
│   └── test_e2e.py                # Comprehensive full-stack E2E test script
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios API clients
│   │   ├── components/            # Reusable UI & layout components
│   │   ├── contexts/              # Auth & global state providers
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── pages/                 # Full feature views (Dashboard, Tasks, etc.)
│   │   ├── routes/                # Client-side router configuration
│   │   └── types/                 # TypeScript interfaces
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile                 # Multi-stage production build (Node + Nginx)
│   ├── nginx.conf                 # SPA routing & caching configuration
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── docker-compose.yml             # Full-stack orchestrator (db, backend, frontend)
└── README.md
```

---

## 4. Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ (or use Docker for database only)

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Apply database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at: `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env

# Start Vite dev server
npm run dev
```
Frontend will be available at: `http://localhost:5173`.

---

## 5. Docker & Docker Compose Setup

Run the entire full-stack application with a single command:

```bash
# Build and launch PostgreSQL, FastAPI backend, and React frontend
docker compose up --build
```

### Services Started:
| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:5173](http://localhost:5173) | Nginx Alpine serving React SPA |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | FastAPI with Uvicorn |
| **Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI documentation |
| **Database** | `localhost:5432` | PostgreSQL 16 (persistent named volume) |

### Shutting Down:
```bash
# Stop containers without losing data
docker compose down

# Stop containers and wipe database volume
docker compose down -v
```

---

## 6. Testing & Quality Assurance

### Backend Tests (Pytest)
```bash
cd backend
pytest -v
```
*Expected: 65 / 65 passed (100%).*

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```
*Expected: 24 / 24 passed (100%).*

### Production Frontend Build
```bash
cd frontend
npm run build
```
*Expected: 0 errors.*

### End-to-End Test Suite (E2E)
```bash
cd backend
python test_e2e.py
```
*Expected: E2E TEST PASSED SUCCESSFULLY across all 33 full-stack validation steps.*

---

## 7. Database Migration Lineage

Alembic migrations track the full schema evolution:

```
<base>
  ↓
2e01a3e3011a (create companies, roles, users)
  ↓
28894d13caf6 (add departments, employees)
  ↓
34e954a9d0e0 (add projects, tasks)
  ↓
9bc553e52242 (add leaves, attendance)
  ↓
562f5aa37a21 (head) (add notifications)
```

Commands:
```bash
# Run latest migrations
alembic upgrade head

# Verify current revision
alembic current
```

---

## 8. Continuous Integration (CI/CD)

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically executes on every `push` and `pull_request` to `main`:
1. **Backend CI**: Runs PostgreSQL service container, installs dependencies, and runs `pytest -v`.
2. **Frontend CI**: Sets up Node.js 20, runs `vitest` unit tests, and verifies `npm run build`.
3. **Docker Validation**: Builds production Docker images for both backend and frontend.

---

## 9. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | *Required* | PostgreSQL connection string |
| `SECRET_KEY` | *Required* | 64-character random string for JWT signing |
| `ALGORITHM` | `HS256` | JWT cryptographic algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT expiration time in minutes |
| `ENVIRONMENT` | `development` | `development`, `test`, or `production` |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `BACKEND_CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins |
| `WORKDAY_START_TIME` | `09:30` | Company shift baseline start time |
| `LATE_GRACE_MINUTES` | `15` | Late attendance grace period in minutes |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Base REST API URL prefix |

---

## 10. Production Deployment Guidelines

WorkFlow Pro is completely containerized and environment-driven, making it portable to modern cloud hosting platforms:

- **Render / Railway**: Deploy backend as a Web Service from `backend/Dockerfile` with PostgreSQL add-on; deploy frontend as a Static Site or Docker web service.
- **Fly.io / AWS ECS / VPS**: Deploy using `docker compose` or Kubernetes manifests. Set `ENVIRONMENT=production` and supply managed PostgreSQL connection strings.
- **Reverse Proxy**: Nginx configurations are included in `frontend/nginx.conf` with automated SPA client-side fallback routing (`try_files $uri $uri/ /index.html;`) and security headers.
