import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileText,
  GitCommit,
  GitFork,
  Heart,
  Lightbulb,
  Network,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResult, AnalysisRequest } from "./features/analysis/types";
import {
  buildDocxBlob,
  buildLatexDocument,
  buildMarkdownDocument,
  downloadBlob,
  downloadText
} from "./features/export/exporters";
import type { CitationStyle } from "./features/export/citations";
import { extractPapers } from "./features/library/extract";
import type { PaperExtractionProgress, ResearchPaper } from "./features/library/types";
import { searchPapers } from "./features/search/searchIndex";
import {
  clearLatestProject,
  loadLatestProject,
  saveLatestProject
} from "./features/storage/projectStore";
import { buildInfo, commitUrl } from "./shared/buildInfo";
import { formatCount, formatDuration } from "./shared/format";

type Toast = { tone: "success" | "error" | "info"; message: string };

export function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult>();
  const [query, setQuery] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState<string>();
  const [citationStyle, setCitationStyle] = useState<CitationStyle>("apa");
  const [useDeepEmbeddings, setUseDeepEmbeddings] = useState(false);
  const [progress, setProgress] = useState<PaperExtractionProgress>();
  const [isExtracting, setIsExtracting] = useState(false);
  const [toast, setToast] = useState<Toast>();

  const readyPapers = papers.filter((paper) => paper.status === "ready");
  const failedPapers = papers.filter((paper) => paper.status === "failed");
  const selectedPaper = papers.find((paper) => paper.id === selectedPaperId) ?? readyPapers[0];
  const searchResults = useMemo(() => searchPapers(readyPapers, query), [readyPapers, query]);
  const totalWords = readyPapers.reduce((sum, paper) => sum + paper.wordCount, 0);

  const analysisMutation = useMutation({
    mutationFn: (request: AnalysisRequest) => runAnalysisWorker(request),
    onSuccess(result) {
      setAnalysis(result);
      setToast({
        tone: "success",
        message: `Research map built in ${formatDuration(result.durationMs)}.`
      });
    },
    onError(error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Analysis failed."
      });
    }
  });

  useEffect(() => {
    let mounted = true;
    loadLatestProject()
      .then((project) => {
        if (!mounted || !project) return;
        setPapers(project.papers);
        setAnalysis(project.analysis);
        setToast({ tone: "info", message: "Restored the last local project from this browser." });
      })
      .catch(() =>
        setToast({ tone: "error", message: "Could not load the saved browser project." })
      );
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!papers.length) return;
    const timeout = window.setTimeout(() => {
      saveLatestProject({ papers, analysis }).catch(() =>
        setToast({ tone: "error", message: "Could not save this project in browser storage." })
      );
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [papers, analysis]);

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, 50);
    if (!files.length) return;

    setIsExtracting(true);
    setProgress(undefined);
    setToast({ tone: "info", message: `Reading ${formatCount(files.length, "file")} locally.` });

    const extracted = await extractPapers(files, setProgress);
    const nextPapers = [...papers, ...extracted];
    setPapers(nextPapers);
    setSelectedPaperId(extracted.find((paper) => paper.status === "ready")?.id ?? selectedPaperId);
    setIsExtracting(false);

    const ready = nextPapers.filter((paper) => paper.status === "ready");
    if (ready.length) {
      analysisMutation.mutate({ papers: ready, options: { useDeepEmbeddings } });
    }
  }

  function rerunAnalysis() {
    if (!readyPapers.length) return;
    analysisMutation.mutate({ papers: readyPapers, options: { useDeepEmbeddings } });
  }

  async function resetProject() {
    setPapers([]);
    setAnalysis(undefined);
    setSelectedPaperId(undefined);
    setQuery("");
    await clearLatestProject();
    setToast({ tone: "success", message: "Cleared the local project from this browser." });
  }

  async function exportDocx() {
    if (!analysis) return;
    const blob = await buildDocxBlob({ papers: readyPapers, analysis, style: citationStyle });
    downloadBlob("research-flow-draft.docx", blob);
  }

  function exportLatex() {
    if (!analysis) return;
    downloadText(
      "research-flow-draft.tex",
      buildLatexDocument({ papers: readyPapers, analysis, style: citationStyle }),
      "application/x-tex;charset=utf-8"
    );
  }

  function exportMarkdown() {
    if (!analysis) return;
    downloadText(
      "research-flow-draft.md",
      buildMarkdownDocument({ papers: readyPapers, analysis, style: citationStyle }),
      "text/markdown;charset=utf-8"
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-teal-700 text-white">
                <Network size={22} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">Research Flow</h1>
                <p className="text-sm text-slate-600">
                  Local paper map, contradictions, gaps, outline, citations, Word and LaTeX.
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Project links">
            <a
              className="button secondary"
              href={buildInfo.repositoryUrl}
              target="_blank"
              rel="noreferrer"
            >
              <GitFork size={18} aria-hidden="true" />
              Star on GitHub
              <ExternalLink size={14} aria-hidden="true" />
            </a>
            <a
              className="button support"
              href={buildInfo.paypalUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Heart size={18} aria-hidden="true" />
              Support
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="space-y-4">
          <DropZone
            disabled={isExtracting}
            onPick={() => inputRef.current?.click()}
            onFiles={handleFiles}
          />
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
            onChange={(event) => event.target.files && void handleFiles(event.target.files)}
          />

          <StatusPanel
            papers={papers}
            totalWords={totalWords}
            progress={progress}
            isExtracting={isExtracting}
            isAnalyzing={analysisMutation.isPending}
            analysis={analysis}
          />

          <div className="panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="panel-title">Analysis Engine</h2>
              <Brain size={18} aria-hidden="true" className="text-teal-700" />
            </div>
            <label className="mt-3 flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-teal-700"
                checked={useDeepEmbeddings}
                onChange={(event) => setUseDeepEmbeddings(event.target.checked)}
              />
              <span>
                Try lazy Transformers.js embeddings. Falls back to local TF-IDF vectors if model
                loading is unavailable.
              </span>
            </label>
            <button
              className="button primary mt-4 w-full"
              type="button"
              disabled={!readyPapers.length || analysisMutation.isPending}
              onClick={rerunAnalysis}
            >
              <Sparkles size={18} aria-hidden="true" />
              Build Research Map
            </button>
          </div>

          <SearchPanel
            query={query}
            onQueryChange={setQuery}
            results={searchResults}
            onSelect={setSelectedPaperId}
          />

          <button
            className="button danger w-full"
            type="button"
            onClick={() => void resetProject()}
          >
            <Trash2 size={18} aria-hidden="true" />
            Clear Local Project
          </button>
        </aside>

        <section className="space-y-4">
          <MetricsStrip papers={readyPapers} failed={failedPapers.length} analysis={analysis} />

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <ResearchMap
              analysis={analysis}
              papers={readyPapers}
              onSelectPaper={setSelectedPaperId}
            />
            <PaperInspector paper={selectedPaper} />
          </div>

          <InsightPanels analysis={analysis} papers={readyPapers} />

          <OutlineAndExports
            analysis={analysis}
            citationStyle={citationStyle}
            onCitationStyleChange={setCitationStyle}
            onExportDocx={() => void exportDocx()}
            onExportLatex={exportLatex}
            onExportMarkdown={exportMarkdown}
          />
        </section>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <span>Research Flow v{buildInfo.version}</span>
          <a
            className="inline-flex items-center gap-2 font-medium text-slate-800"
            href={commitUrl()}
          >
            <GitCommit size={16} aria-hidden="true" />
            commit {buildInfo.commit}
          </a>
        </div>
      </footer>

      <div className="sr-only" aria-live="polite">
        {toast?.message}
      </div>
      {toast ? <ToastMessage toast={toast} onClose={() => setToast(undefined)} /> : null}
    </main>
  );
}

function DropZone({
  disabled,
  onPick,
  onFiles
}: {
  disabled: boolean;
  onPick: () => void;
  onFiles: (files: File[]) => void;
}) {
  return (
    <div
      className="panel border-dashed border-teal-300 bg-teal-50/60"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-lg bg-white text-teal-700 shadow-sm">
          <UploadCloud size={24} aria-hidden="true" />
        </div>
        <div>
          <h2 className="panel-title">Drop Papers</h2>
          <p className="text-sm text-slate-700">PDF, TXT, or Markdown. Up to 50 at once.</p>
        </div>
      </div>
      <button
        className="button primary mt-4 w-full"
        type="button"
        disabled={disabled}
        onClick={onPick}
      >
        <FileText size={18} aria-hidden="true" />
        Choose Files
      </button>
    </div>
  );
}

function StatusPanel({
  papers,
  totalWords,
  progress,
  isExtracting,
  isAnalyzing,
  analysis
}: {
  papers: ResearchPaper[];
  totalWords: number;
  progress?: PaperExtractionProgress;
  isExtracting: boolean;
  isAnalyzing: boolean;
  analysis?: AnalysisResult;
}) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="panel-title">Local Status</h2>
        {isExtracting || isAnalyzing ? (
          <RefreshCw size={18} className="animate-spin text-blue-700" aria-hidden="true" />
        ) : (
          <CheckCircle2 size={18} className="text-emerald-700" aria-hidden="true" />
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Papers</dt>
          <dd className="font-semibold">{papers.length}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Words</dt>
          <dd className="font-semibold">{totalWords.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Engine</dt>
          <dd className="font-semibold">{analysis?.engine ?? "not run"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Updated</dt>
          <dd className="font-semibold">
            {analysis ? new Date(analysis.generatedAt).toLocaleTimeString() : "pending"}
          </dd>
        </div>
      </dl>
      {progress ? (
        <p className="mt-3 text-sm text-slate-700">
          {progress.phase} {progress.index + 1}/{progress.total}: {progress.fileName}
        </p>
      ) : null}
    </div>
  );
}

function SearchPanel({
  query,
  onQueryChange,
  results,
  onSelect
}: {
  query: string;
  onQueryChange: (value: string) => void;
  results: Array<{ id: string; title: string; fileName: string; snippet: string }>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="panel">
      <label className="panel-title flex items-center gap-2" htmlFor="paper-search">
        <Search size={18} aria-hidden="true" />
        Search
      </label>
      <input
        id="paper-search"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-700 focus:ring-2"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="method, dataset, contradiction..."
      />
      <div className="mt-3 space-y-2">
        {results.map((result) => (
          <button
            key={result.id}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-teal-500"
            type="button"
            onClick={() => onSelect(result.id)}
          >
            <span className="block text-sm font-semibold text-slate-900">{result.title}</span>
            <span className="mt-1 block text-xs text-slate-600">{result.snippet}</span>
          </button>
        ))}
        {query && !results.length ? (
          <p className="text-sm text-slate-600">No local matches.</p>
        ) : null}
      </div>
    </div>
  );
}

function MetricsStrip({
  papers,
  failed,
  analysis
}: {
  papers: ResearchPaper[];
  failed: number;
  analysis?: AnalysisResult;
}) {
  const metrics = [
    { label: "Ready papers", value: papers.length.toLocaleString(), icon: FileText },
    { label: "Clusters", value: analysis?.clusters.length.toLocaleString() ?? "0", icon: Network },
    {
      label: "Contradictions",
      value: analysis?.contradictions.length.toLocaleString() ?? "0",
      icon: AlertTriangle
    },
    { label: "Gaps", value: analysis?.gaps.length.toLocaleString() ?? "0", icon: Lightbulb },
    { label: "Failed files", value: failed.toLocaleString(), icon: Database }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <div key={metric.label} className="panel min-h-24">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">{metric.label}</span>
            <metric.icon size={18} className="text-teal-700" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

function ResearchMap({
  analysis,
  papers,
  onSelectPaper
}: {
  analysis?: AnalysisResult;
  papers: ResearchPaper[];
  onSelectPaper: (id: string) => void;
}) {
  const byId = new Map(papers.map((paper) => [paper.id, paper]));

  return (
    <div className="panel min-h-[420px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="panel-title">Published Research Map</h2>
        <Network size={18} aria-hidden="true" className="text-teal-700" />
      </div>
      <div className="relative mt-4 min-h-[330px] overflow-hidden rounded-lg border border-slate-200 bg-white">
        {analysis?.clusters.length ? (
          analysis.clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-3 shadow-sm"
              style={{ left: `${cluster.x}%`, top: `${cluster.y}%`, borderColor: cluster.color }}
            >
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                <h3 className="text-sm font-semibold">{cluster.label}</h3>
              </div>
              <p className="mt-2 text-xs text-slate-600">{cluster.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {cluster.paperIds.slice(0, 4).map((paperId) => (
                  <button
                    key={paperId}
                    type="button"
                    className="rounded border border-slate-200 px-1.5 py-1 text-xs text-slate-700 hover:border-teal-500"
                    onClick={() => onSelectPaper(paperId)}
                    title={byId.get(paperId)?.title}
                  >
                    {byId.get(paperId)?.year ?? "paper"}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid min-h-[330px] place-items-center p-6 text-center">
            <div>
              <BookOpen size={42} className="mx-auto text-slate-400" aria-hidden="true" />
              <p className="mt-3 font-medium">Drop papers to build the map.</p>
              <p className="mt-1 text-sm text-slate-600">
                The first analysis runs locally after extraction finishes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaperInspector({ paper }: { paper?: ResearchPaper }) {
  if (!paper) {
    return (
      <div className="panel min-h-[420px]">
        <h2 className="panel-title">Paper Inspector</h2>
        <p className="mt-4 text-sm text-slate-600">Select or upload a paper to inspect metadata.</p>
      </div>
    );
  }

  return (
    <div className="panel min-h-[420px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="panel-title">Paper Inspector</h2>
          <p className="mt-2 text-lg font-semibold leading-snug">{paper.title}</p>
        </div>
        <FileText size={20} className="shrink-0 text-teal-700" aria-hidden="true" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Year</dt>
          <dd className="font-semibold">{paper.year ?? "Unknown"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Words</dt>
          <dd className="font-semibold">{paper.wordCount.toLocaleString()}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">Authors</dt>
          <dd className="font-semibold">
            {paper.authors.length ? paper.authors.join(", ") : "Unknown"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">DOI</dt>
          <dd className="break-words font-semibold">{paper.doi ?? "Not detected"}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-700">Abstract</h3>
        <p className="mt-2 max-h-52 overflow-auto text-sm leading-6 text-slate-700">
          {(paper.abstract ?? paper.text.slice(0, 850)) || paper.error}
        </p>
      </div>
    </div>
  );
}

function InsightPanels({
  analysis,
  papers
}: {
  analysis?: AnalysisResult;
  papers: ResearchPaper[];
}) {
  const byId = new Map(papers.map((paper) => [paper.id, paper]));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="panel-title">Contradiction Detection</h2>
          <AlertTriangle size={18} className="text-amber-700" aria-hidden="true" />
        </div>
        <div className="mt-3 space-y-3">
          {analysis?.contradictions.length ? (
            analysis.contradictions.map((item) => (
              <article key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h3 className="font-semibold">{item.topic}</h3>
                <p className="mt-1 text-sm text-slate-700">{item.summary}</p>
                <p className="mt-2 text-xs font-medium text-amber-900">
                  confidence {Math.round(item.confidence * 100)}%
                </p>
                <div className="mt-2 grid gap-2">
                  {item.evidence.map((evidence) => (
                    <blockquote
                      key={`${item.id}-${evidence.paperId}`}
                      className="border-l-2 border-amber-500 pl-3 text-xs leading-5 text-slate-700"
                    >
                      {evidence.sentence}
                      <cite className="mt-1 block font-semibold not-italic">
                        {byId.get(evidence.paperId)?.title ?? evidence.title}
                      </cite>
                    </blockquote>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <EmptyState text="No contradiction pairs yet. Add more papers or run the map." />
          )}
        </div>
      </div>

      <div className="panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="panel-title">Gap Analysis</h2>
          <Lightbulb size={18} className="text-blue-700" aria-hidden="true" />
        </div>
        <div className="mt-3 space-y-3">
          {analysis?.gaps.length ? (
            analysis.gaps.map((gap) => (
              <article key={gap.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{gap.title}</h3>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-blue-900">
                    {gap.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{gap.rationale}</p>
                <p className="mt-2 text-sm font-medium text-blue-950">{gap.opportunity}</p>
              </article>
            ))
          ) : (
            <EmptyState text="Gap cards appear after analysis." />
          )}
        </div>
      </div>
    </div>
  );
}

function OutlineAndExports({
  analysis,
  citationStyle,
  onCitationStyleChange,
  onExportDocx,
  onExportLatex,
  onExportMarkdown
}: {
  analysis?: AnalysisResult;
  citationStyle: CitationStyle;
  onCitationStyleChange: (style: CitationStyle) => void;
  onExportDocx: () => void;
  onExportLatex: () => void;
  onExportMarkdown: () => void;
}) {
  return (
    <div className="panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="panel-title">Draft Outline And Citations</h2>
          <p className="mt-1 text-sm text-slate-600">
            Exports include the generated outline and bibliography.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={citationStyle}
            onChange={(event) => onCitationStyleChange(event.target.value as CitationStyle)}
            aria-label="Citation style"
          >
            <option value="apa">APA</option>
            <option value="mla">MLA</option>
            <option value="chicago">Chicago</option>
          </select>
          <button
            className="button secondary"
            type="button"
            disabled={!analysis}
            onClick={onExportMarkdown}
          >
            <Download size={18} aria-hidden="true" />
            MD
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={!analysis}
            onClick={onExportLatex}
          >
            <Download size={18} aria-hidden="true" />
            TeX
          </button>
          <button
            className="button primary"
            type="button"
            disabled={!analysis}
            onClick={onExportDocx}
          >
            <Download size={18} aria-hidden="true" />
            Word
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {analysis?.outline.length ? (
            <div className="space-y-4">
              {analysis.outline.map((section) => (
                <section key={section.id}>
                  <h3 className="font-semibold">{section.heading}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState text="The outline appears after the first research map is built." />
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Citation Keys</h3>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto">
            {analysis?.citations.length ? (
              analysis.citations.map((citation) => (
                <div key={citation.paperId} className="rounded border border-slate-200 p-2 text-xs">
                  <code className="font-semibold text-teal-800">@{citation.key}</code>
                  <p className="mt-1 text-slate-600">{citation.bibliography}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No citations yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      {text}
    </div>
  );
}

function ToastMessage({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const toneClass =
    toast.tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-950"
      : toast.tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : "border-blue-200 bg-blue-50 text-blue-950";

  return (
    <div
      className={`fixed bottom-4 right-4 z-20 max-w-sm rounded-lg border p-4 shadow-lg ${toneClass}`}
    >
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium">{toast.message}</p>
        <button className="text-xs font-semibold" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function runAnalysisWorker(request: AnalysisRequest) {
  return new Promise<AnalysisResult>((resolve, reject) => {
    const worker = new Worker(new URL("./workers/analysis.worker.ts", import.meta.url), {
      type: "module"
    });

    worker.onmessage = (
      event: MessageEvent<{ ok: true; result: AnalysisResult } | { ok: false; error: string }>
    ) => {
      worker.terminate();
      if (event.data.ok) resolve(event.data.result);
      else reject(new Error(event.data.error));
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };

    worker.postMessage(request);
  });
}
