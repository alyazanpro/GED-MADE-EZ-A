"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BrandName } from "@/components/landing/brand-name";

const navLinks = [
  { href: "#why", label: "Product" },
  { href: "#subjects", label: "Curriculum" },
  { href: "#compare", label: "Compare" },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || mobileOpen ? "bg-slate-900/95 backdrop-blur-md border-b border-slate-800" : "bg-transparent"}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandName />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href={user ? "/dashboard" : "/auth/signin"}
            className="inline-flex items-center justify-center rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </div>

        <button
          className="p-2 text-slate-300 md:hidden hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute inset-x-0 top-16 border-b border-slate-800 bg-slate-900 md:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-2 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href={user ? "/dashboard" : "/auth/signin"}
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-white mt-3 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                {user ? "Dashboard" : "Sign in"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black pt-20" aria-labelledby="hero-brand">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/oman/landscape-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover object-[center_40%] opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-950/70 to-black" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-20 text-center">
        <p className="text-sm font-semibold text-indigo-400 mb-4 uppercase tracking-widest animate-fade-in">
          Oman Ministry of Education · Grades 9–12
        </p>

        <h1 id="hero-brand" className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <BrandName />
        </h1>

        <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Pass exams with your books.
        </p>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Textbook-grounded tutoring, exam readiness, and bilingual lessons —
          built for Basic Education through the General Education Diploma.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Link
            href={user ? "/dashboard" : "/auth/signin"}
            className="inline-flex items-center justify-center rounded-xl gradient-primary px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            {user ? "Continue learning" : "Start free"}
          </Link>
          <a href="#why" className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-4 text-base font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:border-slate-500 hover:text-white">
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
