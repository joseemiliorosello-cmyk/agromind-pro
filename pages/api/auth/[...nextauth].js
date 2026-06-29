import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Lista de emails autorizados a usar la app — variable de entorno en Vercel,
// separados por coma (sin espacios). El owner la administra desde el panel
// de Vercel: Settings → Environment Variables → ALLOWED_EMAILS.
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      // Si no hay lista configurada, no se restringe (evita bloquear al owner
      // si todavía no seteó la variable de entorno).
      if (ALLOWED_EMAILS.length === 0) return true;
      const email = (profile?.email || "").toLowerCase();
      return ALLOWED_EMAILS.includes(email);
    },
  },
  pages: {
    error: "/",
  },
};

export default NextAuth(authOptions);
