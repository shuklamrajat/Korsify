import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  FileText, 
  Brain, 
  Upload,
  X,
  Plus,
  BookOpen,
  Zap,
  Users,
  Target,
  Clock,
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("blank");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);


  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      description: string; 
      tags?: string[];
      method: 'blank' | 'document';
      documentFiles?: File[];
    }) => {
      // First create the course
      const courseResponse = await apiRequest("POST", "/api/courses", {
        title: data.title,
        description: data.description,
        tags: data.tags
      });
      const course = await courseResponse.json();

      // If document method, upload and process
      if (data.method === 'document' && data.documentFiles && data.documentFiles.length > 0) {
        setIsUploading(true);
        
        // Upload each file
        for (let i = 0; i < data.documentFiles.length; i++) {
          const file = data.documentFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('courseId', course.id);
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / data.documentFiles.length) * 100));
          
          const uploadResponse = await apiRequest("POST", "/api/documents/process-for-course", formData);
          if (!uploadResponse.ok) {
            setIsUploading(false);
            setUploadProgress(0);
            throw new Error(`Failed to process document: ${file.name}`);
          }
        }
        
        setIsUploading(false);
        setUploadProgress(0);
      }



      return course;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course created!",
        description: activeTab === 'document' 
          ? "AI is processing your document..." 
          : "Your course has been created successfully"
      });
      onOpenChange(false);
      setLocation(`/courses/${course.id}/edit`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create course",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setCurrentTag("");
    setSelectedDocuments([]);
    setActiveTab("blank");
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleSubmit = () => {
    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a course title",
        variant: "destructive"
      });
      return;
    }

    createCourseMutation.mutate({
      title,
      description,
      tags,
      method: activeTab as 'blank' | 'document',
      documentFiles: selectedDocuments.length > 0 ? selectedDocuments : undefined
    });
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Course</DialogTitle>
          <DialogDescription>
            Choose how you want to create your course
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blank" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Start from Scratch
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI from Document
            </TabsTrigger>
          </TabsList>

          {/* Course Details (shown in all tabs) */}
          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="Enter your course title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Add a tag..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <TabsContent value="blank" className="mt-6">
            <Card className="p-6 bg-gray-50 border-dashed">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Manual Course Creation</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create your course structure manually. You'll be able to add modules, lessons, and quizzes step by step.
                </p>
                <div className="flex justify-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Full control
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Takes more time
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="document" className="mt-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-dashed">
              <div className="text-center">
                <Brain className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Upload a document and let AI create a complete course structure with content
                </p>
                
                <div className="mt-4">
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                      {selectedDocuments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {selectedDocuments.length} file{selectedDocuments.length > 1 ? 's' : ''} selected
                          </p>
                          {selectedDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">{doc.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedDocuments(selectedDocuments.filter((_, i) => i !== index));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Multiple files supported: PDF, DOC, DOCX, TXT, MD (max 50MB each)
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    id="document-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedDocuments(files);
                    }}
                  />
                </div>

                {/* Progress indicator */}
                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading documents...</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-center gap-4 text-sm text-gray-500 mt-4">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Fast creation
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="w-4 h-4" />
                    AI-generated content
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>


        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => {
            resetForm();
            onOpenChange(false);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              createCourseMutation.isPending || 
              !title || 
              isUploading ||
              (activeTab === 'document' && selectedDocuments.length === 0)
            }
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading {uploadProgress}%...
              </>
            ) : createCourseMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}