"use client";

import { useState } from "react";
import { socials, type Platform } from "@/content/site";
import { videos } from "@/content/videos";
import { VideoCard } from "./VideoCard";

type Filter = "All" | Platform;

export function VideoLibrary() {
  const [filter, setFilter] = useState<Filter>("All");
  const filters: Filter[] = ["All", ...socials.map((s) => s.platform)];
  const shown = videos.filter((v) => filter === "All" || v.platform === filter);

  return (
    <div className="stack gap-8">
      <div className="split" style={{ alignItems: "center" }}>
        <h2 className="h3">All videos</h2>
        <div className="row" role="group" aria-label="Filter by platform" style={{ gap: "var(--space-2)" }}>
          {filters.map((f) => (
            <button key={f} type="button" className="pill" aria-pressed={f === filter} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid-videos" aria-live="polite">
        {shown.map((v) => (
          <VideoCard key={v.slug} video={v} showTopic />
        ))}
      </div>
    </div>
  );
}
