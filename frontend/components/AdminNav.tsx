'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function AdminNav() {
  return (
    <nav className="border-b border-slate-200/50 dark:border-slate-800/40 bg-white/75 dark:bg-slate-950/75 backdrop-blur-md sticky top-0 z-40 text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent hover:opacity-85 transition-opacity">
            DevBlog CMS
          </Link>
          <Link
            href="/blog"
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            View Site
          </Link>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/blog' })}
          className="text-sm font-semibold px-4 py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
