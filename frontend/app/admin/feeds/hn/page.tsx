import DevToFeed from '@/components/DevToFeed';

export const dynamic = 'force-dynamic';

export default function AdminHNFeedPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="select-none">
        <h1 className="text-[28px] font-semibold text-slate-800 tracking-tight leading-none mb-2">
          Hacker News Curation
        </h1>
        <p className="text-[13px] text-slate-500 font-medium">
          Manage software engineering discussion threads pulled from Hacker News
        </p>
      </div>
      
      <div className="bg-white/40 border border-slate-200/50 backdrop-blur-md glow-card-3d rounded-2xl p-6">
        <DevToFeed />
      </div>
    </div>
  );
}
