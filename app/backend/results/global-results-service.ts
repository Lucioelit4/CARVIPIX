import "server-only";

import type { PoolClient } from "pg";
import { backendDatabase } from "../core/database";
import {
  isProbabilisticResultsEnabled,
  shouldApplyOfficialClosure,
  validateProbabilisticRun,
} from "./probabilistic-results-domain";
import {
  adjustedWinProbability,
  runProbabilisticSimulation,
  type ProbabilisticScenario,
  type SimulatedProfileResult,
  type SimulationRiskType,
} from "./probabilistic-simulation-engine";
import {
  createProbabilisticProfiles,
  type ProbabilisticProfileDefinition,
} from "./probabilistic-profile-factory";
import {
  buildProfileSummaries,
  mapLifecycleStatusToObservedOutcome,
} from "./probabilistic-results-mappers";

export interface GlobalResultsSnapshot {
  enabled: boolean;
  generatedAt: string;
  simulation: null | {
    runId: string;
    methodologyVersion: string;
    periodStart: string;
    periodEnd: string;
    dataSource: string;
    dataHash: string;
    seed: string;
    iterations: number;
    assumptions: Record<string, unknown>;
    limitations: Record<string, unknown>;
    metrics: Record<string, unknown>;
  };
  profiles: {
    total: number;
    botTotal: number;
    featured: Array<{
      profileId: string;
      displayName: string;
      avatarKey: string;
      riskType: SimulationRiskType;
      initialBalance: number;
      currentBalance: number;
      maxDrawdownPct: number;
      operationsApplied: number;
      isBotProfile: boolean;
      returnPct: number;
      probableBalanceRange: { low: number; median: number; high: number };
      probabilityOfLoss: number;
      observedComponentPct: number;
      simulatedComponentPct: number;
      equityCurve: Array<{ occurredAt: string; balance: number; drawdownPct: number }>;
      updatedAt: string;
    }>;
  };
  alerts: {
    total: number;
    activated: number;
    takeProfits: number;
    stopLosses: number;
    cancelled: number;
    expired: number;
    notActivated: number;
    netPips: number;
    weeklyPips: number;
    monthlyPips: number;
    winRate: number;
    averageRiskReward: number;
  };
  activity: Array<{
    activityId: string;
    activityType: string;
    title: string;
    summary: string;
    occurredAt: string;
  }>;
}

type ProfileRow = {
  profile_id: string;
  display_name: string;
  avatar_key: string;
  risk_type: SimulationRiskType;
  initial_balance: number;
  current_balance: number;
  max_drawdown_pct: number;
  operations_applied: number;
  is_bot_profile: boolean;
  equity_curve: Array<{ occurredAt: string; balance: number; drawdownPct: number }>;
  updated_at: Date;
};

type ScenarioRow = {
  scenario_id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  source_type: "RECORDED_ANALYSIS" | "DOCUMENTED_MODEL";
  activation_probability: number;
  success_probability: number;
  risk_reward: number;
  risk_pips: number;
  spread_pips: number;
  commission_pips: number;
  slippage_pips: number;
  observed_outcome: null | "TP" | "SL" | "NOT_ACTIVATED";
  observed_signal_id: string | null;
  occurred_at: Date;
  metadata: Record<string, unknown>;
};

type RunRow = {
  run_id: string;
  methodology_version: string;
  period_start: Date;
  period_end: Date;
  data_source: string;
  data_hash: string;
  seed: string;
  iterations: number;
  assumptions: Record<string, unknown>;
  limitations: Record<string, unknown>;
  metrics: Record<string, unknown>;
  completed_at: Date | null;
};

type StoredProfileSummary = {
  returnPct: number;
  probabilityOfLoss: number;
  probableBalanceRange: { low: number; median: number; high: number };
  observedComponentPct: number;
  simulatedComponentPct: number;
};

export interface ValidatedProbabilisticRunInput {
  runId: string;
  methodologyVersion: string;
  periodStart: Date;
  periodEnd: Date;
  dataSource: string;
  dataHash: string;
  seed: string;
  iterations: number;
  assumptions: Record<string, unknown>;
  limitations: Record<string, unknown>;
  metrics: Record<string, unknown>;
  scenarios: ProbabilisticScenario[];
  profileDefinitions: ProbabilisticProfileDefinition[];
  profileResults: SimulatedProfileResult[];
  botProfileIds: string[];
}

