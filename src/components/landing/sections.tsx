"use client";

import Link from "next/link";
import Image from "next/image";
import {
  proofFeatures,
  featureProofs,
  trustBadges,
  comparisonPoints,
} from "@/data/mock-data";
import {
  SUBJECT_CATALOG,
  STAGE_META,
  formatGrades,
} from "@/data/curriculum";
import { BrandName } from "@/components/landing/brand-name";

export function AtmosphereSection() {
  return (
    <section className="lp-shot lp-band" aria-labelledby="atmosphere-title">
      <div className="lp-shot-media">
        <Image
          src="/images/oman/coast-signin.png"
          alt=""
          fill
          sizes="100vw"
          quality={88}
          className="object-cover object-center"
        />
      </div>
      <div className="lp-shot-veil lp-shot-veil-band" aria-hidden />

      <div className="lp-container w-full">
        <p className="lp-kicker">Built for Oman</p>
        <h2 id="atmosphere-title" className="lp-title">
          The MoE pathway.
          <br />
          Grades 9–12.
        </h2>
        <p className="lp-lede" style={{ color: "rgba(237,237,237,0.72)" }}>
          From Basic Education into the General Education Diploma — grounded in
          the textbooks your school already uses.
        </p>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="why" className="lp-section">
      <div className="lp-container">
        <p className="lp-kicker">Product</p>
        <h2 className="lp-title">
          <span className="lp-accent">Designed</span> for{" "}
          <span className="lp-accent-red">Oman</span>
          <br />
          Not a generic study app.
        </h2>
        <p className="lp-lede">
          Four powerful systems that ship today. Sign in and open any of them.
        </p>

        <div className="lp-features">
          {proofFeatures.map((feature) => (
            <div key={feature.title} className="lp-feature">
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <Link href="/auth/signin" className="lp-btn lp-btn-ghost">
                {feature.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComparisonSection() {
  return (
    <section id="compare" className="lp-section lp-section-quiet">
      <div className="lp-container">
        <div className="lp-center">
          <p className="lp-kicker">Compare</p>
          <h2 className="lp-title" style={{ maxWidth: "18ch", marginInline: "auto" }}>
            General content is useful.
            <br />
            MoE exams need more.
          </h2>
          <p className="lp-lede">
            We align to Oman textbooks and exam readiness — not a broader video
            library.
          </p>
        </div>

        <div className="lp-compare">
          <div>
            <p className="lp-compare-label">Khan Academy</p>
            <ul>
              {comparisonPoints.khan.map((line) => (
                <li key={line}>
                  <span className="lp-compare-mark">–</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-compare-us">
            <p className="lp-compare-label">
              <BrandName />
            </p>
            <ul>
              {comparisonPoints.us.map((line) => (
                <li key={line}>
                  <span className="lp-compare-mark">✓</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SubjectsSection() {
  return (
    <section id="subjects" className="lp-section">
      <div className="lp-container">
        <p className="lp-kicker">Curriculum</p>
        <h2 className="lp-title">
          Full pathway.
          <br />
          Every core subject.
        </h2>
        <p className="lp-lede">
          Basic Education (9–10) into the General Education Diploma (11–12).
        </p>

        <div className="lp-stages">
          {Object.values(STAGE_META).map((stage) => (
            <div key={stage.id} className="lp-stage">
              <p className="lp-stage-label">{stage.labelAr}</p>
              <h3>{stage.label}</h3>
              <p className="grades">Grades {stage.grades.join(" & ")}</p>
              <p>{stage.blurb}</p>
            </div>
          ))}
        </div>

        <div className="lp-subjects">
          {SUBJECT_CATALOG.map((subject) => (
            <Link
              key={subject.id}
              href="/auth/signin"
              className="lp-subject"
            >
              <span>
                <span className="lp-subject-name">{subject.name}</span>
                {subject.nameAr ? (
                  <span className="lp-subject-ar" dir="rtl">
                    {subject.nameAr}
                  </span>
                ) : null}
              </span>
              <span className="lp-subject-meta">
                {formatGrades(subject.grades)} · {subject.topics.length} topics
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProofsSection() {
  return (
    <section id="proofs" className="lp-section lp-section-quiet">
      <div className="lp-container">
        <div className="lp-center">
          <p className="lp-kicker">In the product</p>
          <h2 className="lp-title">
            Real routes.
            <br />
            Real workflows.
          </h2>
          <p className="lp-lede">
            Every claim maps to a working screen after you sign in.
          </p>
        </div>

        <div className="lp-proofs">
          {featureProofs.map((p) => (
            <div key={p.title} className="lp-proof">
              <p className="lp-proof-route">{p.routeLabel}</p>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** @deprecated */
export function TestimonialsSection() {
  return <ProofsSection />;
}

export function CTASection() {
  return (
    <section className="lp-shot lp-cta">
      <div className="lp-shot-media">
        <Image
          src="/images/oman/mutrah-corniche.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={88}
          className="object-cover object-[center_40%]"
        />
      </div>
      <div className="lp-shot-veil lp-shot-veil-cta" aria-hidden />

      <div className="lp-container relative z-[2]">
        <p className="lp-kicker">Get started</p>
        <h2 className="lp-title">Study the Oman MoE way.</h2>
        <p className="lp-lede" style={{ color: "rgba(237,237,237,0.78)" }}>
          Enable the library. Start a lesson. Run five exam questions. Watch
          readiness move.
        </p>
        <div className="lp-cta-actions">
          <Link href="/auth/signin" className="lp-btn lp-btn-primary">
            Get started free
          </Link>
          <Link href="/auth/signin" className="lp-btn lp-btn-secondary">
            Sign in
          </Link>
        </div>
        <div className="lp-trust">
          {trustBadges.map((badge) => (
            <span key={badge.label}>{badge.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-row">
          <div>
            <p className="lp-brand">
              <BrandName />
            </p>
            <p style={{ marginTop: "0.35rem", fontSize: "0.8125rem", color: "var(--lp-faint)" }}>
              Oman MoE Grades 9–12
            </p>
          </div>
          <nav className="lp-footer-nav" aria-label="Footer">
            <a href="#why" className="lp-nav-link">
              Product
            </a>
            <a href="#subjects" className="lp-nav-link">
              Curriculum
            </a>
            <a href="#compare" className="lp-nav-link">
              Compare
            </a>
            <Link href="/auth/signin" className="lp-nav-link">
              Sign in
            </Link>
          </nav>
        </div>
        <p className="lp-footer-copy">
          © 2026 GED MADE EZ. Built for Oman&apos;s Ministry of Education pathway.
        </p>
      </div>
    </footer>
  );
}

/** @deprecated Prefer AtmosphereSection */
export function InstitutionsSection() {
  return <AtmosphereSection />;
}
