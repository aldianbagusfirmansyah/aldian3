import { HistoricalRatePoint } from "../types";

/**
 * Seedable random number generator to make curves consistent for the same pair and date
 */
class SeededRandom {
  private seed: number;
  constructor(seedStr: string) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    this.seed = Math.abs(hash);
  }

  // Returns number in [0, 1)
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // normal distribution using Box-Muller transform
  nextGaussian() {
    const u = this.next() || 0.0001; // Avoid 0
    const v = this.next() || 0.0001;
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

/**
 * Generates a realistic financial historical curve using a Brownian Bridge
 * ending precisely at the current spot rate.
 */
export function generateHistory(
  base: string,
  target: string,
  currentRate: number,
  days: number = 30
): HistoricalRatePoint[] {
  const points: HistoricalRatePoint[] = [];
  const now = new Date();
  
  // Seed based on base + target to make graphs reproducible on refresh, but slightly dynamic per day
  const todayStr = now.toISOString().split("T")[0];
  const rng = new SeededRandom(`${base}-${target}-${todayStr}`);

  // Determine typical annual volatility for different currencies
  let volatility = 0.05; // 5% default
  let trendSign = 1; // 1 means target currency tends to grow against base

  // Tailored volatilities and trends
  const highVol = ['TRY', 'ARS', 'RUB', 'ZAR', 'BRL', 'NGN'];
  const lowVol = ['EUR', 'CHF', 'GBP', 'CAD', 'SGD', 'AED', 'SAR'];

  if (highVol.includes(target) || highVol.includes(base)) {
    volatility = 0.18; // 18% volatility
  } else if (lowVol.includes(target) && lowVol.includes(base)) {
    volatility = 0.035; // 3.5% volatility
  }

  // Determine an offset for 1-year ago (typically +/- 5% to 15% from today)
  const maxTrend = volatility * 1.5;
  const netTrendPercent = (rng.next() * 2 - 1) * maxTrend;
  const startRate = currentRate / (1 + netTrendPercent);

  // Generate date points going backward
  const dateList: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dateList.push(d);
  }

  const N = days;
  
  // Create a random walk
  const w: number[] = [0];
  let curWalk = 0;
  for (let i = 1; i < N; i++) {
    // scale variance with step size (fraction of a year)
    const stepVar = Math.sqrt(1 / 365);
    const step = rng.nextGaussian() * stepVar * volatility;
    curWalk += step;
    w.push(curWalk);
  }

  const wEnd = w[N - 1];

  // Build the Brownian Bridge: B(t) = w(t) - t * wEnd
  // So B(0) = 0, B(N-1) = 0
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1 || 1);
    const bridge = w[i] - t * wEnd;

    // R(t) = startRate + t * (currentRate - startRate) + volatility * bridge * currentRate
    const trendPart = startRate + t * (currentRate - startRate);
    const randomNoise = currentRate * bridge * 1.2;
    
    // Ensure rate is always positive
    let rate = Math.max(currentRate * 0.01, trendPart + randomNoise);

    // Format date string beautifully based on days range
    let dateStr = "";
    const date = dateList[i];
    if (days <= 7) {
      dateStr = date.toLocaleDateString(undefined, { weekday: 'short' });
    } else if (days <= 31) {
      dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else {
      dateStr = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }

    points.push({
      date: dateStr,
      rate: rate,
      rateFormatted: rate.toLocaleString(undefined, {
        minimumFractionDigits: rate < 0.1 ? 5 : rate < 10 ? 4 : 2,
        maximumFractionDigits: rate < 0.1 ? 6 : rate < 10 ? 4 : 2,
      })
    });
  }

  return points;
}

/**
 * Formats values to match visual expectations (e.g., $1.00, €34.20)
 */
export function formatCurrencyValue(value: number, code: string, symbol: string = ''): string {
  const displaySymbol = symbol || code;
  
  // Choose decimal places based on size
  let fractionDigits = 2;
  if (value < 0.01) fractionDigits = 5;
  else if (value < 1) fractionDigits = 4;
  else if (value < 10) fractionDigits = 3;

  return `${displaySymbol} ${value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })} ${code}`;
}
