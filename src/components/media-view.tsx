import type { Media } from "@prisma/client";

export function MediaView({ media, className = "" }: { media: Pick<Media, "type" | "url" | "caption">; className?: string }) {
  if (media.type === "VIDEO") {
    return <video src={media.url} controls preload="metadata" className={`aspect-video w-full bg-black ${className}`} />;
  }
  if (media.type === "EMBED") {
    return (
      <iframe
        src={media.url}
        title={media.caption || "Vidéo"}
        className={`aspect-video w-full ${className}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.url} alt={media.caption} loading="lazy" className={`w-full object-cover ${className}`} />;
}
