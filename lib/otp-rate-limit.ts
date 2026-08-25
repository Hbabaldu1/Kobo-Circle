import 'server-only';
import { createHash } from 'crypto';

const MAX_REQUESTS = 3;
const WINDOW_SECONDS = 15 * 60;

export async function checkOtpRateLimit(phone: string): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('OTP rate limiting is not configured.');

  const phoneHash = createHash('sha256').update(phone).digest('hex');
  const key = `kobo-circle:otp:${phoneHash}`;
  const headers = { Authorization: `Bearer ${token}` };
  const increment = await fetch(`${url}/incr/${key}`, { headers, cache: 'no-store' });
  if (!increment.ok) throw new Error('OTP rate limiter is unavailable.');
  const count = Number((await increment.json()).result);
  if (count === 1) await fetch(`${url}/expire/${key}/${WINDOW_SECONDS}`, { headers, cache: 'no-store' });
  if (count > MAX_REQUESTS) {
    const ttlResponse = await fetch(`${url}/ttl/${key}`, { headers, cache: 'no-store' });
    const ttl = ttlResponse.ok ? Number((await ttlResponse.json()).result) : WINDOW_SECONDS;
    return { allowed: false, retryAfterSeconds: Math.max(ttl, 1) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
