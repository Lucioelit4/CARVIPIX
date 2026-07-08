import type {
  KnowledgeCard,
  KnowledgeCategory,
  KnowledgeCluster,
  KnowledgeConflict,
  KnowledgeEvolutionDecision,
  KnowledgeEvolutionReport,
  KnowledgeMergePlan,
  KnowledgePriority,
  KnowledgeSimilarity,
  KnowledgeSplitPlan,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function toTokens(input: string): Set<string> {
  return new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) {
    return 1;
  }

  const union = new Set<string>([...left, ...right]);
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  return union.size === 0 ? 0 : intersection / union.size;
}

function normalizePriority(score: number): KnowledgePriority {
  if (score >= 0.85) {
    return 'critical';
  }
  if (score >= 0.65) {
    return 'high';
  }
  if (score >= 0.45) {
    return 'medium';
  }
  return 'low';
}

function hasOpposingDirection(left: KnowledgeCard, right: KnowledgeCard): boolean {
  const leftDirection = typeof left.metadata?.direction === 'string' ? String(left.metadata?.direction).toLowerCase() : '';
  const rightDirection = typeof right.metadata?.direction === 'string' ? String(right.metadata?.direction).toLowerCase() : '';

  if (!leftDirection || !rightDirection) {
    return false;
  }

  const opposite =
    (leftDirection === 'bullish' && rightDirection === 'bearish') ||
    (leftDirection === 'bearish' && rightDirection === 'bullish') ||
    (leftDirection === 'long' && rightDirection === 'short') ||
    (leftDirection === 'short' && rightDirection === 'long');

  return opposite;
}

export class KnowledgeEvolutionEngine {
  evolve(cards: KnowledgeCard[], now = Date.now()): KnowledgeEvolutionReport {
    const similarities = this.calculateSimilarities(cards);
    const conflicts = this.detectConflicts(cards, similarities);
    const decisions = cards.map((card) => this.decideCardEvolution(card, cards, conflicts, now));
    const ranking = this.rank(decisions);
    const mergePlans = this.buildMergePlans(cards, similarities);
    const splitPlans = this.buildSplitPlans(cards, decisions);
    const clusters = this.cluster(cards, similarities);

    const summary = {
      totalCards: cards.length,
      activeCards: decisions.filter((decision) => decision.lifecycle === 'active').length,
      revalidateCards: decisions.filter((decision) => decision.lifecycle === 'revalidate').length,
      degradedCards: decisions.filter((decision) => decision.lifecycle === 'degraded').length,
      retiredCards: decisions.filter((decision) => decision.lifecycle === 'retired').length,
    };

    return {
      generatedAt: now,
      decisions,
      ranking,
      conflicts,
      similarities,
      clusters,
      mergePlans,
      splitPlans,
      summary,
    };
  }

  private decideCardEvolution(
    card: KnowledgeCard,
    allCards: KnowledgeCard[],
    conflicts: KnowledgeConflict[],
    now: number,
  ): KnowledgeEvolutionDecision {
    const agingDays = Math.max(0, (now - card.createdAt) / DAY_MS);
    const staleDays = Math.max(0, (now - card.lastValidatedAt) / DAY_MS);
    const usageFactor = clamp01(Math.log10(card.usageCount + 1) / 3);
    const reinforcement = clamp01(card.reinforcementSignals * 0.04 + usageFactor * 0.15);
    const decay = clamp01(agingDays * card.decayRate + staleDays * 0.003);

    const dependencyPenalty = this.computeDependencyPenalty(card, allCards);
    const conflictPenalty = this.computeConflictPenalty(card.cardId, conflicts);

    const base =
      card.validationScore * 0.35 +
      card.performanceScore * 0.35 +
      card.reliability * 0.2 +
      usageFactor * 0.1;

    const evolvedScore = clamp01(base + reinforcement - decay - dependencyPenalty - conflictPenalty);

    const shouldReinvestigate = staleDays >= 7 || card.validationScore < 0.45 || card.performanceScore < 0.45;
    const shouldDegrade = evolvedScore < 0.5 || conflictPenalty > 0.2;
    const shouldStrengthen = evolvedScore >= 0.62 && card.reliability >= 0.6 && !shouldReinvestigate;
    const shouldRetire = evolvedScore < 0.28 || (staleDays > 30 && card.validationScore < 0.4);
    const shouldRemove = shouldRetire && agingDays > 90;

    let lifecycle: KnowledgeEvolutionDecision['lifecycle'] = 'active';
    if (shouldRetire) {
      lifecycle = 'retired';
    } else if (shouldReinvestigate) {
      lifecycle = 'revalidate';
    } else if (shouldDegrade) {
      lifecycle = 'degraded';
    }

    const rationale: string[] = [];
    rationale.push(`score=${evolvedScore.toFixed(3)}`);
    rationale.push(`aging_days=${agingDays.toFixed(1)}`);
    rationale.push(`stale_days=${staleDays.toFixed(1)}`);

    if (shouldStrengthen) {
      rationale.push('reinforcement recommended');
    }
    if (shouldDegrade) {
      rationale.push('degradation applied');
    }
    if (shouldReinvestigate) {
      rationale.push('revalidation required');
    }
    if (shouldRetire) {
      rationale.push('retirement threshold reached');
    }

    return {
      cardId: card.cardId,
      lifecycle,
      evolvedScore,
      agingDays,
      shouldStrengthen,
      shouldDegrade,
      shouldReinvestigate,
      shouldRetire,
      shouldRemove,
      stillWorking: lifecycle === 'active' && evolvedScore >= 0.6,
      rationale,
    };
  }

