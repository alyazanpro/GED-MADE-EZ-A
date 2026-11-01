"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card } from "@/components/ui";
import { SUBJECT_CATALOG, getSubject } from "@/data/curriculum";
import { loadCorpusManifest } from "@/lib/rag/shared-corpus";
import type { SharedCorpusBookMeta, SharedCorpusManifest } from "@/lib/rag/shared-corpus-types";
import { useUserData } from "@/lib/use-user-data";
import { formatBytes, relativeTime } from "@/lib/user-data";
import {
  Upload,
  FileText,
  Search,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookMarked,
  Library,
} from "lucide-react";

export default function LibraryPage() {
  const {
    data,
    ready,
    uploadBook,
    deleteBook,
    updateUseMoeLibrary,
    toggleMoeShelf,
    moeBookCount,
  } = useUserData();
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState(SUBJECT_CATALOG[0].id);
  const [uploading, setUploading] = useState(false);
  const [manifest, setManifest] = useState<SharedCorpusManifest | null>(null);
  const [moeFilter, setMoeFilter] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void loadCorpusManifest().then((m) => {
      if (!cancelled) setManifest(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.books.filter((b) => {
      if (!q) return true;
      const subject = getSubject(b.subjectId)?.name || "";
      return (
        b.title.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q)
      );
    });
  }, [data.books, query]);

  const moeBooks = useMemo(() => {
    const list = manifest?.books ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((b) => {
      if (moeFilter !== "all" && b.subjectId !== moeFilter) return false;
      if (!q) return true;
      const subject = getSubject(b.subjectId)?.name || b.subjectId;
      return (
        b.title.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q) ||
        b.sourcePath.toLowerCase().includes(q)
      );
    });
  }, [manifest, moeFilter, query]);

  const moeBySubject = useMemo(() => {
    const map = new Map<string, SharedCorpusBookMeta[]>();
    for (const b of moeBooks) {
      const arr = map.get(b.subjectId) || [];
      arr.push(b);
      map.set(b.subjectId, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [moeBooks]);

  const readyCount = data.books.filter((b) => b.status === "ready").length;
  const moeOn = data.useMoeLibrary !== false;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
          continue;
        }
        await uploadBook(file, subjectId);
      }
    } finally {
      setUploading(false);
    }
  }

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading library…</div>;
  }

  return (
    <>
      <AppHeader
        title="Textbook"
        highlight="library"
        subtitle="Built-in Oman MoE corpus for tutor grounding, plus personal PDF uploads stored in this browser."
        showGreeting={false}
        action={
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? "Extracting…" : "Upload PDF"}
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <Card className="mb-8 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
              <Library className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Oman MoE library (built-in)
              </h2>
              <p className="mt-1 max-w-xl text-xs text-muted">
                Pre-indexed textbooks — no re-upload needed. Tutor cites these as
                “MoE library” when this toggle is on. Personal uploads still merge in.
              </p>
              <p className="mt-2 text-xs text-emerald-300/90">
                {moeBookCount || manifest?.books.length || 0} indexed title
                {(moeBookCount || manifest?.books.length || 0) === 1 ? "" : "s"}
                {manifest
                  ? ` · ${Object.keys(manifest.subjects).length} subjects`
                  : " · run npm run index:moe-corpus if empty"}
              </p>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
            <input
              type="checkbox"
              checked={moeOn}
              onChange={(e) => updateUseMoeLibrary(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Use shared MoE library
          </label>
        </div>

        {manifest && moeBySubject.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMoeFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  moeFilter === "all"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-white/5 text-muted hover:text-white"
                }`}
              >
                All
              </button>
              {Object.keys(manifest.subjects)
                .sort()
                .map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMoeFilter(id)}
                    className={`rounded-lg px-2.5 py-1 text-xs ${
                      moeFilter === id
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-white/5 text-muted hover:text-white"
                    }`}
                  >
                    {getSubject(id)?.name || id} ({manifest.subjects[id].bookCount})
                  </button>
                ))}
            </div>

            <div className="mt-4 max-h-80 space-y-4 overflow-y-auto scrollbar-thin">
              {moeBySubject.map(([sid, list]) => (
                <div key={sid}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {getSubject(sid)?.name || sid}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {list.map((book) => {
                      const onShelf = data.moeShelfIds.includes(book.id);
                      return (
                        <div
                          key={book.id}
                          id={`book-${book.id}`}
                          className="flex items-start justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3 scroll-mt-24"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {book.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                              {book.grade ? `G${book.grade} · ` : ""}
                              {book.pageCount} pages · {book.chunkCount} chunks
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMoeShelf(book.id)}
                            className={`shrink-0 rounded-lg px-2 py-1 text-[11px] ${
                              onShelf
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-white/5 text-muted hover:text-white"
                            }`}
                            title="Add to my study shelf"
                          >
                            <span className="inline-flex items-center gap-1">
                              <BookMarked className="h-3 w-3" />
                              {onShelf ? "On shelf" : "Add to shelf"}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(!manifest || (manifest.books.length === 0 && moeBySubject.length === 0)) && (
          <p className="mt-4 text-xs text-amber-200/80">
            No shared index yet. From the project root run{" "}
            <code className="rounded bg-black/30 px-1">npm run index:moe-corpus</code>{" "}
            then refresh.
          </p>
        )}
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs text-muted">Assign uploads to</label>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
        >
          {SUBJECT_CATALOG.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#121826]">
              {s.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">
          {readyCount} personal textbook{readyCount === 1 ? "" : "s"} ready
          {moeOn ? " · MoE library on" : ""}
        </span>
      </div>

      <div
        className={`mb-8 rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragOver
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-white/10 bg-white/[0.02]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
          <Upload className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">
          Your uploads (notes &amp; extra books)
        </h3>
        <p className="mt-2 text-sm text-muted">
          PDF only. Extracted here and stored locally — complements the shared MoE index.
        </p>
        <Button
          className="mt-6"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Browse files
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search MoE library and your textbooks..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-white">Your uploads</h3>
      {books.length === 0 ? (
        <Card className="border-dashed text-center">
          <p className="text-sm text-white">No personal uploads yet</p>
          <p className="mt-1 text-xs text-muted">
            Optional — the built-in MoE library already grounds the tutor when enabled.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {books.map((book) => {
            const subject = getSubject(book.subjectId);
            return (
              <Card key={book.id} hover id={`book-${book.id}`} className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
                    <FileText className="h-7 w-7 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white">{book.title}</h3>
                        <p className="text-xs text-muted">{subject?.name || "General"}</p>
                      </div>
                      <button
                        onClick={() => void deleteBook(book.id)}
                        className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{formatBytes(book.sizeBytes)}</span>
                      <span>•</span>
                      <span>{relativeTime(book.uploadedAt)}</span>
                      {book.pageCount != null && book.pageCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{book.pageCount} pages</span>
                        </>
                      )}
                      {book.chunkCount != null && book.chunkCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{book.chunkCount} chunks</span>
                        </>
                      )}
                    </div>
                    <div className="mt-3">
                      {book.status === "ready" ? (
                        <Badge variant="success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Ready
                        </Badge>
                      ) : book.status === "failed" ? (
                        <div className="space-y-1">
                          <Badge variant="danger">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                          {book.errorMessage && (
                            <p className="text-[11px] text-red-300/80">{book.errorMessage}</p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="warning">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Extracting
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
