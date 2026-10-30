# 🏛️ Cloud-Ready Lost-and-Found Service: Architecture & System Design

**Problem Statement 41:** Cloud-Ready Lost-and-Found Service for College Campuses  
**Author:** Senior Full-Stack Engineering & Cloud Architecture Team  

---

## 1. High-Level System Architecture Diagram

```mermaid
graph TB
    subgraph Client Layer ["Frontend Client (React 18 + Vite + Tailwind CSS)"]
        UI[Student & Staff UI]
        Router[React Router Dom]
        AuthCtx[Auth Context & State]
        APIClient[Axios REST Client]
        UI --> Router
        Router --> AuthCtx
        AuthCtx --> APIClient
    end

    subgraph Gateway ["Reverse Proxy / API Gateway"]
        Proxy[Vite Dev Proxy / Nginx / Cloud Load Balancer]
        APIClient --> Proxy
    end

    subgraph Backend Layer ["Backend API (Node.js + Express.js)"]
        Server[Express Server: Port 5001 / 5000]
        Middlewares[CORS, Uploads Multer, JWT & Optional Auth, Error Handler]
        Controllers[Item, Dashboard, Admin, AI Controllers]
        Repo[ItemRepository: Database Abstraction Layer]

        Proxy --> Server
        Server --> Middlewares
        Middlewares --> Controllers
        Controllers --> Repo
    end

    subgraph Storage Layer ["Pluggable Persistent Storage Layer"]
        DBRouter{DATABASE_MODE}
        Repo --> DBRouter

        subgraph Local Execution ["Local Mode (Zero-Config)"]
            SQLite[("SQLite3 Engine<br/><code>database/lost_and_found.sqlite</code>")]
        end

        subgraph Cloud Execution ["Cloud Mode (Managed Production)"]
            PostgreSQL[("Managed PostgreSQL Pool<br/>(Supabase / Neon / AWS RDS)")]
        end

        DBRouter -->|"sqlite (default)"| SQLite
        DBRouter -->|"postgres (with credentials)"| PostgreSQL
        DBRouter -.->|"fallback if postgres fails"| SQLite
    end

    subgraph FileStorage ["Static Asset Storage"]
        Uploads[Local <code>server/uploads/</code> or Cloud S3 Bucket]
        Controllers --> Uploads
    end
```

---

## 2. Frontend Architecture

The frontend is a Single Page Application (SPA) built using **React 18** and **Vite**, styled with responsive **Tailwind CSS**, and utilizing **Lucide React** iconography.

### Key Architectural Characteristics:
1. **Component Modularity**: UI components are isolated and reusable:
   - `Navbar`: Global sticky navigation featuring Home, Browse Items, Report Lost, Report Found, and About.
   - `ItemCard`: Render cards with category icons, Report IDs, date/location tags, and dynamic status pills.
   - `ItemFilter`: Real-time filter toolbar supporting title search, location filtering, category selection, type tabs, and status filters.
   - `Toast`: Global notification mechanism for asynchronous feedback.
2. **Flexible Routing (`App.jsx`)**:
   - **Public Routes**: `/`, `/browse`, `/items/:id`, `/post-lost`, `/post-found`, `/about`, `/login`, `/register`.
   - **Frictionless Reporting**: Students and campus staff can submit lost and found reports immediately without a mandatory login barrier.
   - **Protected Routes**: `/dashboard` (personal listings management) and `/admin` (super-admin moderation).
3. **State & Network Management**:
   - `AuthContext`: Manages JWT session tokens in localStorage.
   - `api.js`: Centralized Axios instance with timeout, base URL resolution, and automatic token attachment.
   - Debounced API queries prevent server flooding during interactive searches.

---

## 3. Backend Architecture & REST API Workflow

The backend is built with **Node.js** and **Express.js**, following clean layered separation:
- **Routes Layer** (`routes/itemRoutes.js`): Maps HTTP endpoints to request handlers.
- **Middleware Layer** (`middleware/authMiddleware.js`, `middleware/uploadMiddleware.js`): Sanitizes requests, enforces size limits, processes multipart image uploads, and extracts authentication tokens optionally or strictly.
- **Controller Layer** (`controllers/itemController.js`): Orchestrates business logic, validates required parameters, formats responses, and handles HTTP status codes.
- **Repository Layer** (`repositories/itemRepository.js`): Encapsulates all SQL queries, data persistence, and status state-machine transitions.

### REST API Workflow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student / Finder
    participant Client as React Client (Vite)
    participant API as Express API Server
    participant Repo as ItemRepository
    participant DB as SQLite / PostgreSQL

    Note over Student,DB: 1. Submitting a Lost or Found Report
    Student->>Client: Enters Title, Category, Location, Date, Contact
    Client->>API: POST /api/items (multipart/form-data or JSON)
    API->>API: Validate fields & generate unique Report ID (e.g. LF-2026-1001)
    API->>Repo: create(itemData)
    Repo->>DB: INSERT INTO items (...) VALUES (...)
    DB-->>Repo: Returns last inserted row ID
    Repo-->>API: Returns complete item record
    API-->>Client: 201 Created { message, reportId, item }
    Client-->>Student: Displays Success Modal with Unique Report ID

    Note over Student,DB: 2. Claiming an Item
    Student->>Client: Clicks "Claim This Item" & enters contact/proof
    Client->>API: POST /api/items/:id/claim
    API->>Repo: submitClaim(id, claimantDetails)
    Repo->>DB: INSERT INTO claims (...)
    Repo->>DB: UPDATE items SET status = 'Claim Pending', ...
    DB-->>Repo: OK
    Repo-->>API: Updated Item Record
    API-->>Client: 200 OK { message, item }
    Client-->>Student: Status badge updates to "⏳ Claim Pending"
