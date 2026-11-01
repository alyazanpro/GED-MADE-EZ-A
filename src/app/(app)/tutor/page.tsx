"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Button, Card } from "@/components/ui";
import { SUBJECT_CATALOG } from "@/data/curriculum";
import { useUserData } from "@/lib/use-user-data";
import { useAuth } from "@/lib/auth-context";
import { getFirstName } from "@/lib/utils";
import { Send, Sparkles, Bot, User, BookOpen, ExternalLink, Upload, X } from "lucide-react";
import { LanguageToggle } from "@/components/learning/language-toggle";
import { LEARNING_LANGUAGE_LABELS } from "@/data/lessons/types";

const suggestedPromptsEn = [
  "What are my weakest topics?",
  "Explain photosynthesis from my biology textbook",
  "How should I study Chemistry this week?",
  "Summarize Newton’s first law from my physics book",
];

const suggestedPromptsAr = [
  "ما مواضيعي الضعيفة؟",
  "اشرح البناء الضوئي من كتاب الأحياء",
  "كيف أدرس الكيمياء هذا الأسبوع؟",
  "لخّص قانون نيوتن الأول من كتاب الفيزياء",
];

const suggestedPromptsMixed = [
  "What are my weakest topics؟ / ما مواضيعي الضعيفة؟",
  "Explain inequality / اشرح المتباينة من كتابي",
  "How should I study Chemistry this week?",
  "لخّص force / القوة من كتاب الفيزياء",
];

