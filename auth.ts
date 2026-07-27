import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const PRIMARY_USER_EMAIL = "longin.erwan@gmail.com";
export const LEGACY_DEMO_EMAIL = "demo@fitai.local";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  callbacks: {
    authorized() {
      return true;
    },
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      if (!email) return false;

      // Phase 1: keep the private build locked to Erwan while we commercialize safely.
      return email === PRIMARY_USER_EMAIL;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = String(token.email).toLowerCase();
      }
      return session;
    },
  },
});

