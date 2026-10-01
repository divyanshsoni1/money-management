"use client";

import { useState, useCallback, useMemo, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TradeResult = "win" | "loss" | null;

export interface TradeEntry {
  index: number;
  stake: number;
  result: TradeResult;
  newBalance: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Broker payout rate (%). This is a fixed constant in the original UI — it is
 * not derived from Balance / Trades / Expected Wins.
 */
const AVERAGE_PAYOUT = 96;

/** Prevent absurdly large trade counts from locking the browser. */
const MAX_TRADES = 9999;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Parse a user-entered string to a finite number, or null if invalid/empty. */
function parseNum(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return isFinite(n) && !isNaN(n) ? n : null;
}

/** Round to `dp` decimal places and strip trailing zeros. */
function round(n: number, dp = 2): number {
  return parseFloat(n.toFixed(dp));
}

// ─── Profit Percentage — binomial cumulative probability formula ──────────────
//
// Variables
//   N  = total trades
//   W  = expected (required) wins
//   P  = payout percentage (e.g. 96 for 96%)
//
// Step 1 — decimal odds
//   Q = 1 + P / 100
//
// Step 2 — implied win probability per trade
//   p = 1 / Q
//   q = 1 - p
//
// Step 3 — cumulative success probability (at least W wins from N trades)
//   P_success = Σ_{k=W}^{N} C(N,k) · p^k · q^(N-k)
//
// Step 4 — capital multiplier
//   M = 1 / P_success
//
// Step 5 — profit percentage
//   ProfitPct = (M - 1) × 100
//
// Numerical stability
//   Each binomial term is evaluated in log-space to avoid factorial overflow
//   and floating-point underflow with large N:
//
//     logTerm(k) = logC(N,k) + k·log(p) + (N-k)·log(q)
//     term(k)    = exp(logTerm(k))
//
//   logC(N,k) is built iteratively via the recurrence:
//     logC(N,0) = 0
//     logC(N,k) = logC(N,k-1) + log(N-k+1) - log(k)
//
//   This avoids computing N! directly and keeps intermediate values finite
//   for all N up to JavaScript's safe integer range.

/** Compute log of binomial coefficient C(N,k) iteratively — no factorial overflow. */
function logBinomCoeff(n: number, k: number): number {
  // C(n,k) == C(n, n-k); use the smaller side to minimise iterations
  const kk = k > n - k ? n - k : k;
  let logC = 0;
  for (let i = 0; i < kk; i++) {
    logC += Math.log(n - i) - Math.log(i + 1);
  }
  return logC;
}

/**
 * Cumulative binomial probability: P(X >= W) where X ~ Binomial(N, p).
 *
 * Each term is evaluated in log-space then summed as probabilities.
 * Returns a value in [0, 1].
 */
function binomialCDF(n: number, w: number, p: number): number {
  // Edge cases
  if (w === 0) return 1; // P(X >= 0) is always 1
  if (w > n) return 0;   // impossible condition

  const q = 1 - p;
  const logP = p > 0 ? Math.log(p) : -Infinity;
  const logQ = q > 0 ? Math.log(q) : -Infinity;

  let sum = 0;
  let logC = 0; // logC(n, w-1) — built up to w first, then incremented

  // Build logC(n, w) by iterating from 0 to w
  for (let i = 0; i < w; i++) {
    logC += Math.log(n - i) - Math.log(i + 1);
  }

  // Sum terms k = w .. n
  for (let k = w; k <= n; k++) {
    // logTerm = logC(n,k) + k*log(p) + (n-k)*log(q)
    const logTerm =
      logC +
      k * logP +
      (n - k) * logQ;

    // exp(-Infinity) = 0, so terms where p=0 or q=0 are handled safely
    const term = isFinite(logTerm) ? Math.exp(logTerm) : 0;
    sum += term;

    // Advance logC: logC(n, k+1) = logC(n,k) + log(n-k) - log(k+1)
    if (k < n) {
      logC += Math.log(n - k) - Math.log(k + 1);
    }
  }

  // Clamp to [0, 1] to absorb any floating-point rounding noise
  return Math.min(1, Math.max(0, sum));
}

/**
 * Calculate Profit Percentage using the binomial cumulative probability formula.
 *
 * @param trades        N — total number of trades (positive integer)
 * @param expectedWins  W — required wins (non-negative integer, ≤ trades)
 * @param avgPayout     P — broker payout percentage (e.g. 96 for 96%)
 * @returns             Profit Percentage rounded to 2 dp, or null if inputs are invalid
 */
export function calcProfitPercentage(
  trades: number | null,
  expectedWins: number | null,
  avgPayout: number
): number | null {
  // ── Input validation ────────────────────────────────────────────────
  if (trades === null || expectedWins === null) return null;
  if (trades < 0 || expectedWins < 0 || avgPayout < 0) return null;
  if (!Number.isInteger(trades) || !Number.isInteger(expectedWins)) return null;
  if (trades === 0) return null; // no meaningful result with zero trades
  if (expectedWins > trades) return null; // impossible success condition

  // ── Step 1: decimal odds ────────────────────────────────────────────
  const Q = 1 + avgPayout / 100;

  // ── Step 2: implied win probability ────────────────────────────────
  // Q is always >= 1, so p is always in (0, 1]
  const p = 1 / Q;

  // ── Step 3: cumulative success probability ──────────────────────────
  const P_success = binomialCDF(trades, expectedWins, p);

  // ── Step 4 + 5: multiplier → profit percentage ──────────────────────
  if (P_success <= 0) return null; // guard against division by zero

  const M = 1 / P_success;
  const profitPct = (M - 1) * 100;

  // Infinity/NaN safety (shouldn't occur after guards, but be explicit)
  if (!isFinite(profitPct)) return null;

  return round(profitPct, 2);
}

// ─── First Stake calculation ──────────────────────────────────────────────────
//
// Formula:
//   C_target = B × (1 + ProfitPercentage / 100)
//
//   Stake_1 = round(
//     C_target × C(N-1, W-1) × p^W × (1-p)^(N-W)
//   )
//
// where p = 1 / Q = 1 / (1 + avgPayout/100)
//
// Derived from:
//   Stake_1 = C_target / Q × C(N-1,W-1) × p^(W-1) × (1-p)^(N-W)
//           = C_target × p × C(N-1,W-1) × p^(W-1) × (1-p)^(N-W)
//           = C_target × C(N-1,W-1) × p^W × (1-p)^(N-W)
//
// Numerical stability:
//   The binomial coefficient and probability powers are all computed in
//   log-space, then combined with C_target before the final exp().
//   This prevents factorial overflow for large N (e.g. N=100, W=42).

/**
 * Calculate the first stake using the binomial probability formula.
 *
 * @param balance          B  — initial balance (positive number)
 * @param trades           N  — total trades (positive integer)
 * @param expectedWins     W  — expected wins (positive integer, 1 ≤ W ≤ N)
 * @param avgPayout        P  — broker payout percentage (e.g. 96 for 96%)
 * @param profitPercentage    — calculated profit % as a plain number (e.g. 92.63)
 * @returns                   Rounded integer stake, or null if inputs are invalid
 */
export function calcFirstStake(
  balance: number | null,
  trades: number | null,
  expectedWins: number | null,
  avgPayout: number,
  profitPercentage: number | null
): number | null {
  // ── Input validation ─────────────────────────────────────────────────
  if (balance === null || trades === null || expectedWins === null) return null;
  if (profitPercentage === null) return null;
  if (balance < 0 || trades <= 0 || expectedWins <= 0) return null;
  if (!Number.isInteger(trades) || !Number.isInteger(expectedWins)) return null;
  if (expectedWins > trades) return null;
  if (avgPayout < 0) return null;

  // Edge: balance = 0 → stake is 0
  if (balance === 0) return 0;

  // ── Step 1: decimal odds and probability ─────────────────────────────
  // Q = 1 + avgPayout/100  (e.g. 1.96 for 96%)
  // p = 1 / Q
  const Q = 1 + avgPayout / 100;

  // Guard: Q = 1 means payout = 0%, p = 1 exactly.
  // In that degenerate case the formula is still mathematically defined.
  const p = 1 / Q;
  const q = 1 - p;

  // ── Step 2: target balance ────────────────────────────────────────────
  // profitPercentage is stored as a plain percentage number (e.g. 92.63),
  // so we divide by 100 to get the fractional increase.
  const C_target = balance * (1 + profitPercentage / 100);

  // ── Step 3: log-space calculation ────────────────────────────────────
  // logStake = log(C_target) + logC(N-1, W-1) + W·log(p) + (N-W)·log(q)
  const n = trades;
  const w = expectedWins;

  const logCTarget = Math.log(C_target);
  const logBinom = logBinomCoeff(n - 1, w - 1);
  const logP = p > 0 ? Math.log(p) : -Infinity;
  const logQ = q > 0 ? Math.log(q) : -Infinity;

  // (N - W) factor: when W = N, this is 0, so logQ term drops out
  const logProbPart = w * logP + (n - w) * logQ;

  const logStake = logCTarget + logBinom + logProbPart;

  if (!isFinite(logStake)) return null;

  const rawStake = Math.exp(logStake);

  if (!isFinite(rawStake) || isNaN(rawStake)) return null;

  // ── Step 4: round to nearest whole number ────────────────────────────
  return Math.round(rawStake);
}

// ─── Next Stake calculation (Masaniello conditional-probability) ──────────────
//
// After a trade is settled the next stake is derived from:
//
//   Q    = 1 + avgPayout / 100
//   p    = 1 / Q          (implied win probability per trade)
//
//   f = [ P_success(n_rem - 1, w_rem - 1) - P_success(n_rem - 1, w_rem) ]
//       / [ Q × P_success(n_rem, w_rem) ]
//
//   nextStake = newBalance × f
//
// where:
//   n_rem  = remaining trades  AFTER the settled trade
//   w_rem  = remaining required wins AFTER the settled trade
//   P_success(n, w) = binomialCDF(n, w, p)  — already defined above
//
// Edge-case handling:
//   • w_rem = 0  → target already reached; return null (cycle complete)
//   • n_rem = 0  → no trades left; return null
//   • w_rem > n_rem → mathematically impossible; return null
//   • denominator ≤ 0 → guard against division by zero / negative; return null
//   • result not finite / negative → return null

/**
 * Calculate the next stake using the Masaniello conditional-probability model.
 *
 * @param newBalance  Running balance after settling the current trade (₹)
 * @param n_rem       Remaining trades after the current trade is settled
 * @param w_rem       Remaining required wins after the current trade is settled
 * @param avgPayout   Broker payout percentage (e.g. 96 for 96%)
 * @returns           Rounded integer next stake, or null when no further stake is needed/possible
 */
export function calcNextStake(
  newBalance: number,
  n_rem: number,
  w_rem: number,
  avgPayout: number
): number | null {
  // ── Edge-case guards ──────────────────────────────────────────────────
  if (!isFinite(newBalance) || newBalance <= 0) return null;
  if (n_rem <= 0) return null;          // no trades left
  if (w_rem <= 0) return null;          // target already achieved
  if (w_rem > n_rem) return null;       // mathematically impossible

  // ── Probability setup ─────────────────────────────────────────────────
  const Q = 1 + avgPayout / 100;        // e.g. 1.96 for 96%
  const p = 1 / Q;                      // implied win probability ≈ 0.5102

  // ── P_success values ──────────────────────────────────────────────────
  // P_success(n, w) = P(X >= w | X ~ Binomial(n, p))
  const P_nrem_wrem     = binomialCDF(n_rem,     w_rem,     p); // denominator factor
  const P_nrem1_wrem1   = binomialCDF(n_rem - 1, w_rem - 1, p); // numerator, first term
  const P_nrem1_wrem    = binomialCDF(n_rem - 1, w_rem,     p); // numerator, second term

  // ── Stake fraction ────────────────────────────────────────────────────
  const numerator   = P_nrem1_wrem1 - P_nrem1_wrem;
  const denominator = Q * P_nrem_wrem;

  // Guard: denominator must be positive; numerator must be non-negative
  if (denominator <= 0 || numerator <= 0) return null;

  const f = numerator / denominator;

  if (!isFinite(f) || f <= 0) return null;

  // ── Raw stake ─────────────────────────────────────────────────────────
  const rawStake = newBalance * f;

  if (!isFinite(rawStake) || isNaN(rawStake) || rawStake <= 0) return null;

  // ── Round to nearest integer (matching existing app rounding behavior) ─
  return Math.round(rawStake);
}

/**
 * Recompute running balances for a sequence of trade entries.
 * Returns a new array with `newBalance` filled in for every resolved entry.
 */
function recalcBalances(
  initialBalance: number,
  entries: TradeEntry[]
): TradeEntry[] {
  let running = initialBalance;
  return entries.map((e) => {
    if (e.result === null) return { ...e, newBalance: null };
    if (e.result === "win") {
      running = round(running + e.stake * (AVERAGE_PAYOUT / 100), 2);
    } else {
      running = round(running - e.stake, 2);
    }
    return { ...e, newBalance: running };
  });
}

// ─── Hook interface ───────────────────────────────────────────────────────────

export interface MoneyManagementState {
  // Controlled raw strings for the three editable inputs
  balanceRaw: string;
  tradesRaw: string;
  expectedWinsRaw: string;

  // Parsed/validated numbers (null = empty or invalid input)
  balance: number | null;
  trades: number | null;
  expectedWins: number | null;

  // Derived/calculated
  averagePayout: number;
  profitPercentage: number | null;
  stake: number | null;

  // Trade rows list
  tradeEntries: TradeEntry[];

  // Input handlers
  setBalanceRaw: (v: string) => void;
  setTradesRaw: (v: string) => void;
  setExpectedWinsRaw: (v: string) => void;

  // Actions
  resetAllTrades: () => void;
  markTrade: (index: number, result: "win" | "loss") => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMoneyManagement(): MoneyManagementState {
  // ── Controlled input state ────────────────────────────────────────────
  const [balanceRaw, setBalanceRawState] = useState("1000");
  const [tradesRaw, setTradesRawState] = useState("5");
  const [expectedWinsRaw, setExpectedWinsRawState] = useState("3");

  /**
   * The trade list is now stateful so that:
   *   • Initially (and after Reset All) it contains exactly ONE item — the first stake.
   *   • Each Win/Loss action appends the next trade, up to `trades` total.
   *
   * We no longer pre-populate the entire list on initialisation.
   */
  const [tradeEntries, setTradeEntries] = useState<TradeEntry[]>([]);

  // ── Parsed values ─────────────────────────────────────────────────────

  const balance = useMemo(() => {
    const n = parseNum(balanceRaw);
    if (n === null || n < 0) return null;
    return round(n, 2);
  }, [balanceRaw]);

  const trades = useMemo(() => {
    const n = parseNum(tradesRaw);
    if (n === null || n < 0 || !Number.isInteger(n) || n > MAX_TRADES) return null;
    return n;
  }, [tradesRaw]);

  const expectedWins = useMemo(() => {
    const n = parseNum(expectedWinsRaw);
    if (n === null || n < 0 || !Number.isInteger(n)) return null;
    if (trades !== null && n > trades) return null;
    return n;
  }, [expectedWinsRaw, trades]);

  // ── Derived calculations ──────────────────────────────────────────────

  const averagePayout = AVERAGE_PAYOUT;

  const profitPercentage = useMemo(
    () => calcProfitPercentage(trades, expectedWins, averagePayout),
    [trades, expectedWins, averagePayout]
  );

  /**
   * The first stake — derived from current Money Management values.
   * This is the single source of truth; it is NOT stored separately in state.
   */
  const firstStake = useMemo(
    () => calcFirstStake(balance, trades, expectedWins, averagePayout, profitPercentage),
    [balance, trades, expectedWins, averagePayout, profitPercentage]
  );

  /**
   * Kept for backward-compatibility (returned on the hook interface).
   * Not used internally for trade row generation any more.
   */
  const stake = firstStake;

  // ── Seed / reseed the list with the first stake ───────────────────────
  //
  // We reseed whenever the first-stake value changes AND the user has not
  // yet acted on any trade (i.e. the list is either empty or contains only
  // the unresolved first-stake row).
  //
  // This satisfies §11 (Dynamic Input Changes): changing Balance/Trades/
  // Expected Wins/Payout immediately updates the first-stake row.
  //
  // If the user has already clicked Win/Loss on trade #1 we leave the list
  // alone — preserving the existing progression behaviour.

  useEffect(() => {
    setTradeEntries((prev) => {
      // "Progression has started" = any row in the list has a non-null result
      const progressionStarted = prev.some((e) => e.result !== null);
      if (progressionStarted) return prev; // don't disturb mid-progression

      // (Re)seed with exactly one first-stake item
      if (firstStake === null) return [];

      return [{ index: 1, stake: firstStake, result: null, newBalance: null }];
    });
  }, [firstStake]);

  // ── Input setters ─────────────────────────────────────────────────────

  const setBalanceRaw = useCallback((v: string) => {
    // Allow digits + at most one decimal point; strip everything else
    const cleaned = v.replace(/[^0-9.]/g, "");
    const dotIdx = cleaned.indexOf(".");
    const normalized =
      dotIdx === -1
        ? cleaned
        : cleaned.slice(0, dotIdx + 1) + cleaned.slice(dotIdx + 1).replace(/\./g, "");
    setBalanceRawState(normalized);
  }, []);

  const setTradesRaw = useCallback((v: string) => {
    // Integers only
    setTradesRawState(v.replace(/[^0-9]/g, ""));
  }, []);

  const setExpectedWinsRaw = useCallback(
    (v: string) => {
      const cleaned = v.replace(/[^0-9]/g, "");
      // Clamp to current trades value if needed
      const n = parseNum(cleaned);
      if (n !== null && trades !== null && n > trades) {
        setExpectedWinsRawState(String(trades));
        return;
      }
      setExpectedWinsRawState(cleaned);
    },
    [trades]
  );

  // ── Actions ───────────────────────────────────────────────────────────

  /**
   * Reset All:
   *   1. Clear the entire list.
   *   2. Recalculate the first stake from current inputs.
   *   3. Seed the list with exactly ONE first-stake item.
   */
  const resetAllTrades = useCallback(() => {
    setTradeEntries(() => {
      if (firstStake === null) return [];
      return [{ index: 1, stake: firstStake, result: null, newBalance: null }];
    });
  }, [firstStake]);

  /**
   * Mark a trade as Win or Loss.
   *
   * Steps:
   *   1. Record the result on the target row and compute its newBalance.
   *   2. Derive the post-settlement state:
   *        n_rem  = totalTrades - nextIndex + 1
   *        w_rem  = expectedWins - (wins settled so far including this one)
   *        balance_after = running balance after this trade
   *   3. Calculate the next stake via the Masaniello conditional-probability
   *      formula (calcNextStake).  Falls back to firstStake only when
   *      calcNextStake returns null for a valid-but-uncalculable case
   *      (e.g. w_rem = 0 meaning target already reached — in that case we
   *      skip appending a new row entirely).
   *   4. Append the next trade row with the dynamically calculated stake.
   */
  const markTrade = useCallback(
    (index: number, result: "win" | "loss") => {
      setTradeEntries((prev) => {
        // Find the row being marked
        const rowIdx = prev.findIndex((e) => e.index === index);
        if (rowIdx === -1) return prev;

        // Apply the result to this row
        const updated: TradeEntry[] = prev.map((e) =>
          e.index === index ? { ...e, result } : e
        );

        // Recompute all running balances from the initial balance
        const withBalances =
          balance !== null ? recalcBalances(balance, updated) : updated;

        // Balance immediately after this trade settles
        const thisRow = withBalances[rowIdx];
        const balanceAfter = thisRow.newBalance;

        const nextIndex = index + 1;
        const alreadyHasNext = withBalances.some((e) => e.index === nextIndex);
        const totalTrades = trades ?? 0;

        // Nothing to append if there are no more trade slots or next row exists
        if (alreadyHasNext || nextIndex > totalTrades || balanceAfter === null) {
          return withBalances;
        }

        // ── Derive post-settlement remaining state ────────────────────────
        //
        // Count wins in all settled rows (including the one just marked).
        const winsSettled = withBalances.filter(
          (e) => e.result === "win"
        ).length;

        // n_rem: how many trades are left for the NEXT row onward
        //   nextIndex is 1-based; remaining slots = totalTrades - nextIndex + 1
        const n_rem = totalTrades - nextIndex + 1;

        // w_rem: required wins still needed after this settlement
        const totalWinsRequired = expectedWins ?? 0;
        const w_rem = totalWinsRequired - winsSettled;

        // ── Calculate next stake via Masaniello ───────────────────────────
        const nextStake = calcNextStake(
          balanceAfter,
          n_rem,
          w_rem,
          averagePayout
        );

        // If calcNextStake returns null the target is already achieved or the
        // state is impossible — do not append a new row in either case.
        if (nextStake === null) return withBalances;

        withBalances.push({
          index: nextIndex,
          stake: nextStake,
          result: null,
          newBalance: null,
        });

        return withBalances;
      });
    },
    [balance, trades, expectedWins, averagePayout, firstStake]
  );

  return {
    balanceRaw,
    tradesRaw,
    expectedWinsRaw,
    balance,
    trades,
    expectedWins,
    averagePayout,
    profitPercentage,
    stake,
    tradeEntries,
    setBalanceRaw,
    setTradesRaw,
    setExpectedWinsRaw,
    resetAllTrades,
    markTrade,
  };
}
