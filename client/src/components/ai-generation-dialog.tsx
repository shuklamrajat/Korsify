import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Settings, 
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
  Check,
  Save,
  FileType,
  X
} from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: string;
}

interface ProcessingPhase {
  name: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

interface AiGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  documents: Document[];
  onComplete?: () => void;
}

const phaseDetails = {
  document_analysis: {
    title: "Analyzing Documents",
    icon: Search,
    message: "Extracting text and identifying key concepts..."
  },
  content_analysis: {
    title: "Analyzing Content", 
    icon: Sparkles,
    message: "Organizing content into logical modules..."
  },
  content_generation: {
    title: "Generating Modules",
    icon: Sparkles,
    message: "Creating lessons and educational content..."
  },
  validation: {
    title: "Validating Content",
    icon: Check,
    message: "Ensuring quality and coherence..."
  },
  finalization: {
    title: "Saving Generated Content",
    icon: Save,
    message: "Saving to database and updating course..."
  }
};

export default function AiGenerationDialog({
  open,
  onOpenChange,
  courseId,
  documents,
  onComplete
}: AiGenerationDialogProps) {
  const { toast } = useToast();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ProcessingPhase | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [customOptions, setCustomOptions] = useState<any>({});
  const [showCustomization, setShowCustomization] = useState(false);

  // Poll for processing status
  const { data: jobStatus } = useQuery({
    queryKey: ['/api/processing-jobs', processingJobId],
    enabled: !!processingJobId && processing,
    refetchInterval: 1000,
  });

  // Update current phase based on job status
  useEffect(() => {
    if (jobStatus) {
      setCurrentPhase({
        name: jobStatus.phase,
        progress: jobStatus.progress,
        status: jobStatus.status === 'processing' ? 'processing' : 
                jobStatus.status === 'completed' ? 'completed' : 
                jobStatus.status === 'failed' ? 'failed' : 'pending',
        message: jobStatus.error
      });

      if (jobStatus.status === 'completed') {
        setProcessing(false);
        setProcessingJobId(null);
        toast({
          title: "Generation Complete",
          description: "Your course content has been generated successfully!",
        });
        onComplete?.();
        onOpenChange(false);
      } else if (jobStatus.status === 'failed') {
        setProcessing(false);
        setProcessingJobId(null);
        toast({
          title: "Generation Failed",
          description: jobStatus.error || "Failed to generate course content",
          variant: "destructive",
        });
      }
    }
  }, [jobStatus, toast, onComplete, onOpenChange]);

  // Generate course mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/courses/generate-async", {
        courseId,
        documentIds: selectedDocuments,
        options: customOptions
      });
      return response.json();
    },
    onSuccess: (data) => {
      setProcessingJobId(data.jobId);
      setProcessing(true);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start course generation",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select at least one document to generate content from",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const toggleDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const availableDocuments = documents.filter(doc => doc.status === 'completed');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <DialogTitle>AI Course Generation</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" disabled={processing}>
                <HelpCircle className="w-4 h-4" />
              </Button>
              {!processing && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowCustomization(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!processing ? (
            <div className="space-y-6 p-6">
              {/* Header Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered Course Generation</h3>
                <p className="text-gray-600">
                  Select documents to analyze with AI and generate course content. 
                  Customize the generation process to better match your teaching style and audience.
                </p>
              </div>

              {/* Options Summary */}
              {Object.keys(customOptions).length > 0 && (
                <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        Customized Options ({Object.keys(customOptions).length})
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowCustomization(true)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(customOptions).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {key}: {value as string}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Document Selection */}
              <div>
                <h4 className="font-medium mb-3">Select Documents</h4>
                <div className="space-y-2">
                  {availableDocuments.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No documents available for generation</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Upload documents in the Documents tab first
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    availableDocuments.map((doc) => (
                      <Card 
                        key={doc.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedDocuments.includes(doc.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => toggleDocument(doc.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={selectedDocuments.includes(doc.id)}
                              onCheckedChange={() => toggleDocument(doc.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div className="flex-1">
                              <p className="font-medium">{doc.fileName}</p>
                              <p className="text-sm text-gray-500">
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc.fileType.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Processing State */}
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {currentPhase && phaseDetails[currentPhase.name] ? (
                      (() => {
                        const Icon = phaseDetails[currentPhase.name].icon;
                        return <Icon className="w-10 h-10 text-primary animate-pulse" />;
                      })()
                    ) : (
                      <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {currentPhase && phaseDetails[currentPhase.name] 
                      ? phaseDetails[currentPhase.name].title 
                      : 'Processing...'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {currentPhase && phaseDetails[currentPhase.name]
                      ? phaseDetails[currentPhase.name].message
                      : 'Please wait while we process your documents...'}
                  </p>
                </div>

                <div className="space-y-4">
                  {Object.entries(phaseDetails).map(([phaseName, phase]) => {
                    const isActive = currentPhase?.name === phaseName;
                    const isCompleted = currentPhase && 
                      Object.keys(phaseDetails).indexOf(phaseName) < 
                      Object.keys(phaseDetails).indexOf(currentPhase.name);
                    
                    return (
                      <div key={phaseName} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-100' :
                          isActive ? 'bg-primary/20' : 'bg-gray-100'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          ) : (
                            <phase.icon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            isActive ? 'text-primary' : 
                            isCompleted ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {phase.title}
                          </p>
                        </div>
                        {isActive && currentPhase && (
                          <span className="text-sm text-gray-500">
                            {currentPhase.progress}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {currentPhase && (
                  <Progress 
                    value={currentPhase.progress} 
                    className="h-2"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {!processing && (
          <div className="border-t p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Selected: {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={selectedDocuments.length === 0 || generateMutation.isPending}
                >
                  {generateMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Generate Course Content
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}