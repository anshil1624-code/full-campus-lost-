# 🛠️ Technical Approach & Engineering Decisions

**Project:** Cloud-Ready Lost-and-Found Service (Problem Statement 41)  
**Author:** Senior Full-Stack Engineering Team  

---

## 1. Problem Framing & Core Objectives

College campuses suffer from fragmented lost-and-found systems: paper logbooks at security desks, informal social media posts, and chaotic WhatsApp groups. Students have low recovery rates, while finders have no safe, standardized way to return belongings.

Our objective was to engineer a **production-quality, zero-configuration local service** that:
1. Runs immediately on any evaluator's machine without cloud credentials or paid API keys.
2. Persists all reports, searches, claims, and status updates reliably to disk storage.
3. Provides a documented, drop-in cloud architecture ready for production deployment.

---

## 2. Engineering Decisions & Architecture Tradeoffs

### A. SQLite as Default Local Storage with Database Abstraction Layer
- **Decision**: We selected **SQLite3** as the primary local database, wrapped inside a unified repository abstraction layer (`server/config/db.js` and `server/repositories/itemRepository.js`).
- **Rationale**:
  - Unlike in-memory databases, SQLite writes directly to a persistent file on disk (`database/lost_and_found.sqlite`).
  - No server process, username, password, or daemon installation is required.
  - To fulfill the "Cloud-Ready" requirement, our query abstraction layer converts `?` placeholders into `$1, $2, ...` syntax when `DATABASE_MODE=postgres` is selected, enabling an instant switch to managed PostgreSQL (Supabase, Neon, AWS RDS) without modifying application queries.
  - An automatic fallback kicks in if `DATABASE_MODE=postgres` is set but credentials fail, preventing startup crashes.

### B. Frictionless Student Reporting vs. User Account Management
- **Decision**: Designed reporting forms (`PostLostItemPage` and `PostFoundItemPage`) to be accessible without mandatory authentication walls, while retaining optional JWT accounts for personalized dashboards.
- **Rationale**: In real-world campus scenarios, a student rushing between lectures who finds keys on the floor will not complete a 5-step registration process. Removing mandatory login maximizes reporting velocity, while automatic Report IDs (`LF-2026-XXXX`, `FD-2026-XXXX`) enable tracking without an account.

### C. State Machine for Status Transitions
- **Decision**: Implemented strict status transition validation in `ItemRepository.js`:
  ```
  Lost ───────────────► Claim Pending ───────────────► Returned / Recovered
  Found ──────────────► Claim Pending ───────────────► Returned / Recovered
                             ▲                               │
                             └──────── Reopen (Admin/Owner) ─┘
  ```
- **Rationale**: Prevents nonsensical state transitions (e.g. attempting to claim an item already verified and returned to its owner).

### D. Privacy Protection & Contact Masking
- **Decision**: Contact phone numbers and email addresses are partially masked in public card and detail views (e.g. `mar****@student.edu`). Users must explicitly click "Reveal Contact Information" or submit a claim to establish communication.
- **Rationale**: Protects students from automated web scrapers, spam, and unsolicited messages.

### E. Port Conflict Resilience (macOS Support)
- **Decision**: Port 5000 is occupied by default on modern macOS versions (used by AirPlay Receiver ControlCenter). We engineered an automatic retry mechanism in `server.js` that catches `EADDRINUSE` and seamlessly binds to port 5001.

---

## 3. Database Schema Design

### `items` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique internal numerical ID |
| `reportId` | TEXT | UNIQUE NOT NULL | Human-readable tracking ID (e.g. `LF-2026-1001`) |
| `title` | TEXT | NOT NULL | Item name/title |
| `description` | TEXT | NOT NULL | Detailed item description & markings |
| `category` | TEXT | NOT NULL | Category (Electronics, Bags & Wallets, Books, etc.) |
| `type` | TEXT | NOT NULL | `'Lost'` or `'Found'` |
| `status` | TEXT | NOT NULL DEFAULT `'Lost'` | Current status (`Lost`, `Found`, `Claim Pending`, `Returned / Recovered`) |
| `location` | TEXT | NOT NULL | Specific campus location where lost or found |
| `date` | TEXT | NOT NULL | Date lost or found (YYYY-MM-DD) |
| `image` | TEXT | DEFAULT `''` | Relative path to uploaded image file |
| `contactName` | TEXT | NOT NULL | Reporter / Finder full name |
| `contactEmail`| TEXT | NULLABLE | Reporter email |
| `contactPhone`| TEXT | NULLABLE | Reporter phone / contact method |
| `contact` | TEXT | NOT NULL | Aggregated contact string |
| `claimantName`| TEXT | NULLABLE | Name of person who initiated a claim |
| `claimantContact`| TEXT| NULLABLE | Claimant's contact info |
| `claimNotes` | TEXT | NULLABLE | Verification proof notes submitted by claimant |
| `userId` | INTEGER | NULLABLE | Associated student user ID (if logged in) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp of creation |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp of last status change |

### `claims` Table
Tracks claim history and verification notes:
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `itemId` | INTEGER | Foreign key referencing `items.id` |
| `claimantName` | TEXT | Full name of student claiming item |
| `claimantContact`| TEXT | Contact details |
| `claimNotes` | TEXT | Proof of ownership description |
| `status` | TEXT | `'Pending'`, `'Approved'`, `'Rejected'` |
| `createdAt` | DATETIME | Timestamp when claim was submitted |

---

## 4. Known Limitations & Future Improvements

1. **In-App Real-Time Chat**:
   - *Current*: Direct email/phone contact or campus desk handover.
   - *Future*: Integrated end-to-end encrypted in-app messaging via WebSockets (Socket.io) to conceal personal emails/numbers entirely.
2. **Computer Vision Verification**:
   - *Current*: Gemini AI generates descriptive text and matches keyword overlaps.
   - *Future*: Image embeddings (e.g. CLIP / MobileNet) to automatically match photos of lost items with photos of found items by visual similarity.
3. **Campus Map Integration**:
   - *Current*: Text-based campus locations with search and filtering.
   - *Future*: Interactive OpenStreetMap or campus SVG map with pinpointed loss and recovery zones.
4. **Push Notifications**:
   - *Current*: On-screen toasts and real-time dashboard updates.
   - *Future*: Email notifications via SendGrid/Resend when a claim is submitted on an item.
