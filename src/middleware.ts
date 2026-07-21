export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Run auth on app routes only.
     * Skip Next internals, static files, and public asset folders
     * (critical for iPad Safari loading CSS/JS/images).
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|avatars/|fitness/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff|woff2)$).*)",
  ],
};
