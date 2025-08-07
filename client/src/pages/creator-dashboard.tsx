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
import CreateCourseDialog from "@/components/ui/create-course-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { User, Course, Document } from "@shared/schema";
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Fetch user courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch user documents
  const { data: documents = [] } = useQuery<Document[]>({
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

  // Generate course from document mutation
  const generateCourseMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest("POST", "/api/courses/generate", { documentId });
      return response.json();
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course generated successfully!",
        description: "Your AI-powered course is ready to edit.",
      });
      // Navigate to course editor
      setLocation(`/courses/${course.id}/edit`);
    },
    onError: (error) => {
      toast({
        title: "Failed to generate course",
        description: error.message || "Could not generate course from document",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploadingFile(file);
    uploadMutation.mutate(file);
  };

  const handleCreateCourse = () => {
    setShowCreateDialog(true);
  };

  const handleGenerateCourse = (documentId: string) => {
    generateCourseMutation.mutate(documentId);
  };

  const stats = [
    {
      title: "Total Courses",
      value: courses?.length?.toString() || "0",
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
      <CreateCourseDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      
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
          <TabsList className="grid grid-cols-3 w-full max-w-xl">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
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
                  <p className="text-gray-600 mb-6">Create your first course to start teaching.</p>
                  <Button onClick={handleCreateCourse}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
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

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">1,247</p>
                    <p className="text-gray-600">Total Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">78%</p>
                    <p className="text-gray-600">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">4.8</p>
                    <p className="text-gray-600">Average Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
