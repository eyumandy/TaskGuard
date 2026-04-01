# TaskGuard

A behavior-aware browser extension for reducing task switching during academic study sessions.

## Overview

TaskGuard tracks tab switching frequency, estimates off-task time using domain classification, and presents in-session feedback through a live dashboard. When users attempt to navigate to predefined distracting sites during an active study session, the system presents a brief reflective prompt rather than enforcing strict blocking.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style)
- **Package Manager**: pnpm

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
taskguard/
├── app/                  # Next.js App Router pages
│   ├── history/          # Session history view
│   ├── login/            # Authentication - login
│   ├── session/          # Active study session dashboard
│   ├── settings/         # User settings & domain customization
│   ├── signup/           # Authentication - sign up
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── app-header.tsx    # App-wide header
│   ├── ascii-water.tsx   # Animated hero background
│   ├── hero-panel.tsx    # Landing page hero panel
│   ├── hero.tsx          # Landing page hero section
│   ├── nav-bar.tsx       # Navigation bar
│   ├── status-bar.tsx    # Session status bar
│   └── theme-provider.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Authors

- Whitnie Ojie-Ahamiojie
- Rocco Tammone
- Anthony Cao
- Yumandy Espinosa

University of Florida — HCI Course Project, 2026