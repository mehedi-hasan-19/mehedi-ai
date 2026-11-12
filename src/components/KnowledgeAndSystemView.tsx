import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  FileText,
  Search,
  RefreshCw,
  Check,
  Shield,
  Laptop,
  Send,
} from 'lucide-react';
import {
  ActivityLogRecord,
  FileRecord,
  IntegrationRecord,
  LanguageCode,
  MemoryRecord,
  ThemeMode,
  UserProfileRecord,
  UserSettingsRecord,
} from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface KnowledgeAndSystemViewProps {
  activeSection: 'memory' | 'files' | 'integrations' | 'logs' | 'settings' | 'profile';
  language: LanguageCode;
  theme: ThemeMode;
  memories: MemoryRecord[];
  files: FileRecord[];
  integrations: IntegrationRecord[];
  logs: ActivityLogRecord[];
  userProfile: UserProfileRecord | null;
  userSettings: UserSettingsRecord | null;
  systemHealth: {
    geminiConfigured: boolean;
    defaultModel: string;
    n8nConfigured: boolean;
    firestoreConnected: boolean;
  };
  onSaveMemory: (
    title: string,
    category: MemoryRecord['category'],
    content: string,
    tags: string[],
    existingId?: string
  ) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onUploadFileRecord: (file: {
    name: string;
    folder: string;
    mimeType: string;
    sizeBytes: number;
    textContent: string;
  }) => Promise<void>;
  onUpdateFileRecord: (fileId: string, updates: Partial<FileRecord>) => Promise<void>;
  onDeleteFileRecord: (fileId: string) => Promise<void>;
  onTestIntegration: (providerKey: string, name: string, endpointHint: string) => Promise<void>;
  onUpdateSettings: (updates: Partial<UserSettingsRecord>) => Promise<void>;
  onUpdateProfile: (updates: Partial<UserProfileRecord>) => Promise<void>;
}

