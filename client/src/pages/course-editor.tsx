import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import AiGenerationDialog from "@/components/ai-generation-dialog";
import { SourceViewer } from "@/components/source-viewer";
import { CitationRenderer } from "@/components/citation-renderer";
import ModuleEditorDialog from "@/components/module-editor-dialog";
import LessonEditorDialog from "@/components/lesson-editor-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { CourseWithDetails, Document } from "@shared/schema";
import { 
  ArrowLeft,
  Save,
  Upload,
  BookOpen,
  FileText,
  Folder,
  Plus,
  Sparkles,
  School,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Layers,
  ScrollText,
  HelpCircle,
  ChevronRight,
  Image as ImageIcon,
  X,
  FileUp,
  Link
} from "lucide-react";

export default function CourseEditor() {
  const params = useParams();
  const courseId = params.id;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [showAiGeneration, setShowAiGeneration] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [activeSourceReference, setActiveSourceReference] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  
  // Debug logging
  console.log('CourseEditor params:', params);
  console.log('CourseEditor courseId:', courseId);
  
  // Form state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Fetch course data
  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useQuery<CourseWithDetails>({
    queryKey: ['/api/courses', courseId],
    enabled: !!courseId,
  });

  // Fetch course documents (documents linked to this course)
  const { data: courseDocuments = [], isLoading: courseDocumentsLoading } = useQuery<Document[]>({
    queryKey: [`/api/courses/${courseId}/documents`],
    enabled: !!courseId,
  });

  // Fetch all user documents (for selection dialog)
  const { data: allUserDocuments = [], isLoading: allDocumentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Initialize form with course data
  useEffect(() => {
    if (course) {
      setCourseTitle(course.title || "");
      setCourseDescription(course.description || "");
      setCoverImage(course.thumbnailUrl || null);
    }
  }, [course]);

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (updates: Partial<any>) => {
      await apiRequest("PATCH", `/api/courses/${courseId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
      toast({
        title: "Course updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update course",
        variant: "destructive",
      });
    },
  });

  // Upload document mutation - supports multiple files
  const uploadDocumentMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      
      // Add all files to formData
      Array.from(files).forEach((file) => {
        formData.append('documents', file);
      });
      
      // Add courseId if available
      if (courseId) {
        formData.append('courseId', courseId);
      }
      
      const response = await apiRequest("POST", "/api/documents/upload", formData);
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/documents`] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Documents uploaded",
        description: `Successfully uploaded ${result.count} document(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
      setLocation('/creator');
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  // Add documents to course mutation
  const addDocumentsMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      await apiRequest("POST", `/api/courses/${courseId}/documents`, { documentIds });
    },
    onSuccess: () => {
      toast({
        title: "Documents added",
        description: "Documents have been added to the course.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/documents`] });
      setShowDocumentSelector(false);
      setSelectedDocuments([]);
    },
    onError: (error) => {
      toast({
        title: "Failed to add documents",
        description: error.message || "Failed to add documents to course",
        variant: "destructive",
      });
    },
  });

  // Remove document from course mutation  
  const removeDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/courses/${courseId}/documents/${documentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Document removed",
        description: "Document has been removed from the course.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/documents`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove document",
        description: error.message || "Failed to remove document",
        variant: "destructive",
      });
    },
  });

  const handleSaveDetails = () => {
    updateCourseMutation.mutate({
      title: courseTitle,
      description: courseDescription,
      thumbnailUrl: coverImage,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.error('No files selected');
      return;
    }

    // Create FormData and append files
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('documents', files[i]);
    }
    
    // Add courseId if available
    if (courseId) {
      formData.append('courseId', courseId);
    }

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      // Refresh the documents list
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/documents`] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: "Documents uploaded",
        description: `Successfully uploaded ${result.count} document(s).`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      // Clear the input for re-upload
      event.target.value = '';
    }
  };

  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, just preview locally
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCourse = () => {
    deleteCourseMutation.mutate();
  };

  const handleAddDocuments = () => {
    if (selectedDocuments.length > 0) {
      addDocumentsMutation.mutate(selectedDocuments);
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    removeDocumentMutation.mutate(documentId);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm("Are you sure you want to delete this module? This will also delete all its lessons.")) {
      try {
        await apiRequest("DELETE", `/api/modules/${moduleId}`);
        toast({
          title: "Module deleted",
          description: "The module has been deleted successfully.",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      } catch (error: any) {
        toast({
          title: "Failed to delete module",
          description: error.message || "An error occurred while deleting the module.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      try {
        await apiRequest("DELETE", `/api/lessons/${lessonId}`);
        toast({
          title: "Lesson deleted",
          description: "The lesson has been deleted successfully.",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      } catch (error: any) {
        toast({
          title: "Failed to delete lesson",
          description: error.message || "An error occurred while deleting the lesson.",
          variant: "destructive",
        });
      }
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <Button onClick={() => setLocation("/creator")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    learners: course.enrollmentCount || 0,
    modules: course.modules?.length || 0,
    lessons: course.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0,
    quizzes: course.modules?.reduce((acc: number, mod: any) => acc + (mod.quiz ? 1 : 0), 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/creator")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold">Course Editor</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                {course.status}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button 
                size="sm"
                onClick={() => updateCourseMutation.mutate({ status: 'published' })}
                disabled={course.status === 'published'}
              >
                {course.status === 'published' ? 'Published' : 'Publish Course'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Cover Image Section */}
            <Card>
              <CardContent className="p-0">
                <div 
                  className="relative h-48 bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-t-lg overflow-hidden cursor-pointer group"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  {coverImage ? (
                    <img 
                      src={coverImage} 
                      alt="Course cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium">Add Cover Image</p>
                      <p className="text-sm text-gray-500 mt-1">
                        A compelling cover image significantly increases learner engagement and course enrollment
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm">
                      {coverImage ? 'Change Image' : 'Upload Image'}
                    </Button>
                  </div>
                </div>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageUpload}
                />
              </CardContent>
            </Card>

            {/* Course Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Course Title</label>
                  <Input
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Enter course title"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Course Description</label>
                  <Textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Enter course description"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveDetails}
                    disabled={updateCourseMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Course Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.learners}</p>
                    <p className="text-sm text-gray-600">Learners</p>
                  </div>
                  <div className="text-center">
                    <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.modules}</p>
                    <p className="text-sm text-gray-600">Modules</p>
                  </div>
                  <div className="text-center">
                    <ScrollText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.lessons}</p>
                    <p className="text-sm text-gray-600">Lessons</p>
                  </div>
                  <div className="text-center">
                    <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.quizzes}</p>
                    <p className="text-sm text-gray-600">Quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex gap-6">
              {/* Source Panel - Left Side */}
              {showSourcePanel && (
                <div className="w-96 flex-shrink-0">
                  <Card className="h-[calc(100vh-300px)] overflow-hidden">
                    <SourceViewer
                      sourceReferences={course?.modules?.flatMap(m => 
                        m.lessons?.flatMap(l => l.sourceReferences || []) || []
                      ) || []}
                      documents={courseDocuments.map(doc => ({
                        id: doc.id,
                        fileName: doc.fileName,
                        processedContent: doc.processedContent || undefined
                      }))}
                      selectedCitationId={activeSourceReference || undefined}
                      onClose={() => setShowSourcePanel(false)}
                    />
                  </Card>
                </div>
              )}
              
              {/* Main Content Area */}
              <div className="flex-1">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Course Content</h2>
                  <p className="text-gray-600">
                    Organize your course content by creating modules and lessons. Each module can contain multiple lessons.
                  </p>
                </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Modules</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingModule(null);
                        setShowModuleEditor(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => setShowAiGeneration(true)}
                      disabled={courseDocuments.length === 0}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {course.modules && course.modules.length > 0 ? (
                  <div className="space-y-4">
                    {course.modules.map((module: any, index: number) => (
                      <Card key={module.id} className="border-l-4 border-l-primary">
                        <CardHeader className="bg-primary/5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Folder className="w-5 h-5 text-primary" />
                              <div>
                                <h4 className="font-medium">
                                  {module.title.startsWith(`Module ${index + 1}:`) || module.title.startsWith(`Module ${index + 1} :`) 
                                    ? module.title 
                                    : `Module ${index + 1}: ${module.title}`}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingModule(module);
                                  setShowModuleEditor(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteModule(module.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                            <span>{module.lessons?.length || 0} lessons</span>
                            <span>{module.quiz ? '1 quiz' : 'No quiz'}</span>
                          </div>
                          <Separator className="mb-4" />
                          {module.lessons && module.lessons.length > 0 ? (
                            <div className="space-y-2">
                              {module.lessons.map((lesson: any, lessonIndex: number) => (
                                <div key={lesson.id}>
                                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-gray-500">{lessonIndex + 1}.</span>
                                      <span className="text-sm">{lesson.title}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedModuleId(module.id);
                                          setEditingLesson(lesson);
                                          setShowLessonEditor(true);
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Lesson Content with Citations */}
                                  {expandedLesson === lesson.id && (
                                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-medium text-sm">Lesson Content</h5>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setShowSourcePanel(!showSourcePanel)}
                                        >
                                          <FileText className="w-3 h-3 mr-1" />
                                          {showSourcePanel ? 'Hide' : 'Show'} Sources
                                        </Button>
                                      </div>
                                      {lesson.content ? (
                                        <CitationRenderer
                                          content={lesson.content}
                                          sourceReferences={lesson.sourceReferences || []}
                                          onCitationClick={(citationId) => {
                                            setActiveSourceReference(citationId);
                                            setShowSourcePanel(true);
                                          }}
                                        />
                                      ) : (
                                        <p className="text-sm text-gray-500">No content available</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No lessons yet</p>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-4"
                            onClick={() => {
                              setSelectedModuleId(module.id);
                              setEditingLesson(null);
                              setShowLessonEditor(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Lesson
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first module</p>
                    <Button
                      onClick={() => {
                        setEditingModule(null);
                        setShowModuleEditor(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Module
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>


              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Documents</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDocumentSelector(true)}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Add Existing
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => document.getElementById('doc-upload')?.click()}
                      disabled={uploadDocumentMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {courseDocumentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : courseDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {courseDocuments.map((doc: Document) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc.fileType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {doc.status === 'pending' && (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {doc.status === 'processing' && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-700 mr-1" />
                              Processing
                            </Badge>
                          )}
                          {doc.status === 'completed' && (
                            <Badge variant="default" className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {doc.status === 'failed' && (
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                            disabled={removeDocumentMutation.isPending}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No documents linked to this course</h3>
                    <p className="text-gray-600 mb-4">Add documents to use for AI module generation</p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => setShowDocumentSelector(true)}>
                        <Link className="w-4 h-4 mr-2" />
                        Add Existing Document
                      </Button>
                      <Button onClick={() => document.getElementById('doc-upload')?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Document
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Module Generation Card */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-amber-900">AI Module Generation</CardTitle>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => setShowAiGeneration(true)}
                    disabled={courseDocuments.length === 0}
                  >
                    Generate Modules
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800">
                  Use Gemini AI to automatically generate modules and lessons from your uploaded documents. 
                  The AI will analyze document content and create a structured learning experience for your students.
                </p>
                {courseDocuments.length > 0 && (
                  <div className="bg-amber-100 rounded p-3 mt-3">
                    <p className="text-sm text-amber-900">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      {courseDocuments.length} document{courseDocuments.length > 1 ? 's' : ''} ready for AI generation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hidden file input - supports multiple files */}
        <input
          id="doc-upload"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* AI Generation Dialog */}
        {showAiGeneration && (
          <AiGenerationDialog
            open={showAiGeneration}
            onOpenChange={setShowAiGeneration}
            courseId={courseId!}
            documents={courseDocuments}
            onComplete={async () => {
              // Force refresh all course-related data with a small delay to ensure DB writes are complete
              setTimeout(async () => {
                await queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
                await queryClient.refetchQueries({ queryKey: ['/api/courses', courseId] });
                // Also refresh documents in case they were processed
                await queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/documents`] });
                // Explicitly refetch the course data
                await refetchCourse();
                // Switch to content tab to show the new modules
                setActiveTab("content");
                // Show success message
                toast({
                  title: "Modules Generated Successfully",
                  description: "Your AI-generated modules are now ready. Check the Content tab to view and edit them.",
                });
              }, 1000); // Wait 1 second for DB writes to complete
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this course?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the course 
                "{course.title}" and all its modules, lessons, and associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteCourse}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Course
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Document Selector Dialog */}
        <Dialog open={showDocumentSelector} onOpenChange={setShowDocumentSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Documents to Course</DialogTitle>
              <DialogDescription>
                Select documents to add to this course for AI content generation
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {allUserDocuments.filter(doc => 
                  !courseDocuments.some(courseDoc => courseDoc.id === doc.id)
                ).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedDocuments.includes(doc.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDocuments([...selectedDocuments, doc.id]);
                        } else {
                          setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                        }
                      }}
                    />
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc.fileType.toUpperCase()}
                      </p>
                    </div>
                    {doc.status === 'completed' && (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </div>
                ))}
                {allUserDocuments.filter(doc => 
                  !courseDocuments.some(courseDoc => courseDoc.id === doc.id)
                ).length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No available documents to add. All your documents are already linked to this course.
                  </p>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowDocumentSelector(false);
                setSelectedDocuments([]);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddDocuments}
                disabled={selectedDocuments.length === 0 || addDocumentsMutation.isPending}
              >
                Add {selectedDocuments.length} Document{selectedDocuments.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Course Preview</DialogTitle>
              <DialogDescription>
                This is how your course will appear to learners
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Course Header */}
              <div className="relative">
                {coverImage ? (
                  <img 
                    src={coverImage} 
                    alt="Course cover" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg" />
                )}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">{course.title}</h1>
                  <Badge className="bg-white/90 text-black">
                    {course.difficultyLevel || 'Beginner'}
                  </Badge>
                </div>
              </div>

              {/* Course Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.modules}</p>
                  <p className="text-sm text-gray-600">Modules</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.lessons}</p>
                  <p className="text-sm text-gray-600">Lessons</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{course.estimatedDuration || 0} min</p>
                  <p className="text-sm text-gray-600">Duration</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-2">About this course</h2>
                <p className="text-gray-600">{course.description || 'No description provided'}</p>
              </div>

              {/* Course Content */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Course Content</h2>
                {course.modules && course.modules.length > 0 ? (
                  <div className="space-y-3">
                    {course.modules.map((module: any, index: number) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">
                            Module {index + 1}: {module.title}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {module.lessons?.length || 0} lessons
                          </span>
                        </div>
                        {module.description && (
                          <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                        )}
                        {module.lessons && module.lessons.length > 0 && (
                          <ul className="ml-4 space-y-1">
                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                              <li key={lesson.id} className="text-sm text-gray-700">
                                {lessonIndex + 1}. {lesson.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No course content available yet
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Source Viewer Dialog */}
        <Dialog open={showSourcePanel} onOpenChange={setShowSourcePanel}>
          <DialogContent className="max-w-6xl w-full h-[80vh] p-0">
            <SourceViewer
              documents={courseDocuments.map(doc => ({
                id: doc.id,
                fileName: doc.fileName,
                processedContent: doc.processedContent || undefined
              }))}
              sourceReferences={[]}
              selectedCitationId={activeSourceReference || undefined}
              onClose={() => setShowSourcePanel(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Module Editor Dialog */}
        {showModuleEditor && (
          <ModuleEditorDialog
            open={showModuleEditor}
            onOpenChange={setShowModuleEditor}
            courseId={courseId!}
            module={editingModule}
            onSuccess={() => {
              setShowModuleEditor(false);
              setEditingModule(null);
            }}
          />
        )}

        {/* Lesson Editor Dialog */}
        {showLessonEditor && (
          <LessonEditorDialog
            open={showLessonEditor}
            onOpenChange={setShowLessonEditor}
            courseId={courseId!}
            moduleId={selectedModuleId}
            lesson={editingLesson}
            onSuccess={() => {
              setShowLessonEditor(false);
              setEditingLesson(null);
            }}
          />
        )}
      </div>
    </div>
  );
}