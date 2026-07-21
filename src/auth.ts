import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Family calendar gate — single shared login (env credentials).
 * Set AUTH_SECRET, FAMILY_USERNAME, FAMILY_PASSWORD on Vercel / .env.local
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Family Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");

        const expectedUser =
          process.env.FAMILY_USERNAME?.trim() || "family";
        const expectedPass = process.env.FAMILY_PASSWORD;

        if (!expectedPass) {
          console.error(
            "FAMILY_PASSWORD is not set — login is disabled until configured."
          );
          return null;
        }

        if (username === expectedUser && password === expectedPass) {
          return {
            id: "family",
            name: expectedUser,
            email: `${expectedUser}@family.local`,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  trustHost: true,
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const isPublic =
        path.startsWith("/login") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/avatars") ||
        path === "/favicon.ico";
      if (isPublic) return true;
      return !!session?.user;
    },
  },
});
