# SUG Animation React Component

## Description
This repository contains a specialized, standalone, environment-aware React component `SugLogoAnimation` that plays the SUG logo visualization natively using GSAP and SVG masking.

## Domain Knowledge for AI Agents
When working with or interacting within this repository, maintain the following concepts:

1. **Architecture**: All of the animation code is centralized entirely inside `src/SugLogoAnimation.tsx`. `App.tsx` essentially just imports and renders it for demonstration purposes.
2. **GSAP**: The main timeline is controlled via GSAP. There is a precise sequence of zooms adjusting the `viewBox` absolutely from `INITIAL_VIEWBOX` out to `FINAL_VIEWBOX`. Avoid messing with these static viewBox string ratios as they perfectly center the geometry.
3. **Sensory Feedback**:
   - Platform detection evaluates `navigator.userAgent` to check if a user is currently on mobile or desktop.
   - If Mobile: Mobile devices use the `web-haptics` module with `useWebHaptics` hook.
   - If Desktop: It utilizes a native `AudioContext` fallback to generate a synthesized "swoosh" via an oscillator logic (`playSwoosh()`).
4. **CSS Conventions**: Structural layout is isolated in `src/SugLogoAnimation.css`, keeping absolute positioning clean. Do not mix it back into `styles.css`.
5. **Modification Rule**: If tasked to update timings or callbacks (`onAnimationComplete`), look for the `timeline` constructed inside the `useEffect`'s `gsap.context()` in `src/SugLogoAnimation.tsx`.

## Capabilities Used
- React
- TypeScript
- GSAP
- standard SVG rendering and nested tags
- HTML5 Web Audio API
- Web Haptics API