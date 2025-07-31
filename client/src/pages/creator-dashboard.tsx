import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/ui/file-upload";
import ProgressIndicator from "@/components/ui/progress-indicator";
import CourseCard from "@/components/ui/course-card";
import TemplateGallery from "@/components/ui/template-gallery";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Plus,
  Upload,
  BookOpen,
  Users,
  TrendingUp,
  Star,
  FileText,
  Settings,
  BarChart3,
  Zap,
  Brain,
  Sparkles
} from "lucide-react";

export default function CreatorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch user courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch user documents
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents"],
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest("POST", "/api/documents", formData);
      return response.json();
    },
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document uploaded successfully",
        description: "You can now generate a course from this document.",
      });
      setUploadingFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
      setUploadingFile(null);
    },
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: { title: string; description: string; tags?: string[] }) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      // Navigate to course editor
      setLocation(`/courses/${course.id}/edit`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create course",
        description: error.message || "Could not create course",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploadingFile(file);
    uploadMutation.mutate(file);
  };

  const handleCreateCourse = () => {
    // Show create course dialog
    // For now, create a default course
    createCourseMutation.mutate({
      title: "New Course",
      description: "Enter your course description here",
      tags: []
    });
  };

  const stats = [
    {
      title: "Total Courses",
      value: courses.length.toString(),
      change: "+2 this month",
      icon: BookOpen,
      color: "text-blue-600"
    },
    {
      title: "Total Students",
      value: "1,247",
      change: "+124 this month",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Completion Rate",
      value: "78%",
      change: "+5% this month",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Avg. Rating",
      value: "4.8",
      change: "Excellent",
      icon: Star,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.firstName || 'Creator'}! Manage your courses and track performance.</p>
          </div>
          <Button 
            size="lg" 
            className="mt-4 lg:mt-0"
            onClick={handleCreateCourse}
            disabled={createCourseMutation.isPending}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="courses" className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <TemplateGallery onCourseCreated={(courseId) => setLocation(`/courses/${courseId}/edit`)} />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>

            {coursesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-600 mb-6">Upload a document to create your first AI-powered course.</p>
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course: any) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEdit={() => setLocation(`/courses/${course.id}/edit`)}
                    onView={() => setLocation(`/courses/${course.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Uploaded Documents</h2>
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload New Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents uploaded</h3>
                  <p className="text-gray-600 mb-6">Upload your first document to start creating courses.</p>
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((document: any) => (
                  <Card key={document.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2 truncate">{document.fileName}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{document.fileType.toUpperCase()}</Badge>
                            <span className="text-sm text-gray-500">
                              {(document.fileSize / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Uploaded {new Date(document.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => handleGenerateCourse(document.id)}
                        disabled={generateCourseMutation.isPending}
                      >
                        {generateCourseMutation.isPending ? (
                          <>
                            <Settings className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Generate Course
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Create AI-Powered Course
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload a Document</h3>
                  <p className="text-gray-600 mb-6">
                    Upload your PDF, DOC, DOCX, TXT, or MD file and watch our AI transform it into a structured course.
                  </p>
                  
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.md"
                    maxSize={50 * 1024 * 1024}
                    className="mb-6"
                  />

                  {uploadingFile && (
                    <div className="mt-6">
                      <ProgressIndicator
                        title="Uploading document..."
                        progress={uploadMutation.isPending ? 50 : 100}
                        status={uploadMutation.isPending ? "processing" : "completed"}
                      />
                    </div>
                  )}

                  {generateCourseMutation.isPending && (
                    <div className="mt-6">
                      <ProgressIndicator
                        title="Generating course with AI..."
                        progress={75}
                        status="processing"
                        phases={[
                          { name: "Document Analysis", status: "completed" },
                          { name: "Content Analysis", status: "completed" },
                          { name: "Content Generation", status: "processing" },
                          { name: "Validation", status: "pending" },
                          { name: "Finalization", status: "pending" }
                        ]}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Generation Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      Powered by Google Gemini 2.5 Flash
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Supports PDF, DOC, DOCX, TXT, MD files
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-600" />
                      5-phase processing pipeline
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-600" />
                      Auto-generated quizzes and assessments
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden file input */}
      <input
        id="file-upload"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
    </div>
  );
}
