import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { performanceMonitor } from "@/lib/performance";
import { cacheManager } from "@/lib/cache";

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    cache: checkCache(),
    memory: checkMemory(),
    environment: process.env.NODE_ENV || "unknown",
    timestamp: new Date().toISOString()
  };

  const healthy = Object.values(checks).slice(0, 3).every(Boolean);

  return NextResponse.json({
    status: healthy ? "healthy" : "unhealthy",
    checks,
    performance: performanceMonitor.getSummary(),
    cacheStats: cacheManager.getAllStats()
  }, { status: healthy ? 200 : 503 });
}

async function checkDatabase(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("signin_users").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

function checkCache(): boolean {
  try {
    cacheManager.set("health-check", "test", { ttl: 1000 });
    const value = cacheManager.getCache("health-check").get("test");
    cacheManager.delete("health-check", "test");
    return value !== undefined;
  } catch {
    return false;
  }
}

function checkMemory(): boolean {
  const used = process.memoryUsage();
  const total = process.memoryUsage().heapTotal;
  const usagePercent = (used.heapUsed / total) * 100;
  return usagePercent < 90; // Consider unhealthy if using more than 90% memory
}
