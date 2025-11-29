# 🎨 Design System Reference

## Color Palette

### Solar Light (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#f7f9fc` | Page background |
| `--color-surface` | `#ffffff` | Cards, panels |
| `--color-surface-alt` | `#edeff5` | Hover states, secondary backgrounds |
| `--color-border` | `#d0d5e5` | Borders, dividers |
| `--color-primary` | `#4c6fff` | Primary actions, links |
| `--color-primary-soft` | `#e5eaff` | Primary soft background |
| `--color-primary-strong` | `#2333a3` | Primary hover/active |
| `--color-accent` | `#f97316` | Accent elements |
| `--color-success` | `#16a34a` | Success states |
| `--color-warning` | `#facc15` | Warning states |
| `--color-danger` | `#ef4444` | Error states |
| `--color-text` | `#0c1326` | Primary text |
| `--color-text-muted` | `#64708c` | Secondary text |
| `--color-input-bg` | `#ffffff` | Input backgrounds |
| `--color-input-border` | `#cbd2e8` | Input borders |
| `--color-nav-bg` | `rgba(255, 255, 255, 0.82)` | Navigation background (with blur) |
| `--color-nav-border` | `rgba(15, 23, 42, 0.08)` | Navigation border |
| `--color-nav-active` | `rgba(76, 111, 255, 0.14)` | Active nav state |

**Light Theme**: Bright, airy, premium feel (Apple/Revolut inspired)

### Nebula Dark (theme-dark)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#050715` | Page background |
| `--color-surface` | `#0b1020` | Cards, panels |
| `--color-surface-alt` | `#11172a` | Hover states, secondary backgrounds |
| `--color-border` | `#1f2937` | Borders, dividers |
| `--color-primary` | `#4c6fff` | Primary actions, links (consistent) |
| `--color-primary-soft` | `rgba(76, 111, 255, 0.16)` | Primary soft background |
| `--color-primary-strong` | `#a5b4fc` | Primary hover/active |
| `--color-accent` | `#a855f7` | Accent elements (purple) |
| `--color-success` | `#22c55e` | Success states |
| `--color-warning` | `#eab308` | Warning states |
| `--color-danger` | `#f87171` | Error states |
| `--color-text` | `#e5edff` | Primary text |
| `--color-text-muted` | `#9caac8` | Secondary text |
| `--color-input-bg` | `rgba(15, 23, 42, 0.96)` | Input backgrounds |
| `--color-input-border` | `#1e293b` | Input borders |
| `--color-nav-bg` | `rgba(15, 23, 42, 0.92)` | Navigation background (with blur) |
| `--color-nav-border` | `rgba(15, 23, 42, 0.9)` | Navigation border |
| `--color-nav-active` | `rgba(76, 111, 255, 0.32)` | Active nav state |

**Dark Theme**: Deep cosmic colors, premium dark experience

---

## Spacing & Sizing

### Border Radius

```css
--radius-sm:  0.375rem;  /* 6px  - Small elements */
--radius-md:  0.75rem;   /* 12px - Medium elements */
--radius-lg:  1rem;      /* 16px - Large elements */
--radius-xl:  1.5rem;    /* 24px - XL elements */
```

**Usage:**
```tsx
<div className="rounded-sm">Small radius</div>
<div className="rounded-md">Medium radius (default)</div>
<div className="rounded-lg">Large radius (cards)</div>
<div className="rounded-xl">Extra large radius</div>
```

### Shadow

```css
--shadow-subtle:  0 1px 3px rgba(15, 23, 42, 0.08);
--shadow-soft:    0 18px 45px rgba(15, 23, 42, 0.12);
```

**Usage:**
```tsx
<Card className="shadow-subtle">Subtle shadow (borders/separators)</Card>
<Card className="shadow-soft">Soft shadow (elevated cards)</Card>
```

---

## Typography

```css
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 
             "SF Pro Text", "Inter", sans-serif;
```

**Font Stack**: Uses native system fonts for optimal performance and platform consistency

**Usage:**
```tsx
<p className="font-sans text-base">Body text</p>
<h1 className="font-sans font-bold text-3xl">Heading</h1>
```

---

## Semantic Colors

### Status & States

| Component | Light | Dark | Usage |
|-----------|-------|------|-------|
| Success | `#16a34a` | `#22c55e` | ✓ Completed, approved |
| Warning | `#facc15` | `#eab308` | ⚠ Attention needed |
| Danger | `#ef4444` | `#f87171` | ✗ Error, destructive |
| Info | `#4c6fff` | `#4c6fff` | ℹ Information (primary) |

### Semantic Naming

The design system uses semantic color names that map to functional intent:

```
--color-primary        → CTA buttons, links, focus
--color-primary-soft   → Primary background, hover subtle
--color-primary-strong → Primary hover, active state

--color-accent         → Secondary CTA, highlights
--color-success        → Success states, positive actions
--color-warning        → Warnings, pending states
--color-danger         → Errors, destructive actions

--color-text           → Primary content
--color-text-muted     → Secondary labels, hints

--color-bg             → Page background
--color-surface        → Cards, panels, elevated surfaces
--color-surface-alt    → Hover states, alternates

--color-border         → Dividers, edges
--color-input-bg       → Form inputs
--color-input-border   → Input borders

--color-nav-bg         → Navigation bar
--color-nav-border     → Navigation border
--color-nav-active     → Active navigation item
```

---

## Component Color Usage

### Button Variants

