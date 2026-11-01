"use client";

import { youtubeEmbedUrl, youtubeWatchUrl } from "@/data/lessons";
import { ExternalLink } from "lucide-react";

export function YoutubeEmbed({
  youtubeId,
  title,
  channel,
  durationLabel,
}: {
  youtubeId: string;
  title: string;
  channel?: string;
  durationLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="relative aspect-video w-full bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={youtubeEmbedUrl(youtubeId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          {(channel || durationLabel) && (
            <p className="mt-0.5 truncate text-xs text-muted">
              {[channel, durationLabel].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <a
          href={youtubeWatchUrl(youtubeId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-white/10 hover:text-cyan-100"
        >
          YouTube
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
