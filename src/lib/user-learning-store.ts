import { createServiceClient } from "@/lib/supabase/server";
import type { UserLearningData } from "@/lib/user-data";
import { validateUserLearningPayload } from "@/lib/user-learning-merge";

export function sanitizeUserLearningId(userId: string): string {
  const raw = (userId || "").trim();
  if (!raw) return "unknown";
  return raw.replace(/[^a-zA-Z0-9._@-]+/g, "_").slice(0, 180);
}

export async function loadUserLearning(
  userId: string
): Promise<UserLearningData | null> {
  const supabase = createServiceClient();
  const id = sanitizeUserLearningId(userId);

  const { data, error } = await supabase
    .from("user_learning")
    .select("data")
    .eq("user_id", id)
    .maybeSingle();

  if (error) {
    console.error("loadUserLearning", error.message);
    return null;
  }
  if (!data?.data) return null;

  const validated = validateUserLearningPayload(data.data);
  return validated.ok ? validated.data : null;
}

export async function saveUserLearning(
  userId: string,
  data: UserLearningData
): Promise<UserLearningData> {
  const validated = validateUserLearningPayload(data);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const payload = {
    ...validated.data,
    version: 2 as const,
    updatedAt: new Date().toISOString(),
  };

  const supabase = createServiceClient();
  const id = sanitizeUserLearningId(userId);

  const { error } = await supabase.from("user_learning").upsert(
    {
      user_id: id,
      version: 2,
      data: payload,
      updated_at: payload.updatedAt,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return validated.data;
}

/** On first login, copy legacy learning rows keyed by email into the auth UUID row. */
export async function adoptLegacyLearningByEmail(
  userId: string,
  email: string
): Promise<void> {
  const supabase = createServiceClient();
  const id = sanitizeUserLearningId(userId);
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return;

  const { data: existing } = await supabase
    .from("user_learning")
    .select("user_id")
    .eq("user_id", id)
    .maybeSingle();
  if (existing) return;

  // Prefer progress email match → legacy user_id
  const { data: progress } = await supabase
    .from("student_progress")
    .select("student_id")
    .ilike("student_email", normalized)
    .maybeSingle();

  const legacyId = progress?.student_id;
  if (!legacyId || legacyId === id) return;

  const { data: legacy } = await supabase
    .from("user_learning")
    .select("data, version")
    .eq("user_id", legacyId)
    .maybeSingle();

  if (!legacy?.data) return;

  await supabase.from("user_learning").upsert(
    {
      user_id: id,
      version: legacy.version || 2,
      data: legacy.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
