import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_SEGMENT_LENGTH = 4;
const CODE_SEGMENTS = 3;

function randomAlphabetCharacter(): string {
  const unbiasedLimit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  while (true) {
    const value = randomBytes(1)[0];
    if (value < unbiasedLimit) {
      return CODE_ALPHABET[value % CODE_ALPHABET.length];
    }
  }
}

export function normalizeFounderCode(value: string): string {
  return value.trim().toUpperCase();
}

export function generateFounderCode(): string {
  const segments = Array.from({ length: CODE_SEGMENTS }, () =>
    Array.from({ length: CODE_SEGMENT_LENGTH }, randomAlphabetCharacter).join(""),
  );
  return `CVX-FND-${segments.join("-")}`;
}

export function hashFounderCode(rawCode: string): string {
  const salt = randomBytes(16);
  const digest = scryptSync(normalizeFounderCode(rawCode), salt, 64);
  return `scrypt:${salt.toString("hex")}:${digest.toString("hex")}`;
}

export function verifyFounderCode(rawCode: string, encodedHash: string): boolean {
  const [algorithm, saltHex, digestHex] = encodedHash.split(":");
  if (algorithm !== "scrypt" || !saltHex || !digestHex) {
    return false;
  }

  try {
    const expected = Buffer.from(digestHex, "hex");
    const actual = scryptSync(normalizeFounderCode(rawCode), Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}