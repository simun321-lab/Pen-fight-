/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PenInstance, AIDifficulty } from '../types/game';
import { DeskBounds, PhysicsEngine } from './physics';

export interface AIDecision {
  penId: string;
  targetPenId: string | null;
  dirX: number;
  dirY: number;
  power: number;
  offsetRatio: number;
  thinkingDurationMs: number;
}

export class AIService {
  /**
   * Evaluates the desk state and chooses the best move for the AI team (player2)
   */
  public static calculateMove(
    allPens: PenInstance[],
    bounds: DeskBounds,
    difficulty: AIDifficulty
  ): AIDecision | null {
    const aiPens = allPens.filter(p => p.team === 'player2' && !p.eliminated);
    const playerPens = allPens.filter(p => p.team === 'player1' && !p.eliminated);

    if (aiPens.length === 0 || playerPens.length === 0) {
      return null;
    }

    // Thinking time based on difficulty (gives realistic cadence)
    const thinkingDurations: Record<AIDifficulty, number> = {
      easy: 700 + Math.random() * 400,
      normal: 900 + Math.random() * 500,
      hard: 1100 + Math.random() * 600,
      master: 1300 + Math.random() * 500,
    };

    if (difficulty === 'easy') {
      return this.calculateEasyMove(aiPens, playerPens, bounds, thinkingDurations.easy);
    } else if (difficulty === 'normal') {
      return this.calculateNormalMove(aiPens, playerPens, bounds, thinkingDurations.normal);
    } else if (difficulty === 'hard') {
      return this.calculateHardMove(aiPens, playerPens, bounds, thinkingDurations.hard);
    } else {
      return this.calculateMasterMove(aiPens, playerPens, bounds, thinkingDurations.master);
    }
  }

  /**
   * EASY: Selects a random AI pen, aims vaguely toward a player pen with high error
   */
  private static calculateEasyMove(
    aiPens: PenInstance[],
    playerPens: PenInstance[],
    _bounds: DeskBounds,
    thinkingMs: number
  ): AIDecision {
    const aiPen = aiPens[Math.floor(Math.random() * aiPens.length)];
    const target = playerPens[Math.floor(Math.random() * playerPens.length)];

    const dx = target.x - aiPen.x;
    const dy = target.y - aiPen.y;
    const baseAngle = Math.atan2(dy, dx);

    // Substantial angle error (+/- 35 degrees)
    const angleError = (Math.random() - 0.5) * (Math.PI / 2.6);
    const finalAngle = baseAngle + angleError;

    const dirX = Math.cos(finalAngle);
    const dirY = Math.sin(finalAngle);

    // Variable power, often underpowered or overpowered
    const dist = Math.hypot(dx, dy);
    const basePower = Math.min(0.9, Math.max(0.3, dist / 450));
    const power = Math.max(0.25, Math.min(0.95, basePower + (Math.random() - 0.5) * 0.4));

    return {
      penId: aiPen.id,
      targetPenId: target.id,
      dirX,
      dirY,
      power,
      offsetRatio: (Math.random() - 0.5) * 0.6,
      thinkingDurationMs: thinkingMs,
    };
  }

  /**
   * NORMAL: Aims toward nearest player pen with modest noise, calibrates power
   */
  private static calculateNormalMove(
    aiPens: PenInstance[],
    playerPens: PenInstance[],
    bounds: DeskBounds,
    thinkingMs: number
  ): AIDecision {
    let bestDist = Infinity;
    let chosenAi = aiPens[0];
    let chosenTarget = playerPens[0];

    for (const ai of aiPens) {
      for (const target of playerPens) {
        const d = Math.hypot(target.x - ai.x, target.y - ai.y);
        if (d < bestDist) {
          bestDist = d;
          chosenAi = ai;
          chosenTarget = target;
        }
      }
    }

    const dx = chosenTarget.x - chosenAi.x;
    const dy = chosenTarget.y - chosenAi.y;
    const baseAngle = Math.atan2(dy, dx);

    // Small angle error (+/- 9 degrees)
    const angleError = (Math.random() - 0.5) * (Math.PI / 18);
    const finalAngle = baseAngle + angleError;

    const dirX = Math.cos(finalAngle);
    const dirY = Math.sin(finalAngle);

    // Calibrated power based on distance and pen mass
    const targetDef = PhysicsEngine.getPenDef(chosenTarget.penDefId);
    const powerScale = Math.min(0.95, Math.max(0.4, (bestDist / 420) * (targetDef.stats.mass ** 0.3)));
    const power = Math.min(1.0, powerScale * (0.9 + Math.random() * 0.2));

    // Slight check to avoid flicking straight off an edge behind target
    const edgeDist = this.distanceToNearestDeskEdge(chosenAi.x, chosenAi.y, bounds);
    const safeOffset = edgeDist < 60 ? 0 : (Math.random() - 0.5) * 0.4;

    return {
      penId: chosenAi.id,
      targetPenId: chosenTarget.id,
      dirX,
      dirY,
      power,
      offsetRatio: safeOffset,
      thinkingDurationMs: thinkingMs,
    };
  }

