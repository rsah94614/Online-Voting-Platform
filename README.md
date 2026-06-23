# 🏛️ VOTEX - Community Online Voting Platform

**A secure, open-source, and easy-to-use election management system for communities, student councils, and organizations.**

Built with Next.js 15 (App Router), TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS, Zustand, and TanStack Query.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-darkblue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

---

## 🎯 Platform Overview

VOTEX is a free and open-source online voting platform designed to make local elections, student councils, and community group voting incredibly simple and secure.

### 🏢 True Multi-Tenant Architecture
- **Isolated Admin Worlds:** Multiple organizations can use the same VOTEX deployment. Anyone can register as an `ADMIN` on the public `/register` page and instantly get their own completely isolated environment.
- **Tenant Security:** Admin A cannot see Admin B's elections, voters, or candidates. Every piece of data is cryptographically scoped to the Tenant ID (`adminId`).

### 🔐 Advanced Voter Eligibility Controls
- **Domain Restricted Mode:** Admins can configure elections so that only voters with specific email domains (e.g., `votex.io`, `harvard.edu`) are permitted to join.
- **Whitelist Mode:** Admins can lock down elections completely by providing a strict list of permitted email addresses.
- **Open Access:** Or, just use a 6-character search code and allow anyone with the code to vote.

### 📊 Real-Time Analytics & Reporting
- **Live SSE Streams:** Admins have access to Server-Sent Events (SSE) that stream vote totals in real-time.
- **Winner Declarations:** Beautiful, confetti-filled UI banners automatically declare winners when an election concludes.
- **Export Data:** Instantly export final election results as **CSV** or **PDF** documents for official auditing and record keeping.

### 🛡️ Security & Privacy
- **Cryptographic Receipts:** Every vote cast generates a unique receipt hash, ensuring transparency.
- **Audit Dashboard:** Admins have access to a dedicated `/admin/audit` page that tracks platform activity.
- **Role-Based Access:** Isolated dashboards for Admins, Voters, and Candidates.

### 📱 Progressive Web App (PWA)
- VOTEX can be installed directly to user devices (iOS, Android, Windows, Mac) as a standalone application.
- Works offline, loads instantly, and runs without browser chrome for a native-app experience.

---

## 🛠️ Technical Stack

- **Framework**: Next.js 15 (App Router), React 18, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma Client (v7+)
- **Authentication**: Custom JWT-based stateless auth (via `jose` for Edge Runtime compatibility)
- **Styling**: Tailwind CSS 3 with a custom cyberpunk aesthetic
- **State**: Zustand (Client State), TanStack Query (Server State caching)
- **Forms**: React Hook Form + Zod validation
- **Charts/PDF**: Recharts, jspdf, autotable
- **Notifications**: React Hot Toast

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Ensure your `.env` file is configured with your database URL and JWT secret:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/votex"
JWT_SECRET="your-secure-secret"
```

### 3. Database Migration & Seeding
Push the Prisma schema to your database and seed it with demo data:
```bash
npx prisma db push --accept-data-loss
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🎓 Demo Accounts & Setup

Because the platform uses a strict Multi-Tenant architecture, the easiest way to start is to register a new admin account:
1. Navigate to `/register` and create an account.
2. You will be automatically logged in to your new, isolated Admin dashboard.

Alternatively, if you ran the seed script, the following global demo accounts are available:

| Role | Email | Password | Dashboard Path |
|------|-------|----------|----------------|
| Admin | admin@votex.io | Demo@1234 | `/admin` |
| Voter | voter@votex.io | Demo@1234 | `/voter` |
| Candidate | candidate@votex.io | Demo@1234 | `/candidate` |
| Party Admin | party@votex.io | Demo@1234 | `/party` |

*Note: You can easily log into these accounts using the Quick Access buttons on the `/login` page.*

---

## 🏗️ Architecture

### Database Schema (Prisma)
- **Users**: Core identity containing role, credentials, and tenant `adminId`.
- **Elections**: The central entity, containing status (`DRAFT`, `UPCOMING`, `LIVE`, `ENDED`), a unique `searchCode`, and `settings` JSON for eligibility rules.
- **Vote**: The immutable record of a vote, linked to a User, Election, and Candidate.
- **AuditLog**: A tamper-evident log tracking critical actions within a tenant.

### API Architecture
- **Next.js API Routes (`app/api/*`)**: RESTful endpoints handling all core logic, strictly scoped by `adminId` for tenant isolation.
- **Server-Sent Events (`/api/votes/status`)**: Efficient, one-way real-time data streaming.
- **Edge Middleware (`middleware.ts`)**: Handles JWT verification, role-based route protection, and rate limiting.

---

## 📄 License

This project is open-source and free to use.

Made with ❤️ for communities worldwide.