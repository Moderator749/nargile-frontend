// YouTube links the admin pastes into the product sheet.

/** The video id in a watch / youtu.be / embed / shorts / live URL, else null. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return match ? match[1] : null;
}

/** Poster frame, so the page shows the video without loading the player. */
export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Privacy-preserving embed, only requested once the viewer presses play. */
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
