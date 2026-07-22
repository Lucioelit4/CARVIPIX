import type { SimulationProfileConfig, SimulationRiskType } from "./probabilistic-simulation-engine";

export interface ProbabilisticProfileDefinition extends SimulationProfileConfig {
  displayName: string;
  avatarKey: string;
  isBotProfile: boolean;
  isRealUser: false;
  profileType: "PROBABILISTIC_SIMULATION";
  excludeFromMembers: true;
  excludeFromRevenue: true;
  excludeFromLiveResults: true;
  excludeFromTestimonials: true;
}

const CAPITALS = [500, 1_000, 2_500, 5_000, 10_000, 25_000] as const;
const FIRST_NAMES = [
  "Sofia", "Daniel", "Michael", "Valeria", "Alex", "Andrea", "Bruno", "Camila", "Elena", "Gabriel",
  "Hector", "Irene", "James", "Karla", "Lucas", "Marina", "Nicolas", "Olivia", "Pablo", "Renata",
] as const;
const LAST_INITIALS = ["M", "R", "T", "S", "A", "B", "C", "D", "F", "G", "L", "P"] as const;

function riskType(index: number): SimulationRiskType {
  if (index < 20) return "CONSERVATIVE";
  if (index < 45) return "MODERATE";
  return "DYNAMIC";
}

function isBot(index: number, risk: SimulationRiskType): boolean {
  const start = risk === "CONSERVATIVE" ? 0 : risk === "MODERATE" ? 20 : 45;
  const selected = risk === "CONSERVATIVE" ? 8 : risk === "MODERATE" ? 10 : 6;
  return index - start < selected;
}

export function createProbabilisticProfiles(runId: string): ProbabilisticProfileDefinition[] {
  if (!runId.trim()) throw new Error("PROBABILISTIC_RUN_ID_REQUIRED");
  return Array.from({ length: 60 }, (_, index) => {
    const risk = riskType(index);
    return {
      profileId: `${runId}-profile-${String(index + 1).padStart(2, "0")}`,
      displayName: `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_INITIALS[Math.floor(index / FIRST_NAMES.length) % LAST_INITIALS.length]}.`,
      avatarKey: `probabilistic-avatar-${String(index + 1).padStart(2, "0")}`,
      initialBalance: CAPITALS[index % CAPITALS.length],
      riskType: risk,
      isBotProfile: isBot(index, risk),
      isRealUser: false,
      profileType: "PROBABILISTIC_SIMULATION",
      excludeFromMembers: true,
      excludeFromRevenue: true,
      excludeFromLiveResults: true,
      excludeFromTestimonials: true,
    };
  });
}