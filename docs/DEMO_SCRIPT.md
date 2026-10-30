# ⏱️ 3-Minute Hackathon Demonstration Script

**Project:** Cloud-Ready Lost-and-Found Service (Problem Statement 41)  
**Target Duration:** Exactly 3 minutes  
**Presenter Goal:** Show live running application, demonstrate end-to-end user workflow, prove SQLite persistence across restarts, and explain the cloud deployment strategy.

---

## 🎬 Demo Breakdown & Step-by-Step Actions

### Phase 1: Opening the Application & Home Dashboard (0:00 – 0:30)
1. **Show running terminal**:
   - Terminal 1: `node server/server.js` (listening on `http://localhost:5001`, database mode: `sqlite`, file: `database/lost_and_found.sqlite`).
   - Terminal 2: `npm run dev` in `client/` (running at `http://localhost:5173`).
2. **Open browser to `http://localhost:5173`**:
   - Highlight the **Hero Section** and the **4 Metric Dashboard Cards**:
     - *Total Reported Items*
     - *Lost Items*
     - *Found Items*
     - *Successfully Recovered Items*
   - Point out that the 8 pre-seeded fictional records (wallet near library, water bottle in playground, student ID near computer lab, etc.) loaded immediately without any cloud account setup.

---

### Phase 2: Reporting a Lost Item (0:30 – 1:00)
1. **Click "Report Lost"** in the navigation bar:
   - Notice the form is immediately accessible without a forced login barrier.
2. **Fill out the form with a test item**:
   - **Item Name**: `Black Titanium Watch`
   - **Category**: `Accessories`
   - **Description**: `Matte black chronograph watch with black silicone strap, left on desk in Room 302.`
   - **Last-Seen Location**: `Science Building Room 302`
   - **Date Lost**: Today's date
   - **Contact Name**: `Jordan Taylor`
   - **Contact Email**: `jordan.t@student.edu`
3. **Click "Publish Lost Item Report"**:
   - Point out the **Success Screen**:
     - Displays the generated unique Report ID: **`LF-2026-XXXX`**.
     - Confirms the record is permanently saved in SQLite.
4. **Click "View Report Details"** to show the created listing.

---

### Phase 3: Reporting a Found Item & Searching (1:00 – 1:40)
1. **Click "Report Found"** in the navigation bar:
   - Fill in:
     - **Item Name**: `AirPods Pro in Blue Case`
     - **Category**: `Electronics`
     - **Description**: `Found on the third-floor library table. Handed in to library desk.`
     - **Found Location**: `Central Library 3rd Floor`
     - **Contact Name**: `Circulation Desk Staff`
     - **Contact Email**: `library-help@campus.edu`
   - Click **"Publish Found Item Listing"**.
   - Note the generated Report ID: **`FD-2026-XXXX`**.
2. **Navigate to "Browse Items"**:
   - In the search bar, type `wallet` -> show only wallet records.
   - Clear search, change category dropdown to `Electronics` -> show only electronics.
   - Filter by status `Claim Pending` -> show items currently being claimed.
   - Highlight how responsive and fast the backend queries are.

---

### Phase 4: Claim Workflow & Status Transition (1:40 – 2:20)
1. **Click on any active item card** (e.g. the newly created `AirPods Pro` or pre-seeded item):
   - Note the masked contact information preserving student privacy: `lib****@campus.edu`.
   - Click **"Reveal Contact"** to show the contact information on demand.
2. **Submit a Claim**:
   - Click the green **"This Is Mine (Claim Item)"** button.
   - Enter Claimant Name: `Samantha White` and Contact: `samantha.w@student.edu`.
   - Notes: `I lost these yesterday during my study group, the serial number ends in 492.`
   - Click **"Submit Claim"**.
   - Point out that the status badge dynamically transitions to **`⏳ Claim Pending`** with claimant details recorded.
3. **Update Status**:
   - Use the status selector buttons to transition status to **`Recovered`**.
   - Note the badge immediately updates to **`✓ Recovered`**, and the home dashboard count automatically increments!

---

### Phase 5: Proving Persistence Across Backend Restart (2:20 – 2:45)
1. **Switch to backend terminal**:
   - Press `Ctrl + C` to kill the backend server.
   - Highlight: The backend process is dead.
2. **Restart the backend**:
   - Run: `node server/server.js`.
   - It re-connects to `database/lost_and_found.sqlite`.
3. **Refresh the browser on the item page**:
   - Point out: The newly created item, its claim data, and the `Recovered` status are **100% preserved**.
   - Explain: Data is stored in persistent SQLite disk storage, never volatile memory or browser localStorage!

---

### Phase 6: Cloud-Ready Architecture & Wrap-Up (2:45 – 3:00)
1. **Show `docs/ARCHITECTURE.md` and `docker-compose.yml`**:
   - *"Our architecture is dual-mode: for local judging, it runs with zero credentials on SQLite. For production cloud deployment, setting `DATABASE_MODE=postgres` connects to managed Supabase, Neon, or AWS RDS with zero code changes thanks to our repository abstraction layer."*
   - *"The entire stack is containerized with Docker Compose with persistent disk volume mounts."*
2. **Conclusion**:
   - *"Thank you! Campus Find solves Problem Statement 41 with robust code, complete offline reliability, and turn-key cloud readiness."*
