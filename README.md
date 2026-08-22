# 🎓 CampusFind: Secure & Interactive Campus Lost and Found

A modern, full-stack, and privacy-first **Campus Lost & Found Platform** engineered with strict institutional security, automated EXIF metadata scrubbing for photo privacy, interactive campus map pinning, and real-time Socket.io matchmaking alerts.

---

## 🌟 Tech Stack (100% Free & Zero-Cost Architecture)

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js, Socket.io (WebSocket gateway for live match & claim notifications).
- **Database**: SQLite with **Prisma ORM** (100% free, zero external server setup, instant portable database).
- **Photo Storage & Privacy**: Local Secure Media Vault with **Sharp EXIF Sanitization** (automatically strips GPS location and camera tags without requiring paid AWS S3).
- **Interactive Maps**: **Leaflet & OpenStreetMap** (100% free, open-source, no paid Mapbox keys required).
- **Security & Validation**: JWT, `sanitize-html`, `express-rate-limit`, `helmet`, and `.edu` domain regex validation.

---

## 🛡️ Security Implementations

1. **Strict `.edu` Domain Validation**:
   - All authentication requests are gated by `validateEduEmail`. Only email addresses with verified institutional `.edu` domains (e.g. `student@mit.edu`, `user@harvard.edu`) are authorized to create reports or claim items. Rejects consumer addresses (`@gmail.com`, `@yahoo.com`, spoofed domains) with `403 Forbidden`.
2. **Automated Image EXIF Stripping**:
   - Incoming photos are buffered in memory and processed using `sharp`. All GPS coordinates, device serial numbers, camera model data, and IPTC/XMP tags are scrubbed before saving as clean WebP files to protect students' physical location privacy.
3. **API Rate Limiting**:
   - Dedicated tier limiters (`express-rate-limit`):
     - Auth: 20 req / 15 min
     - Item Submissions: 15 req / 15 min
     - Claims: 10 req / 15 min
     - General API: 150 req / 15 min
4. **Input Sanitization & XSS Defense**:
   - Recursive sanitization middleware with `sanitize-html` cleanses all text payloads, descriptions, and comments.

---

## ⚡ Interactivity & Real-Time Engine

- **Interactive Campus Map**: Interactive Leaflet map with custom red (Lost) and green (Found) glowing pins, campus hotspot presets (Library, Student Center, Gym, Stata Center, Green Quad), and click-to-pin incident reporting.
- **Real-Time Matchmaking Algorithm**:
   - Evaluates text keyword similarity (Jaccard tokenization), category match, time window, and Haversine geo-distance.
   - When a match is detected (score $\ge 45\%$), the backend immediately emits a `match_alert` event via Socket.io to pop up a live confidence toast and update the user's notification bell.
- **Anti-Theft Secret Question Verification**:
   - Posters can configure a secret verification question (e.g. "What sticker is on the back?" or "What color is the keychain?"), preventing fraudulent claims.
- **Live Campus Chat & Status Workflow**:
   - Real-time chat on incident reports to coordinate secure campus handovers, with statuses transitioning from `OPEN` $\to$ `CLAIMED` $\to$ `RESOLVED`.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Initialize and push database schema (SQLite)
npx prisma db push

# Seed realistic campus data and .edu users
npm run db:seed

# Run security & matchmaking test suite
npm test

# Start backend server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser!

---

## 🧪 Automated Testing

To run the automated backend test suite (testing `.edu` domain verification, Sharp EXIF metadata removal, and matchmaking logic):

```bash
cd backend
npm test
```

Test Results Output:
- `[PASS]` Accepts valid `.edu` campus emails
- `[PASS]` Rejects generic consumer and spoofed emails
- `[PASS]` Strips all EXIF, GPS, and camera metadata from image uploads
- `[PASS]` Computes geo-distance and keyword match scores

---

## 📋 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate with verified `.edu` email (Rate-limited).
- `GET /api/auth/me` — Get current user profile and notification stats.

### Lost & Found Items (`/api/items`)
- `GET /api/items` — List items with filters (category, type, search keyword, geo-radius).
- `GET /api/items/:id` — Inspect detailed report, photos, and messages.
- `POST /api/items` — Submit report with EXIF-stripped image upload and real-time match trigger.
- `PATCH /api/items/:id/status` — Update item status (`OPEN`, `CLAIMED`, `RESOLVED`).

### Claims & Chat (`/api/claims`)
- `POST /api/claims` — Submit claim with proof description and secret answer.
- `PATCH /api/claims/:claimId/review` — Approve/Reject claim.
- `POST /api/claims/item/:itemId/messages` — Send real-time chat message.

### Metrics & Notifications (`/api/stats`)
- `GET /api/stats/campus-metrics` — Recovery rate and category statistics.
- `GET /api/stats/notifications` — Real-time user match notifications.
- `PATCH /api/stats/notifications/:id/read` — Mark notification read.

---

## 🧑‍🎓 Demo Campus Accounts

For testing, you can use the instant **Quick-Switch** buttons in the SSO modal:
- **Alex Chen** (`alex.chen@mit.edu`) — Student
- **Sarah Jenkins** (`sarah.jenkins@mit.edu`) — Student
- **Marcus Vance** (`marcus.vance@mit.edu`) — Staff
- **Campus Safety Admin** (`campus.safety@mit.edu`) — Admin
