import test from 'node:test';
import assert from 'node:assert/strict';

import { KnowledgeEvolutionEngine } from './knowledgeEvolutionEngine';
import { KnowledgeConsumer } from './knowledgeConsumer';
import type { KnowledgeCard } from '../types';

const now = 1_783_500_000_000;
const day = 24 * 60 * 60 * 1000;

function buildCard(overrides: Partial<KnowledgeCard>): KnowledgeCard {
  return {
    cardId: 'card-default',
    title: 'Default Knowledge Card',
    category: 'market_structure',
    tags: ['trend', 'structure'],
    dependencies: [],
    relationships: [],
    summary: 'default',
    validationScore: 0.8,
    performanceScore: 0.8,
    reliability: 0.8,
    usageCount: 30,
    reinforcementSignals: 8,
    decayRate: 0.002,
    lastValidatedAt: now - day,
    lastObservedAt: now - day,
    createdAt: now - 20 * day,
    updatedAt: now - day,
    lifecycle: 'active',
    priority: 'high',
    metadata: { direction: 'bullish' },
    ...overrides,
  };
}

test('knowledge evolution answers if cards still work or need reinforcement degradation reinvestigation retirement or removal', () => {
  const engine = new KnowledgeEvolutionEngine();

  const cards: KnowledgeCard[] = [
    buildCard({ cardId: 'card-strong', title: 'Trend Continuation High Quality' }),
    buildCard({
      cardId: 'card-stale',
      title: 'Session Volatility Shift',
      category: 'session_behavior',
      validationScore: 0.48,
      performanceScore: 0.42,
      reliability: 0.6,
      lastValidatedAt: now - 12 * day,
      lastObservedAt: now - 10 * day,
      reinforcementSignals: 1,
      tags: ['session', 'volatility'],
    }),
    buildCard({
      cardId: 'card-retire',
      title: 'Old Invalid Setup',
      category: 'other',
      validationScore: 0.18,
      performanceScore: 0.2,
      reliability: 0.3,
      usageCount: 1,
      reinforcementSignals: 0,
      decayRate: 0.01,
      lastValidatedAt: now - 45 * day,
      lastObservedAt: now - 45 * day,
      createdAt: now - 200 * day,
      updatedAt: now - 40 * day,
      tags: ['legacy', 'obsolete'],
      metadata: { direction: 'bearish' },
    }),
  ];

  const report = engine.evolve(cards, now);
  const byId = new Map(report.decisions.map((decision) => [decision.cardId, decision]));

  const strong = byId.get('card-strong');
  const stale = byId.get('card-stale');
  const retired = byId.get('card-retire');

  assert.ok(strong);
  assert.ok(stale);
  assert.ok(retired);

  assert.equal(strong?.stillWorking, true);
  assert.equal(strong?.shouldStrengthen, true);

  assert.equal(stale?.shouldReinvestigate, true);
  assert.equal(stale?.lifecycle, 'revalidate');

  assert.equal(retired?.shouldRetire, true);
  assert.equal(retired?.shouldRemove, true);
  assert.equal(retired?.lifecycle, 'retired');

  assert.ok(report.summary.totalCards === 3);
  assert.ok(report.ranking.length === 3);
});

test('knowledge evolution resolves merge split conflict similarity and clustering plans', () => {
  const engine = new KnowledgeEvolutionEngine();

  const cards: KnowledgeCard[] = [
    buildCard({
      cardId: 'merge-a',
      title: 'Breakout Continuation Model',
      tags: ['breakout', 'continuation', 'trend'],
      metadata: { direction: 'bullish' },
    }),
    buildCard({
      cardId: 'merge-b',
      title: 'Breakout Continuation Model',
      tags: ['breakout', 'continuation', 'trend'],
      metadata: { direction: 'bearish' },
    }),
    buildCard({
      cardId: 'split-a',
      title: 'Composite Meta Knowledge',
      tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
      dependencies: [
        { cardId: 'dep-1', required: true },
        { cardId: 'dep-2', required: true },
        { cardId: 'dep-3', required: true },
        { cardId: 'dep-4', required: false },
        { cardId: 'dep-5', required: false },
        { cardId: 'dep-6', required: false },
      ],
      validationScore: 0.45,
      performanceScore: 0.4,
      reliability: 0.5,
      lastValidatedAt: now - 10 * day,
      lifecycle: 'active',
    }),
  ];

  const report = engine.evolve(cards, now);

  assert.ok(report.similarities.some((item) => item.leftCardId === 'merge-a' && item.rightCardId === 'merge-b'));
  assert.ok(report.conflicts.some((item) => item.leftCardId === 'merge-a' && item.rightCardId === 'merge-b'));
  assert.ok(report.mergePlans.length >= 1);
  assert.ok(report.splitPlans.some((plan) => plan.sourceCardId === 'split-a'));
  assert.ok(report.clusters.length >= 1);
});

test('knowledge consumer evolves knowledge automatically after evidence consumption', () => {
  const consumer = new KnowledgeConsumer();
  consumer.consume([
    {
      id: 'ev-knowledge-1',
      source: 'research',
      key: 'research:setup_quality',
      value: 0.86,
      weight: 1.2,
      confidence: 0.9,
      uncertainty: 0.1,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    },
  ]);

  const report = consumer.getLastEvolutionReport();
  const cards = consumer.getKnowledgeCards();

  assert.ok(report);
  assert.ok(cards.length >= 1);
  assert.ok(report?.decisions.length >= 1);
});
