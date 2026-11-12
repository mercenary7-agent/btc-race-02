// btc-race-24h-20261112-1439 entry: time-of-day bot (TypeScript, Node 22).
// Deterministic: no clock, no network, no unseeded randomness; the only time
// read is the bar's own timestamp. Strategy: go long CBBTC at the first bar
// of UTC hour 15 and exit at the first bar of UTC hour 18 — a recurring
// late-afternoon bounce window observed in the published dev recording.

import { runBars, type Bar, type BarsState } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const BUY_HOUR = 15;  // first bar of UTC hour 15: enter long
const SELL_HOUR = 18; // first bar of UTC hour 18: exit flat
const MAX_SLIPPAGE_BPS = 500;

function utcHour(tMs: number): number {
  return Math.floor(tMs / 3_600_000) % 24;
}

await runBars({
  onBatch(state: BarsState, batch: { bars: Bar[] }) {
    const bar = state.latest.get(SYMBOL);
    if (bar === undefined || state.warmingUp) return [];
    const hour = utcHour(Number(bar.t));
    const held = state.positions.get(SYMBOL);
    if (held === undefined || held.qty === 0n) {
      if (hour === BUY_HOUR && state.cash >= 1_000_000n) {
        return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }
    if (hour === SELL_HOUR) {
      return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  },
});
