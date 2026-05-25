"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format, parseISO, subDays, startOfMonth } from 'date-fns';
import { EditIcon } from './Icons';

interface AnalyticsClientProps {
  posts: any[];
  commits: any[];
}

export default function AnalyticsClient({ posts, commits }: AnalyticsClientProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Content Stats Calculations
  const stats = useMemo(() => {
    let totalWords = 0;
    let longest = { title: '', words: 0, slug: '' };
    let shortest = { title: '', words: 999999, slug: '' };

    posts.forEach(p => {
      // Calculate word count from description or approximate
      const words = p.words || (p.summary || '').split(/\s+/).filter(Boolean).length * 10;
      totalWords += words;

      if (words > longest.words) {
        longest = { title: p.title, words, slug: p.slug };
      }
      if (words > 0 && words < shortest.words) {
        shortest = { title: p.title, words, slug: p.slug };
      }
    });

    const averageWords = posts.length > 0 ? Math.round(totalWords / posts.length) : 0;
    const averageReadTime = Math.max(Math.ceil(averageWords / 200), 1);

    return {
      averageWords,
      averageReadTime,
      longest: longest.words > 0 ? longest : null,
      shortest: shortest.words < 999999 ? shortest : null,
      totalCommitsThisMonth: commits.filter(c => {
        try {
          const commitDate = new Date(c.date);
          const startOfCurrentMonth = startOfMonth(new Date());
          return commitDate >= startOfCurrentMonth;
        } catch {
          return false;
        }
      }).length
    };
  }, [posts, commits]);

  // 2. Chart Data A: Posts per Month (Bar Chart)
  const postsPerMonthData = useMemo(() => {
    const monthsMap: Record<string, number> = {};
    posts.forEach(p => {
      if (!p.date) return;
      try {
        const dateParsed = parseISO(p.date);
        const key = format(dateParsed, 'MMM yyyy');
        monthsMap[key] = (monthsMap[key] || 0) + 1;
      } catch {}
    });

    // Convert to sorted array of last 6 months
    return Object.entries(monthsMap)
      .map(([name, count]) => ({ name, count }))
      .slice(-6);
  }, [posts]);

  // 3. Chart Data B: Tags distribution (Pie Chart / Donut)
  const tagsDistributionData = useMemo(() => {
    const tagsMap: Record<string, number> = {};
    posts.forEach(p => {
      if (p.tags) {
        p.tags.forEach((tag: string) => {
          tagsMap[tag] = (tagsMap[tag] || 0) + 1;
        });
      }
    });

    const colors = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
    return Object.entries(tagsMap)
      .map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [posts]);

  // 4. Chart Data C: Deploys/Commits per Day (Line Chart)
  const deploysPerDayData = useMemo(() => {
    const daysMap: Record<string, number> = {};
    
    // Initialize last 7 days with zero
    for (let i = 6; i >= 0; i--) {
      const dayKey = format(subDays(new Date(), i), 'MMM d');
      daysMap[dayKey] = 0;
    }

    commits.forEach(c => {
      if (!c.date) return;
      try {
        const dateParsed = new Date(c.date);
        const key = format(dateParsed, 'MMM d');
        if (key in daysMap) {
          daysMap[key] += 1;
        }
      } catch {}
    });

    return Object.entries(daysMap).map(([name, count]) => ({ name, count }));
  }, [commits]);

  // 5. Content Health Auditing Checks
  const healthAudit = useMemo(() => {
    const missingSummary: any[] = [];
    const missingCover: any[] = [];
    const missingTags: any[] = [];
    const longDrafts: any[] = [];

    posts.forEach(p => {
      if (!p.summary || p.summary.trim() === '') {
        missingSummary.push(p);
      }
      if (!p.coverImage) {
        missingCover.push(p);
      }
      if (!p.tags || p.tags.length === 0) {
        missingTags.push(p);
      }

      // Long drafts (>500 words unpublished >7 days)
      if (p.draft) {
        // Calculate words approx
        const words = (p.content || '').split(/\s+/).filter(Boolean).length;
        try {
          const dateLimit = subDays(new Date(), 7);
          const postDate = parseISO(p.date);
          if (words > 500 && postDate < dateLimit) {
            longDrafts.push({ ...p, words });
          }
        } catch {}
      }
    });

    return {
      missingSummary,
      missingCover,
      missingTags,
      longDrafts,
    };
  }, [posts]);

  if (!isMounted) {
    return (
      <div className="h-[400px] w-full bg-slate-50/50 border border-slate-200 rounded-2xl flex items-center justify-center animate-pulse text-slate-500 font-sans text-[13px]">
        Loading analytics charts...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* 1. Header */}
      <div className="select-none animate-in fade-in slide-in-from-top-4 duration-300">
        <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-none mb-2">
          Analytics
        </h1>
        <p className="text-[13px] text-slate-500 font-semibold">
          Content distribution statistics, commit deploy tracking, and page health audits
        </p>
      </div>

      {/* 2. Grid Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="glow-card-3d p-5">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Average Reading Time</span>
          <div className="text-[28px] font-bold text-slate-800">{stats.averageReadTime} min</div>
          <span className="text-[11px] text-slate-500 block mt-1 font-semibold">Based on word density</span>
        </div>

        <div className="glow-card-3d p-5">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Commits This Month</span>
          <div className="text-[28px] font-bold text-slate-800">{stats.totalCommitsThisMonth} pushes</div>
          <span className="text-[11px] text-slate-500 block mt-1 font-semibold">Continuous deployments</span>
        </div>

        <div className="glow-card-3d p-5">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Longest Post</span>
          <div className="text-[13px] font-bold text-violet-600 truncate mt-1">
            {stats.longest ? (
              <Link href={`/admin/editor?slug=${stats.longest.slug}`} className="hover:underline">
                {stats.longest.title}
              </Link>
            ) : 'None'}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1.5 font-semibold">{stats.longest?.words || 0} words</span>
        </div>

        <div className="glow-card-3d p-5">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Shortest Post</span>
          <div className="text-[13px] font-bold text-violet-600 truncate mt-1">
            {stats.shortest ? (
              <Link href={`/admin/editor?slug=${stats.shortest.slug}`} className="hover:underline">
                {stats.shortest.title}
              </Link>
            ) : 'None'}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1.5 font-semibold">{stats.shortest?.words || 0} words</span>
        </div>
      </div>

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 select-none">
        
        {/* Posts per month (Bar) */}
        <div className="xl:col-span-2 glow-card-3d p-5 space-y-4">
          <h3 className="text-[11px] font-extrabold text-slate-450 tracking-wider uppercase">Posts timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={postsPerMonthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#7C3AED', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tags Distribution (Donut/Pie) */}
        <div className="glow-card-3d p-5 space-y-4">
          <h3 className="text-[11px] font-extrabold text-slate-450 tracking-wider uppercase">Top categories</h3>
          <div className="h-64 flex flex-col justify-between">
            <div className="flex-1 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                  />
                  <Pie
                    data={tagsDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {tagsDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend list */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-500">
              {tagsDistributionData.map(tag => (
                <div key={tag.name} className="flex items-center gap-1 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="truncate">{tag.name} ({tag.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deploys Line chart */}
        <div className="xl:col-span-3 glow-card-3d p-5 space-y-4">
          <h3 className="text-[11px] font-extrabold text-slate-450 tracking-wider uppercase">Commits activity (last 7 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deploysPerDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#10B981', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Content Health Section */}
      <div className="space-y-4 select-none">
        <h3 className="text-[11px] font-extrabold text-slate-400 tracking-wider px-1 uppercase">Content health audit</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Audit 1: Missing Excerpt */}
          <div className="glow-card-3d p-5 flex flex-col justify-between min-h-[160px]">
            <div>
              <h4 className="text-[13px] font-bold text-slate-700">Missing Excerpt ({healthAudit.missingSummary.length})</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1 font-semibold">SEO descriptions are important for search crawls.</p>
              
              <div className="space-y-1.5 mt-3 max-h-24 overflow-y-auto custom-scrollbar">
                {healthAudit.missingSummary.slice(0, 3).map(p => (
                  <Link key={p.slug} href={`/admin/editor?slug=${p.slug}`} className="flex items-center justify-between text-[12px] text-violet-600 hover:text-violet-850 font-bold hover:underline">
                    <span className="truncate max-w-[150px]">{p.title}</span>
                    <EditIcon size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Audit 2: Missing Cover photo */}
          <div className="glow-card-3d p-5 flex flex-col justify-between min-h-[160px]">
            <div>
              <h4 className="text-[13px] font-bold text-slate-700">Missing Cover ({healthAudit.missingCover.length})</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1 font-semibold">Posts look better with graphics header cards.</p>
              
              <div className="space-y-1.5 mt-3 max-h-24 overflow-y-auto custom-scrollbar">
                {healthAudit.missingCover.slice(0, 3).map(p => (
                  <Link key={p.slug} href={`/admin/editor?slug=${p.slug}`} className="flex items-center justify-between text-[12px] text-violet-600 hover:text-violet-850 font-bold hover:underline">
                    <span className="truncate max-w-[150px]">{p.title}</span>
                    <EditIcon size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Audit 3: Missing Tags */}
          <div className="glow-card-3d p-5 flex flex-col justify-between min-h-[160px]">
            <div>
              <h4 className="text-[13px] font-bold text-slate-700">Missing Tags ({healthAudit.missingTags.length})</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1 font-semibold">Untagged posts will not display in taxonomy filter lists.</p>
              
              <div className="space-y-1.5 mt-3 max-h-24 overflow-y-auto custom-scrollbar">
                {healthAudit.missingTags.slice(0, 3).map(p => (
                  <Link key={p.slug} href={`/admin/editor?slug=${p.slug}`} className="flex items-center justify-between text-[12px] text-violet-600 hover:text-violet-850 font-bold hover:underline">
                    <span className="truncate max-w-[150px]">{p.title}</span>
                    <EditIcon size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Audit 4: Stale Draft Warnings */}
          <div className="glow-card-3d p-5 flex flex-col justify-between min-h-[160px]">
            <div>
              <h4 className="text-[13px] font-bold text-slate-700">Stale Drafts ({healthAudit.longDrafts.length})</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1 font-semibold">Draft articles over 500 words older than 7 days.</p>
              
              <div className="space-y-1.5 mt-3 max-h-24 overflow-y-auto custom-scrollbar">
                {healthAudit.longDrafts.slice(0, 3).map(p => (
                  <Link key={p.slug} href={`/admin/editor?slug=${p.slug}`} className="flex items-center justify-between text-[12px] text-violet-600 hover:text-violet-850 font-bold hover:underline">
                    <span className="truncate max-w-[140px]">{p.title}</span>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{p.words} words</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
