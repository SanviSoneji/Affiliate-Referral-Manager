import { randomBytes } from "crypto";

/** URL-safe random referral code, e.g. "aB3xK9_q". */
export const generateCode = (length = 8): string =>
  randomBytes(length).toString("base64url").slice(0, length);

/** Signups / clicks as a percentage with one decimal place. */
export const conversionRate = (clicks: number, signups: number): number =>
  clicks === 0 ? 0 : Math.round((signups / clicks) * 1000) / 10;

/** Total reward credited for a number of signups. */
export const totalReward = (signups: number, rewardAmount: number): number =>
  Math.round(signups * rewardAmount * 100) / 100;

export const isDuplicateKey = (e: unknown): boolean =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "ER_DUP_ENTRY";
