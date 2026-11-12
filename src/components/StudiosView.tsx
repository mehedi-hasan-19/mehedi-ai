import React, { useState } from 'react';
import {
  Search,
  Code2,
  Palette,
  BookmarkPlus,
  Copy,
  Check,
  Play,
  ListPlus,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StudiosViewProps {
  activeStudio: 'research' | 'developer' | 'design';
  language: LanguageCode;
  onSaveToMemory: (title: string, category: 'knowledge' | 'project' | 'note', content: string, tags: string[]) => Promise<void>;
  onCreateTaskFromStudio: (title: string, description: string, agentId: 'research' | 'developer' | 'designer') => Promise<void>;
  onLogActivity: (category: 'agent', action: string, agentId: string, status: 'success' | 'error', details: string) => Promise<void>;
}

export const StudiosView: React.FC<StudiosViewProps> = ({
  activeStudio,
  language,
  onSaveToMemory,
  onCreateTaskFromStudio,
  onLogActivity,
}) => {
  // Research Workspace State
  const [researchTopic, setResearchTopic] = useState('');
  const [researchDepth, setResearchDepth] = useState<'concise' | 'comprehensive' | 'comparative'>('comprehensive');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchReport, setResearchReport] = useState('');
  const [researchSources, setResearchSources] = useState<Array<{ uri: string; title: string }>>([]);
  const [researchError, setResearchError] = useState('');

  // Developer Workspace State
  const [devMode, setDevMode] = useState<'generate' | 'debug' | 'review' | 'architecture'>('generate');
  const [devStack, setDevStack] = useState('TypeScript + React + Node.js');
  const [devPrompt, setDevPrompt] = useState('');
  const [devSnippet, setDevSnippet] = useState('');
  const [devLoading, setDevLoading] = useState(false);
  const [devOutput, setDevOutput] = useState('');
  const [devError, setDevError] = useState('');

  // Design Workspace State
  const [designTitle, setDesignTitle] = useState('');
  const [designStyle, setDesignStyle] = useState('Executive Dark AI Operating System');
  const [designBrief, setDesignBrief] = useState('');
  const [designLoading, setDesignLoading] = useState(false);
  const [designPackage, setDesignPackage] = useState<{
    conceptSummary: string;
    typography: { displayFont: string; bodyFont: string; monoFont: string; rationale: string };
    colorPalette: Array<{ role: string; hex: string; usageNote: string }>;
    layoutArchitecture: string;
    imagePrompts: string[];
  } | null>(null);
  const [designError, setDesignError] = useState('');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState('');

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 2500);
  };

  // Run Research Agent
  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchTopic.trim()) return;
    setResearchLoading(true);
    setResearchError('');
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: researchTopic.trim(),
          depth: researchDepth,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research request failed');
      setResearchReport(data.report || '');
      setResearchSources(data.sources || []);
      await onLogActivity(
        'agent',
        `Research Agent completed report: ${researchTopic.slice(0, 60)}`,
        'research',
        'success',
        `Sources grounded: ${(data.sources || []).length}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Research failed';
      setResearchError(msg);
      await onLogActivity('agent', 'Research Agent execution error', 'research', 'error', msg);
    } finally {
      setResearchLoading(false);
    }
  };

  // Run Developer Agent
  const handleRunDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devPrompt.trim()) return;
    setDevLoading(true);
    setDevError('');
    try {
      const res = await fetch('/api/ai/developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: devMode,
          languageStack: devStack,
          prompt: devPrompt.trim(),
          codeSnippet: devSnippet.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Developer request failed');
      setDevOutput(data.output || '');
      await onLogActivity(
        'agent',
        `Developer Agent (${devMode}): ${devPrompt.slice(0, 60)}`,
        'developer',
        'success',
        `Stack: ${devStack}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Developer execution failed';
      setDevError(msg);
    } finally {
      setDevLoading(false);
    }
  };

  // Run Designer Agent
  const handleRunDesigner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designBrief.trim()) return;
    setDesignLoading(true);
    setDesignError('');
    try {
      const res = await fetch('/api/ai/designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: designTitle.trim() || 'Untitled Design System',
          styleDirection: designStyle,
          brief: designBrief.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Designer request failed');
      setDesignPackage(data.designPackage);
      await onLogActivity(
        'agent',
        `Designer Agent generated system: ${designTitle || 'Brand Spec'}`,
        'designer',
        'success',
        `Style: ${designStyle}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Designer execution failed';
      setDesignError(msg);
    } finally {
      setDesignLoading(false);
    }
  };

  if (activeStudio === 'research') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'রিসার্চ ওয়ার্কস্পেস' : 'Research Workspace'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Powered by Research Agent with live Google Search grounding and structured synthesis.
            </p>
          </div>
          {savedNotice && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {savedNotice}
            </span>
          )}
        </div>

        <form
          onSubmit={handleRunResearch}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Research Topic, Product Comparison, or Market Question
              </label>
              <input
                type="text"
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                placeholder="e.g., Compare top enterprise vector databases in 2026 for low-latency RAG"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Investigation Depth
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-[#0A0E17]">
                {(['concise', 'comprehensive', 'comparative'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setResearchDepth(d)}
                    className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                      researchDepth === d
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Quick Topics:</span>
              {[
                'Best AI Design & Prototyping Tools 2026',
                'Next-Gen Autonomous Coding Architectures',
                'Global FinTech SaaS Compliance Standards',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setResearchTopic(preset)}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {preset}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={researchLoading || !researchTopic.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{researchLoading ? 'Investigating & Grounding...' : 'Run Research Agent'}</span>
            </button>
          </div>
        </form>

        {researchError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
            {researchError}
          </div>
        )}

        {researchReport ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {researchTopic}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Research Agent</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{researchDepth} mode</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{researchSources.length} web citations</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onSaveToMemory(
                      `Research: ${researchTopic.slice(0, 80)}`,
                      'knowledge',
                      researchReport,
                      ['research', researchDepth]
                    );
                    flashNotice('Saved to AI Memory');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  <span>Save to Memory</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onCreateTaskFromStudio(
                      `Follow-up on: ${researchTopic.slice(0, 80)}`,
                      researchReport.slice(0, 2500),
                      'research'
                    );
                    flashNotice('Created Task in Task Manager');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  <span>Convert to Task</span>
                </button>
              </div>
            </div>
            <MarkdownRenderer content={researchReport} sources={researchSources} />
          </div>
        ) : (
          !researchLoading && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                No active research report in view
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Enter any market, technical, or product topic above to synthesize a grounded report with web citations.
              </p>
            </div>
          )
        )}
      </div>
    );
  }

  if (activeStudio === 'developer') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'ডেভেলপার ওয়ার্কস্পেস' : 'Developer Workspace'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Full-stack code synthesis, root-cause debugging, security auditing, and system architecture.
            </p>
          </div>
          {savedNotice && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {savedNotice}
            </span>
          )}
        </div>

        <form
          onSubmit={handleRunDeveloper}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Engineering Operation Mode
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-[#0A0E17]">
                {(['generate', 'debug', 'review', 'architecture'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDevMode(m)}
                    className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                      devMode === m
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Target Language & Stack
              </label>
              <select
                value={devStack}
                onChange={(e) => setDevStack(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
              >
                <option value="TypeScript + React + Node.js">TypeScript + React + Node.js</option>
                <option value="Python + FastAPI">Python + FastAPI</option>
                <option value="Firebase Firestore Security Rules">Firebase Firestore Security Rules</option>
                <option value="Electron + TypeScript Desktop">Electron + TypeScript Desktop</option>
                <option value="PostgreSQL / SQL Schema">PostgreSQL / SQL Schema</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Engineering Specification or Problem Statement
            </label>
            <input
              type="text"
              value={devPrompt}
              onChange={(e) => setDevPrompt(e.target.value)}
              placeholder="e.g., Create an exponential backoff retry wrapper in TypeScript with jitter and cancellation support"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Optional Existing Code Snippet (for Debugging / Code Review)
            </label>
            <textarea
              rows={4}
              value={devSnippet}
              onChange={(e) => setDevSnippet(e.target.value)}
              placeholder="Paste code to inspect, refactor, or audit..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={devLoading || !devPrompt.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>{devLoading ? 'Synthesizing Code...' : 'Execute Developer Agent'}</span>
            </button>
          </div>
        </form>

        {devError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
            {devError}
          </div>
        )}

        {devOutput && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Developer Agent Deliverable
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="capitalize">{devMode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{devStack}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onSaveToMemory(
                    `Code: ${devPrompt.slice(0, 70)}`,
                    'project',
                    devOutput,
                    ['developer', devMode]
                  );
                  flashNotice('Saved snippet to AI Memory');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Save to Memory</span>
              </button>
            </div>
            <MarkdownRenderer content={devOutput} />
          </div>
        )}
      </div>
    );
  }

  // Design Workspace
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'ডিজাইন ওয়ার্কস্পেস' : 'Design Workspace'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Generate curated color systems, typographic pairings, layout architectures, and visual prompts.
          </p>
        </div>
        {savedNotice && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {savedNotice}
          </span>
        )}
      </div>

      <form
        onSubmit={handleRunDesigner}
        className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Brand or Interface Project Name
            </label>
            <input
              type="text"
              value={designTitle}
              onChange={(e) => setDesignTitle(e.target.value)}
              placeholder="e.g., Aether Quantum Analytics Platform"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Aesthetic Direction
            </label>
            <select
              value={designStyle}
              onChange={(e) => setDesignStyle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
            >
              <option value="Executive Dark AI Operating System">Executive Dark AI Operating System</option>
              <option value="Swiss Precision Editorial Grid">Swiss Precision Editorial Grid</option>
              <option value="Minimalist Architectural Luxury">Minimalist Architectural Luxury</option>
              <option value="High-Density Financial Terminal">High-Density Financial Terminal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Creative Brief & Target Audience
          </label>
          <textarea
            rows={3}
            value={designBrief}
            onChange={(e) => setDesignBrief(e.target.value)}
            placeholder="Describe the product goals, target users, mood, and key interface views..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={designLoading || !designBrief.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <Palette className="h-3.5 w-3.5" />
            <span>{designLoading ? 'Generating Design System...' : 'Generate Design System'}</span>
          </button>
        </div>
      </form>

      {designError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          {designError}
        </div>
      )}

      {designPackage && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {designTitle || 'Generated Design System'}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {designPackage.conceptSummary}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onSaveToMemory(
                    `Design System: ${designTitle || 'Brand Brief'}`,
                    'project',
                    JSON.stringify(designPackage, null, 2),
                    ['design', 'palette']
                  );
                  flashNotice('Design System saved to AI Memory');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Save System to Memory</span>
              </button>
            </div>

            {/* Color System */}
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-slate-900 dark:text-white">
                60-30-10 Curated Color Tokens
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {designPackage.colorPalette.map((swatch, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div
                      className="h-14 w-full rounded-md border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {swatch.hex}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(swatch.hex);
                          setCopiedHex(swatch.hex);
                          setTimeout(() => setCopiedHex(null), 1500);
                        }}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Copy HEX"
                      >
                        {copiedHex === swatch.hex ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {swatch.role}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {swatch.usageNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography & Layout */}
            <div className="grid gap-6 border-t border-slate-200 pt-5 dark:border-slate-800 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Typographic Hierarchy (2+1 Rule)
                </h3>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <strong className="text-slate-900 dark:text-white">Display Face:</strong>{' '}
                    {designPackage.typography.displayFont}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Body Face:</strong>{' '}
                    {designPackage.typography.bodyFont}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Monospace / Telemetry:</strong>{' '}
                    {designPackage.typography.monoFont}
                  </p>
                  <p className="pt-1 text-slate-500 dark:text-slate-400">
                    {designPackage.typography.rationale}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Spatial & Layout Architecture
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {designPackage.layoutArchitecture}
                </p>
              </div>
            </div>

            {/* Visual Prompts */}
            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <h3 className="mb-2.5 font-display text-sm font-semibold text-slate-900 dark:text-white">
                High-Fidelity Visual Asset Prompts
              </h3>
              <div className="space-y-2">
                {designPackage.imagePrompts.map((promptStr, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-300"
                  >
                    <span>{promptStr}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(promptStr)}
                      className="text-blue-600 hover:underline dark:text-blue-400 whitespace-nowrap shrink-0"
                    >
                      Copy Prompt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
