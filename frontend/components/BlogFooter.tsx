export default function BlogFooter() {
  return (
    <footer className="border-t border-slate-200/50 dark:border-slate-800/40 py-10 bg-slate-50/50 dark:bg-slate-900/10 mt-16 w-full">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-6 text-sm text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} DevBlog. All rights reserved.</p>
        <p>
          Built with{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Next.js 16
          </span>{' '}
          &amp;{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Tailwind v4
          </span>
        </p>
      </div>
    </footer>
  );
}
