import type { ToeicQuestion } from "./toeic-questions";
import { normalizeExplanationForDisplay } from "./explanations";

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanGarbledText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\uFFFD/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/-------+/g, "-------")
    .trim();
}

function findMatchingSentenceInPassage(plainPassage: string, prefix: string): string | null {
  if (!prefix || prefix.trim().length < 4) return null;
  
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanPrefix = clean(prefix);
  if (!cleanPrefix) return null;
  
  const sentences = plainPassage.split(/(?<=[.?!])\s+/);
  
  let bestMatch: string | null = null;
  let bestMatchLen = 0;
  
  for (const sentence of sentences) {
    const cleanSentence = clean(sentence);
    if (cleanSentence.includes(cleanPrefix)) {
      return sentence.trim();
    }
    
    if (cleanPrefix.length > 20) {
      const halfPrefix = cleanPrefix.substring(0, Math.floor(cleanPrefix.length / 2));
      if (cleanSentence.includes(halfPrefix)) {
        if (sentence.length > bestMatchLen) {
          bestMatch = sentence.trim();
          bestMatchLen = sentence.length;
        }
      }
    }
  }
  
  if (bestMatch) return bestMatch;
  
  const first20 = prefix.substring(0, Math.min(20, prefix.length));
  const idx = plainPassage.toLowerCase().indexOf(first20.toLowerCase());
  if (idx !== -1) {
    const sub = plainPassage.substring(idx, idx + prefix.length + 120);
    const dotIdx = sub.indexOf('.');
    if (dotIdx !== -1) {
      return plainPassage.substring(idx, idx + dotIdx + 1).trim();
    }
    return plainPassage.substring(idx, idx + prefix.length + 30).trim() + "...";
  }
  
  return null;
}

function removeTrailingTruncatedQuestions(explanation: string): string {
  const lines = explanation.split('\n');
  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1].trim();
    if (
      lastLine.toLowerCase().endsWith("gần nghĩa nhất với") ||
      lastLine.toLowerCase().endsWith("gần nghĩa nhất với:") ||
      lastLine.toLowerCase().startsWith("bài báo đã có thể được viết") ||
      lastLine.toLowerCase().includes("lý do nào nhất") ||
      lastLine.length < 5
    ) {
      lines.pop();
      return lines.join('\n');
    }
  }
  return explanation;
}

export function getSmartExplanation(q: ToeicQuestion, passageText?: string): string {
  let explanation = q.explanation || "";
  
  if (!explanation.trim()) {
    const correctOpt = q.options.find(o => o.label === q.correctAnswer);
    const correctText = correctOpt ? correctOpt.text : "";
    
    let gen = `Chưa có giải thích chi tiết cho câu hỏi này.\n\n`;
    gen += `**Đáp án đúng:** ${q.correctAnswer}`;
    if (correctText) {
      gen += ` (${correctText})`;
    }
    
    return gen;
  }
  
  explanation = cleanGarbledText(normalizeExplanationForDisplay(explanation));
  
  if (passageText) {
    const plainPassage = passageText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    
    const lastQuoteIdx = Math.max(explanation.lastIndexOf('"'), explanation.lastIndexOf('“'));
    if (lastQuoteIdx !== -1) {
      const afterQuote = explanation.substring(lastQuoteIdx + 1).trim();
      const hasClosingQuote = afterQuote.includes('"') || afterQuote.includes('”');
      
      if (!hasClosingQuote && afterQuote.length > 5) {
        const quotePrefix = afterQuote.replace(/\.\.\.$/, "").trim();
        const completed = findMatchingSentenceInPassage(plainPassage, quotePrefix);
        if (completed) {
          explanation = explanation.substring(0, lastQuoteIdx + 1) + completed + `", do đó chọn đáp án đúng là **${q.correctAnswer}**.`;
        }
      }
    }
  }
  
  explanation = removeTrailingTruncatedQuestions(explanation);
  return explanation;
}

