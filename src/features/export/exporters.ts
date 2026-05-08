import type { AnalysisResult, OutlineSection } from "../analysis/types";
import type { ResearchPaper } from "../library/types";
import { type CitationStyle, formatBibliography } from "./citations";

export interface ExportPayload {
  papers: ResearchPaper[];
  analysis: AnalysisResult;
  style: CitationStyle;
}

export function buildLatexDocument({ papers, analysis, style }: ExportPayload) {
  const sections = analysis.outline
    .map((section) => {
      const heading = section.heading.replace(/^\d+\.\s*/, "");
      const bullets = section.bullets.map((bullet) => `\\item ${escapeLatex(bullet)}`).join("\n");
      return `\\section{${escapeLatex(heading)}}\n\\begin{itemize}\n${bullets}\n\\end{itemize}`;
    })
    .join("\n\n");

  return `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\title{Research Flow Draft}
\\author{Generated locally by Research Flow}
\\date{${new Date(analysis.generatedAt).toLocaleDateString()}}

\\begin{document}
\\maketitle

${sections}

\\section*{References}
\\begin{verbatim}
${formatBibliography(papers, style)}
\\end{verbatim}

\\end{document}
`;
}

export function buildMarkdownDocument({ papers, analysis, style }: ExportPayload) {
  const body = analysis.outline.map(markdownSection).join("\n\n");
  return `# Research Flow Draft

Generated locally on ${new Date(analysis.generatedAt).toLocaleString()}.

${body}

## References

${formatBibliography(papers, style)
  .split("\n")
  .map((entry) => `- ${entry}`)
  .join("\n")}
`;
}

export async function buildDocxBlob(payload: ExportPayload) {
  const docx = await import("docx");
  const document = new docx.Document({
    sections: [
      {
        properties: {},
        children: [
          new docx.Paragraph({
            text: "Research Flow Draft",
            heading: docx.HeadingLevel.TITLE
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `Generated locally on ${new Date(payload.analysis.generatedAt).toLocaleString()}`,
                italics: true
              })
            ]
          }),
          ...payload.analysis.outline.flatMap((section) => sectionToDocx(section, docx)),
          new docx.Paragraph({ text: "References", heading: docx.HeadingLevel.HEADING_1 }),
          ...formatBibliography(payload.papers, payload.style)
            .split("\n")
            .map((entry) => new docx.Paragraph({ text: entry, bullet: { level: 0 } }))
        ]
      }
    ]
  });

  return docx.Packer.toBlob(document);
}

export function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadText(fileName: string, text: string, type = "text/plain;charset=utf-8") {
  downloadBlob(fileName, new Blob([text], { type }));
}

function markdownSection(section: OutlineSection) {
  return `## ${section.heading}\n\n${section.bullets.map((bullet) => `- ${bullet}`).join("\n")}`;
}

function sectionToDocx(section: OutlineSection, docx: typeof import("docx")) {
  return [
    new docx.Paragraph({
      text: section.heading,
      heading: docx.HeadingLevel.HEADING_1
    }),
    ...section.bullets.map(
      (bullet) =>
        new docx.Paragraph({
          text: bullet,
          bullet: { level: 0 }
        })
    )
  ];
}

function escapeLatex(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/~/g, "\\textasciitilde{}");
}
