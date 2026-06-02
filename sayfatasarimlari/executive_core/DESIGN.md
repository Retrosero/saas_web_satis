---
name: Executive Core
colors:
  surface: '#faf9ff'
  surface-dim: '#ccdaff'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d8e2ff'
  on-surface: '#051a3e'
  on-surface-variant: '#434654'
  inverse-surface: '#1d3054'
  inverse-on-surface: '#edf0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#006c47'
  on-secondary: '#ffffff'
  secondary-container: '#82f9be'
  on-secondary-container: '#00734c'
  tertiary: '#5e3c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#7d5200'
  on-tertiary-container: '#ffca81'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#82f9be'
  secondary-fixed-dim: '#65dca4'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#ffddb3'
  tertiary-fixed-dim: '#ffb950'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#faf9ff'
  on-background: '#051a3e'
  surface-variant: '#d8e2ff'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
  max-width: 1440px
---

## Brand & Style

The design system is engineered for high-stakes B2B environments where clarity, speed, and reliability are paramount. It targets operations managers and sales executives who require a "cockpit" experience—one that prioritizes information density without sacrificing cognitive ease.

The aesthetic follows a **Modern Corporate** direction. It is inspired by the precision of high-end SaaS platforms, utilizing a systematic approach to whitespace and hierarchy. The interface feels architectural: structured, dependable, and quietly powerful. It avoids unnecessary flourishes, relying instead on perfect alignment, subtle tonal shifts, and exceptional typography to guide the user through complex workflows.

The emotional response should be one of **total control**. Users should feel that the system is an extension of their professional intent, providing a high-performance environment for data-driven decision-making.

## Colors

The palette is rooted in a "functional color" philosophy. **Corporate Blue** is reserved for primary actions and navigational cues, signifying importance and brand presence.

- **Primary (#0052CC):** Used for CTA buttons, active navigation states, and primary focus indicators.
- **Success (#36B37E):** Indicates positive growth, completed sales, and healthy operational statuses.
- **Warning (#FFAB00):** Highlights pending approvals, approaching deadlines, or low-stock alerts.
- **Error (#FF5630):** Reserved for critical failures, declined transactions, and validation errors.
- **Neutral Hierarchy:** We utilize a grayscale derived from `#091E42`. Deep navy for text ensures high contrast, while softer slates are used for borders and secondary metadata.

Surface colors utilize a subtle off-white background (`#F4F5F7`) to allow white cards and containers to pop, creating a clear sense of layering and organization.

## Typography

This design system uses **Inter** for its neutral, systematic character. It is optimized for screen legibility and provides the necessary weights for complex UI hierarchies.

- **Headlines:** Use SemiBold (600) or Bold (700) with slight negative letter-spacing for a modern, tight appearance in dashboards.
- **Body Text:** The standard reading size is 14px (`body-md`), providing a balance between data density and readability.
- **Labels:** Small caps or uppercase labels are used for table headers and section titles to differentiate them from actionable content.
- **Numerical Data:** For financial figures and currency (TL), use a slightly tighter tracking to keep large numbers legible within table cells.
- **Currency Format:** Always suffix values with "TL" (e.g., `1.250,00 TL`) using standard Turkish localized formatting (dot for thousands, comma for decimals).

## Layout & Spacing

The layout employs a **12-column fluid grid** for the main content area, with a fixed-width sidebar (240px or 280px).

- **Density:** High. Margins and gutters are kept tight (16px–24px) to maximize the "above-the-fold" visibility of data tables and charts.
- **Rhythm:** A 4px baseline grid governs all spatial decisions. Padding inside components like inputs and table cells should adhere strictly to these increments.
- **Adaptivity:**
  - **Desktop (1280px+):** Full 12-column display.
  - **Tablet (768px - 1279px):** Sidebar collapses to icons; 8-column grid for content.
  - **Mobile (<767px):** Single column. Navigation moves to a bottom bar or hamburger menu.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and subtle **Ambient Shadows**.

- **Level 0 (Background):** `#F4F5F7`. The base layer for the entire application.
- **Level 1 (Cards/Sidebar):** `#FFFFFF`. High-contrast surfaces that house primary content. These use a very soft 1px border (`#DFE1E6`) instead of heavy shadows to maintain a clean look.
- **Level 2 (Modals/Popovers):** Surface with a medium shadow (8% opacity, 12px blur) to indicate temporary overlay status.
- **Interactions:** Hover states on interactive cards should trigger a slight lift (2px Y-offset) or a change in border-color to the primary brand color.

## Shapes

The design system utilizes **Soft** roundedness (`0.25rem` or 4px) for most components. This choice reflects a professional, "standard-issue" tool aesthetic—more approachable than sharp corners, but more serious than highly rounded "bubbly" consumer apps.

- **Standard (4px):** Buttons, Input fields, Checkboxes.
- **Large (8px):** Main content cards, Modals, and Dashboard widgets.
- **Circular:** Reserved strictly for user avatars and status indicators (pills).

## Components

### Data Tables

Tables are the heart of this system. They must feature:

- Fixed headers on scroll.
- Zebra striping (very subtle) or row-hover highlights.
- Condensed vertical padding (8px–12px) for high density.
- Inline status chips (e.g., "Paid" in Success Green).

### Inputs & Forms

Forms use a top-aligned label pattern for clarity.

- **Validation:** Errors must include both a red border and a helper icon/text below the field.
- **Active State:** A 2px focus ring using the Primary Blue with 20% opacity.

### Sidebars

A dark-themed or high-contrast sidebar (`#091E42`) helps distinguish navigation from the work area. Active states should be indicated with a left-edge accent bar in Primary Blue.

### Toast Notifications

Positioned at the top-right. They should be slim, with a color-coded icon on the left (Success, Info, Warning, Error) and a clear "Dismiss" action.

### System States

- **Loading:** Use skeleton screens that mimic the layout of the table or card rather than a generic spinner.
- **Empty:** Centered illustration (line-art) with a clear "Primary CTA" to help the user get started.
- **Error State:** A full-page or container-specific message with a "Retry" button and a technical log code if applicable.
