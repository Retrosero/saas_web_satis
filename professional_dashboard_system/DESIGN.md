---
name: Professional Dashboard System
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
  on-surface-variant: '#454650'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#767681'
  outline-variant: '#c6c5d1'
  surface-tint: '#4f5a99'
  primary: '#00083d'
  on-primary: '#ffffff'
  primary-container: '#121e5c'
  on-primary-container: '#7d88cb'
  inverse-primary: '#bac3ff'
  secondary: '#006a60'
  on-secondary: '#ffffff'
  secondary-container: '#51fbe7'
  on-secondary-container: '#007167'
  tertiary: '#0c1015'
  on-tertiary: '#ffffff'
  tertiary-container: '#21252a'
  on-tertiary-container: '#888c92'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#061353'
  on-primary-fixed-variant: '#374280'
  secondary-fixed: '#51fbe7'
  secondary-fixed-dim: '#1edecb'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#dfe2e9'
  tertiary-fixed-dim: '#c3c7cd'
  on-tertiary-fixed: '#181c21'
  on-tertiary-fixed-variant: '#43474d'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  sidebar-width: 280px
  gutter: 24px
---

## Brand & Style

This design system is built for high-performance SaaS and enterprise environments, prioritizing clarity, efficiency, and a refined aesthetic. The brand personality is authoritative yet energetic, achieved through a sophisticated "midnight" foundation contrasted by a high-visibility turquoise accent.

The visual style follows a **Corporate Modern** approach with subtle hints of **Glassmorphism** in specific interactive states. It balances deep, dark navigation components with a clean, airy workspace to reduce cognitive load while maintaining a premium feel. The interface feels intentional and structured, utilizing a generous border radius to soften the technical nature of data-heavy layouts.

## Colors

The color strategy uses a **Deep Navy (#121E5C)** as the primary brand anchor, primarily utilized for structural navigation elements (sidebars, headers) to provide a sense of stability and depth. The **Vibrant Turquoise (#00D7C4)** serves as the high-contrast accent color, reserved strictly for primary actions, active states, and critical selection markers.

*   **Primary Surface:** In light mode, use a very light cool gray (#F4F7FE) for backgrounds to differentiate from pure white containers.
*   **Sidebar Context:** The sidebar operates on a dark-theme logic regardless of the main content mode, using the deep navy background with white or low-opacity white text for secondary items.
*   **Functional Colors:** Use the vibrant turquoise for "Success" and "Active" states. A muted red is reserved for errors and destructive actions to maintain professional restraint.

## Typography

The typography system relies on **Hanken Grotesk** to deliver a sharp, contemporary, and highly legible experience. 

*   **Hierarchy:** Headings use a semi-bold weight with tight letter-spacing to create a strong visual impact.
*   **Captions & Labels:** Section headers in the sidebar and data labels use the `label-sm` style—all-caps with increased letter-spacing to ensure distinct categorization.
*   **Readability:** Body text is set with a comfortable 1.5x line height to ensure long-form data or descriptions remain approachable.

## Layout & Spacing

The layout utilizes a **Fixed-Fluid Hybrid** model. The sidebar is fixed at 280px to provide a consistent navigation anchor, while the main content area uses a fluid 12-column grid with 24px gutters.

*   **Margins:** Main page containers should maintain a 32px (xl) margin on desktop to provide breathing room.
*   **Density:** Interactive components (buttons, inputs) utilize a comfortable 12px vertical and 24px horizontal padding to support the 15px roundedness.
*   **Breakpoints:** At 1024px, the sidebar collapses into a hamburger menu or a slim icon-only bar to maximize content space on tablets.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Ambient Shadows**. 

*   **Base Layer:** The primary background uses a cool, off-white tint.
*   **Card Layer:** Content containers are pure white with a very soft, diffused shadow (0px 4px 20px rgba(18, 30, 92, 0.05)) to separate them from the background.
*   **Sidebar Depth:** The sidebar uses a flat, deep navy color but utilizes a subtle inner border (1px white at 10% opacity) on active items to create a sense of inset depth.
*   **Interactions:** Hover states on cards should slightly lift the element using a more pronounced shadow rather than a border change.

## Shapes

The signature of this design system is a **15px border radius** applied across all primary UI components. This specific radius (falling under the `Rounded` category) creates a modern, friendly, yet professional silhouette.

*   **Consistency:** Buttons, input fields, cards, and selection overlays (like the active menu item in the sidebar) must all adhere to the 15px radius.
*   **Exceptions:** Smaller nested elements (like tags or chips) may use a "Pill" shape (full radius) to distinguish them from structural containers.

## Components

### Buttons
*   **Primary:** Solid Turquoise (#00D7C4) with Dark Navy text (#121E5C). This ensures maximum visibility and follows the provided reference for active items.
*   **Secondary/Ghost:** Transparent background with a 1.5px Navy border or Navy text.
*   **Radius:** 15px strictly enforced.

### Sidebar Items
*   **Active State:** Background set to Turquoise (#00D7C4) with the radius applied. Text/Icons within active items should switch to the primary Navy for contrast.
*   **Inactive State:** White text at 70-80% opacity. Icons should be line-art style with a 2px stroke width.

### Input Fields
*   Backgrounds should be a very light gray with a 1px border that turns Turquoise on focus. The 15px radius applies here to maintain harmony with the buttons.

### Logo & Branding
*   The logo should utilize the Primary Navy and Turquoise palette. For dark backgrounds (sidebar), use the Turquoise mark with White typography. For light backgrounds, use the Navy typography.

### Chips & Badges
*   Used for status (e.g., "Pending", "2" notifications). Notifications should use a deep crimson (#E11D48) as seen in the reference image to stand out against the navy sidebar.