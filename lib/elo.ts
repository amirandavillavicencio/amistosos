interface EloInput {
  ownRating: number;
  opponentRating: number;
  actualScore: 0 | 0.5 | 1;
  setsWon: number;
  setsLost: number;
  kFactor?: number;
  confidenceMultiplier?: number;
}

export const BASE_ELO = 1000;
export const BASE_K = 24;

export function expectedScore(ownRating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - ownRating) / 400));
}

function setDifferenceMultiplier(setsWon: number, setsLost: number): number {
  const diff = Math.abs(setsWon - setsLost);
  if (diff >= 3) return 1.15;
  if (diff === 2) return 1.08;
  if (diff === 1) return 1.04;
  return 1;
}

export function updateElo({
  ownRating,
  opponentRating,
  actualScore,
  setsWon,
  setsLost,
  kFactor = BASE_K,
  confidenceMultiplier = 1
}: EloInput) {
  const expected = expectedScore(ownRating, opponentRating);
  const momentum = setDifferenceMultiplier(setsWon, setsLost);
  const delta = Math.round(kFactor * confidenceMultiplier * momentum * (actualScore - expected));
  return {
    expected,
    delta,
    newRating: ownRating + delta
  };
}

export function resolveMatchOutcome(setsWon: number, setsLost: number): 0 | 0.5 | 1 {
  if (setsWon > setsLost) return 1;
  if (setsWon < setsLost) return 0;
  return 0.5;
}

export function confidenceFromHistory(matchesPlayed: number): number {
  if (matchesPlayed >= 12) return 1;
  if (matchesPlayed >= 6) return 0.92;
  if (matchesPlayed >= 3) return 0.85;
  return 0.75;
}
