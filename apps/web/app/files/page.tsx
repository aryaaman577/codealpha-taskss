'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/dashboard/AppLayout';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/axios';
import {
  Folder,
  FileText,
  FileCode,
  Image,
  Video,
  Download,
  Trash2,
  Upload,
  Plus,
  File
} from 'lucide-react';
import { toast } from 'sonner';

interface FileRecord {
  _id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedBy: {
    _id: string;
    displayName: string;
  };
  createdAt: string;
}

export default function FilesPage() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadName, setUploadName] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadSize, setUploadSize] = useState(1.5); // MB
  const [uploadMime, setUploadMime] = useState('application/pdf');

  const isValidUrl = (urlStr: string) => {
    if (!urlStr) return false;
    if (urlStr.startsWith('https://syncspace.local')) return false;
    try {
      const url = new URL(urlStr);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data.data.files || []);
    } catch {
      toast.error('Failed to load shared files vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleCreateMockFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) {
      toast.error('File name is required');
      return;
    }

    const payload = {
      name: uploadName.trim(),
      size: Math.round(uploadSize * 1024 * 1024), // Convert to bytes
      mimeType: uploadMime,
      url: uploadUrl.trim() || undefined,
    };

    try {
      await api.post('/files', payload);
      toast.success('File added to vault');
      setUploadName('');
      setUploadUrl('');
      fetchFiles();
    } catch {
      toast.error('Failed to add file to vault');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/files/${id}`);
      toast.success('File deleted successfully');
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <Image className="text-accent-cyan" size={20} />;
    if (mime.startsWith('video/')) return <Video className="text-accent-purple" size={20} />;
    if (mime.includes('javascript') || mime.includes('typescript') || mime.includes('json') || mime.includes('html')) {
      return <FileCode className="text-accent-primary" size={20} />;
    }
    return <FileText className="text-text-secondary" size={20} />;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left Panel: Upload Mock File */}
          <div className="rounded-[28px] border border-border-default bg-bg-surface/70 p-6 shadow-card backdrop-blur-sm h-fit">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-6">
              <Upload size={18} className="text-accent-primary" /> Upload file record
            </h3>
            <form onSubmit={handleCreateMockFile} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">File Name</span>
                <input
                  type="text"
                  placeholder="e.g. project_draft.pdf"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">File URL / Link (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. https://example.com/file.pdf"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Size (MB)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={uploadSize}
                    onChange={(e) => setUploadSize(parseFloat(e.target.value))}
                    className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</span>
                  <select
                    value={uploadMime}
                    onChange={(e) => setUploadMime(e.target.value)}
                    className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                  >
                    <option value="application/pdf">PDF Document</option>
                    <option value="image/png">PNG Image</option>
                    <option value="image/jpeg">JPEG Image</option>
                    <option value="application/zip">ZIP Archive</option>
                    <option value="text/javascript">Javascript Code</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-accent-primary hover:bg-accent-hover px-4 py-3.5 text-xs font-semibold text-white transition shadow-glow-sm flex items-center justify-center gap-2 mt-4"
              >
                <Plus size={14} /> Add to Vault
              </button>
            </form>
          </div>

          {/* Right Panel: Vault File List */}
          <div className="lg:col-span-2 rounded-[28px] border border-border-default bg-bg-surface/70 p-6 shadow-card backdrop-blur-sm">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-6">
              <Folder size={18} className="text-accent-cyan" /> Secure Vault Files
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {loading ? (
                <div className="py-12 text-center text-sm text-text-secondary">Loading vault files...</div>
              ) : files.length === 0 ? (
                <div className="py-24 text-center text-sm text-text-secondary border-2 border-dashed border-border-subtle rounded-2xl">
                  No files uploaded yet. Add some records in the upload panel!
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-bg-base/40 border border-border-subtle hover:border-border-default transition duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-bg-elevated/85 rounded-xl border border-border-subtle">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-text-primary max-w-[200px] sm:max-w-xs truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          {formatSize(file.size)} • By {file.uploadedBy?.displayName || 'Unknown'}
                          {file.createdAt && ` • ${new Date(file.createdAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {isValidUrl(file.url) ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl border border-border-default hover:bg-bg-elevated/50 text-text-secondary hover:text-white transition"
                          title="Download/Open file"
                        >
                          <Download size={14} />
                        </a>
                      ) : (
                        <button
                          disabled
                          className="p-2.5 rounded-xl border border-border-default/40 text-text-muted/40 cursor-not-allowed opacity-50"
                          title="No valid download link provided"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      {file.uploadedBy?._id === user?._id && (
                        <button
                          onClick={() => handleDelete(file._id)}
                          className="p-2.5 rounded-xl border border-semantic-error/30 hover:bg-semantic-error/15 text-semantic-error transition"
                          title="Delete file record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
