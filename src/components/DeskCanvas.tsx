/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { PenInstance, DeskTheme, TeamId, PenDef } from '../types/game';
import { DeskBounds, PhysicsEngine, CollisionEvent } from '../services/physics';
import { sound } from '../services/sound';
import { DESK_THEMES } from '../data/pens';

interface DeskCanvasProps {
  pens: PenInstance[];
  currentTurn: TeamId;
  isAiTurn: boolean;
  deskThemeId: DeskTheme;
  aimGuideEnabled: boolean;
  reducedMotion: boolean;
  vibrationEnabled: boolean;
  onFlick: (penId: string, dirX: number, dirY: number, power: number, offsetRatio: number) => void;
  onRoundComplete: (survivingP1: number, survivingP2: number) => void;
  onPenEliminated?: (pen: PenInstance) => void;
}

export const DeskCanvas: React.FC<DeskCanvasProps> = ({
  pens,
  currentTurn,
  isAiTurn,
  deskThemeId,
  aimGuideEnabled,
  reducedMotion,
  vibrationEnabled,
  onFlick,
  onRoundComplete,
  onPenEliminated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable game state held in refs to avoid React re-render stalls in 60fps loop
  const pensRef = useRef<PenInstance[]>(pens);
  pensRef.current = pens;

  const currentTurnRef = useRef<TeamId>(currentTurn);
  currentTurnRef.current = currentTurn;

  const isAiTurnRef = useRef<boolean>(isAiTurn);
  isAiTurnRef.current = isAiTurn;

  const aimGuideRef = useRef<boolean>(aimGuideEnabled);
  aimGuideRef.current = aimGuideEnabled;

  const reducedMotionRef = useRef<boolean>(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const vibrationRef = useRef<boolean>(vibrationEnabled);
  vibrationRef.current = vibrationEnabled;

  const onFlickRef = useRef(onFlick);
  onFlickRef.current = onFlick;

  const onRoundCompleteRef = useRef(onRoundComplete);
  onRoundCompleteRef.current = onRoundComplete;

  const onPenEliminatedRef = useRef(onPenEliminated);
  onPenEliminatedRef.current = onPenEliminated;

  // Aiming state
  const isAimingRef = useRef<boolean>(false);
  const activePenIdRef = useRef<string | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchCurrentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera shake
  const screenShakeRef = useRef<{ amount: number; decay: number }>({ amount: 0, decay: 0.9 });

  // Simulation flags
  const isSimulatingRef = useRef<boolean>(false);
  const postSimSettledFramesRef = useRef<number>(0);

  // Desk bounds in canvas coordinates
  const boundsRef = useRef<DeskBounds>({ x: 40, y: 40, width: 720, height: 460 });

  // Collision particles
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number }>>([]);

  const triggerScreenShake = useCallback((strength: number) => {
    if (reducedMotionRef.current) return;
    screenShakeRef.current.amount = Math.min(18, strength * 14);
  }, []);

  const triggerHaptic = useCallback((ms: number = 30) => {
    if (vibrationRef.current && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  }, []);

  // Main canvas animation and physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number = 0;
    let lastTime: number = performance.now();
    let physicsAccumulator: number = 0;
    const FIXED_DT = 1 / 60;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      // Playable desk bounds inside canvas margins (to show table rim and drop-off)
      const marginX = Math.max(28, rect.width * 0.05);
      const marginY = Math.max(28, rect.height * 0.055);

      boundsRef.current = {
        x: marginX,
        y: marginY,
        width: rect.width - marginX * 2,
        height: rect.height - marginY * 2,
      };
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.06); // clamp lag spikes

      physicsAccumulator += dt;
      let anyMovedThisFrame = false;

      // Fixed timestep physics update
      let subSteps = 0;
      while (physicsAccumulator >= FIXED_DT && subSteps < 5) {
        subSteps++;
        physicsAccumulator -= FIXED_DT;

        const anyMoving = PhysicsEngine.step(
          pensRef.current,
          boundsRef.current,
          FIXED_DT,
          (evt: CollisionEvent) => {
            // Sound and collision particles
            const penA = evt.penA;
            const defA = PhysicsEngine.getPenDef(penA.penDefId);
            const isMetallic = defA.style === 'metallic';

            sound.playCollision(evt.intensity, isMetallic);
            triggerScreenShake(evt.intensity);
            if (evt.intensity > 0.4) {
              triggerHaptic(Math.floor(25 + evt.intensity * 35));
            }

            // Spawn collision dust / sparks
            const count = Math.floor(3 + evt.intensity * 6);
            for (let i = 0; i < count; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = (50 + Math.random() * 120) * evt.intensity;
              particlesRef.current.push({
                x: evt.contactX,
                y: evt.contactY,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                color: isMetallic ? '#fef08a' : '#f8fafc',
                life: 0.25 + Math.random() * 0.2,
                maxLife: 0.35,
              });
            }
          },
          (eliminatedPen: PenInstance) => {
            sound.playFallOffDesk();
            triggerHaptic(60);
            if (onPenEliminatedRef.current) {
              onPenEliminatedRef.current(eliminatedPen);
            }
          }
        );

        if (anyMoving) anyMovedThisFrame = true;
      }

      // Track simulation settling
      if (anyMovedThisFrame) {
        isSimulatingRef.current = true;
        postSimSettledFramesRef.current = 0;
      } else if (isSimulatingRef.current) {
        postSimSettledFramesRef.current += 1;
        // Require 8 consecutive stationary frames to guarantee all momentum resolved
        if (postSimSettledFramesRef.current > 8) {
          isSimulatingRef.current = false;
          postSimSettledFramesRef.current = 0;

          // Check surviving pens
          const survivingP1 = pensRef.current.filter(p => p.team === 'player1' && !p.eliminated).length;
          const survivingP2 = pensRef.current.filter(p => p.team === 'player2' && !p.eliminated).length;

          if (onRoundCompleteRef.current) {
            onRoundCompleteRef.current(survivingP1, survivingP2);
          }
        }
      }

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Decay screen shake
      if (screenShakeRef.current.amount > 0.1) {
        screenShakeRef.current.amount *= screenShakeRef.current.decay;
      } else {
        screenShakeRef.current.amount = 0;
      }

      // Draw everything
      drawScene(canvas, dt);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [triggerScreenShake, triggerHaptic]);

  // Canvas drawing function
  const drawScene = (canvas: HTMLCanvasElement, _dt: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply screen shake
    if (screenShakeRef.current.amount > 0.05) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current.amount * 2;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current.amount * 2;
      ctx.translate(shakeX, shakeY);
    }

    const bounds = boundsRef.current;
    const theme = DESK_THEMES.find(t => t.id === deskThemeId) || DESK_THEMES[0];

    // 1. Draw outer room / drop-off floor (the abyss off the desk)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 2. Desk drop shadow (elevation above classroom floor)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 14;

    // Beveled Desk Border (wooden table rim)
    ctx.fillStyle = theme.borderColor;
    roundRect(ctx, bounds.x - 12, bounds.y - 12, bounds.width + 24, bounds.height + 24, 18);
    ctx.fill();
    ctx.restore();

    // 3. Desk wood surface (playable area)
    ctx.save();
    roundRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 12);
    ctx.clip();

    // Wood base color
    ctx.fillStyle = theme.primaryColor;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Procedural wood planks & grain
    const plankHeight = 52;
    const numPlanks = Math.ceil(bounds.height / plankHeight);
    for (let i = 0; i < numPlanks; i++) {
      const py = bounds.y + i * plankHeight;
      // Plank seam
      ctx.strokeStyle = theme.grooveColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bounds.x, py);
      ctx.lineTo(bounds.x + bounds.width, py);
      ctx.stroke();

      // Subtle grain lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let j = 0; j < 3; j++) {
        const gy = py + 12 + j * 14;
        ctx.beginPath();
        ctx.moveTo(bounds.x, gy);
        ctx.bezierCurveTo(
          bounds.x + bounds.width * 0.3, gy + 3,
          bounds.x + bounds.width * 0.7, gy - 3,
          bounds.x + bounds.width, gy
        );
        ctx.stroke();
      }
    }

    // Classroom Desk Doodles & Scratches
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.2;

    // Compass circle scratch
    ctx.beginPath();
    ctx.arc(bounds.x + bounds.width * 0.18, bounds.y + bounds.height * 0.28, 26, 0, Math.PI * 1.7);
    ctx.stroke();

    // Carved initials "PF '98"
    ctx.font = '14px Caveat, cursive';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillText("PF '98", bounds.x + bounds.width * 0.78, bounds.y + bounds.height * 0.82);
    ctx.fillText("A+ ★", bounds.x + bounds.width * 0.14, bounds.y + bounds.height * 0.75);

    // Subtle center desk divider line (school desk symmetry)
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bounds.x + bounds.width / 2, bounds.y + 10);
    ctx.lineTo(bounds.x + bounds.width / 2, bounds.y + bounds.height - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ruler measurement ticks along the top and bottom desk edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let rx = bounds.x + 20; rx < bounds.x + bounds.width - 20; rx += 14) {
      const isMajor = (rx - bounds.x) % 70 < 14;
      const tickH = isMajor ? 9 : 4;
      ctx.beginPath();
      ctx.moveTo(rx, bounds.y);
      ctx.lineTo(rx, bounds.y + tickH);
      ctx.moveTo(rx, bounds.y + bounds.height);
      ctx.lineTo(rx, bounds.y + bounds.height - tickH);
      ctx.stroke();
    }
    ctx.restore();

    // Inner rim shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = 3;
    roundRect(ctx, bounds.x + 1.5, bounds.y + 1.5, bounds.width - 3, bounds.height - 3, 11);
    ctx.stroke();

    ctx.restore(); // end desk surface clip

    // 4. Draw Trails
    for (const pen of pensRef.current) {
      if (pen.trail.length > 1) {
        ctx.save();
        for (let i = 0; i < pen.trail.length - 1; i++) {
          const p1 = pen.trail[i];
          const p2 = pen.trail[i + 1];
          ctx.strokeStyle = `rgba(255, 255, 255, ${p1.alpha * 0.35})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 5. Draw Pens
    for (const pen of pensRef.current) {
      drawPen(ctx, pen);
    }

    // 6. Draw Collision Particles
    for (const p of particlesRef.current) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5 * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 7. Draw Aiming UI (if active player is aiming)
    if (isAimingRef.current && activePenIdRef.current) {
      const activePen = pensRef.current.find(p => p.id === activePenIdRef.current);
      if (activePen && !activePen.eliminated) {
        drawAimingOverlay(ctx, activePen);
      }
    }

    ctx.restore();
  };

  /**
   * Detailed ballpoint pen rendering (barrel, grip, cap, clip, nib, drop shadow)
   */
  const drawPen = (ctx: CanvasRenderingContext2D, pen: PenInstance) => {
    const def = PhysicsEngine.getPenDef(pen.penDefId);
    const { length, width } = def.stats;
    const halfL = length / 2;
    const halfW = width / 2;

    ctx.save();
    ctx.translate(pen.x, pen.y);
    ctx.rotate(pen.angle);

    // Fall animation scaling / opacity
    if (pen.eliminated && pen.fallProgress > 0) {
      const scale = Math.max(0.2, 1.0 - pen.fallProgress * 0.65);
      const alpha = Math.max(0, 1.0 - pen.fallProgress * 0.95);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
    }

    // A. Drop Shadow onto desk
    ctx.save();
    const shadowDist = pen.eliminated ? 6 + pen.fallProgress * 28 : 5;
    const shadowAlpha = pen.eliminated ? Math.max(0, 0.35 - pen.fallProgress * 0.35) : 0.38;
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    roundRect(ctx, -halfL + shadowDist * 0.4, -halfW + shadowDist, length, width, halfW);
    ctx.fill();
    ctx.restore();

    // Active Turn Highlight (ring around pen if it's player's turn and can be flicked)
    const isPlayerTurn = pen.team === currentTurnRef.current && !isAiTurnRef.current && !isSimulatingRef.current && !pen.eliminated;
    if (isPlayerTurn) {
      ctx.save();
      ctx.strokeStyle =
        pen.team === 'player1'
          ? 'rgba(56, 189, 248, 0.85)'
          : pen.team === 'player2'
          ? 'rgba(251, 146, 60, 0.85)'
          : 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      roundRect(ctx, -halfL - 4, -halfW - 4, length + 8, width + 8, halfW + 4);
      ctx.stroke();
      ctx.restore();
    }

    // B. Pen Barrel (main body)
    const barrelGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    barrelGrad.addColorStop(0, def.colors.accent);
    barrelGrad.addColorStop(0.35, def.colors.barrel);
    barrelGrad.addColorStop(0.85, def.colors.barrelEnd);
    barrelGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    roundRect(ctx, -halfL, -halfW, length, width, 4);
    ctx.fill();

    // Subtle edge contour
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // C. Grip Section (near the tip: positive X is tip)
    const gripStart = halfL * 0.25;
    const gripWidth = halfL * 0.45;
    ctx.fillStyle = def.colors.grip;
    ctx.fillRect(gripStart, -halfW + 0.5, gripWidth, width - 1);

    // Grip ribs (friction rings)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let r = gripStart + 4; r < gripStart + gripWidth - 3; r += 4) {
      ctx.beginPath();
      ctx.moveTo(r, -halfW + 1);
      ctx.lineTo(r, halfW - 1);
      ctx.stroke();
    }

    // D. Metal Nib & Ballpoint Tip
    const tipBase = halfL * 0.7;
    const tipLen = halfL * 0.32;
    ctx.fillStyle = def.colors.tip;
    ctx.beginPath();
    ctx.moveTo(tipBase, -halfW + 1.5);
    ctx.lineTo(tipBase + tipLen, -1.8);
    ctx.lineTo(tipBase + tipLen + 2, 0); // tiny ball
    ctx.lineTo(tipBase + tipLen, 1.8);
    ctx.lineTo(tipBase, halfW - 1.5);
    ctx.closePath();
    ctx.fill();

    // Nib bevel shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tipBase + 1, -1, tipLen * 0.7, 1.5);

    // E. Pen Cap & Clip (at the back: negative X)
    const capLen = halfL * 0.55;
    const capGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    capGrad.addColorStop(0, '#ffffff44');
    capGrad.addColorStop(0.4, def.colors.cap);
    capGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

    ctx.fillStyle = capGrad;
    roundRect(ctx, -halfL - 2, -halfW - 0.5, capLen, width + 1, 3);
    ctx.fill();

    // Metallic Pocket Clip
    const clipX = -halfL + 4;
    const clipLen = capLen * 0.75;
    ctx.fillStyle = def.colors.clip;
    ctx.fillRect(clipX, -halfW - 2.5, clipLen, 2.5);

    // Clip stopper end
    ctx.beginPath();
    ctx.arc(clipX + clipLen, -halfW - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Team Ring / Badge (Player 1 = Cyan Blue, Player 2 = Amber Orange, Player 3 = Emerald Green)
    ctx.fillStyle = pen.team === 'player1' ? '#38bdf8' : pen.team === 'player2' ? '#f97316' : '#10b981';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  /**
   * Aiming overlay: Slingshot pullback line, directional trajectory ray, and power indicator
   */
  const drawAimingOverlay = (ctx: CanvasRenderingContext2D, pen: PenInstance) => {
    const start = touchStartPosRef.current;
    const cur = touchCurrentPosRef.current;

    const pullDx = cur.x - start.x;
    const pullDy = cur.y - start.y;
    const pullDist = Math.hypot(pullDx, pullDy);

    // Slingshot logic: Flick direction is opposite to pull direction!
    const MAX_PULL = 135;
    const clampedPull = Math.min(MAX_PULL, pullDist);
    const power = clampedPull / MAX_PULL;

    if (pullDist < 10) {
      // Prompt user to drag
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('Pull back to aim', pen.x, pen.y - 24);
      ctx.restore();
      return;
    }

    const flickDirX = -pullDx / pullDist;
    const flickDirY = -pullDy / pullDist;

    ctx.save();

    // 1. Slingshot Pullback Elastic Band
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)'; // yellow elastic
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pen.x, pen.y);
    ctx.lineTo(pen.x + (pullDx * clampedPull) / pullDist, pen.y + (pullDy * clampedPull) / pullDist);
    ctx.stroke();

    // Pull handle circle
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(pen.x + (pullDx * clampedPull) / pullDist, pen.y + (pullDy * clampedPull) / pullDist, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Forward Trajectory Line & Dotted Aim Guide
    if (aimGuideRef.current) {
      const guideLength = 60 + power * 240;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(pen.x, pen.y);
      ctx.lineTo(pen.x + flickDirX * guideLength, pen.y + flickDirY * guideLength);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trajectory tip arrow
      const arrowX = pen.x + flickDirX * guideLength;
      const arrowY = pen.y + flickDirY * guideLength;
      const arrowAngle = Math.atan2(flickDirY, flickDirX);

      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(arrowAngle);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, -6);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Power Meter Arc around active pen
    ctx.strokeStyle = power > 0.8 ? '#ef4444' : power > 0.4 ? '#eab308' : '#22c55e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const arcRadius = 26;
    ctx.arc(pen.x, pen.y, arcRadius, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2);
    ctx.stroke();

    // Power text readout
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.round(power * 100)}%`, pen.x, pen.y + 40);

    ctx.restore();
  };

  /**
   * Helper to round-rect paths in Canvas
   */
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  /**
   * Touch & Mouse Event Handlers for Aiming & Flicking
   */
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (isSimulatingRef.current || isAiTurnRef.current) return;

    const coords = getCanvasCoords(clientX, clientY);

    // Check if clicked/touched on one of the current player's surviving pens
    const activePens = pensRef.current.filter(
      p => p.team === currentTurnRef.current && !p.eliminated
    );

    let chosenPen: PenInstance | null = null;
    let minD = 44; // Touch radius

    for (const pen of activePens) {
      const d = Math.hypot(coords.x - pen.x, coords.y - pen.y);
      if (d < minD) {
        minD = d;
        chosenPen = pen;
      }
    }

    if (chosenPen) {
      isAimingRef.current = true;
      activePenIdRef.current = chosenPen.id;
      touchStartPosRef.current = { x: coords.x, y: coords.y };
      touchCurrentPosRef.current = { x: coords.x, y: coords.y };
      sound.playClick();
      triggerHaptic(15);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isAimingRef.current) return;
    const coords = getCanvasCoords(clientX, clientY);
    touchCurrentPosRef.current = { x: coords.x, y: coords.y };
  };

  const handlePointerUp = () => {
    if (!isAimingRef.current || !activePenIdRef.current) {
      isAimingRef.current = false;
      return;
    }

    const start = touchStartPosRef.current;
    const cur = touchCurrentPosRef.current;
    const pullDx = cur.x - start.x;
    const pullDy = cur.y - start.y;
    const pullDist = Math.hypot(pullDx, pullDy);

    const activePenId = activePenIdRef.current;
    isAimingRef.current = false;
    activePenIdRef.current = null;

    // Minimum flick threshold
    if (pullDist >= 15) {
      const MAX_PULL = 135;
      const clampedPull = Math.min(MAX_PULL, pullDist);
      const power = clampedPull / MAX_PULL;

      // Inverse slingshot direction
      const flickDirX = -pullDx / pullDist;
      const flickDirY = -pullDy / pullDist;

      // Calculate flick offset on pen for spin
      const pen = pensRef.current.find(p => p.id === activePenId);
      let offsetRatio = 0;
      if (pen) {
        const penDirX = Math.cos(pen.angle);
        const penDirY = Math.sin(pen.angle);
        const contactX = start.x - pen.x;
        const contactY = start.y - pen.y;
        offsetRatio = (contactX * penDirX + contactY * penDirY) / ((pen.vx || 50));
        offsetRatio = Math.max(-0.6, Math.min(0.6, offsetRatio));
      }

      sound.playFlick(power);
      triggerHaptic(Math.floor(25 + power * 35));

      if (onFlickRef.current) {
        onFlickRef.current(activePenId, flickDirX, flickDirY, power, offsetRatio);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={e => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={e => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={e => {
          if (e.touches.length > 0) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={e => {
          if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handlePointerUp}
      />
    </div>
  );
};
