import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/shell";
import { LandingNavbar, HeroSection } from "@/components/landing/navbar-hero";
import {
  AtmosphereSection,
  FeaturesSection,
  ComparisonSection,
  SubjectsSection,
  ProofsSection,
  CTASection,
  LandingFooter,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "GED MADE EZ — Pass Oman MoE Exams with Your Books",
  description:
    "Oman Ministry of Education study platform for Grades 9–12. Textbook-grounded AI tutor, Exam OS readiness tracking, bilingual EN/Arabic lessons for Basic Education and the General Education Diploma.",
  openGraph: {
    title: "GED MADE EZ — Pass Oman MoE Exams with Your Books",
    description:
      "Built for Oman’s MoE pathway. Study with your textbooks, track exam readiness, and learn in English and Arabic.",
    images: [
      {
        url: "/images/oman/landscape-hero.png",
        width: 1920,
        height: 1080,
        alt: "Elevated view of Omani desert dunes at golden hour",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GED MADE EZ",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description:
    "Textbook-grounded study OS for Oman Ministry of Education Grades 9–12 — Basic Education and the General Education Diploma.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "OMR",
  },
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
  },
  about: {
    "@type": "Thing",
    name: "Oman Ministry of Education curriculum Grades 9–12",
  },
  inLanguage: ["en", "ar"],
};

export default function HomePage() {
  return (
    <LandingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <LandingNavbar />
        <HeroSection />
        <AtmosphereSection />
        <FeaturesSection />
        <ComparisonSection />
        <SubjectsSection />
        <ProofsSection />
        <CTASection />
        <LandingFooter />
      </main>
    </LandingShell>
  );
}