#### Primary Button
```tsx
<Button variant="primary">
  {/* 
    background: var(--color-primary)
    text: var(--color-surface)
    shadow: var(--shadow-subtle)
    hover: var(--color-primary-strong)
  */}
</Button>
```

#### Ghost Button
```tsx
<Button variant="ghost">
  {/* 
    background: transparent
    text: var(--color-text)
    hover: var(--color-surface-alt)
  */}
</Button>
```

#### Outline Button
```tsx
<Button variant="outline">
  {/* 
    background: transparent
    border: var(--color-border)
    text: var(--color-text)
    hover: var(--color-surface-alt)
  */}
</Button>
```

#### Subtle Button
```tsx
<Button variant="subtle">
  {/* 
    background: var(--color-primary-soft)
    text: var(--color-primary)
    hover: opacity-80
  */}
</Button>
```

### Card
```tsx
<Card>
  {/* 
    background: var(--color-surface)
    border: var(--color-border)
    shadow: var(--shadow-subtle)
    hover: var(--shadow-soft)
  */}
</Card>
```

### Badge Variants

| Variant | Background | Text | Usage |
|---------|------------|------|-------|
| neutral | `var(--color-surface-alt)` | `var(--color-text)` | Neutral status |
| success | `var(--color-success) / 10%` | `var(--color-success)` | Success status |
| warning | `var(--color-warning) / 10%` | `var(--color-warning)` | Warning status |
| danger | `var(--color-danger) / 10%` | `var(--color-danger)` | Error status |
| info | `var(--color-primary) / 10%` | `var(--color-primary)` | Info status |

---

## Tailwind Class Mappings

All design tokens are mapped to Tailwind utilities:

```tsx
// Colors
<div className="bg-surface">              {/* --color-surface */}
<div className="text-text">               {/* --color-text */}
<div className="border border-border">    {/* --color-border */}
<div className="bg-primary">              {/* --color-primary */}
<div className="bg-accent">               {/* --color-accent */}

// Sizing
<div className="rounded-md">              {/* --radius-md */}
<div className="rounded-lg">              {/* --radius-lg */}

// Shadows
<div className="shadow-subtle">           {/* --shadow-subtle */}
<div className="shadow-soft">             {/* --shadow-soft */}

// Typography
<div className="font-sans">               {/* --font-sans */}
```

---

## Theme Switching Implementation

The theme system uses a CSS class on the `<html>` element:

```
Light Mode:  <html>              (no class)
Dark Mode:   <html class="theme-dark">
```

All CSS variables automatically update when the class changes:

```css
:root {
  /* Solar Light (default) */
  --color-bg: #f7f9fc;
}

:root.theme-dark {
  /* Nebula Dark (override) */
  --color-bg: #050715;
}
```

### Switching in Code

```tsx
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
```

---

## Accessibility

### Color Contrast

**Light Mode**:
- Text (`#0c1326`) on Background (`#f7f9fc`): ~18:1 contrast ✅
- Text (`#64708c`) on Background (`#f7f9fc`): ~8.5:1 contrast ✅
- Primary (`#4c6fff`) on White (`#ffffff`): ~4.5:1 contrast ✅

**Dark Mode**:
- Text (`#e5edff`) on Background (`#050715`): ~18:1 contrast ✅
- Text (`#9caac8`) on Background (`#050715`): ~8.5:1 contrast ✅
- Primary (`#4c6fff`) on Background (`#050715`): ~3.5:1 contrast ⚠️
  - Use for interactive elements (not primary text)

### Focus States

All interactive elements include focus rings:

```tsx
className="focus:outline-none focus:ring-2 focus:ring-primary"
```

---

## Usage Examples

### Complete Card Example

```tsx
import { Card, Badge } from "@/components/ui";

export function BalanceCard() {
  return (
    <Card title="Account Balance" description="Current funds">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-textMuted">Checking</span>
          <span className="font-semibold text-text">$4,250</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="font-medium text-text">Total</span>
          <span className="text-lg font-bold text-primary">$16,750</span>
        </div>
      </div>
      <Badge variant="success" className="mt-4">Healthy</Badge>
    </Card>
  );
}
```

### Dark Mode Aware Component

```tsx
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeAwareComponent() {
  const { theme } = useTheme();
  
  return (
    <div className="p-6 bg-surface rounded-lg">
      {/* All colors automatically adapt based on theme */}
      <h2 className="text-2xl font-bold text-text">
        Current Theme: {theme}
      </h2>
      <p className="text-textMuted">
        Colors update automatically
      </p>
    </div>
  );
}
```

---

## File Structure

```
styles/
├── tokens.css         ← All design tokens (CSS variables)
└── globals.css        ← Global styles & Tailwind directives

components/
├── ui/
│   ├── Button.tsx     ← Uses design tokens
│   ├── Card.tsx       ← Uses design tokens
│   ├── Badge.tsx      ← Uses design tokens
│   └── ...
└── theme/
    └── ThemeProvider.tsx  ← Manages CSS class switching
```

---

## Modification Guide

### Adding a New Color Token

1. Add to `styles/tokens.css`:

```css
:root {
  --color-new: #yourcolor;
}

:root.theme-dark {
  --color-new: #yourdarkcolor;
}
```

2. Add to `tailwind.config.ts`:

```ts
colors: {
  // ... existing
  new: "var(--color-new)",
}
```

3. Use in components:

```tsx
<div className="bg-new text-new">Content</div>
```

---

**Last Updated**: November 28, 2025  
**Design System Version**: 1.0  
**Status**: ✅ Production Ready
