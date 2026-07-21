export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Protect everything except static assets and Next internals.
     * Auth callback in auth.ts also allows /login and /api/auth.
     */
    "/((?!_next/static|_next/image|favicon.ico|avatars/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
