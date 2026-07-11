import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Market-Hour-Aware Semantic Cache (Upstash Redis)
// ---------------------------------------------------------------------------
// Dynamic TTL strategy:
//   - 15 min during active market hours (9:30 AM – 4:00 PM ET, weekdays)
//   - 12 hours overnight / weekends
// Gracefully degrades to no-op when UPSTASH env vars are missing.
// ---------------------------------------------------------------------------

let redis: any = null;

async function getRedis() {
  if (redis !== null) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redis = false; // Sentinel: env vars missing, skip caching
    return false;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url, token });
    return redis;
  } catch {
    redis = false;
    return false;
  }
}

/**
 * Determines if US stock markets are currently open.
 * Uses Intl API for accurate ET timezone conversion.
 */
export function isMarketOpen(): boolean {
  const now = new Date();

  // Convert to Eastern Time using Intl (handles DST automatically)
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const et = new Date(etString);

  const day = et.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hour * 60 + minutes;

  const marketOpen = 9 * 60 + 30;  // 9:30 AM ET
  const marketClose = 16 * 60;      // 4:00 PM ET

  return day >= 1 && day <= 5 && timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}

function buildCacheKey(ticker: string, query: string): string {
  const hash = createHash("sha256")
    .update(`${ticker.toUpperCase()}:${query.toLowerCase()}`)
    .digest("hex");
  return `analysis:${hash}`;
}

/**
 * Attempt to retrieve a cached analysis result.
 * Returns the parsed data object if a valid cache entry exists, null otherwise.
 *
 * Staleness logic:
 *   - If the market is currently CLOSED, any cached entry is considered fresh.
 *   - If the market is OPEN and the remaining TTL is > 4 hours, the entry was
 *     set overnight and is still acceptable for pre-market warm-up.
 *   - Otherwise (market open + short TTL) the entry was set during the current
 *     or previous trading session and may be stale → return null to force refresh.
 */
export async function getSmartCache(ticker: string, query: string): Promise<any | null> {
  const client = await getRedis();
  if (!client) return null;

  try {
    const key = buildCacheKey(ticker, query);
    const cached = await client.get(key);

    if (!cached) return null;

    // If market is closed, any cache is good
    if (!isMarketOpen()) {
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }

    // Market is open — check remaining TTL
    const ttl = await client.ttl(key);
    if (ttl > 14400) {
      // TTL > 4 hours → overnight cache, still acceptable for early market
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }

    // Market open + short TTL = stale during active trading
    return null;
  } catch (err) {
    console.error("[SmartCache] Read error:", err);
    return null;
  }
}

/**
 * Store an analysis result with a market-hour-aware TTL.
 *   - 900 seconds (15 min) during market hours
 *   - 43200 seconds (12 hours) overnight / weekends
 */
export async function setSmartCache(ticker: string, query: string, data: any): Promise<void> {
  const client = await getRedis();
  if (!client) return;

  try {
    const key = buildCacheKey(ticker, query);
    const ttl = isMarketOpen() ? 900 : 43200;
    const serialized = typeof data === "string" ? data : JSON.stringify(data);
    await client.set(key, serialized, { ex: ttl });
  } catch (err) {
    console.error("[SmartCache] Write error:", err);
  }
}
