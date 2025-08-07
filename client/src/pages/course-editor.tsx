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
import type { CourseWithDetails } from "@shared/schema";
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
  Image as ImageIcon
} from "lucide-react";

export default function CourseEditor() {
  const params = useParams();
  const courseId = params.id;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [showAiGeneration, setShowAiGeneration] = useState(false);
  
  // Debug logging
  console.log('CourseEditor params:', params);
  console.log('CourseEditor courseId:', courseId);
  
  // Form state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery<CourseWithDetails>({
    queryKey: ['/api/courses', courseId],
    enabled: !!courseId,
  });

  // Fetch course documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<any[]>({
    queryKey: [`/api/courses/${courseId}/documents`],
    enabled: !!courseId,
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

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('courseId', courseId!);
      const response = await apiRequest("POST", "/api/documents/upload", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/documents`] });
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleSaveDetails = () => {
    updateCourseMutation.mutate({
      title: courseTitle,
      description: courseDescription,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate(file);
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
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm">
                Publish Course
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
            <div>
              <h2 className="text-xl font-semibold mb-2">Course Content</h2>
              <p className="text-gray-600 mb-6">
                Organize your course content by creating modules and lessons. Each module can contain multiple lessons.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Modules</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => setShowAiGeneration(true)}
                      disabled={documents.length === 0}
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
                                <h4 className="font-medium">Module {index + 1}: {module.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
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
                                <div key={lesson.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">{lessonIndex + 1}.</span>
                                    <span className="text-sm">{lesson.title}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No lessons yet</p>
                          )}
                          <Button variant="outline" size="sm" className="w-full mt-4">
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
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Module
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Help Section */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">AI-Powered Course Creation</h3>
                    <p className="text-amber-800 text-sm mb-3">
                      Let AI help you create your course content! Upload documents and our AI will analyze them to suggest modules and lessons.
                    </p>
                    {documents.length > 0 && (
                      <div className="bg-amber-100 rounded p-3 mb-3">
                        <p className="text-sm text-amber-900">
                          <ChevronRight className="w-4 h-4 inline mr-1" />
                          Click to preview what Gemini AI would generate
                        </p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                      Customize AI Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Documents</CardTitle>
                  <Button 
                    size="sm"
                    onClick={() => document.getElementById('doc-upload')?.click()}
                    disabled={uploadDocumentMutation.isPending}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc: any) => (
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
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No documents uploaded yet</h3>
                    <p className="text-gray-600 mb-4">Upload documents to use for AI module generation</p>
                    <Button onClick={() => document.getElementById('doc-upload')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
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
                    disabled={documents.length === 0}
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
                {documents.length > 0 && (
                  <div className="bg-amber-100 rounded p-3 mt-3">
                    <p className="text-sm text-amber-900">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      {documents.length} document{documents.length > 1 ? 's' : ''} ready for AI generation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hidden file input */}
        <input
          id="doc-upload"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* AI Generation Dialog */}
        {showAiGeneration && (
          <AiGenerationDialog
            open={showAiGeneration}
            onOpenChange={setShowAiGeneration}
            courseId={courseId!}
            documents={documents}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
              setActiveTab("content");
            }}
          />
        )}
      </div>
    </div>
  );
}