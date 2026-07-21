import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Family calendar gate — single shared login (env credentials).
 * Cookie options tuned for Safari / iPad (Secure + SameSite=Lax on HTTPS).
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
  // Prefer non-__Host cookies so path/subdomain edge cases on iOS are less fragile
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.callback-url"
          : "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const isPublic =
        path === "/login" ||
        path.startsWith("/login/") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/avatars") ||
        path.startsWith("/fitness") ||
        path === "/favicon.ico";
      if (isPublic) return true;
      return !!session?.user;
    },
  },
});
