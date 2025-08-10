import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { FileText, Quote } from "lucide-react";
import type { SourceReference } from "@shared/schema";

interface CitationRendererProps {
  content: string;
  sourceReferences: SourceReference[];
  onCitationClick?: (citationId: string) => void;
}

export function CitationRenderer({ 
  content, 
  sourceReferences, 
  onCitationClick 
}: CitationRendererProps) {
  const [renderedContent, setRenderedContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    // Parse content and replace citation markers with clickable citations
    const parsedContent = parseCitations(content, sourceReferences);
    setRenderedContent(parsedContent);
  }, [content, sourceReferences]);

  const parseCitations = (text: string, references: SourceReference[]) => {
    // Pattern to match citations like [1], [2], etc.
    const citationPattern = /\[(\d+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = citationPattern.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add citation
      const citationNumber = parseInt(match[1]) - 1;
      const reference = references[citationNumber];
      
      if (reference) {
        parts.push(
          <Citation
            key={`citation-${match.index}`}
            number={citationNumber + 1}
            reference={reference}
            onClick={() => onCitationClick?.(reference.id)}
          />
        );
      } else {
        // If reference not found, just display the number
        parts.push(
          <span key={`citation-${match.index}`} className="text-gray-400">
            {match[0]}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return <div className="citation-content">{renderedContent}</div>;
}

interface CitationProps {
  number: number;
  reference: SourceReference;
  onClick?: () => void;
}

function Citation({ number, reference, onClick }: CitationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="inline-flex items-center justify-center w-5 h-5 mx-0.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors cursor-pointer"
        >
          {number}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3" 
        side="top"
        onPointerDownOutside={() => setIsOpen(false)}
      >
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Quote className="w-4 h-4 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-700 flex-1">{reference.text}</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <FileText className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-gray-600">{reference.documentName}</span>
            {reference.pageNumber && (
              <span className="text-xs text-gray-500">• Page {reference.pageNumber}</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
              setIsOpen(false);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View in source panel →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to add citations to plain text
export function addCitationsToText(
  text: string,
  references: SourceReference[]
): string {
  // This function can be used by AI generation to add citation markers
  let citedText = text;
  
  references.forEach((ref, index) => {
    // Find the reference text in the content and add citation
    const refText = ref.text;
    const citationMarker = `[${index + 1}]`;
    
    // Simple replacement - in production, you'd want more sophisticated matching
    if (citedText.includes(refText)) {
      citedText = citedText.replace(
        refText,
        `${refText}${citationMarker}`
      );
    }
  });
  
  return citedText;
}