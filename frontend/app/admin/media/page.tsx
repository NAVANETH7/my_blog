"use client";

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  MediaIcon,
  PlusIcon,
  TrashIcon,
  WorldIcon,
} from '@/components/admin/Icons';

interface MediaFile {
  name: string;
  size: number;
  date: string;
}

interface UploadTask {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [stats, setStats] = useState({
    totalSizeBytes: 0,
    formattedTotalSize: '0 MB',
    limitBytes: 50 * 1024 * 1024,
  });
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isUploadZoneOpen, setIsUploadZoneOpen] = useState(true);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media files list and statistics
  const loadMediaStats = async () => {
    try {
      const res = await fetch('/api/media/stats');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setStats({
          totalSizeBytes: data.totalSizeBytes || 0,
          formattedTotalSize: data.formattedTotalSize || '0 MB',
          limitBytes: data.limitBytes || 50 * 1024 * 1024,
        });
      }
    } catch (err) {
      console.error('Error fetching media stats:', err);
    }
  };

  useEffect(() => {
    loadMediaStats();
  }, []);

  // XHR Upload implementation with progress triggers
  const uploadFileXHR = (file: File) => {
    const taskId = `${file.name}-${Date.now()}`;
    const newTask: UploadTask = {
      id: taskId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    };

    setUploadTasks(prev => [newTask, ...prev]);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', '/api/upload', true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, progress: percent } : t))
        );
      }
    };

    // Handle completed state
    xhr.onload = () => {
      if (xhr.status === 200) {
        setUploadTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t))
        );
        toast.success(`Uploaded ${file.name}`);
        loadMediaStats();
        // Clear task after delay
        setTimeout(() => {
          setUploadTasks(prev => prev.filter(t => t.id !== taskId));
        }, 3000);
      } else {
        setUploadTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, status: 'failed' } : t))
        );
        toast.error(`Failed uploading ${file.name}`);
      }
    };

    xhr.onerror = () => {
      setUploadTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: 'failed' } : t))
      );
      toast.error(`Connection error during upload of ${file.name}`);
    };

    xhr.send(formData);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadFileXHR(file);
      } else {
        toast.error(`${file.name} is not a valid image format.`);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => {
      uploadFileXHR(file);
    });
  };

  // Copy Markdown URL Helper
  const handleCopyMarkdown = (filename: string) => {
    const markdownText = `![${filename}](/images/posts/${filename})`;
    navigator.clipboard.writeText(markdownText);
    toast.success('Markdown link copied!');
  };

  // Delete media file
  const handleDeleteMedia = async (filename: string) => {
    try {
      const res = await fetch(`/api/media/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Media asset deleted');
        setFiles(prev => prev.filter(f => f.name !== filename));
        loadMediaStats();
        setDeleteConfirmFile(null);
      } else {
        toast.error('Failed to delete media asset');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during deletion');
    }
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate storage usage percent
  const storagePercentage = Math.min((stats.totalSizeBytes / stats.limitBytes) * 100, 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* 1. Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-[28px] font-semibold text-slate-800 tracking-tight leading-none mb-2">
            Media library
          </h1>
          <p className="text-[13px] text-slate-500 font-medium">
            Manage your blog's upload assets and cover images
          </p>
        </div>
        <button
          onClick={() => setIsUploadZoneOpen(!isUploadZoneOpen)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold transition-colors cursor-pointer shadow-sm shadow-violet-500/15"
        >
          <PlusIcon size={14} />
          <span>Upload</span>
        </button>
      </div>

      {/* 2. Collapsible Upload Drop Zone */}
      {isUploadZoneOpen && (
        <div className="space-y-4 select-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-2xl flex flex-col items-center justify-center p-12 transition-all duration-200 cursor-pointer ${
              isDragOver
                ? 'border-violet-500 bg-violet-50/40 shadow-[0_0_20px_rgba(124,58,237,0.06)]'
                : 'border-slate-200 hover:border-violet-500/40 hover:bg-violet-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <span className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 mb-4">
              <MediaIcon size={24} />
            </span>
            <h3 className="text-[14.5px] font-semibold text-slate-700 mb-1">
              Drag & drop images here
            </h3>
            <p className="text-[12.5px] text-slate-500 max-w-[285px] text-center font-semibold">
              Accepts JPG, PNG, WEBP, GIF up to 5MB. Or click here to browse files.
            </p>
          </div>

          {/* Active upload tasks progress logs */}
          {uploadTasks.length > 0 && (
            <div className="p-4 bg-white/60 border border-slate-200/50 backdrop-blur-md shadow-xs rounded-2xl space-y-3">
              <span className="text-[10px] font-bold text-slate-450 tracking-wider uppercase">Active Uploads</span>
              <div className="space-y-2">
                {uploadTasks.map(task => (
                  <div key={task.id} className="flex flex-col gap-1.5 text-[12.5px]">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-650 truncate max-w-[220px]">{task.fileName}</span>
                      <span className="font-bold text-violet-650">{task.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className="h-full bg-violet-500 transition-all duration-100 ease-out"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Storage Usage Gauge Bar */}
      <div className="p-5 bg-white/40 border border-slate-200/50 backdrop-blur-md glow-card-3d shadow-xs rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="space-y-1.5">
          <span className="text-[10.5px] font-bold text-slate-450 tracking-wider uppercase block">Storage Usage</span>
          <div className="flex items-baseline gap-1 text-[13px] font-semibold">
            <span className="text-slate-800 font-bold">{stats.formattedTotalSize}</span>
            <span className="text-slate-500">used of</span>
            <span className="text-slate-600">50 MB</span>
          </div>
        </div>
        
        {/* Progress gauge */}
        <div className="flex-1 max-w-lg w-full h-2.5 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              storagePercentage > 85 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.25)]'
            }`}
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
      </div>

      {/* 4. Media Files Grid */}
      {files.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-slate-200 bg-white/40 shadow-xs rounded-2xl select-none">
          <MediaIcon size={48} className="text-slate-400 mx-auto mb-3" />
          <h3 className="text-[16px] font-semibold text-slate-500 mb-1">Media library empty</h3>
          <p className="text-[12.5px] text-slate-600">Upload cover photos and graphics to embed inside blog pages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map(file => {
            const fileUrl = `/images/posts/${file.name}`;
            const isConfirmingDelete = deleteConfirmFile === file.name;

            return (
              <div
                key={file.name}
                className="group relative bg-white/40 border border-slate-200/60 rounded-2xl overflow-hidden aspect-video flex flex-col justify-between hover:border-slate-350 hover:shadow-md backdrop-blur-md glow-card-3d transition-all duration-200"
              >
                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt={file.name}
                  className="object-cover w-full h-full absolute inset-0 select-none pointer-events-none"
                />

                {/* Hover Details Overlay */}
                <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-3.5 transition-all duration-150 select-none">
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold text-slate-800 block truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      {formatBytes(file.size)}
                    </span>
                  </div>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] text-red-650 font-bold">Delete?</span>
                      <button
                        onClick={() => handleDeleteMedia(file.name)}
                        className="px-2 py-0.5 rounded bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-[10.5px] font-bold cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmFile(null)}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10.5px] font-bold cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyMarkdown(file.name)}
                        className="flex-1 py-1.2 rounded-lg bg-slate-50 border border-slate-250 text-slate-600 hover:text-violet-650 hover:border-violet-300 hover:bg-violet-50 text-[10.5px] font-bold transition-all cursor-pointer"
                      >
                        Copy MD
                      </button>
                      <button
                        onClick={() => setDeleteConfirmFile(file.name)}
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-650 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
