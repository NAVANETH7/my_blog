"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { TrashIcon } from '@/components/admin/Icons';

export default function AdminCurationPage() {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [editedArticles, setEditedArticles] = useState<Record<string, { title: string; description: string }>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedHidden = localStorage.getItem('curated_hidden_articles');
      const savedEdited = localStorage.getItem('curated_edited_articles');
      if (savedHidden) setHiddenIds(JSON.parse(savedHidden));
      if (savedEdited) setEditedArticles(JSON.parse(savedEdited));
    }
  }, []);

  const handleResetCuration = () => {
    if (confirm('Are you sure you want to delete all external feed curation overrides (hidden list & edits)?')) {
      setHiddenIds([]);
      setEditedArticles({});
      if (typeof window !== 'undefined') {
        localStorage.removeItem('curated_hidden_articles');
        localStorage.removeItem('curated_edited_articles');
      }
      toast.success('Curation settings reset!');
    }
  };

  const handleRemoveSingleHidden = (id: string) => {
    const updated = hiddenIds.filter(item => item !== id);
    setHiddenIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('curated_hidden_articles', JSON.stringify(updated));
    }
    toast.success('Article restored to feed list');
  };

  const handleRemoveSingleEdited = (id: string) => {
    const updated = { ...editedArticles };
    delete updated[id];
    setEditedArticles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('curated_edited_articles', JSON.stringify(updated));
    }
    toast.success('Article edits reverted to defaults');
  };

  if (!isMounted) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-550">
        Loading curation metrics...
      </div>
    );
  }

  const hasCuration = hiddenIds.length > 0 || Object.keys(editedArticles).length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-[28px] font-semibold text-slate-800 tracking-tight leading-none mb-2">
            Feed curation overrides
          </h1>
          <p className="text-[13px] text-slate-500 font-medium">
            Manage your local hidden and modified articles for DEV.to and Hacker News feeds
          </p>
        </div>
        
        {hasCuration && (
          <button
            onClick={handleResetCuration}
            className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-[12.5px] font-bold cursor-pointer transition-colors shadow-xs"
          >
            Clear all overrides
          </button>
        )}
      </div>

      {!hasCuration ? (
        <div className="py-24 text-center border border-dashed border-slate-200 bg-white/40 shadow-xs rounded-2xl select-none">
          <span className="text-4xl block mb-3">🛠️</span>
          <h3 className="text-[16px] font-semibold text-slate-500 mb-1">No feed overrides</h3>
          <p className="text-[12.5px] text-slate-600 max-w-sm mx-auto">
            You haven't hidden or edited any external articles. Go to DEV.to or Hacker News feed to curate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
          
          {/* Column 1: Hidden Articles list */}
          <div className="bg-white/40 border border-slate-200/60 shadow-xs backdrop-blur-md glow-card-3d rounded-2xl p-5 space-y-4">
            <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/40 pb-2">
              Hidden articles ({hiddenIds.length})
            </h3>
            
            {hiddenIds.length === 0 ? (
              <span className="text-slate-400 text-[12.5px] italic block">No hidden items</span>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {hiddenIds.map(id => (
                  <div key={id} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-200/50 bg-white/50 text-[12.5px] select-text">
                    <span className="truncate max-w-[240px] font-semibold text-slate-650 font-mono">{id}</span>
                    <button
                      onClick={() => handleRemoveSingleHidden(id)}
                      className="px-2.5 py-1 rounded bg-slate-50 border border-slate-250 text-slate-500 hover:text-slate-800 hover:bg-slate-100 hover:border-slate-300 cursor-pointer shrink-0 font-bold text-[11.5px] transition-colors"
                      title="Restore Article"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Edited Articles list */}
          <div className="bg-white/40 border border-slate-200/60 shadow-xs backdrop-blur-md glow-card-3d rounded-2xl p-5 space-y-4">
            <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/40 pb-2">
              Locally modified articles ({Object.keys(editedArticles).length})
            </h3>
            
            {Object.keys(editedArticles).length === 0 ? (
              <span className="text-slate-400 text-[12.5px] italic block">No edited items</span>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {Object.entries(editedArticles).map(([id, data]) => (
                  <div key={id} className="p-3 rounded-xl border border-slate-200/50 bg-white/50 space-y-2 select-text">
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-[12.5px] font-bold text-slate-800 line-clamp-1">{data.title}</span>
                      <button
                        onClick={() => handleRemoveSingleEdited(id)}
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 cursor-pointer shrink-0 transition-colors"
                        title="Revert Edits"
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                    <p className="text-[11.5px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {data.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
