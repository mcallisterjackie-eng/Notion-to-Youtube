import Image from "next/image";
import type { Video } from "@/content/videos";
import { Badge } from "@/components/ui/Badge";
import { PlayIcon } from "@/components/ui/Icons";

/** Decorative stand-in thumbnail: a soft tint with two brand module squares. */
function ModuleThumb({ video }: { video: Video }) {
  return (
    <>
      <span className="module" style={{ right: 20, top: 56, width: 40, height: 40, borderRadius: 10, background: video.squares[0] }} />
      <span className="module" style={{ right: 68, top: 104, width: 24, height: 24, borderRadius: 6, background: video.squares[1] }} />
    </>
  );
}

export function VideoCard({ video, showTopic = false }: { video: Video; showTopic?: boolean }) {
  const external = video.url !== "#";
  return (
    <a
      className="video-card"
      href={video.url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <div className="video-thumb" style={{ background: video.tint }}>
        <Badge>{video.platform}</Badge>
        {video.youtubeId ? (
          <Image src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" fill sizes="(max-width: 720px) 100vw, 300px" />
        ) : (
          <ModuleThumb video={video} />
        )}
        <span className="play-button" style={{ color: "var(--white)" }}>
          <PlayIcon size={22} />
        </span>
      </div>
      <h3 className="h5 video-title">
        {video.title}
        {external ? <span className="visually-hidden"> (opens {video.platform} in a new tab)</span> : null}
      </h3>
      {showTopic ? <p className="caption">{video.topic}</p> : null}
    </a>
  );
}
