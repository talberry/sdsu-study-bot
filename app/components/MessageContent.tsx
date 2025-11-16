"use client";

import React from "react";

interface MessageContentProps {
  text: string;
}

export default function MessageContent({ text }: MessageContentProps) {
  // Parse and format the message content
  const formatContent = (content: string): React.ReactNode[] => {
    // Split by double newlines to get paragraphs
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((paragraph, pIndex) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Check for multiple choice questions - look for question followed by A-E options
      // Pattern: question line(s) followed by lines starting with A), B), C), etc.
      let optionsStartIndex = -1;
      
      // Find where options start
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check if this line starts with A-E followed by ) or .
        if (/^[A-E][\.\)]\s+/.test(line)) {
          optionsStartIndex = i;
          break;
        }
      }
      
      // If we found options and there's at least one line before them (the question)
      if (optionsStartIndex > 0) {
        const questionLines = lines.slice(0, optionsStartIndex);
        const question = questionLines.join(' ').replace(/^\d+[\.\)]\s*/, '').trim();
        const optionLines = lines.slice(optionsStartIndex).filter(line => /^[A-E][\.\)]\s+/.test(line));
        
        // Need at least 2 options to be a valid MCQ
        if (optionLines.length >= 2) {
          return (
            <div key={pIndex} className="mb-6 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <div className="mb-4">
                <div className="font-semibold text-[#8b2e2e] mb-2 text-sm uppercase tracking-wide">Question</div>
                <p className="text-sm leading-relaxed">{formatInlineText(question)}</p>
              </div>
              <div className="space-y-2">
                {optionLines.map((option, optIndex) => {
                  const match = option.match(/^([A-E])[\.\)]\s*(.+)/i);
                  if (match) {
                    return (
                      <div
                        key={optIndex}
                        className="flex items-start space-x-3 p-3 rounded bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#8b2e2e]/50 transition-all cursor-pointer group"
                      >
                        <span className="font-bold text-[#8b2e2e] min-w-[28px] text-base group-hover:text-[#a03a3a] transition-colors">
                          {match[1].toUpperCase()}.
                        </span>
                        <span className="text-sm flex-1 leading-relaxed">{formatInlineText(match[2])}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        }
      }

      // Check for numbered lists
      if (/^\d+[\.\)]\s+/.test(trimmed.split('\n')[0])) {
        const items = trimmed.split('\n').filter(line => /^\d+[\.\)]\s+/.test(line));
        return (
          <ol key={pIndex} className="list-decimal list-inside space-y-2 mb-4 ml-2">
            {items.map((item, idx) => (
              <li key={idx} className="text-sm leading-relaxed">
                {item.replace(/^\d+[\.\)]\s+/, '')}
              </li>
            ))}
          </ol>
        );
      }

      // Check for bullet lists
      if (/^[-•*]\s+/.test(trimmed.split('\n')[0])) {
        const items = trimmed.split('\n').filter(line => /^[-•*]\s+/.test(line));
        return (
          <ul key={pIndex} className="list-disc list-inside space-y-2 mb-4 ml-2">
            {items.map((item, idx) => (
              <li key={idx} className="text-sm leading-relaxed">
                {item.replace(/^[-•*]\s+/, '')}
              </li>
            ))}
          </ul>
        );
      }

      // Check for headers (lines ending with : or starting with #)
      if (trimmed.match(/^#{1,3}\s+.+/) || trimmed.endsWith(':') && trimmed.split('\n').length === 1) {
        const headerText = trimmed.replace(/^#{1,3}\s+/, '').replace(/:$/, '');
        const level = trimmed.match(/^(#{1,3})/)?.[1]?.length || (trimmed.endsWith(':') ? 2 : 1);
        return (
          <h3
            key={pIndex}
            className={`font-bold mb-2 mt-4 first:mt-0 ${
              level === 1 ? 'text-lg text-[#8b2e2e]' : level === 2 ? 'text-base text-[#8b2e2e]' : 'text-sm'
            }`}
          >
            {headerText}
          </h3>
        );
      }

      // Check for code blocks
      if (trimmed.startsWith('```')) {
        const codeMatch = trimmed.match(/^```(\w+)?\n([\s\S]+?)```/);
        if (codeMatch) {
          return (
            <pre key={pIndex} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 overflow-x-auto mb-4">
              <code className="text-xs text-green-400">{codeMatch[2]}</code>
            </pre>
          );
        }
      }

      // Regular paragraph with inline formatting
      // If it's a single line that looks like a question, don't format as MCQ yet
      if (lines.length === 1) {
        const formattedParagraph = formatInlineText(trimmed);
        return (
          <p key={pIndex} className="text-sm leading-relaxed mb-3">
            {formattedParagraph}
          </p>
        );
      }
      
      // Multi-line content - check if it's a simple list or regular text
      const formattedParagraph = formatInlineText(trimmed);
      return (
        <div key={pIndex} className="text-sm leading-relaxed mb-3 whitespace-pre-line">
          {formattedParagraph}
        </div>
      );
    }).filter(Boolean);
  };

  // Format inline text (bold, italic, code)
  const formatInlineText = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // Match bold (**text** or __text__)
    const boldRegex = /(\*\*|__)(.+?)\1/g;
    // Match italic (*text* or _text_)
    const italicRegex = /(\*|_)(.+?)\1/g;
    // Match inline code (`code`)
    const codeRegex = /`(.+?)`/g;

    // Combine all matches
    const matches: Array<{ start: number; end: number; type: 'bold' | 'italic' | 'code'; text: string }> = [];
    
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, type: 'bold', text: match[2] });
    }
    while ((match = italicRegex.exec(text)) !== null) {
      if (!matches.some(m => m.start <= match!.index && m.end >= match!.index + match![0].length)) {
        matches.push({ start: match.index, end: match.index + match[0].length, type: 'italic', text: match[2] });
      }
    }
    while ((match = codeRegex.exec(text)) !== null) {
      if (!matches.some(m => m.start <= match!.index && m.end >= match!.index + match![0].length)) {
        matches.push({ start: match.index, end: match.index + match[0].length, type: 'code', text: match[1] });
      }
    }

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    matches.forEach((m) => {
      // Add text before match
      if (m.start > lastIndex) {
        parts.push(<span key={key++}>{text.substring(lastIndex, m.start)}</span>);
      }
      // Add formatted match
      if (m.type === 'bold') {
        parts.push(<strong key={key++} className="font-semibold">{m.text}</strong>);
      } else if (m.type === 'italic') {
        parts.push(<em key={key++} className="italic">{m.text}</em>);
      } else if (m.type === 'code') {
        parts.push(<code key={key++} className="bg-[#1f1f1f] px-1.5 py-0.5 rounded text-xs font-mono text-green-400">{m.text}</code>);
      }
      lastIndex = m.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  return <div className="message-content">{formatContent(text)}</div>;
}

