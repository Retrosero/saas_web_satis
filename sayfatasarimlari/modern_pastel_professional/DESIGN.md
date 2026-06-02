---
name: Modern Pastel Professional
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c4c6d3'
  surface-tint: '#405ba6'
  primary: '#405ba6'
  on-primary: '#ffffff'
  primary-container: '#7c96e6'
  on-primary-container: '#052b76'
  inverse-primary: '#b4c5ff'
  secondary: '#296956'
  on-secondary: '#ffffff'
  secondary-container: '#aff0d8'
  on-secondary-container: '#306f5c'
  tertiary: '#825246'
  on-tertiary: '#ffffff'
  tertiary-container: '#c48b7d'
  on-tertiary-container: '#4d261c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#25428d'
  secondary-fixed: '#aff0d8'
  secondary-fixed-dim: '#94d3bd'
  on-secondary-fixed: '#002118'
  on-secondary-fixed-variant: '#07513f'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#f6b8a9'
  on-tertiary-fixed: '#331109'
  on-tertiary-fixed-variant: '#673b30'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is defined by a philosophy of **Approachable Professionalism**. It moves away from the rigid, cold structures of traditional enterprise software toward a "Soft-Modern" aesthetic. The goal is to reduce cognitive load and user anxiety through a palette that feels breathable and interfaces that feel tactile yet lightweight.

The design style blends **Minimalism** with subtle **Glassmorphism**. It prioritizes high whitespace and clear typographic hierarchy, using soft edges and organic shapes to signal friendliness. While the colors are pastel, the execution remains disciplined and grid-aligned to maintain the professional B2B tone required for high-utility tasks. The emotional response should be one of calm, clarity, and modern efficiency.

## Colors

The color strategy for the design system replaces high-contrast corporate blues with a sophisticated pastel palette.

- **Primary (Soft Blue):** A muted, airy blue used for primary actions and brand recognition. It provides a sense of stability without the aggression of darker shades.
- **Secondary (Mint Green):** Used for accents, success states, and secondary call-outs, reinforcing the fresh and contemporary feel.
- **Neutral (Warm Grey):** The foundation of the UI. Backgrounds use a very light warm-white (#F8FAFC), while text uses a deep slate to ensure AAA accessibility.

Avoid using pure blacks (#000000) or pure whites (#FFFFFF) for large surfaces. Instead, use tinted greys to keep the interface feeling "soft" and integrated.

## Typography

Typography in this design system balances the friendly, rounded terminals of **Plus Jakarta Sans** for headings with the geometric precision of **Manrope** for functional body text.

- **Headlines:** Set in Plus Jakarta Sans with tighter letter spacing at larger sizes to create a modern, "editorial" look.
- **Body:** Manrope is chosen for its excellent legibility in B2B contexts (data tables, long-form settings, and dashboards).
- **Scale:** The system uses a major-third typographic scale. Ensure that on mobile devices, display sizes are capped to prevent overflow, switching to defined `-mobile` variants where necessary.

## Layout & Spacing

The design system utilizes a **Fluid Grid** model built on an 8px baseline.

- **Grid:** A 12-column layout for desktop (max-width 1440px) and a 4-column layout for mobile.
- **Rhythm:** Spacing should be generous. Use `md` (24px) for most internal padding to support the "light" brand feel.
- **Reflow:** On mobile, margins reduce to 16px to maximize screen real estate, while vertical spacing between sections remains high to prevent a cramped appearance. Components should stretch to full-width on mobile but sit in structured columns on desktop.

## Elevation & Depth

This design system eschews heavy, dark shadows in favor of **Tonal Layers** and **Ambient Softness**.

Depth is communicated through:

1.  **Surface Tiers:** Backgrounds are the lowest level. Cards and containers use a pure white surface to "pop" against the warm grey background.
2.  **Soft Shadows:** When elevation is required (e.g., modals or floating buttons), use "Natural Light" shadows—highly diffused, with a 10-15% opacity and a slight tint of the primary blue color rather than pure grey.
3.  **Backdrop Blurs:** Use a 12px-20px Gaussian blur on navigation bars and overlays to create a sense of vertical hierarchy without introducing heavy borders.

## Shapes

The shape language is the primary driver of the "approachable" feel. All interactive elements use a **generous corner radius**.

- **Standard Elements:** Buttons, input fields, and tags use a pill-shaped (full-round) or 16px radius.
- **Containers:** Large cards and modals use 24px-32px (`rounded-xl` or `rounded-2xl`) to create a soft, friendly frame for content.
- **Consistency:** Avoid mixing sharp corners with rounded corners. Even secondary elements like checkboxes should feature a 4px-6px radius to maintain the system's softness.

## Components

### Buttons

Buttons are pill-shaped. The primary button uses a solid Soft Blue fill with white text. Secondary buttons should use a ghost style (border only) or a subtle secondary-color tint with 10% opacity.

### Cards

Cards are the backbone of the B2B layout. They must feature a 24px corner radius, a subtle 1px border (#E2E8F0), and no shadow unless hovered. On hover, apply a soft ambient shadow to signal interactivity.

### Input Fields

Inputs should have a 12px radius and a light grey background (#F1F5F9). Upon focus, the background turns white and the border transitions to the primary primary color.

### Chips & Tags

Chips are fully rounded (pill-shaped) and use the pastel secondary and tertiary colors for categorization. Text within chips should always be semi-bold Manrope for legibility.

### Lists & Tables

Lists should have generous vertical padding (16px) between items. Tables should avoid heavy borders; use subtle horizontal dividers and alternate row shading (Zebra striping) in very light warm-grey tints.
