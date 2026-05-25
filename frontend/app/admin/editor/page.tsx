import { Suspense } from 'react';
import EditorClient from '@/components/admin/EditorClient';

export const dynamic = 'force-dynamic';

export default async function AdminEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-[400px] w-full bg-slate-50/50 border border-slate-200 rounded-2xl flex items-center justify-center animate-pulse text-slate-500 font-sans text-[13px]">
        Loading editor...
      </div>
    }>
      <EditorClient />
    </Suspense>
  );
}
