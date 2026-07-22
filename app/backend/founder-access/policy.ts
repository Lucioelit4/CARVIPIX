import { verifyFounderCode } from "./security";
import type { FounderCodeStatus } from "./types";

export type FounderCodeCandidate = {
  id: string;
  codeHash: string;
  status: FounderCodeStatus;
  assignedEmail: string;
  redeemedByUserId: string | null;
};

export type FounderCodeClaimResolution =
  | { kind: "CLAIM"; codeId: string }
  | { kind: "IDEMPOTENT"; codeId: string }
  | { kind: "INVALID" };

export function resolveFounderCodeClaim(input: {
  candidates: FounderCodeCandidate[];
  rawCode: string;
  userId: string;
  userEmail: string;
  existingAccessActive: boolean;
}): FounderCodeClaimResolution {
  const normalizedEmail = input.userEmail.trim().toLowerCase();
  let matched: FounderCodeCandidate | null = null;

  for (const candidate of input.candidates) {
    const codeMatches = verifyFounderCode(input.rawCode, candidate.codeHash);
    if (codeMatches) matched = candidate;
  }

  if (!matched || matched.assignedEmail !== normalizedEmail) return { kind: "INVALID" };
  if (matched.status === "REDEEMED" && matched.redeemedByUserId === input.userId && input.existingAccessActive) {
    return { kind: "IDEMPOTENT", codeId: matched.id };
  }
  if (matched.status === "AVAILABLE") return { kind: "CLAIM", codeId: matched.id };
  return { kind: "INVALID" };
}