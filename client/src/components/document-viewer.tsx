import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when document changes
    setIsLoading(true);
  }, [document.id]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">{document.fileName}</span>
          {sourceReferences.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sourceReferences.length} citations
            </Badge>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading document...</p>
            </div>
          </div>
        )}
        <DocViewer
          documents={[
            {
              uri: `/api/documents/${document.id}/file`,
              fileType: document.fileName.split('.').pop()?.toLowerCase() || 'txt',
              fileName: document.fileName
            }
          ]}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
              retainURLParams: false
            },
            pdfZoom: {
              defaultZoom: 1.0,
              zoomJump: 0.1
            },
            pdfVerticalScrollByDefault: true
          }}
          style={{
            height: '100%',
            backgroundColor: '#f9fafb'
          }}
          onDocumentLoadSuccess={() => setIsLoading(false)}
          onDocumentLoadError={() => {
            setIsLoading(false);
            console.error('Failed to load document');
          }}
        />
      </div>
    </div>
  );
}