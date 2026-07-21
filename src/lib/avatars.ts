/** Modern profile avatars for the kitchen calendar. */
export const PROFILE_AVATARS = [
  // Imagine-generated photo-style
  { id: "avatar-01", src: "/avatars/avatar-01.jpg", label: "Coral" },
  { id: "avatar-02", src: "/avatars/avatar-02.jpg", label: "Violet" },
  { id: "avatar-03", src: "/avatars/avatar-03.jpg", label: "Cyan" },
  { id: "avatar-04", src: "/avatars/avatar-04.jpg", label: "Amber" },
  { id: "avatar-05", src: "/avatars/avatar-05.jpg", label: "Rose" },
  { id: "avatar-06", src: "/avatars/avatar-06.jpg", label: "Blue" },
  { id: "avatar-07", src: "/avatars/avatar-07.jpg", label: "Indigo" },
  { id: "avatar-08", src: "/avatars/avatar-08.jpg", label: "Mint" },
  { id: "avatar-09", src: "/avatars/avatar-09.jpg", label: "Peach" },
  { id: "avatar-10", src: "/avatars/avatar-10.jpg", label: "Navy" },
  { id: "avatar-11", src: "/avatars/avatar-11.jpg", label: "Forest" },
  { id: "avatar-12", src: "/avatars/avatar-12.jpg", label: "Terracotta" },
  // Clean geometric SVG options
  { id: "svg-blue", src: "/avatars/svg/wave-blue.svg", label: "Sky silhouette" },
  { id: "svg-pink", src: "/avatars/svg/wave-pink.svg", label: "Pink silhouette" },
  { id: "svg-emerald", src: "/avatars/svg/wave-emerald.svg", label: "Green silhouette" },
  { id: "svg-amber", src: "/avatars/svg/wave-amber.svg", label: "Gold silhouette" },
  { id: "svg-violet", src: "/avatars/svg/wave-violet.svg", label: "Purple silhouette" },
  { id: "svg-slate", src: "/avatars/svg/wave-slate.svg", label: "Slate silhouette" },
  { id: "svg-rose", src: "/avatars/svg/wave-rose.svg", label: "Rose silhouette" },
  { id: "svg-teal", src: "/avatars/svg/wave-teal.svg", label: "Teal silhouette" },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]["id"];

export function avatarSrc(id?: string | null): string | null {
  if (!id) return null;
  const found = PROFILE_AVATARS.find((a) => a.id === id || a.src === id);
  if (found) return found.src;
  if (id.startsWith("/avatars/") || id.startsWith("http")) return id;
  return null;
}
