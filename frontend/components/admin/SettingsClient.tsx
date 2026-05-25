"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  SettingsIcon,
  WorldIcon,
  LockIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  BellIcon,
} from './Icons';

interface SettingsClientProps {
  session: any;
  initialSettings: any;
  initialGitStatus: any;
}

export default function SettingsClient({
  session,
  initialSettings,
  initialGitStatus,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'blog' | 'github' | 'deploy' | 'danger'>('profile');
  
  // Blog settings forms
  const [blogName, setBlogName] = useState(initialSettings?.blogName || 'DevBlog');
  const [blogDescription, setBlogDescription] = useState(initialSettings?.blogDescription || '');
  const [authorName, setAuthorName] = useState(initialSettings?.authorName || 'Navaneth');
  const [siteUrl, setSiteUrl] = useState(initialSettings?.siteUrl || 'https://');
  const [githubUrl, setGithubUrl] = useState(initialSettings?.socialLinks?.github || '');
  const [twitterUrl, setTwitterUrl] = useState(initialSettings?.socialLinks?.twitter || '');

  // Git status
  const [gitStatus, setGitStatus] = useState(initialGitStatus);
  const [testingGit, setTestingGit] = useState(false);

  // Danger zone confirmations
  const [confirmClearDrafts, setConfirmClearDrafts] = useState('');
  const [confirmResetSlugs, setConfirmResetSlugs] = useState('');

  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'blog', label: 'Blog settings' },
    { id: 'github', label: 'GitHub integration' },
    { id: 'deploy', label: 'Deployment' },
    { id: 'danger', label: 'Danger zone' },
  ] as const;

  // Save blog configurations
  const handleSaveBlogSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteUrl.startsWith('https://')) {
      toast.error('Site URL must start with https://');
      return;
    }

    setLoading(true);
    const saveToast = toast.loading('Saving configurations...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogName,
          blogDescription,
          authorName,
          siteUrl,
          socialLinks: {
            github: githubUrl,
            twitter: twitterUrl
          }
        }),
      });

      if (res.ok) {
        toast.success('Settings updated successfully', { id: saveToast });
      } else {
        toast.error('Failed to save settings', { id: saveToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred', { id: saveToast });
    } finally {
      setLoading(false);
    }
  };

  // Test git status
  const handleTestConnection = async () => {
    setTestingGit(true);
    try {
      const res = await fetch('/api/git/status');
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
        toast.success('GitHub connection test passed!');
      } else {
        toast.error('Failed to connect to Git repository');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection timeout');
    } finally {
      setTestingGit(false);
    }
  };

  // Trigger manual rebuild
  const handleRebuild = async () => {
    setLoading(true);
    const rebuildToast = toast.loading('Syncing changes and rebuilding...');
    try {
      const res = await fetch('/api/deploy/trigger', { method: 'POST' });
      if (res.ok) {
        toast.success('Deployment rebuild triggered!', { id: rebuildToast });
      } else {
        toast.error('Rebuild failed to trigger', { id: rebuildToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Deploy trigger error', { id: rebuildToast });
    } finally {
      setLoading(false);
    }
  };

  // Danger actions: Clear drafts
  const handleClearDrafts = async () => {
    if (confirmClearDrafts !== 'CONFIRM') return;
    setLoading(true);
    const draftsToast = toast.loading('Deleting drafts...');
    // We can loop through posts and delete draft posts
    try {
      const postsRes = await fetch('/api/posts?includeDrafts=true');
      if (postsRes.ok) {
        const posts = await postsRes.json();
        const drafts = posts.filter((p: any) => p.draft);
        let count = 0;
        await Promise.all(
          drafts.map(async (d: any) => {
            const delRes = await fetch(`/api/posts/${d.slug}`, { method: 'DELETE' });
            if (delRes.ok) count++;
          })
        );
        toast.success(`Cleared ${count} draft posts`, { id: draftsToast });
        setConfirmClearDrafts('');
      } else {
        toast.error('Failed to retrieve posts', { id: draftsToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error clearing drafts', { id: draftsToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Page Title */}
      <div className="select-none animate-in fade-in slide-in-from-top-4 duration-300">
        <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-none mb-2">
          Settings
        </h1>
        <p className="text-[13px] text-slate-500 font-semibold">
          Configure profile details, CMS integrations, rebuild hooks, and tax configurations
        </p>
      </div>

      {/* Tab Panels Layout */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Vertical Tabs Navigation (220px) */}
        <aside className="w-full md:w-56 shrink-0 space-y-1.5 select-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-[13.5px] font-bold transition-all duration-150 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-violet-50 text-violet-700 border-l-3 border-violet-600 font-bold pl-3 shadow-xs'
                  : 'text-slate-550 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Right content panels (glass cards) */}
        <div className="flex-grow w-full glow-card-3d p-6 min-h-[400px]">
          
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 select-none animate-in fade-in duration-200">
              <h2 className="text-[16px] font-bold text-slate-800 border-b border-slate-150 pb-2">Profile info</h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-full relative overflow-hidden bg-violet-600 border border-slate-200 flex items-center justify-center font-bold text-[28px] text-white shadow-sm">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span>AD</span>
                  )}
                </div>
                
                <div className="space-y-1 text-center sm:text-left leading-tight">
                  <h3 className="text-[17px] font-bold text-slate-800">{session?.user?.name || 'Administrator'}</h3>
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <span className="text-[13px] text-slate-500 font-semibold">navanethskv@gmail.com</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] font-bold uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-450 block pt-1 font-bold uppercase tracking-wider">
                    Authorized OAuth Session
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-2 text-[12.5px] leading-relaxed">
                <p className="text-slate-600 font-semibold">
                  Authentication login credentials have been processed via <span className="text-violet-650 font-bold">{session?.user?.provider ? (session.user.provider.charAt(0).toUpperCase() + session.user.provider.slice(1)) : 'OAuth'}</span>.
                </p>
                <p className="text-slate-450 font-medium text-[11.5px]">
                  This is the single whitelisted administrator dashboard profile. Access is limited strictly to Navaneth.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: BLOG SETTINGS */}
          {activeTab === 'blog' && (
            <form onSubmit={handleSaveBlogSettings} className="space-y-6 animate-in fade-in duration-200">
              <h2 className="text-[16px] font-bold text-slate-800 border-b border-slate-150 pb-2">Blog metadata</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-500">Blog Name</label>
                  <input
                    type="text"
                    required
                    value={blogName}
                    onChange={(e) => setBlogName(e.target.value)}
                    className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-500">Author Name</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-bold text-slate-500">Blog Description</label>
                <textarea
                  value={blogDescription}
                  onChange={(e) => setBlogDescription(e.target.value)}
                  rows={2}
                  className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none resize-none font-sans"
                  placeholder="Tell readers what your blog explores..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-bold text-slate-500">Site URL (must start with https://)</label>
                <input
                  type="text"
                  required
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none font-mono"
                />
              </div>

              <div className="border-t border-slate-150 pt-4 space-y-4">
                <h3 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">Social Accounts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11.5px] font-bold text-slate-500">GitHub Link</label>
                    <input
                      type="text"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11.5px] font-bold text-slate-500">Twitter Link</label>
                    <input
                      type="text"
                      placeholder="https://twitter.com/username"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-705 text-white text-[13px] font-bold cursor-pointer transition-colors shadow-sm shadow-violet-500/10"
                >
                  Save settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GITHUB INTEGRATION */}
          {activeTab === 'github' && (
            <div className="space-y-6 animate-in fade-in duration-200 select-none">
              <h2 className="text-[16px] font-bold text-slate-800 border-b border-slate-150 pb-2">Git settings</h2>
              
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-bold text-slate-500">Repository Connection URL</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-700 font-mono font-bold truncate">
                  {gitStatus?.repoUrl || 'Not Configured'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-500">GitHub Access Token</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13.5px] text-slate-450 font-mono tracking-widest font-bold">
                    ••••••••••••••••••••
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-bold text-slate-500">Connection Status</label>
                  <div className="h-[43px] border border-slate-200 rounded-xl flex items-center px-4 gap-2 bg-slate-50 transition-all">
                    {gitStatus?.connected ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[12.5px] font-bold text-emerald-600">Connected to repository</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[12.5px] font-bold text-red-600">Misconfigured connection</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11.5px] text-slate-450 font-bold">Last connection push: {gitStatus?.lastPush ? new Date(gitStatus.lastPush).toLocaleString() : 'Never'}</span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingGit}
                  className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-350 text-[12.5px] font-bold text-slate-650 cursor-pointer transition-colors"
                >
                  {testingGit ? 'Testing...' : 'Test connection'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: DEPLOYMENT */}
          {activeTab === 'deploy' && (
            <div className="space-y-6 animate-in fade-in duration-200 select-none">
              <h2 className="text-[16px] font-bold text-slate-800 border-b border-slate-150 pb-2">Site deployment</h2>
              
              <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="text-[14px] font-bold text-slate-700">Rebuild production pipeline</h3>
                <p className="text-[12.5px] text-slate-500 leading-relaxed font-semibold">
                  Triggering a rebuild commit pushes updates directly to the connected repository. This will automatically execute Vercel/Netlify deploy webhooks to recompile production static files.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleRebuild}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-all shadow-sm shadow-violet-500/10 cursor-pointer"
                  >
                    Trigger rebuild
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="space-y-6 animate-in fade-in duration-200 select-none">
              <h2 className="text-[16px] font-bold text-red-600 border-b border-red-150 pb-2">Danger zone</h2>
              
              {/* Box 1: Clear drafts */}
              <div className="border border-red-200 rounded-xl p-5 bg-red-50/20 space-y-4">
                <div>
                  <h3 className="text-[14px] font-bold text-red-600">Clear all drafts</h3>
                  <p className="text-[12px] text-slate-500 leading-normal font-semibold mt-1">
                    Delete every draft post permanently from the file system. Published posts will remain untouched.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type CONFIRM to unlock</label>
                    <input
                      type="text"
                      value={confirmClearDrafts}
                      onChange={(e) => setConfirmClearDrafts(e.target.value)}
                      placeholder="CONFIRM"
                      className="admin-input-3d px-3 py-2 text-[12.5px] focus:border-red-500 focus:shadow-red-500/10 outline-none font-mono font-bold"
                    />
                  </div>
                  <button
                    onClick={handleClearDrafts}
                    disabled={confirmClearDrafts !== 'CONFIRM' || loading}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[12.5px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-30 shrink-0 w-full sm:w-auto"
                  >
                    Delete all drafts
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
