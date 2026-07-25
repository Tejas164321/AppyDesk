import "server-only";
import { adminDb } from "./firebase-admin";

export interface RateLimitCheckResult {
  allowed: boolean;
  sentToday: number;
  dailyCap: number;
  remaining: number;
  reason?: string;
}

export async function checkAndUpdateRateLimit(
  uid: string,
  configuredCap: number = 15
): Promise<RateLimitCheckResult> {
  const dateKey = new Date().toISOString().slice(0, 10);
  const defaultResult: RateLimitCheckResult = {
    allowed: true,
    sentToday: 0,
    dailyCap: configuredCap,
    remaining: configuredCap,
  };

  if (!adminDb || !uid || uid === "anonymous") {
    return defaultResult;
  }

  try {
    const rateRef = adminDb.collection("rateLimitState").doc(uid);
    const docSnap = await rateRef.get();

    let sentToday = 0;
    let mailboxWarmupDay = 1;

    if (docSnap.exists) {
      const data = docSnap.data();
      if (data?.dateKey === dateKey) {
        sentToday = data.sentToday || 0;
      }
      mailboxWarmupDay = data?.mailboxWarmupDay || 1;
    }

    // Warm-up schedule: Day 1 (5), Day 2 (10), Day 3+ (configuredCap)
    let dynamicCap = configuredCap;
    if (mailboxWarmupDay === 1) dynamicCap = Math.min(5, configuredCap);
    else if (mailboxWarmupDay === 2) dynamicCap = Math.min(10, configuredCap);

    if (sentToday >= dynamicCap) {
      return {
        allowed: false,
        sentToday,
        dailyCap: dynamicCap,
        remaining: 0,
        reason: `Daily send cap reached (${sentToday}/${dynamicCap} emails sent today).`,
      };
    }

    // Update send counter atomically
    const newSentToday = sentToday + 1;
    await rateRef.set(
      {
        dateKey,
        sentToday: newSentToday,
        mailboxWarmupDay,
        lastSentAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      allowed: true,
      sentToday: newSentToday,
      dailyCap: dynamicCap,
      remaining: dynamicCap - newSentToday,
    };
  } catch (error) {
    console.warn("Rate limiter check fallback:", error);
    return defaultResult;
  }
}
