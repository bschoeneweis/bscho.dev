'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './page.module.css';

const PIXEL = 4; // scale factor for chunky pixels
const W = 160;
const H = 120;
const CANVAS_W = W * PIXEL;
const CANVAS_H = H * PIXEL;

type GameState = 'idle' | 'casting' | 'waiting' | 'bite' | 'caught' | 'missed';

const FISH_NAMES = [
  'Bubbles',
  'Splash',
  'Finley',
  'Nemo',
  'Gill',
  'Sushi',
  'Captain',
  'Splashy',
  'Bloop',
  'Droplet',
];

const CATCH_MESSAGES = [
  'Nice one!',
  'Whoa, what a whopper!',
  'You got it!',
  'Reel deal!',
  'Fish on!',
  'That’s a keeper!',
  'Splash-tastic!',
  'You’re on a roll!',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FishinPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [caughtFish, setCaughtFish] = useState<string | null>(null);
  const [catchMessage, setCatchMessage] = useState<string | null>(null);

  const stateRef = useRef({
    rodAngle: -0.4,
    lineLength: 0,
    bobberX: 0,
    bobberY: 0,
    bobberSurfaceY: 0,
    castProgress: 0,
    biteAt: 0,
    biteDuration: 0,
    biteStartTime: 0,
    castTimeout: null as ReturnType<typeof setTimeout> | null,
    biteTimeout: null as ReturnType<typeof setTimeout> | null,
    waitTimeout: null as ReturnType<typeof setTimeout> | null,
    resetAfterMissTimeout: null as ReturnType<typeof setTimeout> | null,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;
    ctx.imageSmoothingEnabled = false;

    // Scale so our W×H logical space fills the full canvas
    const scaleX = canvas.width / W;
    const scaleY = canvas.height / H;
    ctx.save();
    ctx.scale(scaleX, scaleY);

    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, H);

    // Water (top portion)
    const waterTop = Math.floor(H * 0.45);
    ctx.fillStyle = '#4A90D9';
    ctx.fillRect(0, waterTop, W, H - waterTop);

    // Ripples
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 5; i++) {
      const x = (W / 6) * (i + 1) + (Date.now() / 200 + i * 2) % 8;
      ctx.fillRect(Math.floor(x) % W, waterTop + 2 + (i % 3) * 4, 3, 2);
    }

    // Dock (chunky planks)
    const dockY = waterTop - 8;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, dockY, W, 12);
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < W; i += 8) {
      ctx.fillRect(i, dockY + 2, 6, 8);
    }
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, dockY + 10, W, 4);

    // Character (simple pixel villager on dock)
    const charX = 32;
    const charY = dockY - 4;
    ctx.fillStyle = '#FFDBAC'; // skin
    ctx.fillRect(charX + 4, charY + 8, 6, 6);
    ctx.fillRect(charX + 6, charY + 4, 4, 6);
    ctx.fillStyle = '#2E7D32'; // shirt
    ctx.fillRect(charX + 4, charY + 10, 6, 4);
    ctx.fillRect(charX + 6, charY + 6, 4, 6);
    ctx.fillStyle = '#5D4037'; // hair
    ctx.fillRect(charX + 6, charY + 2, 6, 4);
    ctx.fillStyle = '#333';
    ctx.fillRect(charX + 8, charY + 6, 2, 2); // eye

    // Rod and line (when cast)
    const rodTipX = charX + 18;
    const rodTipY = charY + 2;
    if (s.lineLength > 0) {
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      const endX = s.bobberX;
      const endY = gameState === 'bite' ? s.bobberSurfaceY + 5 : s.bobberY;
      ctx.lineTo(endX, endY);
      ctx.stroke();
      // Bobber (dips under when bite)
      ctx.fillStyle = gameState === 'bite' ? '#E53935' : '#FFEB3B';
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Rod in hand (pole from character to tip)
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(charX + 10, charY + 6);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();

    ctx.restore();
  }, [gameState]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  const resetCast = useCallback(() => {
    const s = stateRef.current;
    if (s.castTimeout) clearTimeout(s.castTimeout);
    if (s.biteTimeout) clearTimeout(s.biteTimeout);
    if (s.waitTimeout) clearTimeout(s.waitTimeout);
    if (s.resetAfterMissTimeout) clearTimeout(s.resetAfterMissTimeout);
    s.castTimeout = null;
    s.biteTimeout = null;
    s.waitTimeout = null;
    s.resetAfterMissTimeout = null;
    s.lineLength = 0;
    s.bobberX = 0;
    s.bobberY = 0;
    s.castProgress = 0;
    setGameState('idle');
  }, []);

  const cast = useCallback(() => {
    if (gameState !== 'idle') return;
    const s = stateRef.current;
    const waterTop = H * 0.45;
    const rodTipX = 32 + 18;
    const rodTipY = waterTop - 8 - 4 + 2;
    const targetX = 32 + 18 + 60 + Math.random() * 40;
    const targetY = waterTop + 8 + Math.random() * 12;
    s.bobberSurfaceY = targetY;
    s.bobberX = rodTipX;
    s.bobberY = rodTipY;
    s.lineLength = Math.hypot(targetX - rodTipX, targetY - rodTipY);
    setGameState('casting');
    s.castProgress = 0;
    const duration = 400;
    const start = Date.now();
    const castInterval = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      s.bobberX = rodTipX + (targetX - rodTipX) * t;
      s.bobberY = rodTipY + (targetY - rodTipY) * t;
      s.castProgress = t;
      if (t >= 1) {
        clearInterval(castInterval);
        s.bobberX = targetX;
        s.bobberY = targetY;
        setGameState('waiting');
        const waitTime = 5000 + Math.random() * 5000; // 5–10 seconds
        s.waitTimeout = setTimeout(() => {
          s.biteStartTime = Date.now();
          s.biteDuration = 200 + Math.random() * 800;
          setGameState('bite');
          s.biteTimeout = setTimeout(() => {
            setGameState('missed');
            s.biteTimeout = null;
            s.resetAfterMissTimeout = setTimeout(() => {
              s.resetAfterMissTimeout = null;
              resetCast();
            }, 1000);
          }, s.biteDuration);
        }, waitTime);
      }
    }, 16);
    s.castTimeout = setTimeout(() => clearInterval(castInterval), duration + 200);
  }, [gameState]);

  const reel = useCallback(() => {
    const s = stateRef.current;
    if (gameState === 'bite') {
      if (s.biteTimeout) clearTimeout(s.biteTimeout);
      s.biteTimeout = null;
      setCaughtFish(pick(FISH_NAMES));
      setCatchMessage(pick(CATCH_MESSAGES));
      setGameState('caught');
      return;
    }
    if (gameState === 'waiting' || gameState === 'casting') return;
    if (gameState === 'missed' || gameState === 'caught') return;
  }, [gameState]);

  const closeCaught = useCallback(() => {
    setCaughtFish(null);
    setCatchMessage(null);
    resetCast();
  }, [resetCast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (gameState === 'idle') cast();
        else if (gameState === 'bite') reel();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'caught') closeCaught();
        else if (gameState === 'missed') resetCast();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, cast, reel, closeCaught, resetCast]);

  return (
    <div className={styles.fishinPage}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={styles.fishinCanvas}
      />
      <p className={styles.fishinHint}>
        {gameState === 'idle' && 'SPACE — cast'}
        {gameState === 'casting' && 'Casting...'}
        {gameState === 'waiting' && 'Wait for the bobber to go under...'}
        {gameState === 'bite' && 'SPACE — reel in!'}
        {gameState === 'missed' && 'The fish got away! Resetting...'}
      </p>
      {gameState === 'caught' && caughtFish && catchMessage && (
        <div className={styles.fishinCaught} role="dialog" aria-label="Fish caught">
          <p className={styles.fishinCaughtMessage}>{catchMessage}</p>
          <p className={styles.fishinCaughtFish}>You caught {caughtFish}!</p>
          <p className={styles.fishinCaughtEsc}>Press ESC to fish again</p>
          <button type="button" className={styles.fishinCaughtButton} onClick={closeCaught}>
            OK
          </button>
        </div>
      )}
    </div>
  );
}
