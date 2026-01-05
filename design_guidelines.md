# DOCU243 Design Guidelines

## Design Approach
**Government Digital Platform** - Drawing from institutional design systems like GOV.UK, France Connect, and modern governmental portals. The aesthetic must convey state authority, security, and accessibility while remaining modern and user-friendly.

## Core Principles
- **Institutional Authority**: Professional government service, not startup aesthetic
- **Universal Accessibility**: Low-literacy friendly, works on basic devices
- **Trust & Security**: Clear, transparent interactions
- **Simplicity First**: Minimal cognitive load for all users

## Color System

**Primary Colors (Congo National)**
- Primary Blue: `#3774b6` - Dominant color for CTAs, navigation, progress states
- Danger Red: `#ce1021` - Errors, rejections, critical alerts only
- Warning Yellow: `#f7d116` - Pending states, important notifications

**Secondary UI Colors**
- Primary Dark: `#1f3f66` - Headers, footers
- Primary Light: `#eaf1f9` - Section backgrounds
- Success Green: `#2ecc71` - Confirmed payments, approvals
- Attention Orange: `#f39c12` - Important actions

**Neutral Palette**
- Text Main: `#1a1a1a`
- Text Muted: `#6b7280`
- Border: `#e5e7eb`
- Background: `#f9fafb`

## Typography
- **System**: Clear, accessible sans-serif (Inter or similar)
- **Minimum size**: 14px for all body text
- **Hierarchy**: Bold primary headers (24-32px), medium subheaders (18-20px), regular body (14-16px)
- **Line height**: 1.6 for readability

## Layout System
**Spacing**: Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
**Containers**: Max-width of 1280px for main content
**Cards**: White backgrounds with subtle borders, 8px border-radius
**Grid**: Responsive 12-column grid, stack to single column on mobile

## Component Library

**Buttons**
- Primary: Blue background `#3774b6`, white text, 8px radius, 600 weight
- Secondary: Transparent with 2px blue border
- Danger: Red background `#ce1021` for critical actions
- All buttons include icon + text (never color alone)

**Navigation**
- Top bar: Blue `#3774b6` background, white text
- Persistent breadcrumbs for multi-step processes
- Mobile: Hamburger menu with clear hierarchy

**Forms**
- Large touch targets (min 44px height)
- Clear labels above inputs
- Inline validation with icon + text feedback
- Progress indicators for multi-step forms

**Status Indicators**
- Blue: In progress
- Green: Validated/Completed
- Yellow: Pending/Awaiting
- Red: Rejected/Error
- Always combine color + icon + text

**Cards & Data Display**
- White cards on light gray background
- Subtle shadows for depth
- Clear information hierarchy
- Document preview thumbnails where applicable

## Critical Design Constraints

**PWA Requirements**
- Offline-first interface design
- Minimal asset sizes (<5MB total)
- Service worker compatible
- Clear offline/online state indicators

**Accessibility (WCAG AA)**
- WCAG AA contrast minimum
- Icons always paired with text
- High contrast mode ready
- Large touch targets (44px minimum)

**Mobile First**
- Design for 360px viewport upward
- Single column layouts for mobile
- Bottom navigation for key actions on mobile
- Thumb-friendly interaction zones

## Page Structure

**Header**: Blue background, white DOCU243 logo, user status indicator, language toggle
**Main Content**: White/light gray alternating sections, clear visual breaks
**Footer**: Dark blue `#1f3f66`, essential links, government branding

## Images
- **Hero Section**: Yes - use inspirational imagery showing Congolese citizens engaging with digital services (diverse ages, urban/rural contexts)
- **Service Icons**: Custom illustrative icons representing administrative services
- **Document Previews**: Thumbnail representations of official documents
- **Trust Indicators**: Government seals, security badges

All buttons on images require backdrop blur for legibility.

## Animations
**Minimal and Purposeful**
- Progress bar animations for document processing
- Smooth transitions between workflow steps
- Subtle success confirmations
- No decorative animations that slow interaction

## Key Differentiators
- Government blue dominates all interfaces
- Clear status communication throughout user journeys
- Multi-step process visualization
- Offline capability indicators
- Trust markers (government seals, security indicators)
- Low-bandwidth optimized design