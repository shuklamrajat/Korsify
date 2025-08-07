import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Sparkles, 
  Brain,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Quote,
  Hash
} from "lucide-react";

interface Reference {
  id: string;
  type: 'document' | 'template' | 'ai_generated';
  title: string;
  excerpt: string;
  location?: string;
}

interface ReferenceTrackerProps {
  references?: {
    sources: Reference[];
  };
  onReferenceClick?: (reference: Reference) => void;
}

export default function ReferenceTracker({ references, onReferenceClick }: ReferenceTrackerProps) {
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!references || !references.sources || references.sources.length === 0) {
    return null;
  }

  const getIcon = (type: Reference['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'template':
        return <Sparkles className="w-4 h-4" />;
      case 'ai_generated':
        return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Reference['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'template':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ai_generated':
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const handleReferenceClick = (ref: Reference) => {
    setSelectedReference(ref);
    if (onReferenceClick) {
      onReferenceClick(ref);
    }
  };

  return (
    <div className="relative">
      {/* Inline Reference Indicator */}
      <div className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer group"
           onClick={() => setIsExpanded(!isExpanded)}>
        <BookOpen className="w-3 h-3" />
        <span className="font-medium">{references.sources.length} source{references.sources.length > 1 ? 's' : ''}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>

      {/* Expandable Reference Panel */}
      {isExpanded && (
        <Card className="absolute z-10 mt-2 w-96 shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Content References</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              <div className="p-4 space-y-3">
                {references.sources.map((ref) => (
                  <div
                    key={ref.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedReference?.id === ref.id ? 'ring-2 ring-primary' : ''
                    } ${getTypeColor(ref.type)}`}
                    onClick={() => handleReferenceClick(ref)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getIcon(ref.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{ref.title}</p>
                          {ref.location && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              <Hash className="w-2.5 h-2.5 mr-0.5" />
                              {ref.location}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-90 line-clamp-2">
                          <Quote className="w-2.5 h-2.5 inline mr-1" />
                          {ref.excerpt}
                        </p>
                      </div>
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Inline reference component for use within text
export function InlineReference({ referenceId, text, references }: {
  referenceId: string;
  text: string;
  references?: { sources: Reference[] };
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const reference = references?.sources.find(r => r.id === referenceId);
  
  if (!reference) {
    return <span>{text}</span>;
  }

  return (
    <span className="relative inline-block">
      <span 
        className="border-b border-dotted border-blue-500 cursor-help text-blue-700"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {text}
        <sup className="text-xs ml-0.5 text-blue-500">
          [{references?.sources.indexOf(reference)! + 1}]
        </sup>
      </span>
      
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-white rounded-lg shadow-lg border">
          <div className="flex items-start gap-2">
            {getIcon(reference.type)}
            <div className="flex-1">
              <p className="font-medium text-xs mb-1">{reference.title}</p>
              <p className="text-xs text-gray-600 line-clamp-2">{reference.excerpt}</p>
              {reference.location && (
                <p className="text-xs text-gray-500 mt-1">Location: {reference.location}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
  
  function getIcon(type: Reference['type']) {
    switch (type) {
      case 'document':
        return <FileText className="w-3 h-3 text-blue-500" />;
      case 'template':
        return <Sparkles className="w-3 h-3 text-purple-500" />;
      case 'ai_generated':
        return <Brain className="w-3 h-3 text-green-500" />;
    }
  }
}