function TutorPageInner() {
  const { user } = useAuth();
  const { data, ready, readyBookCount, groundedSourceCount, askTutor, updateLearningLanguage, updateUseMoeLibrary } =
    useUserData();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [activeSubjectId, setActiveSubjectId] = useState<string | undefined>();
  const [typing, setTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prefillUsed = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groundedBookCount = useMemo(
    () => groundedSourceCount ?? data.books.filter((b) => b.status === "ready").length,
    [groundedSourceCount, data.books]
  );

  const suggestedPrompts = useMemo(() => {
    const lang = data.learningLanguage ?? "mixed";
    if (lang === "ar") return suggestedPromptsAr;
    if (lang === "en") return suggestedPromptsEn;
    return suggestedPromptsMixed;
  }, [data.learningLanguage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.tutorMessages, typing]);

  useEffect(() => {
    const subject = searchParams.get("subject");
    if (subject && SUBJECT_CATALOG.some((s) => s.id === subject)) {
      setActiveSubjectId(subject);
    }
    const q = searchParams.get("q");
    if (q && !prefillUsed.current) {
      prefillUsed.current = true;
      setInput(q);
    }
  }, [searchParams]);

  async function sendMessage(text: string) {
    if (!text.trim() || typing) return;
    setTyping(true);
    setInput("");
    try {
      await askTutor(text.trim(), activeSubjectId);
    } finally {
      setTyping(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  }

  function removeUploadedFile() {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading tutor…</div>;
  }

  return (
    <>
      <AppHeader
        title="GED"
        highlight="AI Tutor"
        subtitle={
          data.learningLanguage === "ar"
            ? "إجابات من مكتبة الوزارة المشتركة وكتبك المرفوعة مع ذكر الصفحات."
            : "Answers from the shared MoE library and your uploads, with page citations."
        }
        showGreeting={false}
        action={
          <LanguageToggle
            value={data.learningLanguage}
            onChange={updateLearningLanguage}
            className="w-44"
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-white">Focus subject</h3>
            <p className="mb-3 text-xs text-slate-400">
              Scopes retrieval to books tagged with that subject when possible.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setActiveSubjectId(undefined)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  !activeSubjectId
                    ? "gradient-primary text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                All subjects
              </button>
              {SUBJECT_CATALOG.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSubjectId(s.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    activeSubjectId === s.id
                      ? "gradient-primary text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  {s.name}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-white">Suggested prompts</h3>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-left text-xs text-slate-300 transition hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

          {groundedBookCount === 0 && (
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <p className="text-sm font-semibold text-amber-400">
                Tutor needs MoE textbooks
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Without the shared MoE corpus or a ready PDF upload, answers can&apos;t
                cite your Oman textbooks. Enable the library or upload a book first —
                that&apos;s the product, not a generic chatbot.
              </p>
              <Link href="/library" className="mt-4 inline-flex">
                <Button size="sm" variant="gold">
                  Open Library / MoE corpus
                </Button>
              </Link>
            </Card>
          )}

          <Card>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={data.useMoeLibrary !== false}
                onChange={(e) => updateUseMoeLibrary(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
              Use shared MoE library
            </label>
            <p className="mt-2 text-xs text-slate-400">
              Default on. Merges with your personal uploads for grounded answers.
            </p>
          </Card>
        </div>

        <Card className="flex h-[calc(100vh-12rem)] flex-col lg:col-span-3">
          <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">GED Study Tutor</p>
              <p className="text-xs text-emerald-400">
                Grounded in {groundedBookCount} source
                {groundedBookCount === 1 ? "" : "s"}
                {readyBookCount > 0 ? ` (${readyBookCount} upload${readyBookCount === 1 ? "" : "s"})` : ""}
                {activeSubjectId
                  ? ` · focus: ${SUBJECT_CATALOG.find((s) => s.id === activeSubjectId)?.name}`
                  : ""}
                {` · ${LEARNING_LANGUAGE_LABELS[data.learningLanguage ?? "mixed"].short}`}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto py-4 scrollbar-thin">
            {groundedBookCount === 0 && data.tutorMessages.length <= 1 && (
              <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 px-5 py-6 text-center">
                <p className="text-sm font-semibold text-white">
                  Ground the tutor in MoE books first
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  GED MADE EZ answers from the Oman MoE library and your uploads with
                  page citations. Open Library to enable the corpus or upload a PDF —
                  then come back and ask.
                </p>
                <Link href="/library" className="mt-4 inline-flex">
                  <Button size="sm" variant="gold">Go to Library</Button>
                </Link>
              </div>
            )}
            {data.tutorMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    msg.role === "assistant" ? "gradient-primary shadow-lg shadow-indigo-500/30" : "bg-slate-700"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-5 w-5 text-white" />
                  ) : (
                    <User className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div className="max-w-[80%] space-y-2">
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-slate-800/50 text-white border border-slate-700"
                        : "gradient-primary text-white shadow-lg shadow-indigo-500/20"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {msg.citations.map((c) => {
                        const pages =
                          c.pageStart === c.pageEnd
                            ? `p. ${c.pageStart}`
                            : `p. ${c.pageStart}–${c.pageEnd}`;
                        const label =
                          c.sourceType === "moe"
                            ? `MoE library: ${c.title}`
                            : `Your upload: ${c.title}`;
                        return (
                          <Link
                            key={`${c.bookId}-${c.pageStart}-${c.pageEnd}`}
                            href={`/library#book-${c.bookId}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 transition hover:bg-indigo-500/20 hover:text-indigo-200"
                          >
                            <BookOpen className="h-3 w-3" />
                            {label} · {pages}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  {msg.role === "assistant" && msg.relatedTopic && (
                    <Link
                      href={`/subjects/${msg.relatedTopic.subjectId}/${msg.relatedTopic.slug}`}
                      className="inline-flex items-center gap-1 px-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Related topic in Subjects: {msg.relatedTopic.topic}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-indigo-500/30">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="rounded-2xl bg-slate-800/50 border border-slate-700 px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <div
                        key={d}
                        className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-700 pt-4">
            {uploadedFile && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span className="flex-1 truncate text-sm text-white">{uploadedFile.name}</span>
                <button
                  onClick={removeUploadedFile}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-slate-400 transition-all hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400"
                title="Upload PDF"
              >
                <Upload className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendMessage(input)}
                placeholder={`Ask ${getFirstName(user?.displayName)} from your uploaded textbooks...`}
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
              <Button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || typing}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Loading tutor…</div>}>
      <TutorPageInner />
    </Suspense>
  );
}
