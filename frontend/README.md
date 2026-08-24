# WorkFlow Pro — Frontend Application

Modern, enterprise multi-tenant SaaS frontend application built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

---

## 1. Technology Stack

- **Core**: React 18, TypeScript, Vite
- **Routing**: React Router DOM (v7)
- **State & Data Fetching**: TanStack React Query (v5)
- **API Client**: Axios with automatic JWT Bearer token interceptor and centralized error formatting
- **Form Management**: React Hook Form with Zod schema validation
- **Styling**: Tailwind CSS, PostCSS, Lucide React icons
- **Testing**: Vitest, React Testing Library, jsdom

---

## 2. Project Architecture

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts             # Axios instance with auth & error interceptors
│   │   └── endpoints.ts          # Authentication & User API services
│   ├── components/
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── PublicRoute.tsx
│   │   └── layout/
│   │       ├── AppLayout.tsx     # Shell layout with Sidebar and Header
│   │       ├── Sidebar.tsx       # Role-based navigation sidebar
│   │       ├── Header.tsx        # Top navigation & user profile pill
│   │       └── PageContainer.tsx # Reusable responsive page container
│   ├── config/
│   │   └── env.ts                # Environment variables accessor
│   ├── contexts/
│   │   └── AuthContext.tsx       # Global authentication state provider
│   ├── hooks/
│   │   └── useAuth.ts            # Auth hook for consuming AuthContext
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx     # User & organization login
│   │   │   └── RegisterPage.tsx  # Company & admin registration
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx # Overview dashboard & metrics
│   │   ├── profile/
│   │   │   └── ProfilePage.tsx   # User profile & tenant details
│   │   ├── common/
│   │   │   └── ComingSoonPage.tsx# Phase placeholder for upcoming modules
│   │   └── NotFoundPage.tsx      # 404 handler
│   ├── routes/
│   │   └── AppRoutes.tsx         # Route configuration & guards
│   ├── types/
│   │   ├── api.ts                # API error & pagination types
│   │   ├── auth.ts               # Auth context & response interfaces
│   │   └── user.ts               # User & role models
│   ├── utils/
│   │   ├── storage.ts            # LocalStorage abstraction for tokens
│   │   ├── errors.ts             # User-friendly error message extractor
│   │   └── cn.ts                 # Tailwind class merger
│   ├── App.tsx                   # Root component with Providers
│   ├── main.tsx                  # React DOM entrypoint
│   └── index.css                 # Tailwind directives and styles
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Environment Variables

Create `.env` in the `frontend/` directory (see `.env.example`):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

## 4. Running Development Server

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server on port 5173
npm run dev
```

---

## 5. Running Automated Tests

```bash
cd frontend
npm run test
```

---

## 6. Authentication Flow

1. **Registration (`/register`)**:
   - Submits `email`, `full_name`, `password`, and `company_name` to `POST /api/v1/auth/register`.
   - On success, automatically authenticates against `POST /api/v1/auth/login` to obtain JWT Bearer token and redirects to `/dashboard`.
2. **Login (`/login`)**:
   - Submits `username` (`email`) and `password` with `application/x-www-form-urlencoded` to `POST /api/v1/auth/login`.
   - Receives `{ access_token, token_type: "bearer" }`.
   - Stores token in `storage.ts` (`localStorage`), sets authorization header for all subsequent API calls, queries `GET /api/v1/users/me` to populate user profile, and navigates to the requested or default `/dashboard` route.
3. **Token Persistence & Verification**:
   - On page refresh, `AuthContext` reads the persisted token from `storage.ts` and validates session validity via `GET /api/v1/users/me`.
   - If token is expired or unauthorized (`401`), `storage.clearAll()` is triggered and user is redirected to `/login`.
4. **Logout**:
   - Removes token and cached user, resets state, and immediately routes to `/login`.

---

## 7. Role-Based Navigation

- **Admin**: Full access to all management sections (`Employees`, `Departments`, `Projects`, `Tasks`, `Leaves`, `Attendance`, `Profile`).
- **Manager**: Access to `Projects`, `Tasks`, `Departments`, `Leaves`, `Attendance`, `Profile`.
- **Employee**: Focused on self-service work (`Tasks`, `Leave Requests`, `Attendance`, `Profile`).
