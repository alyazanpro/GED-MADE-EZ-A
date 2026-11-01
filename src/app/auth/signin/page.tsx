import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/shell";
import { SignInView } from "@/components/landing/signin-view";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to GED MADE EZ with Google. Access Oman MoE Grades 9–12 tutoring, Exam OS, bilingual lessons, and your textbook library.",
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <LandingShell>
      <SignInView />
    </LandingShell>
  );
}
