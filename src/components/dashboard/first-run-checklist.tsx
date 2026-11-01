"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  X,
  ListChecks,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import {
  buildFirstRunSteps,
  type UserLearningData,
} from "@/lib/user-data";

type Props = {
  data: UserLearningData;
  joinedClass: boolean;
  onDismiss: () => void;
  onSkipStep: (stepId: string) => void;
};

export function FirstRunChecklist({
  data,
  joinedClass,
  onDismiss,
  onSkipStep,
}: Props) {
  const checklist = data.firstRunChecklist || { dismissed: false, skippedIds: [] };
  if (checklist.dismissed) return null;

  const steps = buildFirstRunSteps(data, { joinedClass });
  const required = steps.filter((s) => !s.optional);
  const doneCount = required.filter((s) => s.done).length;
  const allDone = steps.every((s) => s.done);

  if (allDone) return null;

  return (
    <Card className="mb-8 border-cyan-500/20 bg-cyan-500/[0.04]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <ListChecks className="h-4 w-4 text-cyan-400" />
            First-run checklist
          </h3>
          <p className="mt-1 text-xs text-muted">
            Why this isn&apos;t a Khan clone — ground the tutor in MoE books, finish a
            lesson, then feed Exam OS readiness.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">
            {doneCount}/{required.length} required
          </Badge>
          <Button variant="ghost" size="sm" onClick={onDismiss} aria-label="Dismiss checklist">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
          >
            <div className="flex min-w-0 items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${step.done ? "text-white/60 line-through" : "text-white"}`}
                >
                  {step.label}
                  {step.optional && (
                    <span className="ml-2 text-[10px] font-normal text-muted">
                      optional
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted">{step.hint}</p>
              </div>
            </div>
            {!step.done && (
              <div className="flex shrink-0 gap-2">
                {step.optional && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSkipStep(step.id)}
                  >
                    Skip
                  </Button>
                )}
                <Link href={step.href}>
                  <Button size="sm" variant="secondary">
                    Go
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
