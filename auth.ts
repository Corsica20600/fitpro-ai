import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const PRIMARY_USER_EMAIL = "longin.erwan@gmail.com";
export const LEGACY_DEMO_EMAIL = "demo@fitai.local";

function getAllowedEmails() {
  return new Set(
    (process.env.FITAI_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

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

      const googleProfile = profile as { email_verified?: boolean } | undefined;
      if (googleProfile?.email_verified === false) return false;

      const allowedEmails = getAllowedEmails();
      if (allowedEmails.size > 0) {
        return allowedEmails.has(email);
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = String(token.email).toLowerCase();
      }
      return session;
    },
  },
});
