import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SourceReference } from "@shared/schema";

interface DocumentViewerProps {
  document: {
    id: string;
    fileName: string;
    processedContent?: string;
  };
  sourceReferences: SourceReference[];
  selectedReferenceId?: string;
  onReferenceClick?: (ref: SourceReference) => void;
}

export function DocumentViewer({ 
  document, 
  sourceReferences, 
  selectedReferenceId,
  onReferenceClick 
}: DocumentViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set());
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Process content into lines with line numbers
  const getProcessedLines = () => {
    if (!document.processedContent) return [];
    return document.processedContent.split('\n');
  };

  const lines = getProcessedLines();

  // Find which lines contain references
  const findReferenceLines = () => {
    const refLines = new Map<number, SourceReference[]>();
    
    sourceReferences.forEach(ref => {
      if (ref.documentId === document.id && document.processedContent) {
        const refText = ref.text.toLowerCase();
        const contentLower = document.processedContent.toLowerCase();
        const index = contentLower.indexOf(refText);
        
        if (index !== -1) {
          // Calculate line number
          const beforeText = document.processedContent.substring(0, index);
          const lineNumber = beforeText.split('\n').length;
          
          if (!refLines.has(lineNumber)) {
            refLines.set(lineNumber, []);
          }
          refLines.get(lineNumber)?.push(ref);
        }
      }
    });
    
    return refLines;
  };

  const referenceLines = findReferenceLines();

  // Auto-scroll to selected reference
  useEffect(() => {
    if (selectedReferenceId && document.processedContent) {
      const ref = sourceReferences.find(r => r.id === selectedReferenceId);
      if (ref && ref.documentId === document.id) {
        const refText = ref.text.toLowerCase();
        const contentLower = document.processedContent.toLowerCase();
        const index = contentLower.indexOf(refText);
        
        if (index !== -1) {
          const beforeText = document.processedContent.substring(0, index);
          const lineNumber = beforeText.split('\n').length;
          
          // Highlight the lines containing the reference
          const refLength = ref.text.split('\n').length;
          const newHighlighted = new Set<number>();
          for (let i = lineNumber; i < lineNumber + refLength; i++) {
            newHighlighted.add(i);
          }
          setHighlightedLines(newHighlighted);
          
          // Scroll to the line
          setTimeout(() => {
            const element = lineRefs.current[lineNumber];
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    }
  }, [selectedReferenceId, document, sourceReferences]);

  // Filter lines based on search
  const shouldShowLine = (line: string, lineNumber: number) => {
    if (!searchTerm) return true;
    return line.toLowerCase().includes(searchTerm.toLowerCase()) || 
           highlightedLines.has(lineNumber);
  };

  // Highlight search terms in text
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">{document.fileName}</span>
          {sourceReferences.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sourceReferences.length} citations
            </Badge>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Document Content with Line Numbers */}
      <ScrollArea className="flex-1" ref={contentRef}>
        <div className="font-mono text-xs">
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const hasReference = referenceLines.has(lineNumber);
            const references = referenceLines.get(lineNumber) || [];
            const isHighlighted = highlightedLines.has(lineNumber);
            const isVisible = shouldShowLine(line, lineNumber);
            
            if (!isVisible && !isHighlighted) return null;
            
            return (
              <div
                key={lineNumber}
                ref={(el) => { lineRefs.current[lineNumber] = el; }}
                className={`
                  flex group hover:bg-gray-50 transition-colors
                  ${isHighlighted ? 'bg-blue-50 border-l-4 border-blue-400' : ''}
                  ${hasReference ? 'cursor-pointer' : ''}
                `}
                onClick={() => {
                  if (hasReference && references[0] && onReferenceClick) {
                    onReferenceClick(references[0]);
                  }
                }}
              >
                {/* Line Number */}
                <div className={`
                  w-12 px-2 py-1 text-right select-none flex-shrink-0
                  ${isHighlighted ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}
                `}>
                  {lineNumber}
                </div>
                
                {/* Line Content */}
                <div className="flex-1 px-3 py-1 whitespace-pre-wrap break-words">
                  {hasReference && (
                    <span className="inline-flex items-center gap-1 mr-2">
                      {references.map((ref, i) => {
                        const refIndex = sourceReferences.findIndex(r => r.id === ref.id);
                        return (
                          <Badge 
                            key={i}
                            variant="outline" 
                            className="text-xs px-1 py-0 h-5"
                          >
                            <Hash className="w-3 h-3 mr-0.5" />
                            {refIndex + 1}
                          </Badge>
                        );
                      })}
                    </span>
                  )}
                  <span>{searchTerm ? highlightSearchTerm(line) : line}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer with document stats */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>{lines.length} lines</span>
          <span>{referenceLines.size} referenced sections</span>
        </div>
      </div>
    </div>
  );
}