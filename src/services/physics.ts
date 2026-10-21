/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PenInstance, PenDef } from '../types/game';
import { PENS_CATALOG } from '../data/pens';

export interface DeskBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionEvent {
  penA: PenInstance;
  penB: PenInstance;
  intensity: number;
  contactX: number;
  contactY: number;
}

export class PhysicsEngine {
  private static penDefMap: Map<string, PenDef> = new Map();

  static {
    PENS_CATALOG.forEach(p => PhysicsEngine.penDefMap.set(p.id, p));
  }

  public static getPenDef(id: string): PenDef {
    return this.penDefMap.get(id) || PENS_CATALOG[0];
  }

  /**
   * Calculates the two endpoints of the central spine of the pen
   */
  public static getPenEndpoints(pen: PenInstance): { tip: { x: number; y: number }; back: { x: number; y: number }; halfLength: number; radius: number } {
    const def = this.getPenDef(pen.penDefId);
    const halfL = (def.stats.length * 0.85) / 2; // spine segment is slightly shorter than total pen
    const cos = Math.cos(pen.angle);
    const sin = Math.sin(pen.angle);

    return {
      tip: {
        x: pen.x + cos * halfL,
        y: pen.y + sin * halfL,
      },
      back: {
        x: pen.x - cos * halfL,
        y: pen.y - sin * halfL,
      },
      halfLength: halfL,
      radius: def.stats.width / 2,
    };
  }

