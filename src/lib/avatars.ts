/** Modern profile avatars generated for the kitchen calendar. */
export const PROFILE_AVATARS = [
  { id: "avatar-01", src: "/avatars/avatar-01.jpg", label: "Coral" },
  { id: "avatar-02", src: "/avatars/avatar-02.jpg", label: "Violet" },
  { id: "avatar-03", src: "/avatars/avatar-03.jpg", label: "Cyan" },
  { id: "avatar-04", src: "/avatars/avatar-04.jpg", label: "Amber" },
  { id: "avatar-05", src: "/avatars/avatar-05.jpg", label: "Rose" },
  { id: "avatar-06", src: "/avatars/avatar-06.jpg", label: "Blue" },
  { id: "avatar-07", src: "/avatars/avatar-07.jpg", label: "Indigo" },
  { id: "avatar-08", src: "/avatars/avatar-08.jpg", label: "Mint" },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]["id"];

export function avatarSrc(id?: string | null): string | null {
  if (!id) return null;
  const found = PROFILE_AVATARS.find((a) => a.id === id || a.src === id);
  if (found) return found.src;
  if (id.startsWith("/avatars/") || id.startsWith("http")) return id;
  return null;
}
