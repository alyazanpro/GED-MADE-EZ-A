"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/auth-storage";
import { apiUrl } from "@/lib/api";
import {
  Loader2,
  Shield,
  Users,
  MousePointerClick,
  UserPlus,
  Activity,
} from "lucide-react";

type AnalyticsPayload = {
  uniqueUsers: number;
  totalContinues: number;
  totalSignIns?: number;
  registeredLast7Days?: number;
  signInsLast7Days?: number;
  last7Days: {
    date: string;
    continues: number;
    signIns?: number;
    registrations?: number;
  }[];
  recentEvents: {
    id: string;
    email: string;
    name: string;
    at: string;
  }[];
  users: {
    id: string;
    email: string;
    name: string;
    picture: string;
    firstSeenAt: string;
    lastSeenAt: string;
    continueCount: number;
  }[];
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminAnalyticsPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherMsg, setTeacherMsg] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/signin");
      return;
    }
    if (!isSuperAdmin) {
      router.replace("/dashboard");
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace("/auth/signin");
      return;
    }

    void (async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch(apiUrl("/api/admin/analytics"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load admin analytics.");
        }
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
      } finally {
        setFetching(false);
      }
    })();
  }, [user, loading, isSuperAdmin, router]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <>
      <AppHeader
        title="Super Admin"
        highlight="analytics"
        subtitle="Sign-in analytics across GED MADE EZ (Supabase Auth)."
        showGreeting={false}
      />

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
        <Shield className="h-4 w-4 shrink-0" />
        Signed in as super admin: {user?.email}
      </div>

      <Card className="mb-8">
        <h3 className="mb-2 font-semibold text-white">Grant teacher role</h3>
        <p className="mb-3 text-xs text-muted">
          Teachers are separate from super-admin. Granted emails can open /teacher and create
          classes.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={teacherEmail}
            onChange={(e) => setTeacherEmail(e.target.value)}
            placeholder="teacher@school.edu.om"
            className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
          />
          <Button
            size="sm"
            disabled={granting || !teacherEmail.trim()}
            onClick={() => {
              const token = getToken();
              if (!token) return;
              setGranting(true);
              setTeacherMsg(null);
              void (async () => {
                try {
                  const res = await fetch(apiUrl("/api/admin/teachers"), {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ email: teacherEmail.trim() }),
                  });
                  const body = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(body.error || "Grant failed");
                  setTeacherMsg(`Granted teacher access to ${body.grant.email}`);
                  setTeacherEmail("");
                } catch (err) {
                  setTeacherMsg(err instanceof Error ? err.message : "Grant failed");
                } finally {
                  setGranting(false);
                }
              })();
            }}
          >
            Grant teacher
          </Button>
        </div>
        {teacherMsg && <p className="mt-2 text-xs text-muted">{teacherMsg}</p>}
      </Card>

      {error && (
        <Card className="mb-6 border-red-500/20 bg-red-500/10 text-red-300">
          {error}
        </Card>
      )}

      {data && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Registered users</p>
                  <p className="mt-1 text-3xl font-bold text-white">{data.uniqueUsers}</p>
                  <p className="mt-1 text-xs text-muted">Unique accounts seen</p>
                </div>
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Total sign-ins</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {data.totalSignIns ?? data.totalContinues}
                  </p>
                  <p className="mt-1 text-xs text-muted">All successful logins</p>
                </div>
                <MousePointerClick className="h-6 w-6 text-emerald-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">New (7 days)</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {data.registeredLast7Days ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted">First-time registrations</p>
                </div>
                <UserPlus className="h-6 w-6 text-sky-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Sign-ins (7 days)</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {data.signInsLast7Days ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted">Logins this week</p>
                </div>
                <Activity className="h-6 w-6 text-amber-400" />
              </div>
            </Card>
          </div>

          <Card className="mb-8">
            <h3 className="mb-4 font-semibold text-white">
              Sign-ins vs registrations — last 7 days
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.last7Days.map((d) => ({
                    ...d,
                    signIns: d.signIns ?? d.continues,
                    registrations: d.registrations ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#8b95a8", fontSize: 11 }}
                    tickFormatter={(v) => String(v).slice(5)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#8b95a8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#121826",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="signIns"
                    name="Sign-ins"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="registrations"
                    name="Registrations"
                    fill="#34d399"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Users</h3>
                <Badge variant="info">{data.users.length}</Badge>
              </div>
              <div className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin">
                {data.users.length === 0 && (
                  <p className="text-sm text-muted">No sign-ins recorded yet.</p>
                )}
                {data.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{u.name}</p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        Registered: {formatWhen(u.firstSeenAt)} · Last:{" "}
                        {formatWhen(u.lastSeenAt)}
                      </p>
                    </div>
                    <Badge>{u.continueCount}×</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent sign-ins</h3>
                <Badge variant="success">live</Badge>
              </div>
              <div className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin">
                {data.recentEvents.length === 0 && (
                  <p className="text-sm text-muted">No events yet.</p>
                )}
                {data.recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                  >
                    <p className="text-sm font-medium text-white">{event.name}</p>
                    <p className="text-xs text-muted">{event.email}</p>
                    <p className="mt-1 text-[10px] text-muted">{formatWhen(event.at)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
