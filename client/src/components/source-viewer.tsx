import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  ChevronRight, 
  Search, 
  ExternalLink,
  Quote,
  BookOpen,
  Info,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { Document, SourceReference } from "@shared/schema";

interface SourceViewerProps {
  documents: Document[];
  sourceReferences?: SourceReference[];
  activeReference?: string;
  onReferenceClick?: (reference: SourceReference) => void;
}

interface ParsedContent {
  text: string;
  citations: { id: string; text: string; documentId: string }[];
}

export default function SourceViewer({
  documents,
  sourceReferences = [],
  activeReference,
  onReferenceClick
}: SourceViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  const citationRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Generate source guide summary
  const generateSourceGuide = () => {
    if (documents.length === 0) return null;

    return documents.map(doc => ({
      id: doc.id,
      title: doc.fileName,
      summary: `Document containing ${doc.processedContent?.length || 0} characters of content`,
      suggestedQuestions: [
        `What are the main topics in ${doc.fileName}?`,
        `Summarize the key points from ${doc.fileName}`,
        `How does ${doc.fileName} relate to the course objectives?`
      ]
    }));
  };

  const sourceGuide = generateSourceGuide();

  // Parse content with citations
  const parseContentWithCitations = (content: string): ParsedContent => {
    const citationPattern = /\[(\d+)\]/g;
    const citations: { id: string; text: string; documentId: string }[] = [];
    
    let parsedText = content;
    let match;
    
    while ((match = citationPattern.exec(content)) !== null) {
      const citationId = match[1];
      const reference = sourceReferences.find(ref => ref.id === citationId);
      
      if (reference) {
        citations.push({
          id: citationId,
          text: reference.text,
          documentId: reference.documentId
        });
      }
    }
    
    return { text: parsedText, citations };
  };

  // Handle citation hover
  const handleCitationHover = (citationId: string | null) => {
    setHoveredCitation(citationId);
  };

  // Handle citation click
  const handleCitationClick = (citationId: string) => {
    const reference = sourceReferences.find(ref => ref.id === citationId);
    if (reference) {
      setSelectedDocument(documents.find(doc => doc.id === reference.documentId) || null);
      if (onReferenceClick) {
        onReferenceClick(reference);
      }
    }
  };

  // Toggle source expansion
  const toggleSourceExpansion = (sourceId: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Source Panel */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Sources</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                className={`cursor-pointer transition-colors ${
                  selectedDocument?.id === doc.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDocument(doc)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <FileText className="w-4 h-4 mt-0.5 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{doc.fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(doc.fileSize / 1024).toFixed(1)} KB
                        </p>
                        {doc.status === 'completed' && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Processed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Source Guide */}
        {sourceGuide && sourceGuide.length > 0 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Source Guide</h4>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              {sourceGuide.slice(0, 2).map((guide) => (
                <div
                  key={guide.id}
                  className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    const doc = documents.find(d => d.id === guide.id);
                    if (doc) setSelectedDocument(doc);
                  }}
                >
                  <p className="font-medium truncate">{guide.title}</p>
                  <p className="text-gray-500 mt-1 line-clamp-2">{guide.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedDocument ? (
          <>
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <h3 className="font-semibold">{selectedDocument.fileName}</h3>
                    <p className="text-sm text-gray-500">
                      {sourceReferences.filter(ref => ref.documentId === selectedDocument.id).length} citations
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="content" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="citations">Citations</TabsTrigger>
                <TabsTrigger value="questions">Suggested Questions</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <div className="prose max-w-none">
                      {selectedDocument.processedContent ? (
                        <div className="whitespace-pre-wrap">
                          {selectedDocument.processedContent}
                        </div>
                      ) : (
                        <p className="text-gray-500">Content not yet processed</p>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="citations" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-4">
                    {sourceReferences
                      .filter(ref => ref.documentId === selectedDocument.id)
                      .map((reference, index) => (
                        <Card
                          key={reference.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleCitationClick(reference.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline">[{index + 1}]</Badge>
                              <div className="flex-1">
                                <Quote className="w-4 h-4 text-gray-400 mb-2" />
                                <p className="text-sm italic">"{reference.text}"</p>
                                {reference.context && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Context: {reference.context}
                                  </p>
                                )}
                                {reference.pageNumber && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Page {reference.pageNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="questions" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <div className="space-y-3">
                      {sourceGuide
                        ?.find(guide => guide.id === selectedDocument.id)
                        ?.suggestedQuestions.map((question, index) => (
                          <Card key={index} className="hover:bg-gray-50">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <BookOpen className="w-4 h-4 text-primary mt-0.5" />
                                <p className="text-sm">{question}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a source document to view</p>
            </div>
          </div>
        )}
      </div>

      {/* Citation Tooltip */}
      {hoveredCitation && (
        <div className="fixed z-50 bg-white border rounded-lg shadow-lg p-3 max-w-sm">
          {(() => {
            const reference = sourceReferences.find(ref => ref.id === hoveredCitation);
            const document = documents.find(doc => doc.id === reference?.documentId);
            return reference ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">[{hoveredCitation}]</Badge>
                  <span className="text-xs text-gray-500">{document?.fileName}</span>
                </div>
                <p className="text-sm">"{reference.text}"</p>
                <p className="text-xs text-gray-500 mt-2">Click to view in source</p>
              </>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}