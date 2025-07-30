import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Save,
  Eye,
  ArrowLeft,
  Settings,
  BookOpen,
  FileText,
  Video,
  Image,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Clock,
  Users,
  Globe,
  Target,
  Zap,
  Edit3
} from "lucide-react";

export default function CourseEditor() {
  const params = useParams();
  const courseId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Fetch course details
  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  // Initialize editing state when course loads
  useEffect(() => {
    if (course && !editingCourse) {
      setEditingCourse({ ...course });
    }
  }, [course, editingCourse]);

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", `/api/courses/${courseId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Course saved successfully",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save course",
        description: error.message || "An error occurred while saving",
        variant: "destructive",
      });
    },
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, updates }: { lessonId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/lessons/${lessonId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Lesson updated",
        description: "Lesson changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update lesson",
        description: error.message || "An error occurred while updating the lesson",
        variant: "destructive",
      });
    },
  });

  const handleSaveCourse = () => {
    if (!editingCourse) return;
    
    const updates = {
      title: editingCourse.title,
      description: editingCourse.description,
      language: editingCourse.language,
      targetAudience: editingCourse.targetAudience,
      difficultyLevel: editingCourse.difficultyLevel,
      status: editingCourse.status,
    };
    
    updateCourseMutation.mutate(updates);
  };

  const handleUpdateLesson = (lessonId: string, updates: any) => {
    updateLessonMutation.mutate({ lessonId, updates });
  };

  const handlePublishCourse = () => {
    if (!editingCourse) return;
    
    const updates = { ...editingCourse, status: 'published' };
    setEditingCourse(updates);
    updateCourseMutation.mutate({ status: 'published' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !editingCourse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Course not found</h3>
              <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have permission to edit it.</p>
              <Button onClick={() => setLocation("/creator")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedModuleData = selectedModule 
    ? editingCourse.modules?.find((m: any) => m.id === selectedModule)
    : null;
    
  const selectedLessonData = selectedLesson && selectedModuleData
    ? selectedModuleData.lessons?.find((l: any) => l.id === selectedLesson)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/creator")}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Editor</h1>
              <p className="text-gray-600">Edit and customize your AI-generated course</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button
              onClick={handleSaveCourse}
              disabled={updateCourseMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            {editingCourse.status === 'draft' && (
              <Button
                onClick={handlePublishCourse}
                disabled={updateCourseMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Publish Course
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="p-4 space-y-2">
                    {editingCourse.modules?.map((module: any, moduleIndex: number) => (
                      <div key={module.id} className="space-y-1">
                        <Button
                          variant={selectedModule === module.id ? "default" : "ghost"}
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => {
                            setSelectedModule(module.id);
                            setSelectedLesson(null);
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-medium text-blue-600">
                              {moduleIndex + 1}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium truncate">{module.title}</div>
                              <div className="text-xs text-gray-500">
                                {module.lessons?.length || 0} lessons
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        {selectedModule === module.id && module.lessons && (
                          <div className="ml-6 space-y-1">
                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                              <Button
                                key={lesson.id}
                                variant={selectedLesson === lesson.id ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start text-left h-auto p-2"
                                onClick={() => setSelectedLesson(lesson.id)}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <div className="w-4 h-4 bg-gray-100 rounded text-xs flex items-center justify-center">
                                    {lessonIndex + 1}
                                  </div>
                                  <span className="truncate text-sm">{lesson.title}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="course" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="course">Course Details</TabsTrigger>
                <TabsTrigger value="content">Content Editor</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="course" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input
                          id="title"
                          value={editingCourse.title || ''}
                          onChange={(e) => setEditingCourse(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter course title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={editingCourse.status}
                          onValueChange={(value) => setEditingCourse(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editingCourse.description || ''}
                        onChange={(e) => setEditingCourse(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter course description"
                        rows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={editingCourse.language}
                          onValueChange={(value) => setEditingCourse(prev => ({ ...prev, language: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select
                          value={editingCourse.difficultyLevel}
                          onValueChange={(value) => setEditingCourse(prev => ({ ...prev, difficultyLevel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audience">Target Audience</Label>
                        <Input
                          id="audience"
                          value={editingCourse.targetAudience || ''}
                          onChange={(e) => setEditingCourse(prev => ({ ...prev, targetAudience: e.target.value }))}
                          placeholder="e.g., Developers, Students"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {editingCourse.modules?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Modules</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {editingCourse.modules?.reduce((acc: number, module: any) => 
                            acc + (module.lessons?.length || 0), 0) || 0}
                        </div>
                        <div className="text-sm text-gray-600">Lessons</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {editingCourse.estimatedDuration || 0}
                        </div>
                        <div className="text-sm text-gray-600">Minutes</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {editingCourse.enrollmentCount || 0}
                        </div>
                        <div className="text-sm text-gray-600">Students</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                {selectedLessonData ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5" />
                        Edit Lesson: {selectedLessonData.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="lesson-title">Lesson Title</Label>
                        <Input
                          id="lesson-title"
                          value={selectedLessonData.title}
                          onChange={(e) => {
                            const updatedCourse = { ...editingCourse };
                            const moduleIndex = updatedCourse.modules.findIndex((m: any) => m.id === selectedModule);
                            const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex((l: any) => l.id === selectedLesson);
                            updatedCourse.modules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                            setEditingCourse(updatedCourse);
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lesson-content">Lesson Content</Label>
                        <Textarea
                          id="lesson-content"
                          value={selectedLessonData.content}
                          onChange={(e) => {
                            const updatedCourse = { ...editingCourse };
                            const moduleIndex = updatedCourse.modules.findIndex((m: any) => m.id === selectedModule);
                            const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex((l: any) => l.id === selectedLesson);
                            updatedCourse.modules[moduleIndex].lessons[lessonIndex].content = e.target.value;
                            setEditingCourse(updatedCourse);
                          }}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                          <Input
                            id="lesson-duration"
                            type="number"
                            value={selectedLessonData.estimatedDuration || ''}
                            onChange={(e) => {
                              const updatedCourse = { ...editingCourse };
                              const moduleIndex = updatedCourse.modules.findIndex((m: any) => m.id === selectedModule);
                              const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex((l: any) => l.id === selectedLesson);
                              updatedCourse.modules[moduleIndex].lessons[lessonIndex].estimatedDuration = parseInt(e.target.value) || 0;
                              setEditingCourse(updatedCourse);
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lesson-video">Video URL (optional)</Label>
                          <Input
                            id="lesson-video"
                            value={selectedLessonData.videoUrl || ''}
                            onChange={(e) => {
                              const updatedCourse = { ...editingCourse };
                              const moduleIndex = updatedCourse.modules.findIndex((m: any) => m.id === selectedModule);
                              const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex((l: any) => l.id === selectedLesson);
                              updatedCourse.modules[moduleIndex].lessons[lessonIndex].videoUrl = e.target.value;
                              setEditingCourse(updatedCourse);
                            }}
                            placeholder="https://youtube.com/..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedLesson(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            const updates = {
                              title: selectedLessonData.title,
                              content: selectedLessonData.content,
                              estimatedDuration: selectedLessonData.estimatedDuration,
                              videoUrl: selectedLessonData.videoUrl,
                            };
                            handleUpdateLesson(selectedLessonData.id, updates);
                          }}
                          disabled={updateLessonMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Lesson
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a lesson to edit</h3>
                      <p className="text-gray-600">Choose a lesson from the course structure to start editing its content.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Course Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Visibility & Access</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Course Status</Label>
                          <Select
                            value={editingCourse.status}
                            onValueChange={(value) => setEditingCourse(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  Draft
                                </div>
                              </SelectItem>
                              <SelectItem value="published">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Published
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Danger Zone</h4>
                      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-red-900">Delete Course</h5>
                            <p className="text-sm text-red-700">
                              Permanently delete this course and all its content. This action cannot be undone.
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
