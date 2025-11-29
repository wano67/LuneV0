# Lune Web Frontend

A modern, responsive web frontend for the Lune finance management platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dual Theme System**: Solar Light (default) and Nebula Dark modes with seamless switching
- **Design Tokens**: Comprehensive CSS variable-based design system for consistency
- **Three Universes**: Personal, Business, and Performance dashboards
- **Responsive Layout**: Mobile-first design with collapsible sidebar navigation
- **Rich UI Components**: Button, Card, Badge, and PageHeader primitives
- **Type-Safe**: Full TypeScript support throughout

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with design tokens
- **Theme Management**: React Context with localStorage persistence
- **Package Manager**: npm / pnpm

## Getting Started

### Installation

```bash
cd apps/web
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Start the backend API from the monorepo root:

```bash
npm run dev:api
```

The Fastify server runs on http://localhost:3001 with Swagger docs at http://localhost:3001/docs.

### Building

```bash
npm run build
npm start
```

## Project Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── app/                      # Main app routes
│   │   ├── personal/            # Personal dashboard
│   │   ├── business/            # Business dashboard
│   │   └── performance/         # Performance dashboard
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Redirect to /app/personal
├── components/
│   ├── layout/                  # AppShell, TopNav, SideNav
│   ├── theme/                   # ThemeProvider, useTheme hook
│   └── ui/                      # Button, Card, Badge, PageHeader
├── lib/
│   └── config.ts               # API configuration
├── styles/
│   ├── globals.css             # Global styles & Tailwind
│   └── tokens.css              # Design tokens (colors, spacing, etc.)
├── public/                      # Static assets
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies
```

## Design System

### Color Tokens

The design system uses CSS variables for colors, enabling seamless theme switching:

- **Solar Light** (default): Bright, modern colors inspired by daylight
  - Background: `#f7f9fc`
  - Primary: `#4c6fff`
  
- **Nebula Dark**: Deep, cosmic colors
  - Background: `#050715`
  - Primary: `#4c6fff` (consistent across themes)

### Spacing & Radii

All spacing and border radius values are defined as CSS variables:
- Radius: `sm`, `md`, `lg`, `xl`
- Font: System UI fonts for optimal readability
- Shadows: `subtle` and `soft` for depth

### Theme Switching

Use the `useTheme()` hook to access and control theme:

```tsx
import { useTheme } from "@/components/theme/ThemeProvider";

export function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

## API Integration

The frontend is configured to connect to the backend API at `http://localhost:3001` by default.

Configure via environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Import and use:

```tsx
import { API_BASE_URL } from "@/lib/config";
```

## Authentication

- Primary flow: use `/signup` or `/login` in the web app. Successful auth stores the JWT + user in localStorage and all `/app/*` routes are protected.
- Optional dev override: set `NEXT_PUBLIC_LUNE_DEV_TOKEN` to a bearer token if you want to bypass the login UI during development. Runtime auth still takes precedence if you log in.

## Dashboard Universes

### Personal
- Overview of accounts, budgets, and financial status
- Transaction history and spending patterns
- Savings goals and financial score

### Business
- Revenue metrics and KPIs
- Invoice tracking and client management
- Project status and resource allocation
- Service breakdown and margin analysis

### Performance
- Cross-universe financial metrics
- Workload and time tracking
- Long-term goals and risk assessment
- Asset allocation and financial health index

## Development

### Adding a New Component

1. Create component file in appropriate `components/` subdirectory
2. Use TypeScript for type safety
3. Leverage design tokens via Tailwind classes (`bg-surface`, `text-text`, etc.)
4. Export from barrel file if in a subdirectory

Example:

```tsx
// components/ui/MyComponent.tsx
import React from "react";

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return <div className="bg-surface text-text p-6 rounded-lg">{title}</div>;
}
```

### Adding a New Page

Create a new file in the `app/` directory following Next.js conventions:

```tsx
// app/app/personal/new-section/page.tsx
import { PageHeader, Card } from "@/components/ui";

export default function NewSectionPage() {
  return (
    <div>
      <PageHeader title="New Section" />
      <Card>Content here</Card>
    </div>
  );
}
```

## Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Optional: dev token used for local authenticated calls (Bearer) if you want to bypass the login UI
NEXT_PUBLIC_LUNE_DEV_TOKEN=
```

To obtain a dev token:
1. Start the backend with `npm run dev:api`.
2. Open Swagger at http://localhost:3001/docs.
3. Use `POST /api/v1/auth/login` (or `POST /api/v1/auth/signup`) to get an `accessToken` in the response.
4. Paste that token into `NEXT_PUBLIC_LUNE_DEV_TOKEN` and restart `npm run dev`.

## Performance Notes

- CSS tokens use CSS variables for instant theme switching without page reload
- Sidebar drawer uses Tailwind's responsive utilities (hidden on mobile, visible on lg+)
- Design tokens minimize CSS output while maintaining customizability
- Next.js App Router provides automatic code splitting

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Contributing

When working on the frontend:

1. Follow the existing component structure
2. Use TypeScript for all new code
3. Leverage design tokens for styling
4. Ensure responsive design (mobile-first)
5. Test theme switching in both light and dark modes

## License

Part of the Lune project.
