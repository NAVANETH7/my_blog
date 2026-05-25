"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Load ThreeJS background without SSR
const LoginThreeBackground = dynamic(
  () => import('@/components/admin/LoginThreeBackground'),
  { ssr: false }
);

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin');
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/admin' });
    } catch (err) {
      console.error(err);
      setGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setGithubLoading(true);
    try {
      await signIn('github', { callbackUrl: '/admin' });
    } catch (err) {
      console.error(err);
      setGithubLoading(false);
    }
  };

  const errorMessages: Record<string, string> = {
    AccessDenied: 'Access denied. This dashboard is private.',
    OAuthSignin: 'OAuth sign-in failed. Please try again.',
    OAuthCallback: 'OAuth callback error. Please try again.',
  };

  const errorMessage = errorParam ? (errorMessages[errorParam] || 'Authentication failed. Please try again.') : null;

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm mt-4 font-semibold tracking-wide">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="text-slate-800 flex items-center justify-center relative overflow-hidden font-sans select-none w-full">
      {/* Dynamic Background */}
      <LoginThreeBackground />

      {/* Glass login card */}
      <div className="w-full max-w-[420px] bg-white/70 border border-slate-200/80 rounded-[24px] backdrop-blur-[24px] p-12 shadow-[0_10px_40px_rgba(0,0,0,0.06)] glow-card-3d z-10 relative flex flex-col transition-all duration-300">
        
        {/* Logo Mark: rotated glowing square */}
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 rotate-45 bg-gradient-to-br from-violet-600 to-indigo-650 rounded-lg flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.25)] border border-violet-400/20">
            <div className="-rotate-45 text-white font-bold text-lg select-none">d</div>
          </div>
        </div>

        <h1 className="text-center text-[28px] font-semibold tracking-tight text-slate-800 mb-2 leading-none">
          Welcome back
        </h1>
        <p className="text-center text-sm text-slate-500 font-medium mb-8">
          Sign in to your CMS dashboard
        </p>

        {/* Errors Block */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-red-650 shrink-0 mt-0.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-[13px] font-semibold leading-tight text-red-650">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3.5">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || githubLoading}
            className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold tracking-wide text-slate-700 shadow-sm"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center justify-center my-5 gap-3 select-none">
            <div className="h-[1px] bg-slate-200 flex-grow" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="h-[1px] bg-slate-200 flex-grow" />
          </div>

          {/* GitHub Sign In */}
          <button
            onClick={handleGithubLogin}
            disabled={googleLoading || githubLoading}
            className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold tracking-wide text-slate-700 shadow-sm"
          >
            {githubLoading ? (
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 fill-slate-800" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            )}
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* Footer Secured badge */}
        <p className="text-center text-[12px] font-semibold text-slate-400 mt-10">
          Secured by NextAuth.js · Admin only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-transparent flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm mt-4 font-semibold tracking-wide">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