  /**
   * Advances the physics simulation by fixed dt seconds
   */
  public static step(
    pens: PenInstance[],
    bounds: DeskBounds,
    dt: number,
    onCollision?: (evt: CollisionEvent) => void,
    onEliminated?: (pen: PenInstance) => void
  ): boolean {
    const activePens = pens.filter(p => !p.eliminated);
    let anyMoving = false;

    // 1. Integrate motion and apply surface friction on desk
    for (const pen of activePens) {
      const def = this.getPenDef(pen.penDefId);
      const grip = def.stats.grip;
      const mass = def.stats.mass;

      // Friction decelerations
      const speed = Math.hypot(pen.vx, pen.vy);
      if (speed > 0.001) {
        anyMoving = true;
        // Friction on wood: combination of static/kinetic friction
        const frictionCoeff = 380 * grip;
        const decel = (frictionCoeff / mass) * dt;

        if (speed <= decel || speed < 0.8) {
          pen.vx = 0;
          pen.vy = 0;
        } else {
          pen.vx -= (pen.vx / speed) * decel;
          pen.vy -= (pen.vy / speed) * decel;
        }

        // Add trail dot
        if (speed > 60 && Math.random() < 0.35) {
          pen.trail.push({ x: pen.x, y: pen.y, alpha: 0.5 });
          if (pen.trail.length > 8) pen.trail.shift();
        }
      }

      // Angular damping
      const angSpeed = Math.abs(pen.angularVelocity);
      if (angSpeed > 0.001) {
        anyMoving = true;
        const angDamp = (7.5 * grip * def.stats.stability) * dt;
        if (angSpeed <= angDamp || angSpeed < 0.04) {
          pen.angularVelocity = 0;
        } else {
          pen.angularVelocity -= Math.sign(pen.angularVelocity) * angDamp;
        }
      }

      // Update positions
      pen.x += pen.vx * dt;
      pen.y += pen.vy * dt;
      pen.angle += pen.angularVelocity * dt;

      // Keep angle in [-PI, PI]
      pen.angle = Math.atan2(Math.sin(pen.angle), Math.cos(pen.angle));
    }

    // Decay trails
    for (const pen of pens) {
      for (let i = pen.trail.length - 1; i >= 0; i--) {
        pen.trail[i].alpha -= dt * 2.5;
        if (pen.trail[i].alpha <= 0) {
          pen.trail.splice(i, 1);
        }
      }
    }

    // 2. Pairwise pen-to-pen collisions (capsule-capsule model)
    const n = activePens.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const penA = activePens[i];
        const penB = activePens[j];
        this.resolvePenCollision(penA, penB, onCollision);
      }
    }

    // 3. Desk Boundary & Elimination Check
    for (const pen of activePens) {
      const endpoints = this.getPenEndpoints(pen);
      const margin = 2; // desk edge margin
      const left = bounds.x + margin;
      const right = bounds.x + bounds.width - margin;
      const top = bounds.y + margin;
      const bottom = bounds.y + bounds.height - margin;

      // Check if center of mass or both tip & back are over edge
      const centerOut = pen.x < left || pen.x > right || pen.y < top || pen.y > bottom;
      const tipOut = endpoints.tip.x < left || endpoints.tip.x > right || endpoints.tip.y < top || endpoints.tip.y > bottom;
      const backOut = endpoints.back.x < left || endpoints.back.x > right || endpoints.back.y < top || endpoints.back.y > bottom;

      // If center of mass is out, or more than 60% of pen is out, pen falls off desk!
      if (centerOut || (tipOut && backOut)) {
        pen.eliminated = true;
        pen.fallProgress = 0.01;
        pen.fallRotation = (Math.random() - 0.5) * 4;
        if (onEliminated) onEliminated(pen);
      }
    }

    // 4. Update falling animations for eliminated pens
    for (const pen of pens) {
      if (pen.eliminated && pen.fallProgress > 0 && pen.fallProgress < 1) {
        anyMoving = true;
        pen.fallProgress += dt * 2.2;
        pen.x += pen.vx * dt * 0.4;
        pen.y += (pen.vy * dt * 0.4) + (280 * dt * pen.fallProgress); // gravity drop
        pen.angle += pen.fallRotation * dt;
        if (pen.fallProgress >= 1) {
          pen.fallProgress = 1;
        }
      }
    }

    return anyMoving;
  }

  /**
   * Accurate segment-to-segment distance algorithm for capsule collision
   */
  private static resolvePenCollision(
    penA: PenInstance,
    penB: PenInstance,
    onCollision?: (evt: CollisionEvent) => void
  ): void {
    const endA = this.getPenEndpoints(penA);
    const endB = this.getPenEndpoints(penB);

    // Segment A: P1 to P2
    const p1x = endA.back.x;
    const p1y = endA.back.y;
    const p2x = endA.tip.x;
    const p2y = endA.tip.y;

    // Segment B: Q1 to Q2
    const q1x = endB.back.x;
    const q1y = endB.back.y;
    const q2x = endB.tip.x;
    const q2y = endB.tip.y;

    const { closestA, closestB, distance } = this.segmentToSegmentDistance(
      p1x, p1y, p2x, p2y,
      q1x, q1y, q2x, q2y
    );

    const minDistance = endA.radius + endB.radius;

    if (distance < minDistance) {
      // Overlap detected!
      const penetration = minDistance - distance;

      let nx = closestA.x - closestB.x;
      let ny = closestA.y - closestB.y;
      const len = Math.hypot(nx, ny);

      if (len > 0.0001) {
        nx /= len;
        ny /= len;
      } else {
        // Degenerate case: fallback normal based on centers
        let cdx = penA.x - penB.x;
        let cdy = penA.y - penB.y;
        const clen = Math.hypot(cdx, cdy) || 1;
        nx = cdx / clen;
        ny = cdy / clen;
      }

      const defA = this.getPenDef(penA.penDefId);
      const defB = this.getPenDef(penB.penDefId);

      const mA = defA.stats.mass;
      const mB = defB.stats.mass;
      const lA = defA.stats.length;
      const lB = defB.stats.length;

      // Moment of inertia: I = 1/12 * m * (length^2 + width^2)
      const IA = (1 / 12) * mA * (lA * lA + defA.stats.width * defA.stats.width);
      const IB = (1 / 12) * mB * (lB * lB + defB.stats.width * defB.stats.width);

      // Contact point
      const contactX = (closestA.x + closestB.x) / 2;
      const contactY = (closestA.y + closestB.y) / 2;

      // Lever arms from centers of mass to contact point
      const rAx = contactX - penA.x;
      const rAy = contactY - penA.y;
      const rBx = contactX - penB.x;
      const rBy = contactY - penB.y;

      // Relative velocity at contact point: v_rel = (vA + wA x rA) - (vB + wB x rB)
      // Note: in 2D, (w x r) = (-w * ry, w * rx)
      const vAx = penA.vx - penA.angularVelocity * rAy;
      const vAy = penA.vy + penA.angularVelocity * rAx;
      const vBx = penB.vx - penB.angularVelocity * rBy;
      const vBy = penB.vy + penB.angularVelocity * rBx;

      const relVx = vAx - vBx;
      const relVy = vAy - vBy;

      // Relative velocity along collision normal
      const velAlongNormal = relVx * nx + relVy * ny;

      // Positional separation to resolve penetration
      const totalInvMass = 1 / mA + 1 / mB;
      const percent = 0.8; // Baumgarte percentage
      const slop = 0.05;
      const correction = Math.max(0, penetration - slop) / totalInvMass * percent;
      penA.x += (nx * correction) / mA;
      penA.y += (ny * correction) / mA;
      penB.x -= (nx * correction) / mB;
      penB.y -= (ny * correction) / mB;

      // Only apply impulse if bodies are moving towards each other
      if (velAlongNormal < 0) {
        // Restitution (elasticity)
        const e = (defA.stats.restitution + defB.stats.restitution) / 2;

        // Effective mass term including rotational inertia:
        // r x n = rAx * ny - rAy * nx
        const rAxn = rAx * ny - rAy * nx;
        const rBxn = rBx * ny - rBy * nx;

        const effectiveMass = 1 / (
          (1 / mA) +
          (1 / mB) +
          (rAxn * rAxn) / IA +
          (rBxn * rBxn) / IB
        );

        const impulseMag = -(1 + e) * velAlongNormal * effectiveMass;

        // Apply normal impulse
        const impX = nx * impulseMag;
        const impY = ny * impulseMag;

        penA.vx += impX / mA;
        penA.vy += impY / mA;
        penA.angularVelocity += (rAx * impY - rAy * impX) / IA;

        penB.vx -= impX / mB;
        penB.vy -= impY / mB;
        penB.angularVelocity -= (rBx * impY - rBy * impX) / IB;

        // Tangential friction impulse
        let tx = relVx - velAlongNormal * nx;
        let ty = relVy - velAlongNormal * ny;
        const tLen = Math.hypot(tx, ty);
        if (tLen > 0.0001) {
          tx /= tLen;
          ty /= tLen;
          const rAxt = rAx * ty - rAy * tx;
          const rBxt = rBx * ty - rBy * tx;
          const effFrictionMass = 1 / (
            (1 / mA) + (1 / mB) + (rAxt * rAxt) / IA + (rBxt * rBxt) / IB
          );
          const frictionCoeff = 0.35;
          const frictionImpulseMag = Math.max(
            -frictionCoeff * impulseMag,
            Math.min(frictionCoeff * impulseMag, -(relVx * tx + relVy * ty) * effFrictionMass)
          );

          const fImpX = tx * frictionImpulseMag;
          const fImpY = ty * frictionImpulseMag;

          penA.vx += fImpX / mA;
          penA.vy += fImpY / mA;
          penA.angularVelocity += (rAx * fImpY - rAy * fImpX) / IA;

          penB.vx -= fImpX / mB;
          penB.vy -= fImpY / mB;
          penB.angularVelocity -= (rBx * fImpY - rBy * fImpX) / IB;
        }

        if (onCollision) {
          const intensity = Math.min(1.0, Math.abs(velAlongNormal) / 350);
          onCollision({
            penA,
            penB,
            intensity,
            contactX,
            contactY,
          });
        }
      }
    }
  }

  /**
   * Distance between two 2D line segments
   */
  private static segmentToSegmentDistance(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
  ): { closestA: { x: number; y: number }; closestB: { x: number; y: number }; distance: number } {
    const dx1 = x2 - x1;
    const dy1 = y2 - y1;
    const dx2 = x4 - x3;
    const dy2 = y4 - y3;
    const r13x = x1 - x3;
    const r13y = y1 - y3;

    const a = dx1 * dx1 + dy1 * dy1; // squared length of seg1
    const e = dx2 * dx2 + dy2 * dy2; // squared length of seg2
    const f = dx2 * r13x + dy2 * r13y;

    let s = 0.0;
    let t = 0.0;

    if (a <= 0.00001 && e <= 0.00001) {
      // Both segments are points
      s = 0.0;
      t = 0.0;
    } else if (a <= 0.00001) {
      // Seg 1 is a point
      s = 0.0;
      t = Math.max(0, Math.min(1, f / e));
    } else {
      const c = dx1 * r13x + dy1 * r13y;
      if (e <= 0.00001) {
        // Seg 2 is a point
        t = 0.0;
        s = Math.max(0, Math.min(1, -c / a));
      } else {
        // General non-degenerate case
        const b = dx1 * dx2 + dy1 * dy2;
        const denom = a * e - b * b;

        if (denom !== 0.0) {
          s = Math.max(0, Math.min(1, (b * f - c * e) / denom));
        } else {
          s = 0.0;
        }

        t = (b * s + f) / e;

        if (t < 0.0) {
          t = 0.0;
          s = Math.max(0, Math.min(1, -c / a));
        } else if (t > 1.0) {
          t = 1.0;
          s = Math.max(0, Math.min(1, (b - c) / a));
        }
      }
    }

    const cAx = x1 + s * dx1;
    const cAy = y1 + s * dy1;
    const cBx = x3 + t * dx2;
    const cBy = y3 + t * dy2;

    const dist = Math.hypot(cAx - cBx, cAy - cBy);

    return {
      closestA: { x: cAx, y: cAy },
      closestB: { x: cBx, y: cBy },
      distance: dist,
    };
  }

  /**
   * Applies flick impulse to a pen
   * @param pen The pen to flick
   * @param dirX Normalized X direction
   * @param dirY Normalized Y direction
   * @param power Power ratio (0 to 1)
   * @param offsetRatio Offset along pen (-1 to 1) where 0 is center, 1 is tip, -1 is back
   */
  public static applyFlick(
    pen: PenInstance,
    dirX: number,
    dirY: number,
    power: number,
    offsetRatio: number = 0
  ): void {
    const def = this.getPenDef(pen.penDefId);
    const mass = def.stats.mass;

    // Base speed: 450 - 1350 px/s based on power and mass
    const maxSpeed = 1450;
    const minSpeed = 260;
    const effectivePower = Math.max(0.1, Math.min(1.0, power));
    const impulseSpeed = (minSpeed + (maxSpeed - minSpeed) * (effectivePower ** 1.15)) / (mass ** 0.55);

    pen.vx = dirX * impulseSpeed;
    pen.vy = dirY * impulseSpeed;

    // Calculate angular velocity based on flick contact point offset
    // If flicked near the tip or back, it induces spin!
    const halfL = (def.stats.length * 0.85) / 2;
    const contactDist = offsetRatio * halfL;
    
    // Cross product of pen orientation and flick direction
    const penDirX = Math.cos(pen.angle);
    const penDirY = Math.sin(pen.angle);
    const torqueFactor = (penDirX * dirY - penDirY * dirX) * contactDist;

    const stability = def.stats.stability;
    pen.angularVelocity = (torqueFactor * 0.08) / stability;
  }
}