export const KnowledgeAndSystemView: React.FC<KnowledgeAndSystemViewProps> = ({
  activeSection,
  language,
  memories,
  files,
  integrations,
  logs,
  userProfile,
  userSettings,
  systemHealth,
  onSaveMemory,
  onDeleteMemory,
  onUploadFileRecord,
  onUpdateFileRecord,
  onDeleteFileRecord,
  onTestIntegration,
  onUpdateSettings,
  onUpdateProfile,
}) => {
  // Memory State
  const [memSearch, setMemSearch] = useState('');
  const [memCategoryFilter, setMemCategoryFilter] = useState<'all' | MemoryRecord['category']>('all');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [memTitle, setMemTitle] = useState('');
  const [memCat, setMemCat] = useState<MemoryRecord['category']>('knowledge');
  const [memContent, setMemContent] = useState('');
  const [memTags, setMemTags] = useState('');
  const [showMemForm, setShowMemForm] = useState(false);

  // File Manager State
  const [fileSearch, setFileSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [uploadFolder, setUploadFolder] = useState('Workspace Docs');
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [fileQuestion, setFileQuestion] = useState('');
  const [analyzingFileId, setAnalyzingFileId] = useState<string | null>(null);
  const [fileQaAnswer, setFileQaAnswer] = useState('');
  const [fileError, setFileError] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Logs State
  const [logSearch, setLogSearch] = useState('');

  // Profile State
  const [profName, setProfName] = useState(userProfile?.displayName || '');
  const [profTitle, setProfTitle] = useState(userProfile?.title || 'AI Systems Architect');
  const [profBio, setProfBio] = useState(userProfile?.bio || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // 1. AI MEMORY MODULE
  if (activeSection === 'memory') {
    const filteredMemories = memories.filter((m) => {
      const matchesCat = memCategoryFilter === 'all' || m.category === memCategoryFilter;
      const matchesQuery =
        !memSearch.trim() ||
        m.title.toLowerCase().includes(memSearch.toLowerCase()) ||
        m.content.toLowerCase().includes(memSearch.toLowerCase());
      return matchesCat && matchesQuery;
    });

    const handleMemoryFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!memTitle.trim() || !memContent.trim()) return;
      const parsedTags = memTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);
      await onSaveMemory(
        memTitle.trim(),
        memCat,
        memContent.trim(),
        parsedTags,
        editingMemoryId || undefined
      );
      setMemTitle('');
      setMemContent('');
      setMemTags('');
      setEditingMemoryId(null);
      setShowMemForm(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'এআই মেমোরি ভল্ট' : 'AI Memory Vault'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              User-controlled persistent memory retrieved automatically by MEHEDI AI during chat and orchestration.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMemoryId(null);
              setMemTitle('');
              setMemContent('');
              setMemTags('');
              setShowMemForm(!showMemForm);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Memory Record</span>
          </button>
        </div>

        {showMemForm && (
          <form
            onSubmit={handleMemoryFormSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              {editingMemoryId ? 'Edit Stored Memory' : 'Store New AI Memory'}
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Memory Title
                </label>
                <input
                  type="text"
                  required
                  value={memTitle}
                  onChange={(e) => setMemTitle(e.target.value)}
                  placeholder="e.g., Preferred Coding Architecture & Naming Conventions"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Memory Category
                </label>
                <select
                  value={memCat}
                  onChange={(e) => setMemCat(e.target.value as MemoryRecord['category'])}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                >
                  <option value="preference">User Preference</option>
                  <option value="project">Project Memory</option>
                  <option value="knowledge">Saved Knowledge</option>
                  <option value="note">Important Note</option>
                  <option value="conversation">Conversation Highlight</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Fact / Context Content
              </label>
              <textarea
                rows={4}
                required
                value={memContent}
                onChange={(e) => setMemContent(e.target.value)}
                placeholder="Write the exact facts, preferences, or project parameters the AI should remember..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Keywords / Tags (comma-separated, max 10)
              </label>
              <input
                type="text"
                value={memTags}
                onChange={(e) => setMemTags(e.target.value)}
                placeholder="typescript, preferred-stack, bilingual"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMemForm(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
              >
                {editingMemoryId ? 'Update Memory' : 'Save Memory'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={memSearch}
              onChange={(e) => setMemSearch(e.target.value)}
              placeholder="Search saved memories..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3.5 pl-9 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-[#111827]">
            {(['all', 'preference', 'project', 'knowledge', 'note', 'conversation'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMemCategoryFilter(cat)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                    memCategoryFilter === cat
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {filteredMemories.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No saved memories found
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Store your preferences, project context, or research notes so MEHEDI AI can reference them across conversations.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                        {mem.title}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="capitalize">{mem.category}</span>
                        {mem.tags && mem.tags.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{mem.tags.join(' / ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMemoryId(mem.id);
                          setMemTitle(mem.title);
                          setMemCat(mem.category);
                          setMemContent(mem.content);
                          setMemTags((mem.tags || []).join(', '));
                          setShowMemForm(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Edit Memory"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMemory(mem.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
                        title="Delete Memory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {mem.content.length > 420 ? `${mem.content.slice(0, 420)}...` : mem.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. FILE MANAGER MODULE
  if (activeSection === 'files') {
    const folders = ['All', 'Workspace Docs', 'Research Reports', 'Datasets & CSV', 'Design Assets'];
    const filteredFiles = files.filter((f) => {
      const matchesFolder = selectedFolder === 'All' || f.folder === selectedFolder;
      const matchesSearch =
        !fileSearch.trim() || f.name.toLowerCase().includes(fileSearch.toLowerCase());
      return matchesFolder && matchesSearch;
    });

    const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileError('');

      if (file.size > 10 * 1024 * 1024) {
        setFileError('File exceeds maximum allowed size of 10 MB.');
        return;
      }

      const allowedExtensions = /\.(pdf|docx|txt|csv|xlsx|png|jpg|jpeg|json|md)$/i;
      if (!allowedExtensions.test(file.name)) {
        setFileError('Unsupported file type. Allowed: PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, JPEG, JSON, MD.');
        return;
      }

      let extractedText = '';
      if (
        file.type.startsWith('text/') ||
        /\.(txt|csv|json|md)$/i.test(file.name)
      ) {
        extractedText = (await file.text()).slice(0, 24000);
      } else {
        extractedText = `Binary/Structured Document Metadata: ${file.name} (${
          file.type || 'application/octet-stream'
        }, ${file.size} bytes). Uploaded to ${uploadFolder}. Ready for AI cataloging and metadata question answering.`;
      }

      await onUploadFileRecord({
        name: file.name.slice(0, 200),
        folder: uploadFolder,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        textContent: extractedText,
      });
      e.target.value = '';
    };

    const handleSummarizeFile = async (fileRec: FileRecord, customQuestion?: string) => {
      setAnalyzingFileId(fileRec.id);
      setFileError('');
      try {
        const res = await fetch('/api/ai/analyze-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: fileRec.name,
            mimeType: fileRec.mimeType,
            textContent: fileRec.textContent,
            question: customQuestion,
            language,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'File analysis failed');
        if (customQuestion) {
          setFileQaAnswer(data.analysis);
        } else {
          await onUpdateFileRecord(fileRec.id, { aiSummary: data.analysis.slice(0, 7500) });
          setSelectedFile({ ...fileRec, aiSummary: data.analysis.slice(0, 7500) });
        }
      } catch (err: unknown) {
        setFileError(err instanceof Error ? err.message : 'Unable to analyze file');
      } finally {
        setAnalyzingFileId(null);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'ফাইল ম্যানেজার ও ডকুমেন্ট ইন্টেলিজেন্স' : 'File Manager & Document Intelligence'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Upload PDF, DOCX, TXT, CSV, XLSX, PNG, JPG files with prompt-injection-guarded AI summarization and Q&A.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
            >
              {folders.slice(1).map((f) => (
                <option key={f} value={f}>
                  Folder: {f}
                </option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload File</span>
              <input type="file" className="hidden" onChange={handleFileUploadChange} />
            </label>
          </div>
        </div>

        {fileError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
            {fileError}
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-[#111827]">
            {folders.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedFolder === folder
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {folder}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Filter files by name..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
            {filteredFiles.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  No files in this folder
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Click "Upload File" to import TXT, CSV, PDF, DOCX, XLSX, or image documents for AI inspection.
                </p>
              </div>
            ) : (
              filteredFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    {renamingFileId === f.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (renameValue.trim()) {
                              await onUpdateFileRecord(f.id, { name: renameValue.trim() });
                            }
                            setRenamingFileId(null);
                          }}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(f);
                          setFileQaAnswer('');
                        }}
                        className="flex items-center gap-2 text-left font-display text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>{f.name}</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{f.folder}</span>
                      <span aria-hidden="true">·</span>
                      <span>{f.mimeType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{(f.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={analyzingFileId === f.id}
                      onClick={() => {
                        setSelectedFile(f);
                        handleSummarizeFile(f);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      {analyzingFileId === f.id ? 'Summarizing...' : 'AI Summarize'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingFileId(f.id);
                        setRenameValue(f.name);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Rename"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFileRecord(f.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-red-500"
                      title="Delete File"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* File Inspector & Q&A Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Document Inspector & File Q&A
            </h3>
            {selectedFile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Folder: {selectedFile.folder} · {(selectedFile.sizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Content Excerpt
                  </p>
                  <pre className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-300">
                    {selectedFile.textContent.slice(0, 1200)}
                  </pre>
                </div>

                {selectedFile.aiSummary && (
                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="mb-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      AI Summary (Document Agent)
                    </p>
                    <MarkdownRenderer content={selectedFile.aiSummary} />
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ask a Question About This File
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fileQuestion}
                      onChange={(e) => setFileQuestion(e.target.value)}
                      placeholder="e.g., What are the key figures or action items?"
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                    />
                    <button
                      type="button"
                      disabled={!fileQuestion.trim() || analyzingFileId === selectedFile.id}
                      onClick={() => handleSummarizeFile(selectedFile, fileQuestion.trim())}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {fileQaAnswer && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#0A0E17]">
                      <MarkdownRenderer content={fileQaAnswer} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any uploaded file on the left to inspect its extracted content, generate an AI summary, or ask grounded questions.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. INTEGRATIONS CENTER MODULE
  if (activeSection === 'integrations') {
    const catalog = [
      {
        providerKey: 'google-gemini',
        name: 'Google Gemini AI Brain',
        connected: systemHealth.geminiConfigured,
        permissions: 'Server-side @google/genai SDK (Text, Reasoning, Function Calling)',
        instructions: 'Configured automatically via server-side GEMINI_API_KEY in AI Studio Secrets.',
        endpointHint: `Model: ${systemHealth.defaultModel}`,
      },
      {
        providerKey: 'firebase-cloud',
        name: 'Firebase Auth & Cloud Firestore',
        connected: systemHealth.firestoreConnected,
        permissions: 'Zero-Trust ABAC Security Rules + Verified Identity Isolation',
        instructions: 'Provisioned and linked via firebase-applet-config.json.',
        endpointHint: 'Firestore Enterprise Database',
      },
      {
        providerKey: 'google-search',
        name: 'Google Search Live Grounding',
        connected: systemHealth.geminiConfigured,
        permissions: 'Real-time web search citations for Research Agent',
        instructions: 'Active through Gemini server-side googleSearch tool.',
        endpointHint: 'tools: [{ googleSearch: {} }]',
      },
      {
        providerKey: 'n8n-automation',
        name: 'n8n Workflow Automation Server',
        connected:
          systemHealth.n8nConfigured ||
          integrations.some((i) => i.providerKey === 'n8n-automation' && i.status === 'connected'),
        permissions: 'Server-proxied webhook triggers (requires Approval Center for external side effects)',
        instructions: 'Set N8N_WEBHOOK_URL in server environment or configure per-workflow webhook URLs.',
        endpointHint: systemHealth.n8nConfigured ? 'Server N8N_WEBHOOK_URL active' : 'Awaiting webhook URL',
      },
      {
        providerKey: 'google-workspace',
        name: 'Gmail, Google Drive & Google Calendar',
        connected: integrations.some(
          (i) => i.providerKey === 'google-workspace' && i.status === 'connected'
        ),
        permissions: 'Approval-gated email dispatch, document indexing, and schedule sync',
        instructions: 'All outbound emails or calendar mutations route through the Approval Center before execution.',
        endpointHint: 'OAuth 2.0 / Approval Center Gate',
      },
    ];

    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'ইন্টিগ্রেশনস ও কানেকশন কেন্দ্র' : 'Integrations & Service Connections'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real-time verified connection telemetry. Only services with verified live credentials show as Connected.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {catalog.map((item) => (
            <div
              key={item.providerKey}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </h3>
                  <span
                    className={`text-xs font-medium ${
                      item.connected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.connected ? 'Verified Connected' : 'Configuration Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{item.instructions}</p>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <p>
                    <strong>Permissions:</strong> {item.permissions}
                  </p>
                  <p className="font-mono mt-0.5">{item.endpointHint}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    onTestIntegration(item.providerKey, item.name, item.endpointHint)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Test & Verify Connection</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. ACTIVITY LOGS MODULE
  if (activeSection === 'logs') {
    const filteredLogs = logs.filter(
      (l) =>
        !logSearch.trim() ||
        l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.category.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.agentId.toLowerCase().includes(logSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'অ্যাক্টিভিটি ও সিকিউরিটি অডিট লগ' : 'Activity & Security Audit Logs'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Append-only, tamper-protected Firestore audit trail of agent operations, tasks, and approval decisions.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Action Event</th>
                <th className="px-4 py-3 font-medium">Agent / Module</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono capitalize text-slate-600 dark:text-slate-400">
                      {log.category}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {log.agentId}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span
                        className={
                          log.status === 'error'
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : log.status === 'warning'
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-emerald-600 dark:text-emerald-400 font-medium'
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. SETTINGS & ARCHITECTURE GUIDE MODULE
  if (activeSection === 'settings') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'সিস্টেম সেটিংস ও কনফিগারেশন গাইড' : 'OS Settings & Architecture Guide'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Configure bilingual interface language, theme, AI model, semi-autonomous safeguards, and desktop packaging.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Operating System Preferences
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Interface & AI Response Language (English / বাংলা)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors ${
                    userSettings?.language !== 'bn'
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  English (en-US)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ language: 'bn' })}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors ${
                    userSettings?.language === 'bn'
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  বাংলা (Bengali)
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Visual Theme Surface
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors ${
                    userSettings?.theme !== 'light'
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  Executive Dark OS (Default)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors ${
                    userSettings?.theme === 'light'
                      ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  Daylight Precision
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Primary Gemini Model
              </label>
              <select
                value={userSettings?.defaultModel || 'gemini-3.8-flash'}
                onChange={(e) => onUpdateSettings({ defaultModel: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Fast Multi-Agent Orchestration)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-Low Latency)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Balanced Latest Flash)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Semi-Autonomous Permission Policy
              </label>
              <select
                value={userSettings?.semiAutonomousLevel || 'strict'}
                onChange={(e) =>
                  onUpdateSettings({
                    semiAutonomousLevel: e.target.value as 'strict' | 'balanced' | 'proactive',
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
              >
                <option value="strict">Strict Gate — Require approval for all external side effects</option>
                <option value="balanced">Balanced — Autonomous internal synthesis, gated outbound actions</option>
                <option value="proactive">Proactive — Autonomous task planning + gated outbound execution</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-blue-500" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Setup & Windows Electron Packaging Guide
              </h2>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                <strong className="text-slate-900 dark:text-white">1. Firebase Services Active:</strong>{' '}
                Firebase Authentication (Google Sign-In) and Cloud Firestore are provisioned via{' '}
                <code className="font-mono">firebase-applet-config.json</code> and protected by Zero-Trust ABAC rules in{' '}
                <code className="font-mono">firestore.rules</code>.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">2. Server-Side Gemini Brain:</strong>{' '}
                All AI calls run exclusively on the Node.js Express backend (<code className="font-mono">server.ts</code>) using{' '}
                <code className="font-mono">process.env.GEMINI_API_KEY</code>. Your API key is never exposed to browser bundles.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">3. Windows Desktop Packaging (Electron):</strong>{' '}
                Secure main and preload scripts are ready in <code className="font-mono">/desktop/main/main.ts</code> and{' '}
                <code className="font-mono">/desktop/preload/preload.ts</code> with{' '}
                <code className="font-mono">contextIsolation: true</code> and{' '}
                <code className="font-mono">nodeIntegration: false</code>. Run{' '}
                <code className="font-mono">npx electron-builder --win</code> locally to build the Windows NSIS installer.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. USER PROFILE MODULE
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {language === 'bn' ? 'ইউজার প্রোফাইল ও সিকিউরিটি আইডেন্টিটি' : 'User Profile & Identity Security'}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your personal profile is strictly isolated in Firestore (<code className="font-mono">/users/{userProfile?.ownerId}</code>).
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onUpdateProfile({
            displayName: profName.trim() || 'MEHEDI Operator',
            title: profTitle.trim(),
            bio: profBio.trim(),
          });
          setProfileSaved(true);
          setTimeout(() => setProfileSaved(false), 2000);
        }}
        className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
              {userProfile?.displayName || 'Operator'}
            </p>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {userProfile?.email} · UID: {userProfile?.ownerId}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Shield className="h-4 w-4" />
            <span>PII Isolated</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Display Name
            </label>
            <input
              type="text"
              required
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Role / Title
            </label>
            <input
              type="text"
              value={profTitle}
              onChange={(e) => setProfTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Executive Bio & Operating Context
          </label>
          <textarea
            rows={3}
            value={profBio}
            onChange={(e) => setProfBio(e.target.value)}
            placeholder="Brief description of your projects, priorities, and operating preferences..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {profileSaved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>Profile updated</span>
            </span>
          )}
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
          >
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
};
