# 🎓 Campus Find: Cloud-Ready Lost-and-Found Service

> **Problem Statement 41:** Cloud-Ready Lost-and-Found Service for College Campuses  
> A complete, modern full-stack web application designed for students and campus staff to report lost items, submit found belongings, search listings, manage claims, and recover lost property.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement & Solution](#-problem-statement--solution)
3. [Key Features](#-key-features)
4. [Technology Stack](#-technology-stack)
5. [Prerequisites](#-prerequisites)
6. [Quick Start (Local Non-Docker Setup)](#-quick-start-local-non-docker-setup)
7. [Docker & Docker Compose Setup](#-docker--docker-compose-setup)
8. [Database & Persistence Architecture](#-database--persistence-architecture)
9. [Environment Variables](#-environment-variables)
10. [REST API Documentation](#-rest-api-documentation)
11. [Sample Inputs & Expected Outputs](#-sample-inputs--expected-outputs)
12. [Troubleshooting Guide](#-troubleshooting-guide)
13. [Architecture Documentation](#-architecture-documentation)

---

## 🌟 Project Overview

**Campus Find** is a responsive, cloud-ready web application engineered to solve the persistent challenge of lost belongings on college and university campuses. Built with **React 18**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, and a pluggable database architecture supporting **persistent SQLite** locally and **managed PostgreSQL** in the cloud.

The system is designed to run **100% locally with zero cloud credentials, API keys, or paid services required**, while maintaining complete turn-key cloud readiness for containerized cloud deployment.

---

## 🎯 Problem Statement & Solution

* **The Problem:** Campus lost-and-found systems are traditionally decentralized, relying on paper notebooks at security booths, chaotic bulletin boards, or unsearchable social media threads. Items remain unclaimed, and recovery rates are low.
* **Our Solution:** A unified digital portal providing:
  * Fast, friction-free reporting for lost and found items.
  * Instant auto-generation of unique tracking IDs (`LF-2026-XXXX`, `FD-2026-XXXX`).
  * Real-time search across titles, descriptions, categories, and campus locations.
  * Strict status lifecycle management (`Lost`, `Found`, `Claim Pending`, `Returned / Recovered`).
  * Privacy-protected claim workflow shielding student emails and phones from web scrapers.
  * Zero-config persistent SQLite storage that survives server restarts.

---

## ✨ Key Features

### 1. Home Dashboard (Requirement 4.A)
* Real-time statistics counters:
  * **Total Reported Items**
  * **Active Lost Items**
  * **Found Belongings**
  * **Successfully Recovered Items**
* Quick action buttons to report lost and found belongings immediately.
* Live feed of recently reported campus items.

### 2. Report a Lost Item (Requirement 4.B)
* Comprehensive input validation: Item Name, Category, Description, Last-Seen Location, Date Lost, Contact Name, Email, and Phone.
* Optional photo upload with automatic MIME validation and size limits (5 MB).
* Automatic generation of human-readable Report ID (e.g., `LF-2026-1001`).
* Instant success confirmation modal with navigation to the created listing.

### 3. Report a Found Item (Requirement 4.C)
* Clean form capturing item details, category, found location, safe pickup instructions, and finder contact information.
* Generates found report ID (e.g., `FD-2026-1002`).

### 4. Browse and Search (Requirement 4.D)
* Instant search by keyword, title, description, or Report ID.
* Multi-dimensional filtering:
  * **Type Filter**: All, Lost, Found
  * **Category Filter**: Bags & Wallets, Electronics, ID Cards, Keys, Books, Clothing, Accessories, Other
  * **Location Filter**: Type any campus hall, room, or building (e.g. *Library*, *Cafeteria*)
  * **Status Filter**: All, Lost, Found, Claim Pending, Returned / Recovered
* Clear status badges, category icons, and responsive cards.

### 5. Item Status Lifecycle & Transitions (Requirement 4.E)
* Validates state transitions using a formal state machine:
  * `Lost` / `Found` ➔ `Claim Pending` ➔ `Returned / Recovered`
  * Prevents invalid or contradictory status transitions.
* Interactive status buttons on item detail views with instantaneous persistence.

### 6. Claim Workflow & Privacy Protection (Requirement 4.F)
* Express interest in recovering an item via a modal capturing claimant details and proof of ownership.
* Automatically transitions item to `⏳ Claim Pending`.
* **Contact Privacy**: Contact numbers and emails are masked by default (`m****@student.edu`) and only unmasked upon explicit user action ("Reveal Contact").

### 7. Guaranteed Persistence (Requirement 4.G)
* Uses SQLite3 as default local storage: `database/lost_and_found.sqlite`.
* Parameterized SQL queries preventing injection vulnerabilities.
* Automatic schema creation and automatic seeding of 8 sample records.
* **100% persistent**: Data remains intact when the backend or machine is restarted.

---

## 💻 Technology Stack

* **Frontend:** React 18, Vite 6, Tailwind CSS, Lucide React Icons, Axios, React Router Dom
* **Backend:** Node.js (v18–v24 compatible), Express.js 4, Multer, BcryptJS, JSON Web Tokens
* **Database (Local):** SQLite3 with persistent disk file storage (`database/lost_and_found.sqlite`)
* **Database (Cloud):** Managed PostgreSQL (Supabase / Neon / AWS RDS) via pluggable query abstraction
* **Containerization:** Docker, Docker Compose (multi-stage builds with persistent volumes)

---

## 📋 Prerequisites

* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* *(Optional)* **Docker & Docker Compose**: If running in a containerized environment.

---

## 🚀 Quick Start (Local Non-Docker Setup)

### Step 1: Install Dependencies
Open your terminal in the project root:

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install
cd ..
```

### Step 2: Start the Backend API Server
In a terminal window:

```bash
cd server
npm start
# or: node server.js
```
The API server will automatically initialize the database at `database/lost_and_found.sqlite` and listen on:  
👉 **`http://localhost:5001`** *(or `5000`)*  
Health Check: **`http://localhost:5001/api/health`**

### Step 3: Start the Frontend Client
In a second terminal window:

```bash
cd client
npm run dev
```
Open your browser and navigate to:  
👉 **`http://localhost:5173`**

---

## 🐳 Docker & Docker Compose Setup

A complete containerized environment is provided with persistent disk volumes for the SQLite database.

```bash
# 1. Build and launch containers
docker compose up --build

# 2. Access the application:
# Frontend: http://localhost:5173
# Backend:  http://localhost:5001 (proxied from 5000)

# 3. Stop containers (preserves database on host machine in ./database):
docker compose down
```

---

## 💾 Database & Persistence Architecture

The database file is stored in:  
📁 **`database/lost_and_found.sqlite`** (relative to the repository root).

### Mandatory Sample Seed Data (Requirement 9)
On initial startup, if the database is fresh, the application automatically seeds **8 fictional campus records**:

1. **Lost Black Wallet** (`LF-2026-1001`) — *Central Library, 2nd Floor Study Desks* (Status: `Lost`)
2. **Found Blue Water Bottle** (`FD-2026-1002`) — *Sports Complex & Playground Bleachers* (Status: `Found`)
3. **Lost Student ID Card** (`LF-2026-1003`) — *Turing Hall Computer Lab 304* (Status: `Claim Pending`)
4. **Found Black Umbrella** (`FD-2026-1004`) — *Cafeteria Table 12* (Status: `Returned / Recovered`)
5. **Lost Wireless Earbuds** (`LF-2026-1005`) — *Humanities Hall Room 102* (Status: `Lost`)
6. **Found Spiral Notebook** (`FD-2026-1006`) — *Auditorium Foyer North* (Status: `Found`)
7. **Lost Keychain with Car Keys** (`LF-2026-1007`) — *Student Parking Lot C* (Status: `Lost`)
8. **Found Backpack in Library** (`FD-2026-1008`) — *Central Library 3rd Floor Desk* (Status: `Claim Pending`)

To verify persistence across a restart:
```bash
# Run automated persistence test
npm test
```

---

## ⚙️ Environment Variables

A template file `.env.example` is provided at the repository root:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment mode |
| `PORT` | `5001` | Backend listening port (auto-detects port conflicts) |
| `DATABASE_MODE` | `sqlite` | Storage engine: `'sqlite'` (local) or `'postgres'` (cloud) |
| `DATABASE_URL` | *(empty)* | PostgreSQL connection string for cloud mode |
| `DB_FILE_PATH` | *(empty)* | Custom path for SQLite database file |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin for CORS |
| `VITE_BACKEND_URL` | `http://localhost:5001`| Backend URL used by React frontend |
| `JWT_SECRET` | *(secure fallback)* | Secret key for signing JSON Web Tokens |

---

## 📡 REST API Documentation

| Method | Endpoint | Description | Public / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, database mode, and storage file path | Public |
| `GET` | `/api/items/stats` | Aggregated statistics (total, lost, found, claim pending, recovered) | Public |
| `GET` | `/api/items` | List items with query filters (`?search=...&category=...&type=...&status=...&location=...`) | Public |
| `GET` | `/api/items/:id` | Retrieve single item by numerical ID or Report ID (`LF-...`, `FD-...`) | Public |
| `POST` | `/api/items` | Submit a new lost or found report (supports multipart image upload) | Public / Student |
| `PATCH`| `/api/items/:id/status` | Update item status (`Lost`, `Found`, `Claim Pending`, `Returned / Recovered`) | Public |
| `POST` | `/api/items/:id/claim` | Submit claim expressing interest/proof to recover an item | Public |
| `PUT` | `/api/items/:id` | Update full item fields | Owner / Admin |
| `DELETE`| `/api/items/:id` | Delete report from database | Owner / Admin |
| `POST` | `/api/auth/register` | Student registration | Public |
| `POST` | `/api/auth/login` | Student login | Public |

---

## 🧪 Automated Testing

We provide an automated integration test suite that tests:
* Server startup and health check response
* Automatic Report ID generation for lost and found reports
* Parameterized SQLite database insertion
* Search and multi-category filters
* Status transition state machine validation
* **Database persistence across a simulated server crash and restart**

Run tests with:
```bash
npm test
# or: node server/tests/api.test.js
```
Expected output:  
`🏁 Test Summary: 16 Passed, 0 Failed`

---

## 💡 Sample Inputs & Expected Outputs

### 1. Reporting a Lost Item
* **Request:** `POST /api/items`
```json
{
  "title": "Lost Graphing Calculator",
  "category": "Electronics",
  "description": "Black TI-84 Plus CE left in Math Building room 204",
  "type": "Lost",
  "location": "Euler Hall Room 204",
  "date": "2026-10-24",
  "contactName": "Jordan Reed",
  "contactEmail": "jordan.r@student.edu",
  "contactPhone": "+1 (555) 234-5678"
}
```
* **Response (HTTP 201 Created):**
```json
{
  "message": "Lost item reported successfully! Report ID: LF-2026-4821",
  "reportId": "LF-2026-4821",
  "item": {
    "id": 9,
    "reportId": "LF-2026-4821",
    "title": "Lost Graphing Calculator",
    "status": "Lost",
    "type": "Lost",
    "location": "Euler Hall Room 204"
  }
}
```

### 2. Submitting a Claim
* **Request:** `POST /api/items/9/claim`
```json
{
  "claimantName": "Jordan Reed",
  "claimantContact": "jordan.r@student.edu",
  "claimNotes": "My name is written in silver marker on the battery compartment"
}
```
* **Response (HTTP 200 OK):**
```json
{
  "message": "Claim submitted successfully! Status updated to Claim Pending.",
  "item": {
    "id": 9,
    "status": "Claim Pending",
    "claimantName": "Jordan Reed"
  }
}
```

---

## 🛠️ Troubleshooting Guide

### 1. Port 5000 in Use on macOS
* **Cause**: macOS AirPlay Receiver (`ControlCenter`) listens on port 5000 by default.
* **Solution**: The server detects `EADDRINUSE` and automatically switches to port **`5001`**. The frontend Vite proxy and API client are configured to connect to `5001` automatically.

### 2. Node.js Native Module Warning with `sqlite3`
* **Cause**: Node 24 native addon binding.
* **Solution**: Handled automatically via `npx prebuild-install -r napi`. Run `npm test` to verify SQLite works smoothly.

### 3. Database Reset
To wipe and restore default 8 seed items at any time:
```bash
rm -f database/lost_and_found.sqlite
node server/scripts/seed.js
```

---

## 📖 Architecture Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:
* **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**: Full architecture breakdown, sequence flows, and Mermaid diagrams.
* **[`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)**: A concise, step-by-step 3-minute hackathon evaluation script.
* **[`docs/TECHNICAL_APPROACH.md`](docs/TECHNICAL_APPROACH.md)**: Engineering decisions, tradeoffs, schema specs, and future roadmap.