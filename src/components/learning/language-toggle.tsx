"use client";

import {
  LEARNING_LANGUAGE_LABELS,
  type LearningLanguage,
} from "@/data/lessons/types";
import { cn } from "@/lib/utils";

const OPTIONS: LearningLanguage[] = ["mixed", "en", "ar"];

type Props = {
  value: LearningLanguage;
  onChange: (lang: LearningLanguage) => void;
  compact?: boolean;
  className?: string;
};

export function LanguageToggle({ value, onChange, compact, className }: Props) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {!compact && (
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
          Learning language · لغة التعلم
        </p>
      )}
      <div
        className="flex rounded-xl border border-white/10 bg-white/[0.03] p-0.5"
        role="group"
        aria-label="Learning language"
      >
        {OPTIONS.map((opt) => {
          const active = value === opt;
          const label = LEARNING_LANGUAGE_LABELS[opt];
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-center text-[11px] font-medium transition",
                active
                  ? "bg-indigo-500/30 text-white ring-1 ring-indigo-400/40"
                  : "text-muted hover:bg-white/5 hover:text-white"
              )}
              title={`${label.en} / ${label.ar}`}
            >
              {opt === "mixed" ? "EN/ع" : opt === "en" ? "EN" : "ع"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
