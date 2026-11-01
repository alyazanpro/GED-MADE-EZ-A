import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://gedmadeez.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GED MADE EZ — Oman MoE Grades 9–12 Study OS",
    template: "%s · GED MADE EZ",
  },
  description:
    "Pass Oman Ministry of Education exams with textbook-grounded tutoring. Basic Education (Grades 9–10) and General Education Diploma (11–12) with Exam OS, bilingual EN/Arabic lessons, and MoE library citations.",
  keywords: [
    "GED Oman",
    "Oman MoE",
    "Ministry of Education Oman",
    "General Education Diploma",
    "Basic Education Oman",
    "Grades 9-12 Oman",
    "Oman exam prep",
    "GED MADE EZ",
    "Omani curriculum study",
    "bilingual Arabic English tutoring",
  ],
  authors: [{ name: "GED MADE EZ" }],
  creator: "GED MADE EZ",
  openGraph: {
    type: "website",
    locale: "en_OM",
    alternateLocale: ["ar_OM"],
    url: siteUrl,
    siteName: "GED MADE EZ",
    title: "GED MADE EZ — Oman MoE Grades 9–12 Study OS",
    description:
      "Textbook-grounded study for Oman’s MoE pathway. Exam OS readiness, bilingual EN/ع lessons, and citations from your books.",
    images: [
      {
        url: "/images/oman/landscape-hero.png",
        width: 1920,
        height: 1080,
        alt: "Elevated view of Omani desert dunes and mountains at golden hour",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GED MADE EZ — Oman MoE Grades 9–12 Study OS",
    description:
      "Pass Oman MoE exams with your textbooks. Grades 9–12 study OS for Basic Education and the GED.",
    images: ["/images/oman/landscape-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