export function extractQuotesFromExplanation(explanation: string): string[] {
  if (!explanation) return [];
  
  const quotes: string[] = [];
  const regex = /["“«]([^"”»]{8,})["”»]/g;
  let match;
  while ((match = regex.exec(explanation)) !== null) {
    quotes.push(match[1].trim());
  }
  
  return quotes;
}

export function highlightHtmlTextSafe(html: string, quote: string): string {
  if (!quote || quote.trim().length < 5) return html;
  
  const cleanQuote = quote.trim().replace(/^[“"'"«„](.*)[”"'"»“]$/, '$1');
  const words = cleanQuote.split(/\s+/).filter(Boolean);
  if (words.length === 0) return html;
  
  const escapedWords = words.map(w => escapeRegExp(w));
  const pattern = escapedWords.join('(?:\\s+|<[^>]*>)+');
  
  try {
    const tokens = html.split(/(<[^>]+>)/g);
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    const highlightedTokens = tokens.map((token) => {
      if (token.startsWith('<') && token.endsWith('>')) {
        return token;
      }
      return token.replace(regex, '<mark class="bg-yellow-100 text-ink font-semibold border-b-2 border-yellow-400 px-1 rounded shadow-sm">$1</mark>');
    });
    
    return highlightedTokens.join('');
  } catch (e) {
    console.error("Highlight error:", e);
    return html;
  }
}

export function renderExplanationText(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let trimmed = line.trim();
    
    if (trimmed === "") {
      return <div key={lineIdx} className="h-1" />;
    }
    
    if (trimmed.startsWith('-------') || trimmed === '------') {
      return <hr key={lineIdx} className="my-3 border-t border-outline-variant/30" />;
    }

    // Check if line is blockquote (starts with >)
    let isBlockquote = false;
    if (trimmed.startsWith('>')) {
      isBlockquote = true;
      trimmed = trimmed.substring(1).trim();
    }
    
    // Parse formatting helper (bold **text**, italic *text*)
    const parseFormattedText = (rawText: string) => {
      const boldParts = rawText.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        if (bIdx % 2 === 1) {
          return <strong key={bIdx} className="text-primary font-black">{bPart}</strong>;
        }
        
        // Parse italics (*italic*) inside non-bold text
        const italicParts = bPart.split(/\*([^*]+)\*/g);
        return italicParts.map((iPart, iIdx) => {
          if (iIdx % 2 === 1) {
            return <em key={iIdx} className="font-semibold italic text-ink/80">{iPart}</em>;
          }
          return iPart;
        });
      });
    };
    
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      const cleanContent = trimmed.replace(/^[-•]\s*/, "");
      const cleanJSX = parseFormattedText(cleanContent);
      
      return (
        <div key={lineIdx} className="pl-3 text-on-surface-variant flex items-start gap-2 min-h-[1.25rem] py-0.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="flex-1 leading-relaxed">{cleanJSX}</span>
        </div>
      );
    }
    
    const contentJSX = parseFormattedText(trimmed);
    
    if (isBlockquote) {
      return (
        <blockquote key={lineIdx} className="my-2 border-l-4 border-primary/40 pl-3 py-1.5 bg-primary/5 rounded-r italic text-ink/85 text-[12px] leading-relaxed">
          {contentJSX}
        </blockquote>
      );
    }
    
    return (
      <p key={lineIdx} className="min-h-[1.25rem] text-ink/90 py-0.5 leading-relaxed">
        {contentJSX}
      </p>
    );
  });
}

export function splitTranscript(text?: string | null) {
  if (!text) return { english: "", vietnamese: "" };
  const markers = [
    "Dịch nghĩa:",
    "Dịch nghĩa\n",
    "Dịch nghĩa :\n",
    "Dịch:",
    "Dịch \n",
    "Bản dịch:"
  ];
  for (const marker of markers) {
    const parts = text.split(marker);
    if (parts.length > 1) {
      return {
        english: parts[0].trim(),
        vietnamese: parts.slice(1).join(marker).trim()
      };
    }
  }
  return { english: text.trim(), vietnamese: "" };
}
