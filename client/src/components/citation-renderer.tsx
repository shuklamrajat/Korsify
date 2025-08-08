import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import type { SourceReference } from "@shared/schema";

interface CitationRendererProps {
  content: string;
  sourceReferences: SourceReference[];
  onCitationClick?: (reference: SourceReference) => void;
}

export default function CitationRenderer({
  content,
  sourceReferences,
  onCitationClick
}: CitationRendererProps) {
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  const [clickedCitation, setClickedCitation] = useState<string | null>(null);

  // Parse content and replace citations with interactive elements
  const renderContentWithCitations = () => {
    // Pattern to match citations like [1], [2], etc.
    const citationPattern = /\[(\d+)\]/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = citationPattern.exec(content)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      const citationId = match[1];
      const reference = sourceReferences.find(ref => ref.id === citationId);
      
      if (reference) {
        // Add interactive citation
        parts.push(
          <Popover key={`citation-${citationId}`} open={clickedCitation === citationId}>
            <PopoverTrigger asChild>
              <span
                className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-primary bg-primary/10 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                onMouseEnter={() => setHoveredCitation(citationId)}
                onMouseLeave={() => setHoveredCitation(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setClickedCitation(citationId === clickedCitation ? null : citationId);
                  if (onCitationClick) {
                    onCitationClick(reference);
                  }
                }}
              >
                [{citationId}]
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Source {citationId}
                  </Badge>
                  <span className="text-xs text-gray-500 truncate ml-2">
                    {reference.documentName}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm italic">"{reference.text}"</p>
                </div>
                
                {reference.context && (
                  <div className="text-xs text-gray-600">
                    <p className="font-medium mb-1">Context:</p>
                    <p className="line-clamp-3">{reference.context}</p>
                  </div>
                )}
                
                {reference.pageNumber && (
                  <p className="text-xs text-gray-400">
                    Page {reference.pageNumber}
                  </p>
                )}
                
                <div className="pt-2 border-t">
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      // Navigate to source document
                      if (onCitationClick) {
                        onCitationClick(reference);
                      }
                    }}
                  >
                    View in source document →
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      } else {
        // Citation without reference (fallback)
        parts.push(
          <span
            key={`citation-${citationId}`}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded"
          >
            [{citationId}]
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  // Render hover tooltip
  const renderHoverTooltip = () => {
    if (!hoveredCitation) return null;
    
    const reference = sourceReferences.find(ref => ref.id === hoveredCitation);
    if (!reference) return null;
    
    return (
      <div className="fixed z-50 pointer-events-none">
        <Card className="p-3 max-w-sm shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                [{hoveredCitation}]
              </Badge>
              <span className="text-xs text-gray-500 truncate">
                {reference.documentName}
              </span>
            </div>
            <p className="text-sm line-clamp-3">"{reference.text}"</p>
            <p className="text-xs text-gray-500">Click to view more</p>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="prose max-w-none">
        {renderContentWithCitations()}
      </div>
      {renderHoverTooltip()}
    </div>
  );
}

// Utility function to extract citations from content
export function extractCitations(content: string): string[] {
  const citationPattern = /\[(\d+)\]/g;
  const citations: string[] = [];
  let match;
  
  while ((match = citationPattern.exec(content)) !== null) {
    if (!citations.includes(match[1])) {
      citations.push(match[1]);
    }
  }
  
  return citations;
}

// Utility function to generate mock source references for testing
export function generateMockReferences(documentId: string, documentName: string, count: number): SourceReference[] {
  const references: SourceReference[] = [];
  
  for (let i = 1; i <= count; i++) {
    references.push({
      id: i.toString(),
      documentId,
      documentName,
      startOffset: i * 100,
      endOffset: (i * 100) + 50,
      text: `This is a sample text excerpt from the source document that provides evidence for the claim made in the lesson content.`,
      context: `This excerpt appears in the context of discussing key concepts and principles related to the course topic.`,
      pageNumber: Math.floor(Math.random() * 20) + 1
    });
  }
  
  return references;
}