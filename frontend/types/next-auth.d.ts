import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
      provider: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isAdmin: boolean;
    provider: string;
  }
}
