# 🚀 Lune Frontend - Quick Start Guide

Welcome! The entire Lune web frontend is ready to go. Here's everything you need to know:

## ✅ What's Been Created

Your complete Next.js frontend with:

- **Modern Stack**: Next.js 15 + TypeScript + Tailwind CSS
- **Design System**: Dual-theme (Solar Light ☀️ + Nebula Dark 🌙) with CSS variables
- **Three Universes**: Personal, Business, and Performance dashboards
- **Ready Components**: Button, Card, Badge, PageHeader primitives
- **Responsive Design**: Mobile-first with collapsible sidebar
- **Theme Switching**: Instant switching with localStorage persistence

## 🎯 Getting Started

### 1. Navigate to the frontend

```bash
cd apps/web
```

### 2. Install (if not already done)

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

**The app will be available at** `http://localhost:3000` (or 3001 if 3000 is busy)

### 4. Build for production

```bash
npm run build
npm start
```

## 🎨 Design System

### Tokens File
All design tokens live in `styles/tokens.css`:
- **Colors** (Solar Light + Nebula Dark)
- **Typography** (font stack)
- **Spacing** (radius values)
- **Shadows** (soft & subtle)

### Using Tokens in Components

All Tailwind classes automatically read from tokens:

```tsx
// These use CSS variables under the hood:
<div className="bg-surface text-text p-6 rounded-lg shadow-subtle">
  Content
</div>
```

Available token-based classes:
- **Colors**: `bg-surface`, `text-text`, `border-border`, `bg-primary`, `bg-accent`, etc.
- **Radii**: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`
- **Shadows**: `shadow-subtle`, `shadow-soft`

### Theme Switching

Use the hook anywhere:

```tsx
import { useTheme } from "@/components/theme/ThemeProvider";

export function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current: {theme}
    </button>
  );
}
```

## 📍 Routing Structure

```
/                          → Redirects to /app/personal
/app/personal              → Personal dashboard
  /accounts, /transactions, /budgets → Sub-sections

/app/business              → Business dashboard
  /clients, /projects, /invoices → Sub-sections

/app/performance           → Performance dashboard
  /workload, /health, /goals → Sub-sections
```

## 🧩 Component Library

All primitive components are in `components/ui/`:

### Button
```tsx
<Button variant="primary" size="md">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="subtle">Subtle</Button>
```

### Card
```tsx
<Card title="Title" description="Subtitle">
  Your content here
</Card>
```

### Badge
```tsx
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Error</Badge>
<Badge variant="info">Info</Badge>
```

### PageHeader
```tsx
<PageHeader 
  title="Page Title"
  description="Optional description"
  action={<Button>Action</Button>}
/>
```

## ⚙️ Configuration

### Environment Variables

Create/edit `.env.local`:

```env
# API Configuration (optional, defaults to localhost:3001)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Use it:

```tsx
import { API_BASE_URL } from "@/lib/config";

const response = await fetch(`${API_BASE_URL}/api/endpoint`);
```

## 📁 Project Structure

```
apps/web/
├── app/                      # Next.js App Router
│   ├── app/                  # Main app routes (layout wrapper)
│   │   ├── personal/         # Personal dashboard
│   │   ├── business/         # Business dashboard
│   │   └── performance/      # Performance dashboard
│   ├── layout.tsx            # Root layout (ThemeProvider wrapper)
│   └── page.tsx              # Redirect page
├── components/
│   ├── layout/               # AppShell, TopNav, SideNav
│   ├── theme/                # ThemeProvider
│   └── ui/                   # Button, Card, Badge, PageHeader
├── lib/
│   └── config.ts             # API configuration
├── styles/
│   ├── globals.css           # Global styles & Tailwind directives
│   └── tokens.css            # Design tokens
├── public/                   # Static assets
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies

```

## 🎮 Features Demo

### Theme Toggle
- Click the "🌙 Dark" / "☀️ Light" button in the top-right
- Theme persists across sessions
- Instant visual update

### Navigation
- Top bar shows current universe (Personal/Business/Performance)
- Sidebar shows section navigation
- Click sections to navigate
- Sidebar collapses on mobile

### Placeholder Pages
Each section has placeholder content showing:
- Overview pages with sample cards and data
- Sub-section pages with "coming soon" placeholders
- Fully styled with design system

## 🚀 Next Steps

### 1. Connect to Your API

Once your Fastify backend is running on port 3001:

```tsx
import { API_BASE_URL } from "@/lib/config";

// In your component:
const data = await fetch(`${API_BASE_URL}/api/endpoint`);
```

### 2. Add Real Data

Replace the placeholder data in pages with actual API calls using React Query, SWR, or fetch.

### 3. Expand Components

Add more UI components to `components/ui/` as needed:
- Input, Select, Textarea
- Modal, Dropdown, Tooltip
- Table, Chart components
- etc.

### 4. Add Pages

Create new routes by adding files in `app/app/*/`:

```tsx
// app/app/personal/new-section/page.tsx
import { PageHeader, Card } from "@/components/ui";

export default function NewSectionPage() {
  return (
    <div>
      <PageHeader title="New Section" />
      <Card>Your content</Card>
    </div>
  );
}
```

## 📦 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## 🎨 Customizing Themes

Edit `styles/tokens.css` to adjust colors:

```css
:root {
  /* Solar Light (default) */
  --color-primary: #4c6fff;  /* Change primary color */
  --color-accent: #f97316;   /* Change accent */
  /* ... */
}

:root.theme-dark {
  /* Nebula Dark */
  --color-primary: #4c6fff;  /* Keep consistent across themes */
  /* ... */
}
```

Then restart the dev server to see changes.

## ✨ Pro Tips

1. **Type Safety**: All components are fully typed—use TypeScript!
2. **Responsive**: Use Tailwind's `md:` and `lg:` prefixes for breakpoints
3. **Accessibility**: Buttons and links are semantic—extend with aria attributes as needed
4. **Performance**: Next.js automatically code-splits pages
5. **Dark Mode**: Test both themes during development (theme toggle in top-right)

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Let Next.js use next available port, or specify:
npm run dev -- -p 3001
```

**Theme not switching?**
- Check browser DevTools > Application > Local Storage (should have `lune-theme`)
- Ensure `ThemeProvider` wraps your app (it does in root layout)

**Components not styled?**
- Verify `@tailwind directives` in `styles/globals.css`
- Check `tailwind.config.ts` content globs include your files
- Restart dev server after config changes

**TypeScript errors?**
- Run `npm run build` to see all errors
- Check `tsconfig.json` paths are correct
- Ensure imports use `@/` alias

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎉 You're Ready!

Your frontend is production-ready. Start the dev server and begin building!

```bash
cd apps/web
npm run dev
```

Visit `http://localhost:3000` and explore! 🚀
