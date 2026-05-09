import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clipboard,
  Copy,
  Database,
  FileJson,
  Download,
  ExternalLink,
  FileText,
  GitCommit,
  GitFork,
  Heart,
  Lightbulb,
  Link2,
  Network,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResult, AnalysisRequest } from "./features/analysis/types";
import {
  bibtexWithConfidence,
  bibliographyWithConfidence,
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
import {
  createProjectState,
  decodeProjectStateHash,
  encodeProjectStateHash,
  parseProjectState,
  projectStateFromJson,
  projectStateToJson,
  type ProjectState
} from "./features/storage/projectState";
import {
  isCitationStyle,
  loadSettings,
  saveSettings,
  type AppSettings
} from "./features/storage/settingsStore";
import { buildInfo, commitUrl } from "./shared/buildInfo";
import { formatCount, formatDuration } from "./shared/format";
import { isAbortError, userMessage } from "./shared/uiErrors";

type Toast = { tone: "success" | "error" | "info"; message: string };
type OperationState =
  | "empty"
  | "ready"
  | "extracting"
  | "analyzing"
  | "exporting"
  | "sharing"
  | "recoverable-error"
  | "cancelled";
type Activity = { at: string; event: string; detail: string };

const samplePaperText = `Sample Local-First Research Paper
Florin Example and Research Flow

Abstract
This short sample shows how Research Flow treats pasted or generated text exactly like an uploaded paper. The paper argues that local-first literature review tools should expose uncertainty, preserve provenance, and let researchers export their work without cloud accounts.

1 Introduction
Local browser workflows reduce privacy risk and make early research mapping faster. However, tools that hide failures or omit citations are difficult to trust.

2 Findings
The sample finds strong support for portable state files, inline corrections, and evidence-aware export metadata. It also notes that OCR should be handled explicitly when scanned PDFs do not contain usable text.

3 Conclusion
Research tools become usable when users can bring their own messy files, recover from mistakes, and carry their work out again.`;

export function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const extractionAbortRef = useRef<AbortController | undefined>(undefined);
  const analysisAbortRef = useRef<AbortController | undefined>(undefined);
  const analysisWorkerRef = useRef<Worker | undefined>(undefined);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult>();
  const [query, setQuery] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState<string>();
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [progress, setProgress] = useState<PaperExtractionProgress>();
  const [isExtracting, setIsExtracting] = useState(false);
  const [operation, setOperation] = useState<OperationState>("empty");
  const [pasteText, setPasteText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [toast, setToast] = useState<Toast>();

  const readyPapers = papers.filter((paper) => paper.status === "ready");
  const needsReviewPapers = papers.filter((paper) => paper.status !== "ready");
  const selectedPaper = papers.find((paper) => paper.id === selectedPaperId) ?? papers[0];
  const searchResults = useMemo(() => searchPapers(readyPapers, query), [readyPapers, query]);
  const totalWords = readyPapers.reduce((sum, paper) => sum + paper.wordCount, 0);
  const debugMode = useMemo(() => new URLSearchParams(window.location.search).has("debug"), []);

  const analysisMutation = useMutation({
    mutationFn: (request: AnalysisRequest) => {
      const controller = new AbortController();
      analysisAbortRef.current = controller;
      setOperation("analyzing");
      recordActivity("analysis started", `${request.papers.length} ready papers`);
      return runAnalysisWorker(request, controller.signal, (worker) => {
        analysisWorkerRef.current = worker;
      });
    },
    onSuccess(result) {
      setAnalysis(result);
      setOperation("ready");
      recordActivity("analysis completed", `${result.clusters.length} clusters`);
      setToast({
        tone: "success",
        message: `Research map built in ${formatDuration(result.durationMs)}.`
      });
    },
    onError(error) {
      setOperation(isAbortError(error) ? "cancelled" : "recoverable-error");
      recordActivity("analysis stopped", userMessage(error, "Analysis could not finish."));
      setToast({
        tone: isAbortError(error) ? "info" : "error",
        message: userMessage(error, "Analysis could not finish.")
      });
    },
    onSettled() {
      analysisAbortRef.current = undefined;
      analysisWorkerRef.current = undefined;
    }
  });

  const isBusy = isExtracting || analysisMutation.isPending || operation === "exporting";

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    let mounted = true;
    const hash = window.location.hash.startsWith("#state=")
      ? window.location.hash.replace("#state=", "")
      : "";

    const restore = hash ? Promise.resolve(decodeProjectStateHash(hash)) : loadLatestProject();

    restore
      .then((project) => {
        if (!mounted || !project) return;
        const parsed = parseProjectState(project);
        setPapers(parsed.papers);
        setAnalysis(parsed.analysis);
        setSettings(parsed.settings);
        setSelectedPaperId(parsed.papers[0]?.id);
        setOperation(parsed.papers.length ? "ready" : "empty");
        setActivity((current) =>
          [
            {
              at: new Date().toISOString(),
              event: "project loaded",
              detail: `${parsed.papers.length} papers`
            },
            ...current
          ].slice(0, 30)
        );
        setToast({
          tone: "info",
          message: hash
            ? "Loaded the shared Research Flow state from this URL."
            : "Restored the last local project from this browser."
        });
      })
      .catch((error) =>
        setToast({ tone: "error", message: userMessage(error, "Could not restore project state.") })
      );
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!papers.length) return;
    const timeout = window.setTimeout(() => {
      saveLatestProject({ appVersion: buildInfo.version, papers, analysis, settings }).catch(
        (error) =>
          setToast({
            tone: "error",
            message: userMessage(error, "Could not save this project in browser storage.")
          })
      );
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [papers, analysis, settings]);

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, 50);
    if (!files.length) return;

    const stateFiles = files.filter(isProjectStateFile);
    if (stateFiles.length) {
      await importStateFile(stateFiles[0]);
      return;
    }

    const controller = new AbortController();
    extractionAbortRef.current = controller;
    setIsExtracting(true);
    setOperation("extracting");
    setProgress(undefined);
    setToast({ tone: "info", message: `Reading ${formatCount(files.length, "file")} locally.` });
    recordActivity("input files", files.map((file) => file.name).join(", "));

    try {
      const extracted = await extractPapers(files, setProgress, controller.signal);
      const nextPapers = mergePapers(papers, extracted);
      setPapers(nextPapers);
      setSelectedPaperId(extracted[0]?.id ?? selectedPaperId);
      setOperation(
        extracted.some((paper) => paper.status !== "ready") ? "recoverable-error" : "ready"
      );
      recordActivity("input extracted", `${extracted.length} files`);

      const ready = nextPapers.filter((paper) => paper.status === "ready");
      if (settings.autoAnalyze && ready.length) {
        analysisMutation.mutate({
          papers: ready,
          options: { useDeepEmbeddings: settings.useDeepEmbeddings }
        });
      }
    } catch (error) {
      setOperation(isAbortError(error) ? "cancelled" : "recoverable-error");
      setToast({
        tone: isAbortError(error) ? "info" : "error",
        message: userMessage(error, "Input could not be read.")
      });
    } finally {
      setIsExtracting(false);
      extractionAbortRef.current = undefined;
    }
  }

  function rerunAnalysis() {
    if (!readyPapers.length) return;
    analysisMutation.mutate({
      papers: readyPapers,
      options: { useDeepEmbeddings: settings.useDeepEmbeddings }
    });
  }

  async function resetProject() {
    cancelWork();
    setPapers([]);
    setAnalysis(undefined);
    setSelectedPaperId(undefined);
    setQuery("");
    setOperation("empty");
    setActivity([]);
    window.history.replaceState(null, "", window.location.pathname);
    await clearLatestProject();
    setToast({ tone: "success", message: "Cleared the local project from this browser." });
  }

  async function exportDocx() {
    if (!analysis) return;
    setOperation("exporting");
    const blob = await buildDocxBlob({
      papers: readyPapers,
      analysis,
      style: settings.citationStyle
    });
    downloadBlob("research-flow-draft.docx", blob);
    recordActivity("exported Word", "research-flow-draft.docx");
    setOperation("ready");
  }

  function exportLatex() {
    if (!analysis) return;
    setOperation("exporting");
    downloadText(
      "research-flow-draft.tex",
      buildLatexDocument({ papers: readyPapers, analysis, style: settings.citationStyle }),
      "application/x-tex;charset=utf-8"
    );
    recordActivity("exported LaTeX", "research-flow-draft.tex");
    setOperation("ready");
  }

  function exportMarkdown() {
    if (!analysis) return;
    setOperation("exporting");
    downloadText(
      "research-flow-draft.md",
      buildMarkdownDocument({ papers: readyPapers, analysis, style: settings.citationStyle }),
      "text/markdown;charset=utf-8"
    );
    recordActivity("exported Markdown", "research-flow-draft.md");
    setOperation("ready");
  }

  async function copyMarkdown() {
    if (!analysis) return;
    await copyText(
      buildMarkdownDocument({ papers: readyPapers, analysis, style: settings.citationStyle }),
      "Copied Markdown draft."
    );
  }

  async function copyBibliography() {
    if (!analysis) return;
    await copyText(
      `${bibliographyWithConfidence({
        papers: readyPapers,
        analysis,
        style: settings.citationStyle
      })}\n\n${bibtexWithConfidence({ papers: readyPapers, analysis, style: settings.citationStyle })}`,
      "Copied bibliography and BibTeX."
    );
  }

  function exportState() {
    const state = currentProjectState();
    downloadText(
      "research-flow-project.research-flow.json",
      projectStateToJson(state),
      "application/json;charset=utf-8"
    );
    recordActivity("exported state", `${state.papers.length} papers`);
    setToast({ tone: "success", message: "Downloaded a portable Research Flow state file." });
  }

  async function shareState() {
    const state = currentProjectState();
    const encoded = encodeProjectStateHash(state);
    if (encoded.length > 60_000) {
      setToast({
        tone: "info",
        message:
          "This project is too large for a reliable URL. Use Export State File to move it instead."
      });
      return;
    }
    setOperation("sharing");
    const url = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
    await copyText(url, "Copied a share URL for this small project.");
    window.history.replaceState(null, "", `#state=${encoded}`);
    recordActivity("shared URL", `${encoded.length} characters`);
    setOperation("ready");
  }

  function printAnalysis() {
    recordActivity("print", "browser print dialog");
    window.print();
  }

  async function importStateFile(file: File) {
    try {
      const state = projectStateFromJson(await file.text());
      applyProject(state);
      await saveLatestProject(state);
      recordActivity("imported state", file.name);
      setToast({ tone: "success", message: "Imported the Research Flow project state." });
    } catch (error) {
      setToast({
        tone: "error",
        message: userMessage(error, "Project state could not be imported.")
      });
    }
  }

  async function submitPastedText() {
    const value = pasteText.trim();
    if (!value) return;
    const file = new File([value], "pasted-research-text.txt", {
      type: "text/plain",
      lastModified: 0
    });
    await handleFiles([file]);
    setPasteText("");
  }

  async function readClipboardText() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) {
        setToast({ tone: "info", message: "Clipboard did not contain readable text." });
        return;
      }
      setPasteText(value);
      recordActivity("clipboard read", `${value.length} characters`);
      setToast({ tone: "success", message: "Clipboard text is ready to import." });
    } catch (error) {
      setToast({
        tone: "error",
        message: userMessage(
          error,
          "Clipboard permission was blocked. Paste the text into the box instead."
        )
      });
    }
  }

  async function fetchUrlInput() {
    const value = urlInput.trim();
    if (!value) return;
    try {
      const url = new URL(value);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`The server returned HTTP ${response.status}.`);
      const blob = await response.blob();
      const extension = extensionFromContentType(blob.type, url.pathname);
      const file = new File(
        [blob],
        `url-${url.hostname.replace(/[^a-z0-9-]/gi, "-")}${extension}`,
        {
          type: blob.type || "text/plain",
          lastModified: 0
        }
      );
      await handleFiles([file]);
      setUrlInput("");
    } catch (error) {
      setToast({
        tone: "error",
        message: userMessage(
          error,
          "This URL could not be read directly from GitHub Pages. Download the file or paste the rendered text."
        )
      });
    }
  }

  async function loadSample() {
    setPasteText(samplePaperText);
    const file = new File([samplePaperText], "research-flow-sample.txt", {
      type: "text/plain",
      lastModified: 0
    });
    await handleFiles([file]);
  }

  async function copyText(text: string, successMessage: string) {
    await navigator.clipboard.writeText(text);
    recordActivity("copied output", successMessage);
    setToast({ tone: "success", message: successMessage });
  }

  function updateSettings(next: Partial<AppSettings>) {
    setSettings((current) => ({ ...current, ...next }));
  }

  function applyProject(state: ProjectState) {
    const parsed = parseProjectState(state);
    setPapers(parsed.papers);
    setAnalysis(parsed.analysis);
    setSettings(parsed.settings);
    setSelectedPaperId(parsed.papers[0]?.id);
    setOperation(parsed.papers.length ? "ready" : "empty");
    recordActivity("project loaded", `${parsed.papers.length} papers`);
  }

  function currentProjectState() {
    return createProjectState({
      appVersion: buildInfo.version,
      papers,
      analysis,
      settings
    });
  }

  function cancelWork() {
    extractionAbortRef.current?.abort();
    analysisAbortRef.current?.abort();
    analysisWorkerRef.current?.terminate();
    setIsExtracting(false);
    setOperation("cancelled");
    recordActivity("cancelled", "user requested cancellation");
  }

  function recordActivity(event: string, detail: string) {
    setActivity((current) =>
      [{ at: new Date().toISOString(), event, detail }, ...current].slice(0, 30)
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
            disabled={isBusy}
            onPick={() => inputRef.current?.click()}
            onFiles={handleFiles}
          />
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,.txt,.md,.markdown,.bib,.json,.research-flow.json,application/pdf,text/plain,text/markdown,application/json"
            onChange={(event) => event.target.files && void handleFiles(event.target.files)}
          />
          <input
            ref={stateInputRef}
            className="sr-only"
            type="file"
            accept=".json,.research-flow.json,application/json"
            onChange={(event) => event.target.files && void importStateFile(event.target.files[0])}
          />

          <StatusPanel
            papers={papers}
            reviewCount={needsReviewPapers.length}
            totalWords={totalWords}
            progress={progress}
            isExtracting={isExtracting}
            isAnalyzing={analysisMutation.isPending}
            operation={operation}
            analysis={analysis}
            onCancel={cancelWork}
          />

          <div className="panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="panel-title">Analysis Engine</h2>
              <div className="flex items-center gap-2 text-teal-700">
                <Settings size={18} aria-hidden="true" />
                <Brain size={18} aria-hidden="true" />
              </div>
            </div>
            <label className="mt-3 flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-teal-700"
                checked={settings.useDeepEmbeddings}
                onChange={(event) => updateSettings({ useDeepEmbeddings: event.target.checked })}
              />
              <span>
                Try lazy Transformers.js embeddings. Falls back to local TF-IDF vectors if model
                loading is unavailable.
              </span>
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-teal-700"
                checked={settings.autoAnalyze}
                onChange={(event) => updateSettings({ autoAnalyze: event.target.checked })}
              />
              <span>Analyze automatically after new ready papers are imported.</span>
            </label>
            <button
              className="button primary mt-4 w-full"
              type="button"
              disabled={!readyPapers.length || isBusy}
              onClick={rerunAnalysis}
            >
              <Sparkles size={18} aria-hidden="true" />
              Build Research Map
            </button>
          </div>

          <InputCompletenessPanel
            disabled={isBusy}
            pasteText={pasteText}
            urlInput={urlInput}
            onPasteTextChange={setPasteText}
            onUrlInputChange={setUrlInput}
            onSubmitPastedText={() => void submitPastedText()}
            onReadClipboard={() => void readClipboardText()}
            onFetchUrl={() => void fetchUrlInput()}
            onLoadSample={() => void loadSample()}
            onImportState={() => stateInputRef.current?.click()}
          />

          <SearchPanel
            query={query}
            onQueryChange={setQuery}
            results={searchResults}
            onSelect={setSelectedPaperId}
          />

          <button
            className="button danger w-full"
            type="button"
            disabled={isBusy}
            onClick={() => void resetProject()}
          >
            <Trash2 size={18} aria-hidden="true" />
            Clear Local Project
          </button>
        </aside>

        <section className="space-y-4">
          <MetricsStrip
            papers={readyPapers}
            reviewCount={needsReviewPapers.length}
            analysis={analysis}
          />

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
            citationStyle={settings.citationStyle}
            onCitationStyleChange={(citationStyle) => updateSettings({ citationStyle })}
            onExportDocx={() => void exportDocx()}
            onExportLatex={exportLatex}
            onExportMarkdown={exportMarkdown}
            onCopyMarkdown={() => void copyMarkdown()}
            onCopyBibliography={() => void copyBibliography()}
            onExportState={exportState}
            onShareState={() => void shareState()}
            onPrint={printAnalysis}
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
      {debugMode ? (
        <DebugPanel
          operation={operation}
          progress={progress}
          papers={papers}
          analysis={analysis}
          settings={settings}
          activity={activity}
        />
      ) : null}
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
          <p className="text-sm text-slate-700">
            PDF, TXT, Markdown, BibTeX, or state files. Up to 50 at once.
          </p>
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

function InputCompletenessPanel({
  disabled,
  pasteText,
  urlInput,
  onPasteTextChange,
  onUrlInputChange,
  onSubmitPastedText,
  onReadClipboard,
  onFetchUrl,
  onLoadSample,
  onImportState
}: {
  disabled: boolean;
  pasteText: string;
  urlInput: string;
  onPasteTextChange: (value: string) => void;
  onUrlInputChange: (value: string) => void;
  onSubmitPastedText: () => void;
  onReadClipboard: () => void;
  onFetchUrl: () => void;
  onLoadSample: () => void;
  onImportState: () => void;
}) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="panel-title">Other Inputs</h2>
        <Clipboard size={18} className="text-teal-700" aria-hidden="true" />
      </div>
      <textarea
        className="mt-3 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-700 focus:ring-2"
        value={pasteText}
        onChange={(event) => onPasteTextChange(event.target.value)}
        placeholder="Paste paper text, abstract text, or rendered HTML here."
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className="button secondary"
          type="button"
          disabled={disabled}
          onClick={onReadClipboard}
        >
          <Clipboard size={18} aria-hidden="true" />
          Clipboard
        </button>
        <button
          className="button primary"
          type="button"
          disabled={disabled || !pasteText.trim()}
          onClick={onSubmitPastedText}
        >
          <FileText size={18} aria-hidden="true" />
          Import Text
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-700 focus:ring-2"
          value={urlInput}
          onChange={(event) => onUrlInputChange(event.target.value)}
          placeholder="https://example.org/paper.pdf"
          inputMode="url"
        />
        <button
          className="button secondary"
          type="button"
          disabled={disabled || !urlInput.trim()}
          onClick={onFetchUrl}
          title="Works only for URLs that allow browser CORS access."
        >
          <Link2 size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="button secondary"
          type="button"
          disabled={disabled}
          onClick={onLoadSample}
        >
          <Sparkles size={18} aria-hidden="true" />
          Sample
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={disabled}
          onClick={onImportState}
        >
          <FileJson size={18} aria-hidden="true" />
          Import State
        </button>
      </div>
    </div>
  );
}

