# CrownSide 👑

CrownSide is a Detroit-rooted beauty booking platform designed to connect clients with trusted Beauty Professionals — including hair stylists and nail technicians — through a modern, soulful, and culturally intentional experience.

Built with scalability in mind, CrownSide empowers Beauty Pros to manage their own storefronts while giving clients an easy way to discover, book, and review services.

---

## 🌆 Vision

CrownSide was created to serve Metro Detroit’s beauty community with a platform that feels:
- Professional, not corporate
- Soulful, not generic
- Culturally aware, not performative

Our goal is to make booking beauty services seamless while giving Beauty Pros real tools to grow their business.

---

## ✨ Core Features (MVP)

### Client Experience
- Browse Beauty Pros (Hair, Nails, & Lash/Brow Tech)
- View professional storefronts
- Book appointments
- Leave reviews and ratings
- Mobile-first experience

### Beauty Pro Experience
- Register as a Beauty Pro (Select services: Hair, Nails, Lash/Brow Tech)
- 30-day free trial (payment method required)
- Custom storefront with:
  - Profile photo
  - Banner image
  - Services offered
  - Availability
- Manage appointments
- Manage subscription and payment method

### Admin Panel
- Dashboard overview
- Manage users & Beauty Pros
- Control subscription pricing
- Manage hero sections (desktop & mobile)
- Platform-level configuration
- Content and feature management

---

## 💳 Subscription Model

- **Beauty Pro (1 Service)**  
  $24.99 / month  
  *Includes access to Hair OR Nails OR Lash/Brow Tech.*

- **Beauty Pro Elite (2 Services)**  
  $34.99 / month  
  *Includes access to any two services (e.g. Hair + Nails).*

- **Beauty Pro Premier (3 Services)**  
  $49.99 / month  
  *Includes access to all services (Hair, Nails, and Lash/Brow Tech).*

> Pricing and trial settings are fully configurable from the Admin Panel.

---

## 🛠 Tech Stack

### Frontend
- Modern JavaScript framework (client folder)
- Mobile-first UI
- Bottom navigation for mobile
- Desktop header navigation

### Backend
- Node.js
- Express
- Prisma ORM
- PostgreSQL (AWS RDS)
- JWT Authentication

### Payments
- Stripe (checkout + subscriptions)
- Trial enforcement with payment method on file

---

## 📂 Project Structure

```text
crownside/
├── client/        # Frontend application
├── server/        # Backend API & business logic
│   ├── prisma/    # Prisma schema & migrations
│   ├── src/
│   │   ├── controllers
│   │   ├── routes
│   │   ├── middleware
│   │   └── app.js
├── .gitignore
└── README.md

<!-- Redeploy Trigger: 2026-01-16 for Env Var Update -->
