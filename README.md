# SUG Creative Animation

A production-ready, highly optimized React standalone component for playing the SUG modern media animated logo. 

## Overview
This repository contains a robust implementation of complex nested SVGs wrapped with a GSAP timeline that performs continuous zooming, morphing, and rendering of the SUG logo.

The component is environmentally aware out-of-the-box:
- **Mobile Devices**: Hooks into `web-haptics` to generate precise physical hardware feedback corresponding to specific keyframes in the visual timeline.
- **Desktop/Web**: Generates low-latency, synthesized web audio swooshes using the `AudioContext` API to serve as auditory feedback synchronized with the keyframes since haptics are not available.

## Installation / Usage
Since the core logic has been fully extracted into isolated modules, using it in any React or Next.js app is incredibly simple.

1. Ensure the following dependencies are installed:
   ```bash
   npm install gsap web-haptics
   ```

2. Copy the component files into your project:
   - `src/SugLogoAnimation.tsx`
   - `src/SugLogoAnimation.css`

3. Import and render the component:
   ```tsx
   import { SugLogoAnimation } from "./path/to/SugLogoAnimation";

   export default function App() {
     return (
       <div style={{ width: "100vw", height: "100vh" }}>
         <SugLogoAnimation onAnimationComplete={() => console.log("Done!")} />
       </div>
     );
   }
   ```

## Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `className` | `string` | Optional CSS classes to append to the root wrapper. |
| `onAnimationComplete` | `() => void` | Optional callback fired when the final zoom keyframe settles. |

## Running this Repo
To run this preview repository locally:
```bash
npm install
npm run dev
```
Build for production:
```bash
npm run build
```