function emptySnapshot(): GlobalResultsSnapshot {
  return {
    enabled: false,
    generatedAt: new Date().toISOString(),
    simulation: null,
    profiles: { total: 0, botTotal: 0, featured: [] },
    alerts: {
      total: 0,
      activated: 0,
      takeProfits: 0,
      stopLosses: 0,
      cancelled: 0,
      expired: 0,
      notActivated: 0,
      netPips: 0,
      weeklyPips: 0,
      monthlyPips: 0,
      winRate: 0,
      averageRiskReward: 0,
    },
    activity: [],
  };
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class GlobalResultsService {
  private async readAlertMetricsAndActivity() {
    const [alertResult, activityResult] = await Promise.all([
      backendDatabase.query<{
        total: number;
        activated: number;
        take_profits: number;
        stop_losses: number;
        cancelled: number;
        expired: number;
        not_activated: number;
        net_pips: number;
        weekly_pips: number;
        monthly_pips: number;
        win_rate: number;
        average_rr: number;
      }>(`
        SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE activated)::int AS activated,
          COUNT(*) FILTER (WHERE outcome = 'TP')::int AS take_profits,
          COUNT(*) FILTER (WHERE outcome = 'SL')::int AS stop_losses,
          COUNT(*) FILTER (WHERE outcome = 'CANCELLED')::int AS cancelled,
          COUNT(*) FILTER (WHERE outcome = 'EXPIRED')::int AS expired,
          COUNT(*) FILTER (WHERE outcome = 'NOT_ACTIVATED')::int AS not_activated,
          COALESCE(SUM(net_pips), 0) AS net_pips,
          COALESCE(SUM(net_pips) FILTER (WHERE closed_at >= NOW() - INTERVAL '7 days'), 0) AS weekly_pips,
          COALESCE(SUM(net_pips) FILTER (WHERE closed_at >= date_trunc('month', NOW())), 0) AS monthly_pips,
          CASE WHEN COUNT(*) FILTER (WHERE outcome IN ('TP', 'SL')) > 0
            THEN 100.0 * COUNT(*) FILTER (WHERE outcome = 'TP') / COUNT(*) FILTER (WHERE outcome IN ('TP', 'SL'))
            ELSE 0 END AS win_rate,
          COALESCE(AVG(risk_reward) FILTER (WHERE activated), 0) AS average_rr
        FROM alert_performance_metrics
      `),
      backendDatabase.query<{
        activity_id: string;
        activity_type: string;
        title: string;
        summary: string;
        occurred_at: Date;
      }>(`
        SELECT activity_id, activity_type, title, summary, occurred_at
        FROM results_activity_feed
        ORDER BY occurred_at DESC
        LIMIT 12
      `),
    ]);

    const alert = alertResult.rows[0];
    return {
      alerts: {
        total: numberValue(alert?.total),
        activated: numberValue(alert?.activated),
        takeProfits: numberValue(alert?.take_profits),
        stopLosses: numberValue(alert?.stop_losses),
        cancelled: numberValue(alert?.cancelled),
        expired: numberValue(alert?.expired),
        notActivated: numberValue(alert?.not_activated),
        netPips: numberValue(alert?.net_pips),
        weeklyPips: numberValue(alert?.weekly_pips),
        monthlyPips: numberValue(alert?.monthly_pips),
        winRate: numberValue(alert?.win_rate),
        averageRiskReward: numberValue(alert?.average_rr),
      },
      activity: activityResult.rows.map((item) => ({
        activityId: item.activity_id,
        activityType: item.activity_type,
        title: item.title,
        summary: item.summary,
        occurredAt: new Date(item.occurred_at).toISOString(),
      })),
    };
  }

  async getSnapshot(): Promise<GlobalResultsSnapshot> {
    const base = emptySnapshot();
    const alertsAndActivity = await this.readAlertMetricsAndActivity();

    if (!isProbabilisticResultsEnabled()) {
      return {
        ...base,
        ...alertsAndActivity,
      };
    }

    const [runResult, profilesResult] = await Promise.all([
      backendDatabase.query<RunRow>(`
        SELECT run_id, methodology_version, period_start, period_end,
          data_source, data_hash, seed, iterations,
          assumptions, limitations, metrics, completed_at
        FROM probabilistic_simulation_runs
        WHERE status = 'COMPLETED'
        ORDER BY completed_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `),
      backendDatabase.query<ProfileRow>(`
        SELECT profile.profile_id, profile.display_name, profile.avatar_key, profile.risk_type,
          profile.initial_balance, profile.current_balance, profile.max_drawdown_pct,
          profile.operations_applied, (bot.profile_id IS NOT NULL) AS is_bot_profile,
          COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'occurredAt', balance.recorded_at,
              'balance', balance.balance,
              'drawdownPct', balance.drawdown_pct
            ) ORDER BY balance.sequence_no)
            FROM probabilistic_profile_balances balance
            WHERE balance.profile_id = profile.profile_id
          ), '[]'::jsonb) AS equity_curve,
          profile.updated_at
        FROM probabilistic_profiles profile
        LEFT JOIN probabilistic_bot_profiles bot ON bot.profile_id = profile.profile_id
        WHERE profile.run_id = (
          SELECT run_id FROM probabilistic_simulation_runs
          WHERE status = 'COMPLETED' ORDER BY completed_at DESC LIMIT 1
        )
        ORDER BY bot.selection_rank NULLS LAST, profile.updated_at DESC, profile.profile_id
      `),
    ]);

    const run = runResult.rows[0];
    const profiles = profilesResult.rows;
    const profileSummaries = (run?.metrics?.profileSummaries ?? {}) as Record<string, StoredProfileSummary>;

    return {
      enabled: true,
      generatedAt: new Date().toISOString(),
      simulation: run
        ? {
            runId: run.run_id,
            methodologyVersion: run.methodology_version,
            periodStart: new Date(run.period_start).toISOString(),
            periodEnd: new Date(run.period_end).toISOString(),
            dataSource: run.data_source,
            dataHash: run.data_hash,
            seed: run.seed,
            iterations: numberValue(run.iterations),
            assumptions: run.assumptions ?? {},
            limitations: run.limitations ?? {},
            metrics: run.metrics ?? {},
          }
        : null,
      profiles: {
        total: profiles.length,
        botTotal: profiles.filter((profile) => profile.is_bot_profile).length,
        featured: profiles.slice(0, 8).map((profile) => {
          const summary = profileSummaries[profile.profile_id];
          const initialBalance = numberValue(profile.initial_balance);
          const currentBalance = numberValue(profile.current_balance);
          return {
            profileId: profile.profile_id,
            displayName: profile.display_name,
            avatarKey: profile.avatar_key,
            riskType: profile.risk_type,
            initialBalance,
            currentBalance,
            maxDrawdownPct: numberValue(profile.max_drawdown_pct),
            operationsApplied: numberValue(profile.operations_applied),
            isBotProfile: profile.is_bot_profile,
            returnPct: numberValue(summary?.returnPct ?? (initialBalance > 0 ? ((currentBalance - initialBalance) / initialBalance) * 100 : 0)),
            probableBalanceRange: summary?.probableBalanceRange ?? { low: currentBalance, median: currentBalance, high: currentBalance },
            probabilityOfLoss: numberValue(summary?.probabilityOfLoss),
            observedComponentPct: numberValue(summary?.observedComponentPct),
            simulatedComponentPct: numberValue(summary?.simulatedComponentPct ?? (summary ? undefined : 100)),
            equityCurve: Array.isArray(profile.equity_curve) ? profile.equity_curve.map(point => ({
              occurredAt: String(point.occurredAt),
              balance: numberValue(point.balance),
              drawdownPct: numberValue(point.drawdownPct),
            })) : [],
            updatedAt: new Date(profile.updated_at).toISOString(),
          };
        }),
      },
      alerts: alertsAndActivity.alerts,
      activity: alertsAndActivity.activity,
    };
  }

  async persistValidatedProbabilisticRun(input: ValidatedProbabilisticRunInput): Promise<boolean> {
    if (!isProbabilisticResultsEnabled()) return false;

    validateProbabilisticRun({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      dataSource: input.dataSource,
      dataHash: input.dataHash,
      seed: input.seed,
      iterations: input.iterations,
      scenarioIds: input.scenarios.map((scenario) => scenario.scenarioId),
    });

    if (input.profileDefinitions.length !== 60 || input.profileResults.length !== 60) {
      throw new Error("PROBABILISTIC_RUN_REQUIRES_60_PROFILES");
    }

    const resultByProfile = new Map(input.profileResults.map((result) => [result.profileId, result]));
    if (resultByProfile.size !== input.profileResults.length) {
      throw new Error("PROBABILISTIC_RUN_DUPLICATE_PROFILE_RESULTS");
    }

    for (const definition of input.profileDefinitions) {
      if (!resultByProfile.has(definition.profileId)) {
        throw new Error("PROBABILISTIC_RUN_MISSING_PROFILE_RESULT");
      }
    }

    return backendDatabase.withTransaction(async (client) => {
      await client.query(
        `
        INSERT INTO probabilistic_simulation_runs (
          run_id, methodology_version, period_start, period_end, data_source,
          data_hash, seed, iterations, assumptions, limitations, metrics, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, 'RUNNING')
        ON CONFLICT (run_id) DO UPDATE SET
          methodology_version = EXCLUDED.methodology_version,
          period_start = EXCLUDED.period_start,
          period_end = EXCLUDED.period_end,
          data_source = EXCLUDED.data_source,
          data_hash = EXCLUDED.data_hash,
          seed = EXCLUDED.seed,
          iterations = EXCLUDED.iterations,
          assumptions = EXCLUDED.assumptions,
          limitations = EXCLUDED.limitations,
          metrics = EXCLUDED.metrics,
          status = 'RUNNING',
          completed_at = NULL
      `,
        [
          input.runId,
          input.methodologyVersion,
          input.periodStart,
          input.periodEnd,
          input.dataSource,
          input.dataHash,
          input.seed,
          input.iterations,
          JSON.stringify(input.assumptions),
          JSON.stringify(input.limitations),
          JSON.stringify(input.metrics),
        ],
      );

      for (const scenario of input.scenarios) {
        const scenarioMetadata = {
          decisionQuality: scenario.decisionQuality,
          volatilityFactor: scenario.volatilityFactor,
          trendFactor: scenario.trendFactor,
          contextFactor: scenario.contextFactor,
          originalProbability: scenario.originalProbability,
        };

        await client.query(
          `
          INSERT INTO probabilistic_simulation_scenarios (
            scenario_id, run_id, symbol, direction, source_type,
            activation_probability, success_probability, risk_reward,
            risk_pips, spread_pips, commission_pips, slippage_pips,
            observed_outcome, observed_signal_id, occurred_at, metadata
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15, $16::jsonb
          )
          ON CONFLICT (scenario_id) DO UPDATE SET
            symbol = EXCLUDED.symbol,
            direction = EXCLUDED.direction,
            source_type = EXCLUDED.source_type,
            activation_probability = EXCLUDED.activation_probability,
            success_probability = EXCLUDED.success_probability,
            risk_reward = EXCLUDED.risk_reward,
            risk_pips = EXCLUDED.risk_pips,
            spread_pips = EXCLUDED.spread_pips,
            commission_pips = EXCLUDED.commission_pips,
            slippage_pips = EXCLUDED.slippage_pips,
            observed_outcome = COALESCE(probabilistic_simulation_scenarios.observed_outcome, EXCLUDED.observed_outcome),
            observed_signal_id = COALESCE(probabilistic_simulation_scenarios.observed_signal_id, EXCLUDED.observed_signal_id),
            occurred_at = EXCLUDED.occurred_at,
            metadata = EXCLUDED.metadata
        `,
          [
            scenario.scenarioId,
            input.runId,
            scenario.symbol,
            scenario.direction,
            scenario.sourceType,
            scenario.activationProbability,
            adjustedWinProbability(scenario),
            scenario.riskReward,
            scenario.riskPips,
            scenario.spreadPips,
            scenario.commissionPips,
            scenario.slippagePips,
            scenario.observedOutcome ?? null,
            scenario.observedSignalId ?? null,
            new Date(scenario.occurredAt),
            JSON.stringify(scenarioMetadata),
          ],
        );
      }

      await this.persistProfilesAndSimulationArtifacts(client, {
        runId: input.runId,
        scenarios: input.scenarios,
        profileDefinitions: input.profileDefinitions,
        profileResults: input.profileResults,
        botProfileIds: input.botProfileIds,
      });

      await client.query(
        `
        UPDATE probabilistic_simulation_runs
        SET status = 'COMPLETED', completed_at = NOW(), metrics = $2::jsonb
        WHERE run_id = $1
      `,
        [
          input.runId,
          JSON.stringify({
            ...input.metrics,
            profileSummaries: buildProfileSummaries(input.profileResults),
          }),
        ],
      );

      await client.query(
        `
        INSERT INTO results_activity_feed (activity_id, activity_type, source_id, title, summary, occurred_at, metadata)
        VALUES ($1, 'PROBABILISTIC_RUN_COMPLETED', $2, $3, $4, NOW(), $5::jsonb)
        ON CONFLICT (activity_type, source_id) DO NOTHING
      `,
        [
          `activity-probabilistic-run-${input.runId}`,
          input.runId,
          `Simulacion probabilistica completada ${input.methodologyVersion}`,
          `Se registraron ${input.scenarios.length} escenarios y ${input.profileResults.length} perfiles.`,
          JSON.stringify({ runId: input.runId, methodologyVersion: input.methodologyVersion }),
        ],
      );

      return true;
    });
  }

  async createProfilesForRun(runId: string): Promise<void> {
    if (!isProbabilisticResultsEnabled()) return;

    await backendDatabase.withTransaction(async (client) => {
      const profiles = createProbabilisticProfiles(runId);
      for (const [index, profile] of profiles.entries()) {
        await client.query(
          `
          INSERT INTO probabilistic_profiles (
            profile_id, run_id, display_name, avatar_key, risk_type, initial_balance,
            current_balance, peak_balance, max_drawdown_pct, weekly_result, monthly_result,
            operations_applied, is_real_user, profile_type, exclude_from_members,
            exclude_from_revenue, exclude_from_live_users, exclude_from_testimonials, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $6, $6, 0, 0, 0,
            0, false, 'PROBABILISTIC_SIMULATION', true,
            true, true, true, NOW()
          )
          ON CONFLICT (profile_id) DO NOTHING
        `,
          [profile.profileId, runId, profile.displayName, profile.avatarKey, profile.riskType, profile.initialBalance],
        );

        if (profile.isBotProfile) {
          await client.query(
            `
            INSERT INTO probabilistic_bot_profiles (profile_id, selection_rank)
            VALUES ($1, $2) ON CONFLICT (profile_id) DO NOTHING
          `,
            [profile.profileId, index + 1],
          );
        }
      }
    });
  }

  private async persistProfilesAndSimulationArtifacts(
    client: PoolClient,
    input: {
      runId: string;
      scenarios: ProbabilisticScenario[];
      profileDefinitions: ProbabilisticProfileDefinition[];
      profileResults: SimulatedProfileResult[];
      botProfileIds: string[];
    },
  ): Promise<void> {
    const profileResultById = new Map(input.profileResults.map((profile) => [profile.profileId, profile]));
    const scenarioById = new Map(input.scenarios.map((scenario) => [scenario.scenarioId, scenario]));

    await client.query(
      `
      DELETE FROM probabilistic_profile_events
      WHERE profile_id IN (SELECT profile_id FROM probabilistic_profiles WHERE run_id = $1)
    `,
      [input.runId],
    );
    await client.query(
      `
      DELETE FROM probabilistic_profile_balances
      WHERE profile_id IN (SELECT profile_id FROM probabilistic_profiles WHERE run_id = $1)
    `,
      [input.runId],
    );
    await client.query(
      `
      DELETE FROM probabilistic_bot_profiles
      WHERE profile_id IN (SELECT profile_id FROM probabilistic_profiles WHERE run_id = $1)
    `,
      [input.runId],
    );

    for (const profileDefinition of input.profileDefinitions) {
      const result = profileResultById.get(profileDefinition.profileId);
      if (!result) continue;

      const peakBalance = result.equityCurve.reduce(
        (peak, point) => Math.max(peak, numberValue(point.balance)),
        numberValue(profileDefinition.initialBalance),
      );

      await client.query(
        `
        INSERT INTO probabilistic_profiles (
          profile_id, run_id, display_name, avatar_key, risk_type, initial_balance,
          current_balance, peak_balance, max_drawdown_pct, weekly_result, monthly_result,
          operations_applied, is_real_user, profile_type, exclude_from_members,
          exclude_from_revenue, exclude_from_live_users, exclude_from_testimonials, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, false, 'PROBABILISTIC_SIMULATION', true,
          true, true, true, NOW()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          avatar_key = EXCLUDED.avatar_key,
          risk_type = EXCLUDED.risk_type,
          initial_balance = EXCLUDED.initial_balance,
          current_balance = EXCLUDED.current_balance,
          peak_balance = EXCLUDED.peak_balance,
          max_drawdown_pct = EXCLUDED.max_drawdown_pct,
          weekly_result = EXCLUDED.weekly_result,
          monthly_result = EXCLUDED.monthly_result,
          operations_applied = EXCLUDED.operations_applied,
          updated_at = NOW()
      `,
        [
          profileDefinition.profileId,
          input.runId,
          profileDefinition.displayName,
          profileDefinition.avatarKey,
          profileDefinition.riskType,
          profileDefinition.initialBalance,
          result.finalBalance,
          peakBalance,
          result.maxDrawdownPct,
          result.pnl,
          result.pnl,
          result.simulatedOperations,
        ],
      );

      const shouldBeBot = input.botProfileIds.includes(profileDefinition.profileId) || profileDefinition.isBotProfile;
      if (shouldBeBot) {
        const selectionRank = input.botProfileIds.indexOf(profileDefinition.profileId);
        await client.query(
          `
          INSERT INTO probabilistic_bot_profiles (profile_id, selection_rank, signals_processed, performance_by_asset)
          VALUES ($1, $2, $3, $4::jsonb)
          ON CONFLICT (profile_id) DO UPDATE SET
            selection_rank = EXCLUDED.selection_rank,
            signals_processed = EXCLUDED.signals_processed,
            performance_by_asset = EXCLUDED.performance_by_asset
        `,
          [
            profileDefinition.profileId,
            selectionRank >= 0 ? selectionRank + 1 : 999,
            result.simulatedOperations,
            JSON.stringify({}),
          ],
        );
      }

      let curvePeak = numberValue(profileDefinition.initialBalance);
      const balanceRecords: Array<{
        sequenceNo: number;
        balance: number;
        drawdownPct: number;
        recordedAt: string;
      }> = [];
      for (let sequence = 0; sequence < result.equityCurve.length; sequence += 1) {
        const point = result.equityCurve[sequence];
        const pointBalance = numberValue(point.balance);
        curvePeak = Math.max(curvePeak, pointBalance);
        const pointDrawdownPct = curvePeak > 0
          ? Number((((curvePeak - pointBalance) / curvePeak) * 100).toFixed(4))
          : 0;
        balanceRecords.push({
          sequenceNo: sequence + 1,
          balance: pointBalance,
          drawdownPct: pointDrawdownPct,
          recordedAt: new Date(point.occurredAt).toISOString(),
        });
      }
      await client.query(`
        INSERT INTO probabilistic_profile_balances (
          profile_id, sequence_no, balance, drawdown_pct, recorded_at
        )
        SELECT $1, record.sequence_no, record.balance, record.drawdown_pct, record.recorded_at
        FROM jsonb_to_recordset($2::jsonb) AS record(
          sequence_no INTEGER,
          balance NUMERIC,
          drawdown_pct NUMERIC,
          recorded_at TIMESTAMPTZ
        )
        ON CONFLICT (profile_id, sequence_no) DO UPDATE SET
          balance = EXCLUDED.balance,
          drawdown_pct = EXCLUDED.drawdown_pct,
          recorded_at = EXCLUDED.recorded_at
      `, [profileDefinition.profileId, JSON.stringify(balanceRecords.map(record => ({
        sequence_no: record.sequenceNo,
        balance: record.balance,
        drawdown_pct: record.drawdownPct,
        recorded_at: record.recordedAt,
      })))]);

      const eventRecords: Array<Record<string, unknown>> = [];
      for (let index = 0; index < result.outcomes.length; index += 1) {
        const outcome = result.outcomes[index];
        const scenario = scenarioById.get(outcome.scenarioId);
        if (!scenario) continue;

        const before = numberValue(result.equityCurve[index]?.balance);
        const after = numberValue(result.equityCurve[index + 1]?.balance);
        const peak = result.equityCurve
          .slice(0, index + 2)
          .reduce((max, point) => Math.max(max, numberValue(point.balance)), numberValue(profileDefinition.initialBalance));
        const drawdownPct = peak > 0 ? Number((((peak - after) / peak) * 100).toFixed(4)) : 0;
        const signalId = outcome.source === "OBSERVED"
          ? (scenario.observedSignalId ?? `scenario:${scenario.scenarioId}`)
          : `scenario:${scenario.scenarioId}`;

        eventRecords.push({
          event_id: `prob-event-${profileDefinition.profileId}-${signalId}`,
          signal_id: signalId,
          source_type: outcome.source === "OBSERVED" ? "OBSERVED_OFFICIAL_CLOSURE" : "SIMULATED_SCENARIO",
          outcome: outcome.outcome,
          balance_before: before,
          balance_after: after,
          pnl: numberValue(outcome.pnl),
          drawdown_pct: drawdownPct,
          occurred_at: new Date(scenario.occurredAt).toISOString(),
          metadata: { scenarioId: scenario.scenarioId, pips: outcome.pips },
        });
      }
      await client.query(`
        INSERT INTO probabilistic_profile_events (
          event_id, profile_id, signal_id, source_type, outcome, balance_before,
          balance_after, pnl, drawdown_pct, occurred_at, metadata
        )
        SELECT record.event_id, $1, record.signal_id, record.source_type, record.outcome,
          record.balance_before, record.balance_after, record.pnl, record.drawdown_pct,
          record.occurred_at, record.metadata
        FROM jsonb_to_recordset($2::jsonb) AS record(
          event_id TEXT,
          signal_id TEXT,
          source_type TEXT,
          outcome TEXT,
          balance_before NUMERIC,
          balance_after NUMERIC,
          pnl NUMERIC,
          drawdown_pct NUMERIC,
          occurred_at TIMESTAMPTZ,
          metadata JSONB
        )
        ON CONFLICT (profile_id, signal_id) DO UPDATE SET
          source_type = EXCLUDED.source_type,
          outcome = EXCLUDED.outcome,
          balance_before = EXCLUDED.balance_before,
          balance_after = EXCLUDED.balance_after,
          pnl = EXCLUDED.pnl,
          drawdown_pct = EXCLUDED.drawdown_pct,
          occurred_at = EXCLUDED.occurred_at,
          metadata = EXCLUDED.metadata
      `, [profileDefinition.profileId, JSON.stringify(eventRecords)]);
    }
  }

  async applyOfficialClosure(signalId: string): Promise<void> {
    await backendDatabase.withTransaction(async (client) => {
      const signalResult = await client.query<{
        signal_id: string;
        symbol: string;
        decision: string;
        signal_status: string;
        source: string;
        entry_price: number | null;
        stop_loss: number | null;
        take_profit: number | null;
        activated_at: Date | null;
        closed_at: Date | null;
        metadata: Record<string, unknown>;
      }>(
        `
        SELECT signal_id, symbol, decision, signal_status, source, entry_price,
          stop_loss, take_profit, activated_at, closed_at, metadata
        FROM real_signal_lifecycle WHERE signal_id = $1 FOR UPDATE
      `,
        [signalId],
      );

      const signal = signalResult.rows[0];
      if (!signal) return;

      const tags = Array.isArray(signal.metadata?.tags) ? signal.metadata.tags.map(String) : [];
      if (!shouldApplyOfficialClosure({
        decision: signal.decision,
        status: signal.signal_status,
        source: signal.source,
        activatedAt: signal.activated_at,
        tags,
      })) {
        return;
      }

      const outcome = mapLifecycleStatusToObservedOutcome(signal.signal_status);
      if (!outcome) return;

      const entry = numberValue(signal.entry_price);
      const stop = numberValue(signal.stop_loss);
      const take = numberValue(signal.take_profit);
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(take - entry);
      const riskReward = risk > 0 ? reward / risk : 0;
      const closedAt = signal.closed_at ?? new Date();

      await client.query(
        `
        INSERT INTO alert_performance_metrics (
          signal_id, symbol, direction, outcome, net_pips, risk_reward,
          activated, closed_at, source, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9::jsonb)
        ON CONFLICT (signal_id) DO NOTHING
      `,
        [
          signal.signal_id,
          signal.symbol,
          signal.decision === "ENTER_BUY" ? "BUY" : "SELL",
          outcome,
          numberValue(signal.metadata?.netPips),
          riskReward || null,
          closedAt,
          signal.source,
          JSON.stringify({ lifecycleStatus: signal.signal_status }),
        ],
      );

      if (!isProbabilisticResultsEnabled()) return;

      const runResult = await client.query<RunRow>(`
        SELECT run_id, methodology_version, period_start, period_end,
          data_source, data_hash, seed, iterations,
          assumptions, limitations, metrics, completed_at
        FROM probabilistic_simulation_runs
        WHERE status = 'COMPLETED'
        ORDER BY completed_at DESC NULLS LAST, created_at DESC
        LIMIT 1
        FOR UPDATE
      `);

      const run = runResult.rows[0];
      if (!run) {
        await client.query(
          `
          INSERT INTO results_activity_feed (activity_id, activity_type, source_id, title, summary, occurred_at, metadata)
          VALUES ($1, 'OFFICIAL_ALERT_WITHOUT_SIMULATION', $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT (activity_type, source_id) DO NOTHING
        `,
          [
            `activity-official-alert-without-run-${signal.signal_id}`,
            signal.signal_id,
            `${signal.symbol} ${outcome}`,
            "Cierre oficial registrado sin una simulacion probabilistica activa.",
            closedAt,
            JSON.stringify({ signalId: signal.signal_id }),
          ],
        );
        return;
      }

      const scenarioResult = await client.query<ScenarioRow>(
        `
        SELECT scenario_id, symbol, direction, source_type,
          activation_probability, success_probability, risk_reward,
          risk_pips, spread_pips, commission_pips, slippage_pips,
          observed_outcome, observed_signal_id, occurred_at, metadata
        FROM probabilistic_simulation_scenarios
        WHERE run_id = $1
          AND symbol = $2
          AND occurred_at BETWEEN $3::timestamptz - INTERVAL '7 days' AND $3::timestamptz + INTERVAL '7 days'
        ORDER BY ABS(EXTRACT(EPOCH FROM (occurred_at - $3::timestamptz))) ASC, occurred_at DESC
        LIMIT 1
        FOR UPDATE
      `,
        [run.run_id, signal.symbol, closedAt],
      );

      const nearestScenario = scenarioResult.rows[0];
      if (!nearestScenario) {
        await client.query(
          `
          INSERT INTO results_activity_feed (activity_id, activity_type, source_id, title, summary, occurred_at, metadata)
          VALUES ($1, 'OFFICIAL_ALERT_NO_SCENARIO', $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT (activity_type, source_id) DO NOTHING
        `,
          [
            `activity-official-alert-no-scenario-${signal.signal_id}`,
            signal.signal_id,
            `${signal.symbol} ${outcome}`,
            "No se encontro escenario modelado elegible en la ventana de 7 dias; no se mutaron perfiles.",
            closedAt,
            JSON.stringify({ signalId: signal.signal_id, runId: run.run_id }),
          ],
        );
        return;
      }

      if (nearestScenario.observed_signal_id && nearestScenario.observed_signal_id !== signal.signal_id) {
        await client.query(
          `
          INSERT INTO results_activity_feed (activity_id, activity_type, source_id, title, summary, occurred_at, metadata)
          VALUES ($1, 'OFFICIAL_ALERT_ALREADY_MATCHED', $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT (activity_type, source_id) DO NOTHING
        `,
          [
            `activity-official-alert-already-matched-${signal.signal_id}`,
            signal.signal_id,
            `${signal.symbol} ${outcome}`,
            "El escenario objetivo ya estaba asociado a otra senal observada; se evito doble contribucion.",
            closedAt,
            JSON.stringify({ signalId: signal.signal_id, scenarioId: nearestScenario.scenario_id }),
          ],
        );
        return;
      }

      await client.query(
        `
        UPDATE probabilistic_simulation_scenarios
        SET observed_outcome = $2,
            observed_signal_id = $3,
            metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb
        WHERE scenario_id = $1
      `,
        [
          nearestScenario.scenario_id,
          outcome,
          signal.signal_id,
          JSON.stringify({ observedAt: closedAt.toISOString(), observedSource: "real_signal_lifecycle" }),
        ],
      );

      const scenariosResult = await client.query<ScenarioRow>(
        `
        SELECT scenario_id, symbol, direction, source_type,
          activation_probability, success_probability, risk_reward,
          risk_pips, spread_pips, commission_pips, slippage_pips,
          observed_outcome, observed_signal_id, occurred_at, metadata
        FROM probabilistic_simulation_scenarios
        WHERE run_id = $1
        ORDER BY occurred_at ASC, scenario_id ASC
      `,
        [run.run_id],
      );

      const profileDefinitionsResult = await client.query<{
        profile_id: string;
        display_name: string;
        avatar_key: string;
        risk_type: SimulationRiskType;
        initial_balance: number;
        is_bot_profile: boolean;
      }>(
        `
        SELECT profile.profile_id, profile.display_name, profile.avatar_key,
          profile.risk_type, profile.initial_balance,
          (bot.profile_id IS NOT NULL) AS is_bot_profile
        FROM probabilistic_profiles profile
        LEFT JOIN probabilistic_bot_profiles bot ON bot.profile_id = profile.profile_id
        WHERE profile.run_id = $1
        ORDER BY profile.profile_id ASC
      `,
        [run.run_id],
      );

      const profileDefinitions: ProbabilisticProfileDefinition[] = profileDefinitionsResult.rows.map((row) => ({
        profileId: row.profile_id,
        displayName: row.display_name,
        avatarKey: row.avatar_key,
        initialBalance: numberValue(row.initial_balance),
        riskType: row.risk_type,
        isBotProfile: row.is_bot_profile,
        isRealUser: false,
        profileType: "PROBABILISTIC_SIMULATION",
        excludeFromMembers: true,
        excludeFromRevenue: true,
        excludeFromLiveResults: true,
        excludeFromTestimonials: true,
      }));

      const simulationScenarios: ProbabilisticScenario[] = scenariosResult.rows.map((row) => {
        const metadata = row.metadata ?? {};
        return {
          scenarioId: row.scenario_id,
          occurredAt: new Date(row.occurred_at).toISOString(),
          symbol: row.symbol,
          direction: row.direction,
          originalProbability: numberValue(metadata.originalProbability ?? row.success_probability),
          decisionQuality: numberValue(metadata.decisionQuality ?? 0.5),
          riskReward: numberValue(row.risk_reward),
          activationProbability: numberValue(row.activation_probability),
          volatilityFactor: numberValue(metadata.volatilityFactor ?? 0.5),
          trendFactor: numberValue(metadata.trendFactor ?? 0.5),
          contextFactor: numberValue(metadata.contextFactor ?? 0.5),
          riskPips: numberValue(row.risk_pips),
          spreadPips: numberValue(row.spread_pips),
          commissionPips: numberValue(row.commission_pips),
          slippagePips: numberValue(row.slippage_pips),
          sourceType: row.source_type,
          observedOutcome: row.observed_outcome ?? undefined,
          observedSignalId: row.observed_signal_id ?? undefined,
        };
      });

      const simulationResult = runProbabilisticSimulation({
        seed: run.seed,
        iterations: numberValue(run.iterations),
        scenarios: simulationScenarios,
        profiles: profileDefinitions.map((profile) => ({
          profileId: profile.profileId,
          initialBalance: profile.initialBalance,
          riskType: profile.riskType,
        })),
        generatedAt: new Date().toISOString(),
      });

      const botProfileIds = profileDefinitions
        .filter((profile) => profile.isBotProfile)
        .map((profile) => profile.profileId);

      await this.persistProfilesAndSimulationArtifacts(client, {
        runId: run.run_id,
        scenarios: simulationScenarios,
        profileDefinitions,
        profileResults: simulationResult.profiles,
        botProfileIds,
      });

      await client.query(
        `
        UPDATE probabilistic_simulation_runs
        SET metrics = $2::jsonb
        WHERE run_id = $1
      `,
        [
          run.run_id,
          JSON.stringify({
            ...(run.metrics ?? {}),
            expectedValueR: simulationResult.expectedValueR,
            profileSummaries: buildProfileSummaries(simulationResult.profiles),
            lastObservedClosureSignalId: signal.signal_id,
            lastObservedClosureScenarioId: nearestScenario.scenario_id,
          }),
        ],
      );

      await client.query(
        `
        INSERT INTO results_activity_feed (activity_id, activity_type, source_id, title, summary, occurred_at, metadata)
        VALUES ($1, 'OFFICIAL_ALERT_CLOSED', $2, $3, $4, $5, $6::jsonb)
        ON CONFLICT (activity_type, source_id) DO NOTHING
      `,
        [
          `activity-${signal.signal_id}`,
          signal.signal_id,
          `${signal.symbol} ${outcome}`,
          `Alerta oficial vinculada al escenario ${nearestScenario.scenario_id} y simulacion recalculada.`,
          closedAt,
          JSON.stringify({ runId: run.run_id, scenarioId: nearestScenario.scenario_id, sourceType: "OBSERVED_OFFICIAL_CLOSURE" }),
        ],
      );
    });
  }
}

export const globalResultsService = new GlobalResultsService();