function StatusPanel({
  papers,
  reviewCount,
  totalWords,
  progress,
  isExtracting,
  isAnalyzing,
  operation,
  analysis,
  onCancel
}: {
  papers: ResearchPaper[];
  reviewCount: number;
  totalWords: number;
  progress?: PaperExtractionProgress;
  isExtracting: boolean;
  isAnalyzing: boolean;
  operation: OperationState;
  analysis?: AnalysisResult;
  onCancel: () => void;
}) {
  const isBusy = isExtracting || isAnalyzing;
  return (
    <div className="panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="panel-title">Local Status</h2>
        {isBusy ? (
          <RefreshCw size={18} className="animate-spin text-blue-700" aria-hidden="true" />
        ) : operation === "recoverable-error" ? (
          <AlertTriangle size={18} className="text-amber-700" aria-hidden="true" />
        ) : operation === "cancelled" ? (
          <XCircle size={18} className="text-slate-500" aria-hidden="true" />
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
          <dt className="text-slate-500">Needs review</dt>
          <dd className="font-semibold">{reviewCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-slate-500">State</dt>
          <dd className="font-semibold">{operation}</dd>
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
          {progress.page && progress.pages ? ` page ${progress.page}/${progress.pages}` : ""}
        </p>
      ) : null}
      {isBusy ? (
        <button className="button secondary mt-3 w-full" type="button" onClick={onCancel}>
          <XCircle size={18} aria-hidden="true" />
          Cancel Current Work
        </button>
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
  reviewCount,
  analysis
}: {
  papers: ResearchPaper[];
  reviewCount: number;
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
    { label: "Needs review", value: reviewCount.toLocaleString(), icon: Database }
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
              <p className="mt-1 text-xs font-medium text-slate-700">
                confidence {Math.round(cluster.confidence * 100)}%
              </p>
              <p className="mt-1 text-xs text-slate-500">{cluster.reasons[0]}</p>
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
          <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-slate-500">
            {paper.status.replace(/_/g, " ")}
          </p>
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
        <div className="col-span-2">
          <dt className="text-slate-500">arXiv</dt>
          <dd className="break-words font-semibold">{paper.arxivId ?? "Not detected"}</dd>
        </div>
      </dl>
      <div className="mt-4 grid gap-2 text-xs">
        <ConfidenceLine label="Title" confidence={paper.inference?.title.confidence} />
        <ConfidenceLine label="Authors" confidence={paper.inference?.authors.confidence} />
        <ConfidenceLine label="Year" confidence={paper.inference?.year?.confidence} />
        <ConfidenceLine label="DOI" confidence={paper.inference?.doi?.confidence} />
      </div>
      {paper.error || paper.warnings?.length || paper.nextSteps?.length ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {paper.error ? <p className="font-medium">{paper.error}</p> : null}
          {paper.nextSteps?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {paper.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : null}
          {paper.warnings?.length ? (
            <p className="mt-2 text-xs">{paper.warnings.join(" ")}</p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-700">Abstract</h3>
        <p className="mt-2 max-h-52 overflow-auto text-sm leading-6 text-slate-700">
          {(paper.abstract ?? paper.text.slice(0, 850)) || paper.error}
        </p>
      </div>
    </div>
  );
}

function ConfidenceLine({ label, confidence }: { label: string; confidence?: number }) {
  const percent = confidence === undefined ? "unknown" : `${Math.round(confidence * 100)}%`;
  return (
    <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-2 py-1">
      <span className="text-slate-500">{label} confidence</span>
      <span className="font-semibold text-slate-800">{percent}</span>
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
                <p className="mt-2 text-xs font-medium text-blue-900">
                  confidence {Math.round(gap.confidence * 100)}%
                </p>
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
  onExportMarkdown,
  onCopyMarkdown,
  onCopyBibliography,
  onExportState,
  onShareState,
  onPrint
}: {
  analysis?: AnalysisResult;
  citationStyle: CitationStyle;
  onCitationStyleChange: (style: CitationStyle) => void;
  onExportDocx: () => void;
  onExportLatex: () => void;
  onExportMarkdown: () => void;
  onCopyMarkdown: () => void;
  onCopyBibliography: () => void;
  onExportState: () => void;
  onShareState: () => void;
  onPrint: () => void;
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
            onChange={(event) => {
              if (isCitationStyle(event.target.value)) onCitationStyleChange(event.target.value);
            }}
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
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="button secondary"
          type="button"
          disabled={!analysis}
          onClick={onCopyMarkdown}
        >
          <Copy size={18} aria-hidden="true" />
          Copy MD
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={!analysis}
          onClick={onCopyBibliography}
        >
          <Copy size={18} aria-hidden="true" />
          Copy Citations
        </button>
        <button className="button secondary" type="button" onClick={onExportState}>
          <FileJson size={18} aria-hidden="true" />
          Export State
        </button>
        <button className="button secondary" type="button" onClick={onShareState}>
          <Share2 size={18} aria-hidden="true" />
          Share URL
        </button>
        <button className="button secondary" type="button" disabled={!analysis} onClick={onPrint}>
          <Printer size={18} aria-hidden="true" />
          Print
        </button>
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
                  <p className="mt-1 font-medium text-slate-700">
                    confidence {Math.round(citation.confidence * 100)}%
                  </p>
                  {citation.warnings.length ? (
                    <p className="mt-1 text-amber-800">{citation.warnings.join(" ")}</p>
                  ) : null}
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

function DebugPanel({
  operation,
  progress,
  papers,
  analysis,
  settings,
  activity
}: {
  operation: OperationState;
  progress?: PaperExtractionProgress;
  papers: ResearchPaper[];
  analysis?: AnalysisResult;
  settings: AppSettings;
  activity: Activity[];
}) {
  return (
    <section className="fixed bottom-0 left-0 right-0 z-10 max-h-80 overflow-auto border-t border-slate-300 bg-white p-4 text-xs shadow-2xl">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-4">
        <div>
          <h2 className="font-semibold">Debug State</h2>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify({ operation, progress, settings }, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="font-semibold">Papers</h2>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(
              papers.map((paper) => ({
                id: paper.id,
                status: paper.status,
                title: paper.title,
                confidence: paper.inference?.title.confidence,
                words: paper.wordCount
              })),
              null,
              2
            )}
          </pre>
        </div>
        <div>
          <h2 className="font-semibold">Analysis</h2>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(
              analysis
                ? {
                    sourceHash: analysis.provenance.sourceHash,
                    clusters: analysis.clusters.map((cluster) => ({
                      label: cluster.label,
                      confidence: cluster.confidence
                    })),
                    warnings: analysis.warnings
                  }
                : undefined,
              null,
              2
            )}
          </pre>
        </div>
        <div>
          <h2 className="font-semibold">Activity</h2>
          <ol className="mt-2 space-y-1">
            {activity.map((item) => (
              <li key={`${item.at}-${item.event}`}>
                <span className="font-medium">{item.event}</span> {item.detail}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function runAnalysisWorker(
  request: AnalysisRequest,
  signal: AbortSignal,
  onWorker: (worker: Worker) => void
) {
  return new Promise<AnalysisResult>((resolve, reject) => {
    const worker = new Worker(new URL("./workers/analysis.worker.ts", import.meta.url), {
      type: "module"
    });
    onWorker(worker);

    signal.addEventListener(
      "abort",
      () => {
        worker.terminate();
        reject(new DOMException("Operation cancelled", "AbortError"));
      },
      { once: true }
    );

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

function mergePapers(existing: ResearchPaper[], incoming: ResearchPaper[]) {
  const byId = new Map(existing.map((paper) => [paper.id, paper]));
  for (const paper of incoming) byId.set(paper.id, paper);
  return [...byId.values()].sort(
    (a, b) => a.addedAt.localeCompare(b.addedAt) || a.id.localeCompare(b.id)
  );
}

function isProjectStateFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".research-flow.json") || name.endsWith(".json");
}

function extensionFromContentType(contentType: string, pathname: string) {
  const lowerPath = pathname.toLowerCase();
  if (lowerPath.endsWith(".pdf") || contentType.includes("pdf")) return ".pdf";
  if (lowerPath.endsWith(".bib")) return ".bib";
  if (lowerPath.endsWith(".md") || lowerPath.endsWith(".markdown")) return ".md";
  return ".txt";
}
