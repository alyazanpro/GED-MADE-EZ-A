import { createServiceClient } from "@/lib/supabase/server";

export type SignInUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
  firstSeenAt: string;
  lastSeenAt: string;
  continueCount: number;
};

export type SignInEvent = {
  id: string;
  userId: string;
  email: string;
  name: string;
  at: string;
};

export async function recordGoogleContinue(user: {
  id: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<SignInUser> {
  return recordSignIn(user);
}

export async function recordSignIn(user: {
  id: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<SignInUser> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const email = user.email.trim().toLowerCase();
  const key = user.id || email;

  const { data: existing } = await supabase
    .from("signin_users")
    .select("*")
    .eq("id", key)
    .maybeSingle();

  const nextUser: SignInUser = existing
    ? {
        id: key,
        email,
        name: user.name || existing.name,
        picture: user.picture || existing.picture || "",
        firstSeenAt: existing.first_seen_at,
        lastSeenAt: now,
        continueCount: (existing.continue_count || 0) + 1,
      }
    : {
        id: key,
        email,
        name: user.name || email.split("@")[0],
        picture: user.picture || "",
        firstSeenAt: now,
        lastSeenAt: now,
        continueCount: 1,
      };

  await supabase.from("signin_users").upsert({
    id: nextUser.id,
    email: nextUser.email,
    name: nextUser.name,
    picture: nextUser.picture,
    first_seen_at: nextUser.firstSeenAt,
    last_seen_at: nextUser.lastSeenAt,
    continue_count: nextUser.continueCount,
  });

  await supabase.from("signin_events").insert({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: key,
    email,
    name: nextUser.name,
    at: now,
  });

  return nextUser;
}

export async function getSignInAnalytics() {
  const supabase = createServiceClient();

  const { data: userRows } = await supabase.from("signin_users").select("*");
  const { data: eventRows } = await supabase
    .from("signin_events")
    .select("*")
    .order("at", { ascending: false })
    .limit(2000);

  const users: SignInUser[] = (userRows || [])
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      picture: u.picture || "",
      firstSeenAt: u.first_seen_at,
      lastSeenAt: u.last_seen_at,
      continueCount: u.continue_count || 0,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    );

  const events: SignInEvent[] = (eventRows || []).map((e) => ({
    id: e.id,
    userId: e.user_id,
    email: e.email,
    name: e.name,
    at: e.at,
  }));

  const totalContinues = users.reduce((sum, u) => sum + u.continueCount, 0);
  const signInsByDay: Record<string, number> = {};
  for (const event of events) {
    const day = event.at.slice(0, 10);
    signInsByDay[day] = (signInsByDay[day] || 0) + 1;
  }

  const registrationsByDay: Record<string, number> = {};
  for (const user of users) {
    const day = user.firstSeenAt.slice(0, 10);
    registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      date: key,
      continues: signInsByDay[key] || 0,
      signIns: signInsByDay[key] || 0,
      registrations: registrationsByDay[key] || 0,
    };
  });

  const registeredLast7Days = last7Days.reduce(
    (sum, day) => sum + day.registrations,
    0
  );
  const signInsLast7Days = last7Days.reduce((sum, day) => sum + day.signIns, 0);

  return {
    uniqueUsers: users.length,
    totalContinues,
    totalSignIns: totalContinues,
    registeredLast7Days,
    signInsLast7Days,
    last7Days,
    recentEvents: events.slice(0, 50),
    users,
  };
}
