import React from 'react';
import { Quote, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

/**
 * Parses and renders markdown text with Neobrutalism design tokens
 * Converts **bold**, *italics*, lists, and verbatim evidence quotes into styled UI components.
 */
export const FormattedAnswer = ({ text = '' }) => {
  if (!text) return null;

  // Split text into paragraphs/blocks
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  // Helper to parse inline bold, code, and italics
  const renderInline = (str) => {
    // Regex for bold **...**, code `...`, italics *...*
    const parts = [];
    let remaining = str;
    let key = 0;

    while (remaining.length > 0) {
      // Check for code `...`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-gray-100 border border-black rounded font-mono text-xs font-black text-black mx-0.5">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Check for bold **...**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={key++} className="font-black text-black bg-amber-100/80 px-1.5 py-0.5 rounded border border-black/20 shadow-neo-xs mx-0.5 inline-block text-xs sm:text-sm">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic *...*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={key++} className="italic font-bold text-gray-800 mx-0.5">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Plain text up to the next special token
      const nextSpecial = remaining.search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      } else if (nextSpecial === 0) {
        // Stray character
        parts.push(<span key={key++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      } else {
        parts.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>);
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  return (
    <div className="space-y-4 font-sans text-gray-900 leading-relaxed text-sm">
      {blocks.map((block, idx) => {
        // 1. Check for Verbatim Evidence Callout
        const isVerbatim = block.toLowerCase().includes('verbatim source evidence') || 
                           block.toLowerCase().includes('source evidence:') ||
                           block.toLowerCase().includes('verbatim transcript:');

        if (isVerbatim) {
          const quoteMatch = block.match(/["“]([^"”]+)["”]/) || block.match(/:\s*(.*)/s);
          const quoteContent = quoteMatch ? quoteMatch[1].trim() : block.replace(/.*:\s*/, '');

          return (
            <div 
              key={idx} 
              className="mt-3 p-4 bg-amber-50/80 border-2 border-black rounded-xl shadow-neo-xs space-y-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-900 tracking-wider">
                <Quote size={14} className="text-amber-700" />
                <span>Verbatim Grounding Quote</span>
              </div>
              <blockquote className="font-mono text-xs text-gray-900 bg-white p-3 border-2 border-black rounded-lg leading-relaxed shadow-inner">
                "{quoteContent.replace(/^["'\s]+|["'\s]+$/g, '')}"
              </blockquote>
            </div>
          );
        }

        // 2. Check for bullet list items
        if (block.startsWith('- ') || block.startsWith('* ') || block.startsWith('• ')) {
          const items = block.split(/\n(?=[-•*]\s)/).map(item => item.replace(/^[-•*]\s*/, '').trim());
          return (
            <ul key={idx} className="space-y-2 pl-1">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-black mt-1.5 shrink-0 shadow-neo-xs"></span>
                  <span className="text-sm font-medium text-gray-800 leading-relaxed">
                    {renderInline(item)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // 3. Check for numbered list items
        if (/^\d+\.\s/.test(block)) {
          const items = block.split(/\n(?=\d+\.\s)/).map(item => item.replace(/^\d+\.\s*/, '').trim());
          return (
            <ol key={idx} className="space-y-2.5 pl-1">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 bg-neo-yellow border border-black rounded text-[10px] font-black font-mono shrink-0 shadow-neo-xs">
                    {itemIdx + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800 leading-relaxed">
                    {renderInline(item)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        // 4. Standard Paragraph
        return (
          <p key={idx} className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedAnswer;
