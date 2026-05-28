# CrownSide - AI Developer Onboarding Guide

Welcome to the CrownSide project! This document is designed to get you (an AI assistant like Claude) up to speed on the project architecture, tech stack, business logic, and specific technical quirks so you can jump right into feature development and debugging.

## 🏢 Project Overview
CrownSide is a premium beauty professional booking platform that connects independent stylists, barbers, and beauty pros with clients. It features both a client-facing discovery/booking interface and a stylist-facing dashboard for managing appointments, portfolios, availability, and clients.

The app is built as a **Progressive Web App (PWA)** that is also packaged as a **Native Android APK** using Ionic Capacitor.

## 🛠 Tech Stack

### Frontend (`/client`)
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 (with PostCSS) + HeadlessUI + Lucide React icons
- **State/Data:** Context API (`AuthContext`, `NotificationContext`) + Axios for HTTP requests
- **Native Wrapper:** Ionic Capacitor 8 (`@capacitor/android`, `@capacitor/core`, `@capacitor/status-bar`)
- **Key Features:** Stripe Elements for payments, React DatePicker for booking.

### Backend (`/server`)
- **Framework:** Node.js + Express 5
- **Database ORM:** Prisma 5
- **Database Engine:** PostgreSQL (Hosted on AWS RDS)
- **Authentication:** JWT (JSON Web Tokens) in `httpOnly` cookies + bcryptjs
- **File Storage:** AWS S3 (via `@aws-sdk/client-s3` and `multer-s3`) for profile pictures and portfolio images.
- **External APIs:** Stripe (Payments/Subscriptions), Twilio (SMS Notifications - to be fully wired/scaled).

## 🗂 Directory Structure
```
/crownside
├── client/                 # Frontend React Application
│   ├── android/            # Capacitor generated Android native code
│   ├── public/             # Static assets (favicons, manifest.json)
│   ├── src/
│   │   ├── assets/         # Images, branding (CrownSide bronze/gold logos)
│   │   ├── components/     # Reusable UI components (Navbar, Modals, Admin, etc.)
│   │   ├── context/        # React Context providers (Auth, Notifications)
│   │   ├── lib/            # Utilities (api.js, billingGuard.js)
│   │   ├── pages/          # Full page routes (Home, Explore, StylistDashboard, etc.)
│   │   └── App.jsx         # Root component & Routing
│   ├── capacitor.config.json # Capacitor configuration
│   └── package.json
│
├── server/                 # Backend Node.js/Express API
│   ├── prisma/             # Prisma schema and migrations
│   │   └── schema.prisma   # Single source of truth for DB models
│   ├── scripts/            # Admin/seed scripts (make_admin.js, create_google_user.js)
│   ├── src/
│   │   ├── controllers/    # Route logic
│   │   ├── middlewares/    # Auth and error handling middleware
│   │   ├── routes/         # Express routers
│   │   └── app.js          # Express app entry point
│   └── package.json
│
└── CLAUDE.md               # This onboarding document
```

## 🏗 Key Business Logic & Architecture

### 1. User Roles
- `CLIENT`: Standard user looking to book services.
- `STYLIST`: Beauty professional. Has an attached `StylistProfile` record which holds their business name, location type (Home, Salon, Mobile), portfolio, and services.
- `ADMIN` / `MODERATOR`: Platform administrators.

### 2. Billing & Native App Compliance
**CRITICAL:** Google Play Store policies prohibit using third-party payment gateways (like Stripe) for digital goods/subscriptions within the native app. 
- We use a utility called `billingGuard.js` (`canAccessNativeBilling()`) which checks if the app is running in a Capacitor native environment.
- If it *is* native, pricing cards and Stripe checkout flows are hidden. Subscriptions and payments are restricted to the web/PWA version. 

### 3. The "Founders Circle"
An early-access program for beta testers. Users can be flagged as `isFounderEligible` and enrolled into the Founder program, unlocking exclusive badges and potential future perks.

### 4. Forum System ("Crown Connect")
A built-in community board with multiple boards (Find a Pro, Salon Talk, etc.). It supports structured posts, comment threading, likes, and a reporting system for moderation.

## ⚠️ Important Quirks & Workarounds

### Capacitor Android Issues
1. **CORS & HTTP Requests:** Native Android WebViews run on `https://localhost`. The backend `cors` configuration explicitly whitelists this origin to allow API calls from the APK. 
2. **CapacitorHttp Plugin:** We explicitly **DO NOT** use the `CapacitorHttp` plugin because it intercepts `axios` requests and causes a fatal crash (`TypeError: t.p is not a function`). Standard `axios` XMLHttpRequests work perfectly fine with our CORS setup.
3. **Edge-to-Edge UI & Status Bar:** Newer Android versions enforce Edge-to-Edge rendering (drawing behind the status bar). 
   - We explicitly control the status bar in `App.jsx` using `@capacitor/status-bar`.
   - We set `StatusBar.setOverlaysWebView({ overlay: true })` and `StatusBar.setStyle({ style: Style.Light })` so the app draws behind the status bar, and the battery/time icons render as dark text against the app's white navigation header.

### Authentication Flow
- Auth tokens are stored in `httpOnly` cookies set by the backend.
- The React app uses an `AuthContext` to manage user state. 
- **Flicker Fix:** When `App.jsx` mounts, `loading` is set to `true` while it reaches out to the `/api/auth/me` endpoint. Components (like `Home.jsx`) respect this `loading` state by returning a blank or loading screen to prevent a momentary flash of the unauthenticated public landing page.

## 🚀 Development Workflow

### Starting the Environment
1. **Backend:**
   ```bash
   cd server
   npm run dev
   ```
   *Requires a `.env` file with `DATABASE_URL`, `JWT_SECRET`, AWS, and Stripe keys.*

2. **Frontend:**
   ```bash
   cd client
   npm run dev
   ```

### Building the Android APK
If native changes are made or a new build is required:
```bash
cd client
npm run build
npx cap sync android
```
*(You can then open `client/android` in Android Studio to build the actual APK).*

### Database Changes
If you modify `server/prisma/schema.prisma`:
1. Generate the client: `npx prisma generate`
2. Push to dev DB: `npx prisma db push` (or `migrate dev` depending on the environment).

## 🎯 Immediate Focus Areas (For AI Assistance)
- **Google Play Compliance:** Ensuring all native flows abide by Play Store policies (hence the `googlesylist@tektriq.com` reviewer account).
- **Scale & Stability:** Optimizing the database queries (especially around nested comments and availability schedules).
- **UI/UX Polish:** Maintaining the premium "Crownside Bronze" (`#D4AF37`) aesthetic, utilizing glassmorphism, and ensuring mobile responsiveness.

---
*Ready to build? You have full access to the codebase. Remember to check `client/src/App.jsx` for routing logic and `server/prisma/schema.prisma` as the absolute source of truth for data models.*