```

---

## 4. SQLite Persistence & Database Layer

### Storage Location
- The local database is stored at: `database/lost_and_found.sqlite` (relative to the repository root).
- Both the directory and file are created automatically on server startup if not already present.
- Automated migrations and table initialization occur in `initDB()` (`server/config/db.js`).

### Schema Design & Parameterized Queries
All database interactions use **parameterized SQL queries** (`?` in SQLite, converted automatically to `$1, $2` in PostgreSQL) to completely prevent SQL injection attacks.

```sql
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reportId TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Lost',
  location TEXT NOT NULL,
  date TEXT NOT NULL,
  image TEXT DEFAULT '',
  contactName TEXT NOT NULL,
  contactEmail TEXT,
  contactPhone TEXT,
  contact TEXT NOT NULL,
  claimantName TEXT,
  claimantContact TEXT,
  claimNotes TEXT,
  userId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Automatic Seeding
If the `items` table contains zero records on startup, the application automatically seeds the eight mandatory fictional items covering varied categories, dates, campus locations, and statuses (`Lost`, `Found`, `Claim Pending`, `Returned / Recovered`).

---

## 5. Local vs. Cloud Execution Mode

| Feature | Local Mode (Default) | Cloud Mode |
| :--- | :--- | :--- |
| **Database Engine** | SQLite3 (`database/lost_and_found.sqlite`) | Managed PostgreSQL (Supabase / Neon / AWS RDS) |
| **Credentials Required** | **None** (Zero-configuration) | `DATABASE_URL` connection string |
| **Fallback Behavior** | Default | If Postgres fails/unreachable, gracefully falls back to SQLite |
| **Frontend Server** | Local Vite Dev Server (`localhost:5173`) | Vercel / Netlify / AWS CloudFront + S3 |
| **Backend Server** | Local Express (`localhost:5001`) | Containerized Render / Fly.io / AWS ECS |
| **Offline Capability** | 100% functional offline | Requires active internet connection |

---

## 6. Cloud Deployment Architecture

```mermaid
graph LR
    User([Student Web Browser])

    subgraph Edge ["Cloud CDN & DNS Layer"]
        DNS[DNS / Cloudflare]
        SSL[TLS/HTTPS Certificate]
    end

    subgraph CloudFrontend ["Static Web Hosting"]
        StaticHost["Vercel / S3 / Netlify<br/>(React Static Bundle)"]
    end

    subgraph CloudBackend ["Container / App Platform"]
        CloudAPI["Render / Fly.io / AWS ECS<br/>(Express API Container)"]
    end

    subgraph CloudData ["Managed Cloud Database"]
        ManagedPG[("Supabase / Neon / AWS RDS<br/>(PostgreSQL 15+)")]
    end

    User --> DNS
    DNS --> SSL
    SSL --> StaticHost
    StaticHost -->|API Calls via HTTPS| CloudAPI
    CloudAPI -->|DATABASE_URL via TLS| ManagedPG
```

### Steps to Deploy to the Cloud:
1. **Frontend Deployment (Vercel / Netlify / Render Static):**
   - Build directory: `client/dist`
   - Build command: `npm install && npm run build`
   - Set environment variable: `VITE_BACKEND_URL=https://api.yourcampuslostfound.com`
2. **Backend Deployment (Render / Fly.io / AWS ECS / Railway):**
   - Root directory: `./server` (or deploy root with `docker-compose.yml`)
   - Start command: `node server.js`
   - Set environment variables:
     - `NODE_ENV=production`
     - `PORT=5000`
     - `DATABASE_MODE=postgres`
     - `DATABASE_URL=postgres://user:password@cloud-db-host:5432/campus_lost_found`
     - `CLIENT_URL=https://yourcampuslostfound.com`
     - `JWT_SECRET=<strong_random_secret>`
3. **Database Setup:**
   - Create a free instance on Supabase or Neon.
   - Copy the PostgreSQL connection URI into `DATABASE_URL`.
   - The application automatically initializes tables and schemas upon startup.

---

## 7. Security & Reliability Considerations

1. **SQL Injection Prevention**: 100% of queries use parameterized bindings.
2. **Contact Privacy**: Contact numbers and emails are masked in public views (e.g. `m****@student.edu`) and only unmasked when the user explicitly clicks "Reveal Contact" or submits a verified claim.
3. **File Upload Security**:
   - Multer file size capped at 5 MB.
   - Whitelisted image MIME types (JPEG, PNG, WebP).
   - Filenames sanitized with timestamp prefixes to prevent path traversal attacks.
4. **CORS & Environment Safeguards**: Explicit allowed origins configured; stack traces suppressed in production mode.
5. **Port Conflict Resilience**: When port 5000 is occupied (e.g., macOS AirPlay Receiver), the backend server automatically binds to port 5001 or subsequent available ports without crashing.
