"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut, Menu, X, Shield, School, Flame, Trophy, Star, Zap } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/data/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useUserData } from "@/lib/use-user-data";
import { computeStreak, overallMastery } from "@/lib/user-data";
import { cn, getFirstName, getGreeting } from "@/lib/utils";
import Image from "next/image";
import { LanguageToggle } from "@/components/learning/language-toggle";

function LanguageToggleSlot() {
  const { data, ready, updateLearningLanguage } = useUserData();
  if (!ready) return null;
  return (
    <LanguageToggle
      value={data.learningLanguage}
      onChange={updateLearningLanguage}
    />
  );
}

function syncStatusLabel(status: string) {
  if (status === "syncing") return { text: "Syncing", className: "text-amber-400" };
  if (status === "offline") return { text: "Offline", className: "text-slate-400" };
  if (status === "error") return { text: "Sync paused", className: "text-rose-400" };
  return { text: "Synced", className: "text-emerald-400" };
}

function SidebarStudySummary() {
  const { data, ready, syncStatus } = useUserData();
  if (!ready) return null;
  const mastery = overallMastery(data);
  const streak = computeStreak(data);
  const sync = syncStatusLabel(syncStatus);
  const level = Math.floor(mastery / 10) + 1;
  const xp = mastery % 10;

  return (
    <div className="card-vibrant p-5 bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="level-badge animate-bounce-in">
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Level {level}</p>
            <p className="text-xs text-slate-400">Student</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="streak-fire">
            <Flame className="h-4 w-4" />
            {streak}
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-300">XP Progress</span>
          <span className="font-semibold text-indigo-400">{xp}/10</span>
        </div>
        <div className="xp-bar">
          <div
            className="xp-bar-fill"
            style={{ width: `${xp * 10}%` }}
          />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span>Mastery: {mastery}%</span>
        <span className={`font-medium ${sync.className}`}>
          {sync.text}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{data.books.length} textbooks</span>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-400" />
          <span className="font-semibold text-yellow-400">{mastery * 10}</span>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut, isSuperAdmin, isTeacher } = useAuth();
  const [open, setOpen] = useState(false);

  const items = [
    ...navItems,
    ...(isTeacher || isSuperAdmin
      ? [{ href: "/teacher", label: "Teacher", icon: School }]
      : []),
    ...(isSuperAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const sidebar = (
    <>
      <div className="flex items-center gap-3 border-b border-slate-700 px-5 py-5 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-indigo-500/30">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <Link href="/dashboard" className="text-base font-bold tracking-tight text-white hover:text-indigo-300 transition-colors">
            GED MADE EZ
          </Link>
          <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-400">
            Oman • Grades 9–12
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4 scrollbar-thin bg-slate-900">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                active
                  ? "gradient-primary text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 animate-pulse" />
              )}
              <item.icon className={cn(
                "h-5 w-5 shrink-0 relative z-10",
                active && "text-white"
              )} />
              <span className="relative z-10">{item.label}</span>
              {active && (
                <Zap className="h-4 w-4 ml-auto text-yellow-300 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-slate-700 p-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <LanguageToggleSlot />
        <SidebarStudySummary />

        {user && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-3 bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 group">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={40}
                height={40}
                className="rounded-full ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
                {getFirstName(user.displayName).charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {getFirstName(user.displayName)}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-500/20 hover:text-rose-400"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-indigo-500/30 bg-slate-900 p-3 text-indigo-400 shadow-lg shadow-indigo-500/20 lg:hidden hover:bg-slate-800 hover:text-indigo-300 transition-all"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 transition-transform duration-300 lg:translate-x-0 shadow-2xl shadow-black/50",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-5 rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>
        {sidebar}
      </aside>
    </>
  );
}

export function AppHeader({
  title,
  highlight,
  subtitle,
  action,
  showGreeting = true,
}: {
  title: string;
  highlight?: string;
  subtitle?: string;
  action?: React.ReactNode;
  showGreeting?: boolean;
}) {
  const { user } = useAuth();
  const firstName = getFirstName(user?.displayName);

  return (
    <div className="mb-8 flex flex-col gap-4 pt-10 sm:flex-row sm:items-start sm:justify-between lg:pt-0">
      <div className="animate-fade-in">
        {showGreeting && (
          <p className="mb-2 text-sm font-medium text-indigo-400">
            {getGreeting()}, {firstName} ✨
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}{" "}
          {highlight && (
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </h1>
        {subtitle && (
          <p className="mt-3 text-base text-slate-400 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 animate-slide-up">{action}</div>}
    </div>
  );
}