  /**
   * HARD: Evaluates edge opportunities to knock opponent out while keeping self safe
   */
  private static calculateHardMove(
    aiPens: PenInstance[],
    playerPens: PenInstance[],
    bounds: DeskBounds,
    thinkingMs: number
  ): AIDecision {
    interface ShotCandidate {
      ai: PenInstance;
      target: PenInstance;
      angle: number;
      power: number;
      score: number;
      offset: number;
    }

    const candidates: ShotCandidate[] = [];

    for (const ai of aiPens) {
      const aiDef = PhysicsEngine.getPenDef(ai.penDefId);
      for (const target of playerPens) {
        const targetDef = PhysicsEngine.getPenDef(target.penDefId);
        const dist = Math.hypot(target.x - ai.x, target.y - ai.y);

        // Vector from AI to Target
        const toTargetX = (target.x - ai.x) / dist;
        const toTargetY = (target.y - ai.y) / dist;

        // Nearest edge from target (where we want to knock them!)
        const targetEdgeVector = this.getVectorToNearestEdge(target.x, target.y, bounds);
        const targetEdgeDist = targetEdgeVector.distance;

        // Bonus if pushing the opponent toward their closest edge
        const edgeAlignment = toTargetX * targetEdgeVector.nx + toTargetY * targetEdgeVector.ny;

        // AI's distance to edge (penalize if AI might overshoot and fall off)
        const aiEdgeDist = this.distanceToNearestDeskEdge(ai.x, ai.y, bounds);

        // Scoring heuristic:
        // High score if target is close to edge and we hit them towards that edge
        let score = (1000 / (dist + 50)) + (200 / (targetEdgeDist + 30)) * Math.max(0, edgeAlignment);

        // Mass advantage multiplier
        const massRatio = aiDef.stats.mass / targetDef.stats.mass;
        score *= massRatio;

        // Penalty if AI is dangerously close to desk edge in shooting direction
        if (aiEdgeDist < 50 && edgeAlignment < -0.3) {
          score -= 100;
        }

        const baseAngle = Math.atan2(target.y - ai.y, target.x - ai.x);
        // Very tight jitter (+/- 2.5 degrees)
        const jitter = (Math.random() - 0.5) * (Math.PI / 60);

        // Power calculation: enough to send target off edge, but capped
        let power = Math.min(1.0, Math.max(0.5, (dist / 380) + (1 / massRatio) * 0.25));
        if (targetEdgeDist < 80) {
          power = Math.min(1.0, power + 0.2); // slam them off!
        }

        candidates.push({
          ai,
          target,
          angle: baseAngle + jitter,
          power,
          score,
          offset: (Math.random() - 0.5) * 0.3,
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    return {
      penId: best.ai.id,
      targetPenId: best.target.id,
      dirX: Math.cos(best.angle),
      dirY: Math.sin(best.angle),
      power: best.power,
      offsetRatio: best.offset,
      thinkingDurationMs: thinkingMs,
    };
  }

  /**
   * MASTER: High-level tactical prediction, angle offsets for rotational whip,
   * edge-push traps, and risk mitigation
   */
  private static calculateMasterMove(
    aiPens: PenInstance[],
    playerPens: PenInstance[],
    bounds: DeskBounds,
    thinkingMs: number
  ): AIDecision {
    // Master AI considers hitting the opponent pen at an angle to spin it out of control
    let bestScore = -Infinity;
    let bestAi = aiPens[0];
    let bestTarget = playerPens[0];
    let bestAngle = 0;
    let bestPower = 0.8;
    let bestOffset = 0;

    for (const ai of aiPens) {
      const aiDef = PhysicsEngine.getPenDef(ai.penDefId);
      for (const target of playerPens) {
        const targetDef = PhysicsEngine.getPenDef(target.penDefId);
        const dist = Math.hypot(target.x - ai.x, target.y - ai.y);

        const targetEdgeVec = this.getVectorToNearestEdge(target.x, target.y, bounds);
        const targetEdgeDist = targetEdgeVec.distance;

        // Check if there are other pens obstructing the line of sight
        let obstructed = false;
        for (const other of allPensInList(aiPens, playerPens)) {
          if (other.id !== ai.id && other.id !== target.id && !other.eliminated) {
            const distToLine = pointToSegmentDistance(
              other.x, other.y,
              ai.x, ai.y,
              target.x, target.y
            );
            if (distToLine < (aiDef.stats.width + targetDef.stats.width) / 1.5) {
              obstructed = true;
              break;
            }
          }
        }

        // Direct aim angle
        const baseAngle = Math.atan2(target.y - ai.y, target.x - ai.x);
        const toTargetDirX = Math.cos(baseAngle);
        const toTargetDirY = Math.sin(baseAngle);

        // Alignment with target's nearest edge
        const edgeAlign = toTargetDirX * targetEdgeVec.nx + toTargetDirY * targetEdgeVec.ny;

        // Master score
        let score = (1200 / (dist + 60)) + (450 / (targetEdgeDist + 20)) * (edgeAlign + 1.2);
        if (obstructed) score *= 0.4;

        // Mass factor
        score *= (aiDef.stats.mass / targetDef.stats.mass) ** 1.2;

        // Master power adjustment: calculate required velocity to send target past edge
        // Distance target needs to travel = targetEdgeDist
        const targetTravelDistance = targetEdgeDist + 35;
        const requiredTargetSpeed = Math.sqrt(2 * (380 * targetDef.stats.grip / targetDef.stats.mass) * targetTravelDistance);
        const requiredAiSpeed = requiredTargetSpeed * (targetDef.stats.mass / aiDef.stats.mass + 0.6);
        
        let calculatedPower = Math.min(1.0, Math.max(0.5, requiredAiSpeed / 1200));
        // Add slightly targeted offset to create spin
        const offset = 0.25 * (targetEdgeVec.nx * toTargetDirY - targetEdgeVec.ny * toTargetDirX > 0 ? 1 : -1);

        if (score > bestScore) {
          bestScore = score;
          bestAi = ai;
          bestTarget = target;
          bestAngle = baseAngle;
          bestPower = calculatedPower;
          bestOffset = offset;
        }
      }
    }

    return {
      penId: bestAi.id,
      targetPenId: bestTarget.id,
      dirX: Math.cos(bestAngle),
      dirY: Math.sin(bestAngle),
      power: bestPower,
      offsetRatio: bestOffset,
      thinkingDurationMs: thinkingMs,
    };
  }

  private static distanceToNearestDeskEdge(x: number, y: number, bounds: DeskBounds): number {
    const leftDist = x - bounds.x;
    const rightDist = (bounds.x + bounds.width) - x;
    const topDist = y - bounds.y;
    const bottomDist = (bounds.y + bounds.height) - y;
    return Math.min(leftDist, rightDist, topDist, bottomDist);
  }

  private static getVectorToNearestEdge(x: number, y: number, bounds: DeskBounds): { nx: number; ny: number; distance: number } {
    const leftDist = x - bounds.x;
    const rightDist = (bounds.x + bounds.width) - x;
    const topDist = y - bounds.y;
    const bottomDist = (bounds.y + bounds.height) - y;

    const min = Math.min(leftDist, rightDist, topDist, bottomDist);
    if (min === leftDist) return { nx: -1, ny: 0, distance: leftDist };
    if (min === rightDist) return { nx: 1, ny: 0, distance: rightDist };
    if (min === topDist) return { nx: 0, ny: -1, distance: topDist };
    return { nx: 0, ny: 1, distance: bottomDist };
  }
}

function allPensInList(a: PenInstance[], b: PenInstance[]): PenInstance[] {
  return [...a, ...b];
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.0001) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}