  private computeDependencyPenalty(card: KnowledgeCard, allCards: KnowledgeCard[]): number {
    if (card.dependencies.length === 0) {
      return 0;
    }

    const byId = new Map(allCards.map((item) => [item.cardId, item]));
    let penalty = 0;

    for (const dependency of card.dependencies) {
      const target = byId.get(dependency.cardId);
      if (!target) {
        penalty += dependency.required ? 0.12 : 0.05;
        continue;
      }

      if (target.lifecycle === 'retired') {
        penalty += dependency.required ? 0.18 : 0.08;
      }

      if (target.validationScore < 0.4) {
        penalty += dependency.required ? 0.1 : 0.04;
      }
    }

    return clamp01(penalty);
  }

  private computeConflictPenalty(cardId: string, conflicts: KnowledgeConflict[]): number {
    const own = conflicts.filter((conflict) => conflict.leftCardId === cardId || conflict.rightCardId === cardId);
    if (own.length === 0) {
      return 0;
    }

    let penalty = 0;
    for (const conflict of own) {
      penalty += conflict.severity === 'critical' ? 0.18 : conflict.severity === 'high' ? 0.12 : 0.05;
    }

    return clamp01(penalty);
  }

  private calculateSimilarities(cards: KnowledgeCard[]): KnowledgeSimilarity[] {
    const similarities: KnowledgeSimilarity[] = [];

    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const left = cards[i];
        const right = cards[j];

        const tagSim = jaccard(new Set(left.tags), new Set(right.tags));
        const titleSim = jaccard(toTokens(left.title), toTokens(right.title));
        const depSim = jaccard(
          new Set(left.dependencies.map((dependency) => dependency.cardId)),
          new Set(right.dependencies.map((dependency) => dependency.cardId)),
        );
        const categoryBoost = left.category === right.category ? 0.18 : 0;
        const score = clamp01(tagSim * 0.45 + titleSim * 0.35 + depSim * 0.2 + categoryBoost);

        similarities.push({
          leftCardId: left.cardId,
          rightCardId: right.cardId,
          score,
        });
      }
    }

    return similarities;
  }

  private detectConflicts(cards: KnowledgeCard[], similarities: KnowledgeSimilarity[]): KnowledgeConflict[] {
    const byPair = new Map<string, number>();
    for (const similarity of similarities) {
      const key = `${similarity.leftCardId}|${similarity.rightCardId}`;
      byPair.set(key, similarity.score);
    }

    const conflicts: KnowledgeConflict[] = [];
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const left = cards[i];
        const right = cards[j];
        const key = `${left.cardId}|${right.cardId}`;
        const similarity = byPair.get(key) ?? 0;

        const overlap = similarity >= 0.55;
        const oppositeDirection = hasOpposingDirection(left, right);
        const explicitContradiction =
          left.relationships.some((relationship) => relationship.cardId === right.cardId && relationship.relation === 'contradicts') ||
          right.relationships.some((relationship) => relationship.cardId === left.cardId && relationship.relation === 'contradicts');

        if (!overlap || (!oppositeDirection && !explicitContradiction)) {
          continue;
        }

        conflicts.push({
          leftCardId: left.cardId,
          rightCardId: right.cardId,
          reason: explicitContradiction
            ? 'Explicit contradictory relationship'
            : 'High similarity with opposite directional assertions',
          severity: similarity > 0.8 ? 'critical' : 'high',
        });
      }
    }

    return conflicts;
  }

  private rank(decisions: KnowledgeEvolutionDecision[]): Array<{ cardId: string; score: number; priority: KnowledgePriority }> {
    const ranked = decisions
      .map((decision) => {
        const urgency = decision.shouldReinvestigate ? 0.2 : 0;
        const degradeRisk = decision.shouldDegrade ? 0.12 : 0;
        const retireRisk = decision.shouldRetire ? 0.25 : 0;
        const score = clamp01(decision.evolvedScore + urgency + degradeRisk + retireRisk);

        return {
          cardId: decision.cardId,
          score,
          priority: normalizePriority(score),
        };
      })
      .sort((left, right) => right.score - left.score);

    return ranked;
  }

  private buildMergePlans(cards: KnowledgeCard[], similarities: KnowledgeSimilarity[]): KnowledgeMergePlan[] {
    const plans: KnowledgeMergePlan[] = [];

    for (const similarity of similarities) {
      if (similarity.score < 0.92) {
        continue;
      }

      const left = cards.find((card) => card.cardId === similarity.leftCardId);
      const right = cards.find((card) => card.cardId === similarity.rightCardId);
      if (!left || !right) {
        continue;
      }

      if (left.lifecycle === 'retired' || right.lifecycle === 'retired') {
        continue;
      }

      const target = left.updatedAt >= right.updatedAt ? left.cardId : right.cardId;
      plans.push({
        sourceCardIds: [left.cardId, right.cardId],
        targetCardId: target,
      });
    }

    return plans;
  }

  private buildSplitPlans(cards: KnowledgeCard[], decisions: KnowledgeEvolutionDecision[]): KnowledgeSplitPlan[] {
    const byId = new Map(decisions.map((decision) => [decision.cardId, decision]));
    const plans: KnowledgeSplitPlan[] = [];

    for (const card of cards) {
      const decision = byId.get(card.cardId);
      if (!decision) {
        continue;
      }

      const complexTags = card.tags.length >= 10;
      const complexDependencies = card.dependencies.length >= 6;
      const unstable = decision.shouldReinvestigate && decision.shouldDegrade;

      if (!complexTags && !complexDependencies && !unstable) {
        continue;
      }

      const childIds = [
        `${card.cardId}-part-a`,
        `${card.cardId}-part-b`,
      ];

      plans.push({
        sourceCardId: card.cardId,
        childCardIds: childIds,
      });
    }

    return plans;
  }

  private cluster(cards: KnowledgeCard[], similarities: KnowledgeSimilarity[]): KnowledgeCluster[] {
    if (cards.length === 0) {
      return [];
    }

    const adjacency = new Map<string, Set<string>>();
    for (const card of cards) {
      adjacency.set(card.cardId, new Set<string>());
    }

    for (const similarity of similarities) {
      if (similarity.score < 0.72) {
        continue;
      }

      adjacency.get(similarity.leftCardId)?.add(similarity.rightCardId);
      adjacency.get(similarity.rightCardId)?.add(similarity.leftCardId);
    }

    const visited = new Set<string>();
    const byId = new Map(cards.map((card) => [card.cardId, card]));
    const clusters: KnowledgeCluster[] = [];

    for (const card of cards) {
      if (visited.has(card.cardId)) {
        continue;
      }

      const stack = [card.cardId];
      const members: string[] = [];

      while (stack.length > 0) {
        const currentId = stack.pop() as string;
        if (visited.has(currentId)) {
          continue;
        }

        visited.add(currentId);
        members.push(currentId);

        for (const next of adjacency.get(currentId) ?? []) {
          if (!visited.has(next)) {
            stack.push(next);
          }
        }
      }

      const memberCards = members
        .map((memberId) => byId.get(memberId))
        .filter((value): value is KnowledgeCard => Boolean(value));

      const category = this.pickDominantCategory(memberCards);
      const centroidScore =
        memberCards.length === 0
          ? 0
          : memberCards.reduce((sum, member) => sum + member.validationScore * 0.5 + member.performanceScore * 0.5, 0) /
            memberCards.length;

      clusters.push({
        clusterId: `cluster-${card.cardId}`,
        category,
        members: unique(members),
        centroidScore,
      });
    }

    return clusters;
  }

  private pickDominantCategory(cards: KnowledgeCard[]): KnowledgeCategory {
    if (cards.length === 0) {
      return 'other';
    }

    const counts = new Map<KnowledgeCategory, number>();
    for (const card of cards) {
      counts.set(card.category, (counts.get(card.category) ?? 0) + 1);
    }

    let selected: KnowledgeCategory = cards[0].category;
    let maxCount = counts.get(selected) ?? 0;

    for (const [category, count] of counts.entries()) {
      if (count > maxCount) {
        selected = category;
        maxCount = count;
      }
    }

    return selected;
  }
}
