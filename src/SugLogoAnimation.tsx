import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useWebHaptics } from "web-haptics/react";
import "./SugLogoAnimation.css";

// ViewBox definitions for camera movement (All absolutely centered at 187.5, 187.5)
const INITIAL_VIEWBOX = "97.5 97.5 180 180"; // Zoomed in on center
const ARROW_ONE_VIEWBOX = "77.5 77.5 220 220"; // Slightly zoomed out, centered
const ARROW_TWO_VIEWBOX = "57.5 57.5 260 260"; // Further zoomed out, centered
const ARROW_THREE_VIEWBOX = "37.5 37.5 300 300"; // Almost full view, centered
const FINAL_VIEWBOX = "0 0 375 375"; // Full logo view, centered

type ArrowCue = 1 | 2 | 3;

interface SugLogoAnimationProps {
  className?: string;
  onAnimationComplete?: () => void;
}

export function SugLogoAnimation({ className = "", onAnimationComplete }: SugLogoAnimationProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const bgWashRef = useRef<HTMLDivElement>(null);
  const bgInnerRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLDivElement>(null);
  const circleGroupRef = useRef<SVGGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const sheenRef = useRef<SVGCircleElement>(null);
  const sRef = useRef<SVGPathElement>(null);
  const arrowOneRef = useRef<SVGGElement>(null);
  const arrowTwoRef = useRef<SVGGElement>(null);
  const arrowThreeRef = useRef<SVGGElement>(null);
  const whiteBgRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<GSAPTimeline | null>(null);
  const bgLoopRef = useRef<gsap.core.Tween | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const { trigger, isSupported } = useWebHaptics();
  
  // Environment detection
  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Initialize audio context
  const ensureAudio = async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch {
        // Auto-play might be blocked by browser policy; handle silently
      }
    }

    return audioContextRef.current;
  };

  // Sound generator
  const playSwoosh = async ({
    from,
    to,
    duration,
    volume,
  }: {
    from: number;
    to: number;
    duration: number;
    volume: number;
  }) => {
    const ctx = await ensureAudio();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      filter.type = "lowpass";
      filter.Q.value = 5;

      const now = ctx.currentTime;

      osc.frequency.setValueAtTime(from, now);
      osc.frequency.exponentialRampToValueAtTime(to, now + duration);

      filter.frequency.setValueAtTime(from * 2, now);
      filter.frequency.exponentialRampToValueAtTime(to * 0.5, now + duration);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + duration * 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch {
      // Ignore audio generation errors
    }
  };

  const executeSensoryFeedback = async (cue: ArrowCue) => {
    if (isMobile && isSupported) {
      // Mobile: Play Haptics
      if (cue === 1) trigger([{ duration: 40, intensity: 0.9 }]);
      else if (cue === 2) trigger([{ duration: 60, intensity: 1.0 }]);
      else if (cue === 3) trigger([{ duration: 50, intensity: 1.0 }, { delay: 40, duration: 80, intensity: 1.0 }]);
    } else if (!isMobile) {
      // Desktop: Play Sound
      if (cue === 1) await playSwoosh({ from: 600, to: 1000, duration: 0.25, volume: 0.2 });
      else if (cue === 2) await playSwoosh({ from: 800, to: 1200, duration: 0.28, volume: 0.25 });
      else if (cue === 3) await playSwoosh({ from: 1000, to: 1500, duration: 0.3, volume: 0.3 });
    }
  };

  const completeSensoryFeedback = () => {
    if (isMobile && isSupported) {
      trigger([{ duration: 80, intensity: 1.0 }, { delay: 50, duration: 100, intensity: 1.0 }]);
    } else if (!isMobile) {
      void playSwoosh({ from: 1200, to: 600, duration: 0.5, volume: 0.3 });
    }
  };

  useEffect(() => {
    if (
      !scopeRef.current ||
      !svgRef.current ||
      !bgWashRef.current ||
      !bgInnerRef.current ||
      !noiseRef.current ||
      !circleGroupRef.current ||
      !circleRef.current ||
      !sheenRef.current ||
      !sRef.current ||
      !arrowOneRef.current ||
      !arrowTwoRef.current ||
      !arrowThreeRef.current ||
      !whiteBgRef.current
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const sLength = sRef.current?.getTotalLength() ?? 1000;

      setIsSettled(false);

      bgLoopRef.current?.kill();
      timelineRef.current?.kill();

      // Initial state setup
      gsap.set(whiteBgRef.current, { opacity: 0 });
      gsap.set(bgWashRef.current, { scale: 5, opacity: 1, filter: "blur(0px)" });
      gsap.set(bgInnerRef.current, { rotate: -8, scale: 1.05, xPercent: 0, yPercent: 0 });
      gsap.set(noiseRef.current, { opacity: 0.12 });
      gsap.set(svgRef.current, { attr: { viewBox: INITIAL_VIEWBOX } });
      gsap.set(circleGroupRef.current, { opacity: 0, scale: 4, transformOrigin: "187.5px 187.5px" });
      gsap.set(sheenRef.current, { opacity: 0 });
      
      gsap.set(sRef.current, {
        fillOpacity: 0,
        strokeOpacity: 1,
        strokeDasharray: sLength * 3,
        strokeDashoffset: sLength * 3,
      });

      gsap.set(arrowOneRef.current, { opacity: 0, scale: 0, x: -80, y: 80, rotate: -135, transformOrigin: "202px 190px" });
      gsap.set(arrowTwoRef.current, { opacity: 0, scale: 0, x: -100, y: 100, rotate: -135, transformOrigin: "235px 158px" });
      gsap.set(arrowThreeRef.current, { opacity: 0, scale: 0, x: -120, y: 120, rotate: -135, transformOrigin: "281px 119px" });

      bgLoopRef.current = gsap.to(bgInnerRef.current, {
        scale: 1.15,
        rotate: 8,
        xPercent: 2,
        yPercent: 2,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      const timeline = gsap.timeline({
        delay: 0.2, // Small delay to allow things to mount properly
      });

      timeline
        .to(sRef.current, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" })
        .to(sRef.current, { fillOpacity: 1, strokeOpacity: 0.15, duration: 0.5 }, "-=0.2")
        .call(() => { void executeSensoryFeedback(1); }, [], "-=0.1")
        .to(svgRef.current, { attr: { viewBox: ARROW_ONE_VIEWBOX }, duration: 0.6, ease: "power2.inOut" }, "<")
        .to(arrowOneRef.current, { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: 0.7, ease: "power3.out" }, "<+=0.08")
        .call(() => { void executeSensoryFeedback(2); }, [], "+=0.1")
        .to(svgRef.current, { attr: { viewBox: ARROW_TWO_VIEWBOX }, duration: 0.6, ease: "power2.inOut" }, "<")
        .to(arrowTwoRef.current, { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: 0.7, ease: "power3.out" }, "<+=0.05")
        .call(() => { void executeSensoryFeedback(3); }, [], "+=0.1")
        .to(svgRef.current, { attr: { viewBox: ARROW_THREE_VIEWBOX }, duration: 0.6, ease: "power2.inOut" }, "<")
        .to(arrowThreeRef.current, { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: 0.7, ease: "power3.out" }, "<+=0.05")
        .to(noiseRef.current, { opacity: 0, duration: 1.2, ease: "sine.out" }, "+=0.4")
        .to(bgWashRef.current, { scale: 0.8, filter: "blur(20px)", opacity: 0, duration: 1.5, ease: "power3.inOut" }, "<")
        .to(circleGroupRef.current, {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          ease: "power4.inOut",
          onComplete: () => { void completeSensoryFeedback(); }
        }, "<")
        .to(sRef.current, { strokeOpacity: 0, duration: 0.8, ease: "power2.out" }, "<+=0.2")
        .to(sheenRef.current, { opacity: 1, duration: 1, ease: "power2.inOut" }, "<+=0.4")
        .to(whiteBgRef.current, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, "<+=0.15")
        .to(svgRef.current, {
          attr: { viewBox: FINAL_VIEWBOX },
          duration: 1.4,
          ease: "power4.inOut",
          onComplete: () => {
            bgLoopRef.current?.kill();
            setIsSettled(true);
            if(onAnimationComplete) {
              onAnimationComplete();
            }
          }
        }, "<");

      timelineRef.current = timeline;
    }, scopeRef);

    return () => {
      ctx.revert();
      bgLoopRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={scopeRef}
      className={`sug-logo-animation ${className}`}
      data-settled={isSettled}
    >
      <div ref={whiteBgRef} className="sug-logo-animation__white-bg" />
      <div ref={bgWashRef} className="sug-logo-animation__bg-wash">
        <div ref={bgInnerRef} className="sug-logo-animation__bg-inner" />
      </div>
      <div ref={noiseRef} className="sug-logo-animation__noise" />

      <div className="sug-logo-animation__frame">
        <svg
          ref={svgRef}
          className="sug-logo-animation__svg"
          viewBox={INITIAL_VIEWBOX}
          aria-label="SUG Creative Animation logo"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0878C0" />
              <stop offset="50%" stopColor="#23B3B0" />
              <stop offset="100%" stopColor="#9BE562" />
            </linearGradient>

            <radialGradient id="logo-sheen" cx="30%" cy="25%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            <filter id="logo-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="20" stdDeviation="25" floodColor="#041520" floodOpacity="0.5" />
            </filter>

            <clipPath id="clip-arrow3-1"><rect x="0" width="98" y="0" height="100"/></clipPath>
            <clipPath id="clip-arrow3-2"><path d="M 5 28 L 71 28 L 71 94 L 5 94 Z" clipRule="nonzero"/></clipPath>
            <clipPath id="clip-arrow3-3"><path d="M 2.839844 50.261719 L 48.554688 8.011719 L 90.804688 53.726562 L 45.09375 95.976562 Z" clipRule="nonzero"/></clipPath>
            <clipPath id="clip-arrow3-4"><path d="M -7.628906 38.9375 L 38.085938 -3.316406 L 101.207031 64.980469 L 55.496094 107.230469 Z" clipRule="nonzero"/></clipPath>

            <clipPath id="clip-arrow2-1"><path d="M 217 138 L 256 138 L 256 177 L 217 177 Z" clipRule="nonzero"/></clipPath>
            <clipPath id="clip-arrow2-2"><path d="M 215.789062 151.003906 L 242.777344 126.058594 L 267.722656 153.046875 L 240.734375 177.992188 Z" clipRule="nonzero"/></clipPath>
            <clipPath id="clip-arrow2-3"><path d="M 209.59375 144.304688 L 236.582031 119.359375 L 273.746094 159.566406 L 246.757812 184.507812 Z" clipRule="nonzero"/></clipPath>

            <clipPath id="clip-arrow1-1"><path d="M 187 176 L 215 176 L 215 204 L 187 204 Z" clipRule="nonzero"/></clipPath>
            <clipPath id="clip-arrow1-2"><path d="M 186.09375 185.285156 L 205.921875 166.960938 L 224.25 186.789062 L 204.421875 205.113281 Z" clipRule="nonzero"/></clipPath>
            <clipPath id="clip-arrow1-3"><path d="M 181.613281 180.4375 L 201.441406 162.113281 L 228.421875 191.304688 L 208.59375 209.628906 Z" clipRule="nonzero"/></clipPath>
          </defs>

          <g ref={circleGroupRef} opacity="0">
            <circle ref={circleRef} cx="187.5" cy="187.5" r="168.5" fill="url(#logo-gradient)" filter="url(#logo-shadow)" />
            <circle ref={sheenRef} cx="187.5" cy="187.5" r="168.5" fill="url(#logo-sheen)" />
          </g>

          <g>
            <path
              ref={sRef}
              strokeWidth="2"
              stroke="#FFFFFF"
              fill="#FFFFFF"
              transform="translate(71.937348, 332.439203)"
              d="M 66.4375 -123.96875 C 73.332031 -123.96875 80.144531 -123.179688 86.875 -121.609375 C 93.601562 -120.046875 98.609375 -118.484375 101.890625 -116.921875 L 106.828125 -114.578125 L 93.203125 -87.34375 C 83.816406 -92.351562 74.894531 -94.859375 66.4375 -94.859375 C 61.75 -94.859375 58.425781 -94.347656 56.46875 -93.328125 C 54.507812 -92.304688 53.53125 -90.390625 53.53125 -87.578125 C 53.53125 -86.953125 53.609375 -86.320312 53.765625 -85.6875 C 53.921875 -85.0625 54.234375 -84.472656 54.703125 -83.921875 C 55.171875 -83.378906 55.597656 -82.910156 55.984375 -82.515625 C 56.378906 -82.128906 57.046875 -81.703125 57.984375 -81.234375 C 58.929688 -80.765625 59.675781 -80.410156 60.21875 -80.171875 C 60.769531 -79.941406 61.671875 -79.59375 62.921875 -79.125 C 64.171875 -78.65625 65.109375 -78.300781 65.734375 -78.0625 C 66.359375 -77.832031 67.414062 -77.476562 68.90625 -77 C 70.394531 -76.53125 71.53125 -76.21875 72.3125 -76.0625 C 77.164062 -74.65625 81.390625 -73.09375 84.984375 -71.375 C 88.585938 -69.65625 92.382812 -67.304688 96.375 -64.328125 C 100.363281 -61.359375 103.453125 -57.601562 105.640625 -53.0625 C 107.835938 -48.519531 108.9375 -43.351562 108.9375 -37.5625 C 108.9375 -10.175781 89.921875 3.515625 51.890625 3.515625 C 43.273438 3.515625 35.09375 2.1875 27.34375 -0.46875 C 19.601562 -3.125 14.007812 -5.785156 10.5625 -8.453125 L 5.40625 -12.671875 L 22.296875 -41.09375 C 23.554688 -39.988281 25.203125 -38.691406 27.234375 -37.203125 C 29.265625 -35.722656 32.941406 -33.691406 38.265625 -31.109375 C 43.585938 -28.523438 48.207031 -27.234375 52.125 -27.234375 C 60.726562 -27.234375 65.03125 -30.128906 65.03125 -35.921875 C 65.03125 -38.578125 63.929688 -40.648438 61.734375 -42.140625 C 59.546875 -43.628906 55.832031 -45.3125 50.59375 -47.1875 C 45.351562 -49.070312 41.242188 -50.796875 38.265625 -52.359375 C 30.753906 -56.265625 24.804688 -60.679688 20.421875 -65.609375 C 16.046875 -70.546875 13.859375 -77.082031 13.859375 -85.21875 C 13.859375 -97.425781 18.59375 -106.9375 28.0625 -113.75 C 37.53125 -120.5625 50.320312 -123.96875 66.4375 -123.96875 Z"
              className="sug-logo-animation__s"
              paintOrder="stroke"
            />
          </g>

          <g ref={arrowOneRef} className="sug-logo-animation__arrow" opacity="0">
            <g clipPath="url(#clip-arrow1-1)">
              <g clipPath="url(#clip-arrow1-2)">
                <g clipPath="url(#clip-arrow1-3)">
                  <path fill="#FFFFFF" d="M 214.929688 177.1875 L 191.105469 176.128906 C 186.503906 175.925781 185.726562 184.886719 191.179688 185.035156 L 206.003906 185.4375 L 204.871094 200.351562 C 204.527344 204.894531 213.382812 205.375 213.636719 200.757812 Z M 214.929688 177.1875" />
                </g>
              </g>
            </g>
          </g>

          <g ref={arrowTwoRef} className="sug-logo-animation__arrow" opacity="0">
            <g clipPath="url(#clip-arrow2-1)">
              <g clipPath="url(#clip-arrow2-2)">
                <g clipPath="url(#clip-arrow2-3)">
                  <path fill="#FFFFFF" d="M 255.640625 139.804688 L 222.710938 138.34375 C 216.351562 138.058594 215.277344 150.449219 222.8125 150.652344 L 243.304688 151.207031 L 241.738281 171.828125 C 241.261719 178.105469 253.507812 178.769531 253.855469 172.386719 Z M 255.640625 139.804688" />
                </g>
              </g>
            </g>
          </g>

          <g ref={arrowThreeRef} className="sug-logo-animation__arrow" opacity="0">
            <g transform="translate(239, 56)">
              <g clipPath="url(#clip-arrow3-1)">
                <g clipPath="url(#clip-arrow3-2)">
                  <g clipPath="url(#clip-arrow3-3)">
                    <g clipPath="url(#clip-arrow3-4)">
                      <path fill="#FFFFFF" d="M 70.199219 31.34375 L 14.542969 28.871094 C 3.796875 28.390625 1.980469 49.332031 14.714844 49.675781 L 49.347656 50.613281 L 46.703125 85.460938 C 45.894531 96.070312 66.589844 97.191406 67.179688 86.40625 Z M 70.199219 31.34375" />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default SugLogoAnimation;
