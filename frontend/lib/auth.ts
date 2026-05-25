import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const ADMIN_EMAIL = 'navanethskv@gmail.com';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      authorization: { params: { scope: 'read:user user:email' } },
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    // GATE 1: Block at OAuth callback — before JWT is ever created
    async signIn({ user, profile }) {
      const email = user.email ?? profile?.email;
      if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return '/admin/login?error=AccessDenied';
      }
      return true;
    },

    // Embed admin flag and provider into JWT token
    async jwt({ token, user, account }) {
      if (user) {
        token.isAdmin = user.email === ADMIN_EMAIL;
        token.provider = account?.provider || '';
      }
      return token;
    },

    // Expose admin flag and provider in session object
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = token.isAdmin as boolean;
        (session.user as any).provider = token.provider as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,  // 7 days
    updateAge: 24 * 60 * 60,    // refresh every 24h
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
