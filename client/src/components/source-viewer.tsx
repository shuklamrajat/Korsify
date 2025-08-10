import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Quote, 
  ChevronRight, 
  FileSearch,
  X,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SourceReference } from "@shared/schema";

interface SourceViewerProps {
  sourceReferences: SourceReference[];
  documents: Array<{
    id: string;
    fileName: string;
    processedContent?: string;
  }>;
  onClose?: () => void;
  selectedCitationId?: string;
}

export function SourceViewer({ 
  sourceReferences, 
  documents, 
  onClose,
  selectedCitationId 
}: SourceViewerProps) {
  const [selectedReference, setSelectedReference] = useState<SourceReference | null>(null);
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedCitationId) {
      const ref = sourceReferences.find(r => r.id === selectedCitationId);
      if (ref) {
        setSelectedReference(ref);
        setExpandedDocuments(new Set([ref.documentId]));
      }
    }
  }, [selectedCitationId, sourceReferences]);

  // Group references by document
  const referencesByDocument = sourceReferences.reduce((acc, ref) => {
    if (!acc[ref.documentId]) {
      acc[ref.documentId] = [];
    }
    acc[ref.documentId].push(ref);
    return acc;
  }, {} as Record<string, SourceReference[]>);

  const toggleDocument = (docId: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocuments(newExpanded);
  };

  const getDocumentById = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
        : part
    );
  };

  const renderCitationNumber = (index: number) => (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
      {index + 1}
    </span>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Source References</h3>
            {sourceReferences.length > 0 && (
              <Badge variant="secondary">{sourceReferences.length} citations</Badge>
            )}
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {sourceReferences.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No source references available</p>
            <p className="text-xs mt-1">Citations will appear here when content is generated from documents</p>
          </div>
        ) : (
          <Tabs defaultValue="by-document" className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="by-document">By Document</TabsTrigger>
                <TabsTrigger value="all-citations">All Citations</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="by-document" className="mt-0 p-4 space-y-3">
              {Object.entries(referencesByDocument).map(([docId, refs]) => {
                const doc = getDocumentById(docId);
                const isExpanded = expandedDocuments.has(docId);
                
                return (
                  <Card key={docId} className="overflow-hidden">
                    <button
                      onClick={() => toggleDocument(docId)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm text-gray-900">
                          {doc?.fileName || 'Unknown Document'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {refs.length} citations
                        </Badge>
                      </div>
                      <ChevronRight 
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    
                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                          {refs.map((ref, index) => (
                            <div
                              key={ref.id}
                              onClick={() => setSelectedReference(ref)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedReference?.id === ref.id
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'bg-white hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {renderCitationNumber(sourceReferences.indexOf(ref))}
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700 line-clamp-3">
                                    <Quote className="w-3 h-3 inline mr-1 text-gray-400" />
                                    {ref.text}
                                  </p>
                                  {ref.pageNumber && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Page {ref.pageNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="all-citations" className="mt-0 p-4 space-y-2">
              {sourceReferences.map((ref, index) => {
                const doc = getDocumentById(ref.documentId);
                
                return (
                  <Card
                    key={ref.id}
                    onClick={() => setSelectedReference(ref)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedReference?.id === ref.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {renderCitationNumber(index)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-gray-600">
                            {doc?.fileName || 'Unknown Document'}
                          </span>
                          {ref.pageNumber && (
                            <span className="text-xs text-gray-500">
                              • Page {ref.pageNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">
                          <Quote className="w-3 h-3 inline mr-1 text-gray-400" />
                          {ref.text}
                        </p>
                        {ref.context && (
                          <p className="text-xs text-gray-500 mt-2 pl-4 border-l-2 border-gray-200">
                            {highlightText(ref.context, ref.text)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </ScrollArea>

      {/* Selected Reference Detail */}
      {selectedReference && (
        <div className="border-t bg-white p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Selected Citation</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReference(null)}
                className="h-6 px-2"
              >
                Clear
              </Button>
            </div>
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-sm text-gray-700">{selectedReference.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <FileText className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-gray-600">
                  {getDocumentById(selectedReference.documentId)?.fileName}
                </span>
                {selectedReference.pageNumber && (
                  <span className="text-xs text-gray-500">
                    • Page {selectedReference.pageNumber}
                  </span>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}