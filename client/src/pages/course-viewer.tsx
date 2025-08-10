import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Users,
  Star,
  Award,
  FileText,
  Video,
  BarChart3,
  Target,
  Brain,
  Globe
} from "lucide-react";
import { LessonViewer } from "@/components/lesson-viewer";

export default function CourseViewer() {
  const params = useParams();
  const courseId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debug logging
  console.log('CourseViewer params:', params);
  console.log('CourseViewer courseId:', courseId);
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Fetch course details
  const { data: course, isLoading, error } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });
  
  // Debug course fetch error
  useEffect(() => {
    if (error) {
      console.error('Error fetching course:', error);
    }
  }, [error]);

  // Fetch enrollments to check if user is enrolled
  const { data: enrollments = [] } = useQuery({
    queryKey: ["/api/enrollments"],
  });

  // Check enrollment status
  useEffect(() => {
    if (enrollments && courseId) {
      const enrollment = enrollments.find((e: any) => e.course.id === courseId);
      setIsEnrolled(!!enrollment);
    }
  }, [enrollments, courseId]);

  // Auto-select first module and lesson when course loads
  useEffect(() => {
    if (course && course.modules && course.modules.length > 0 && !selectedModule) {
      const firstModule = course.modules[0];
      setSelectedModule(firstModule.id);
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        setSelectedLesson(firstModule.lessons[0].id);
      }
    }
  }, [course, selectedModule]);

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/enrollments", { courseId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      setIsEnrolled(true);
      toast({
        title: "Enrolled successfully!",
        description: "You can now start learning this course.",
      });
    },
    onError: (error) => {
      toast({
        title: "Enrollment failed",
        description: error.message || "Failed to enroll in course",
        variant: "destructive",
      });
    },
  });

  // Progress update mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ enrollmentId, lessonId, completed, timeSpent }: any) => {
      const response = await apiRequest("POST", "/api/progress", {
        enrollmentId,
        lessonId,
        completed,
        timeSpent,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
  });

  const handleEnroll = () => {
    enrollMutation.mutate();
  };

  const handleLessonComplete = () => {
    if (!isEnrolled || !selectedLesson) return;
    
    const enrollment = enrollments.find((e: any) => e.course.id === courseId);
    if (enrollment) {
      updateProgressMutation.mutate({
        enrollmentId: enrollment.enrollment.id,
        lessonId: selectedLesson,
        completed: true,
        timeSpent: Math.floor(currentTime),
      });
    }
  };

  const navigateToNextLesson = () => {
    if (!course || !selectedModule || !selectedLesson) return;
    
    const currentModuleIndex = course.modules.findIndex((m: any) => m.id === selectedModule);
    const currentModule = course.modules[currentModuleIndex];
    const currentLessonIndex = currentModule.lessons.findIndex((l: any) => l.id === selectedLesson);
    
    // Try next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setSelectedLesson(currentModule.lessons[currentLessonIndex + 1].id);
    }
    // Try first lesson of next module
    else if (currentModuleIndex < course.modules.length - 1) {
      const nextModule = course.modules[currentModuleIndex + 1];
      setSelectedModule(nextModule.id);
      if (nextModule.lessons && nextModule.lessons.length > 0) {
        setSelectedLesson(nextModule.lessons[0].id);
      }
    }
  };

  const navigateToPreviousLesson = () => {
    if (!course || !selectedModule || !selectedLesson) return;
    
    const currentModuleIndex = course.modules.findIndex((m: any) => m.id === selectedModule);
    const currentModule = course.modules[currentModuleIndex];
    const currentLessonIndex = currentModule.lessons.findIndex((l: any) => l.id === selectedLesson);
    
    // Try previous lesson in current module
    if (currentLessonIndex > 0) {
      setSelectedLesson(currentModule.lessons[currentLessonIndex - 1].id);
    }
    // Try last lesson of previous module
    else if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1];
      setSelectedModule(prevModule.id);
      if (prevModule.lessons && prevModule.lessons.length > 0) {
        setSelectedLesson(prevModule.lessons[prevModule.lessons.length - 1].id);
      }
    }
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

  if (!course && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {error?.message?.includes('401') ? 'Please log in to view this course' : 'Course not found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {error?.message?.includes('401') 
                  ? 'You need to be logged in to access course content.' 
                  : 'The course you\'re looking for doesn\'t exist or is not available.'}
              </p>
              <div className="flex gap-3 justify-center">
                {error?.message?.includes('401') && (
                  <Button onClick={() => setLocation("/login")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Login
                  </Button>
                )}
                <Button 
                  variant={error?.message?.includes('401') ? "outline" : "default"}
                  onClick={() => setLocation("/learner")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedModuleData = selectedModule 
    ? course.modules?.find((m: any) => m.id === selectedModule)
    : null;
    
  const selectedLessonData = selectedLesson && selectedModuleData
    ? selectedModuleData.lessons?.find((l: any) => l.id === selectedLesson)
    : null;

  const enrollment = enrollments.find((e: any) => e.course.id === courseId);
  const progressPercentage = enrollment?.progressPercentage || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/learner")}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.estimatedDuration || 0} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.enrollmentCount || 0} students</span>
                </div>
                <Badge variant="outline">{course.difficultyLevel}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            {isEnrolled ? (
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {Math.round(progressPercentage)}% Complete
                  </div>
                  <Progress value={progressPercentage} className="w-32 h-2" />
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enrolled
                </Badge>
              </div>
            ) : (
              <Button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
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
                  Course Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="p-4 space-y-2">
                    {course.modules?.map((module: any, moduleIndex: number) => (
                      <div key={module.id} className="space-y-1">
                        <Button
                          variant={selectedModule === module.id ? "default" : "ghost"}
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => {
                            setSelectedModule(module.id);
                            if (module.lessons && module.lessons.length > 0) {
                              setSelectedLesson(module.lessons[0].id);
                            }
                          }}
                          disabled={!isEnrolled}
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
                        
                        {selectedModule === module.id && module.lessons && isEnrolled && (
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
                                  {lesson.videoUrl && (
                                    <Video className="w-3 h-3 text-blue-500 ml-auto" />
                                  )}
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
            {!isEnrolled ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{course.title}</h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    {course.description || "Discover comprehensive learning materials designed to help you master new skills."}
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900">
                        {course.modules?.length || 0} Modules
                      </div>
                      <div className="text-sm text-gray-600">Structured learning</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900">
                        {course.estimatedDuration || 0} Minutes
                      </div>
                      <div className="text-sm text-gray-600">Estimated time</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900 capitalize">
                        {course.difficultyLevel || 'Intermediate'}
                      </div>
                      <div className="text-sm text-gray-600">Difficulty level</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    {enrollMutation.isPending ? 'Enrolling...' : 'Start Learning Now'}
                  </Button>
                </CardContent>
              </Card>
            ) : selectedLessonData ? (
              <div className="space-y-6">
                {/* Lesson Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedLessonData.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{selectedLessonData.estimatedDuration || 5} min</span>
                          </div>
                          {selectedLessonData.videoUrl && (
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              <span>Video included</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={handleLessonComplete}
                        disabled={updateProgressMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Video Player */}
                {selectedLessonData.videoUrl && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Play className="w-16 h-16 mx-auto mb-4 opacity-70" />
                          <p className="text-lg font-medium">Video Player</p>
                          <p className="text-sm opacity-70">
                            Video URL: {selectedLessonData.videoUrl}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lesson Content */}
                <Card>
                  <CardContent className="p-6">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {selectedLessonData.content || "No content available for this lesson."}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={navigateToPreviousLesson}
                        disabled={course.modules[0]?.lessons[0]?.id === selectedLesson}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous Lesson
                      </Button>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Course Progress</div>
                        <div className="flex items-center gap-2">
                          <Progress value={progressPercentage} className="w-32 h-2" />
                          <span className="text-sm font-medium">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={navigateToNextLesson}
                        disabled={course.modules[course.modules.length - 1]?.lessons[course.modules[course.modules.length - 1]?.lessons.length - 1]?.id === selectedLesson}
                      >
                        Next Lesson
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a lesson to start learning</h3>
                  <p className="text-gray-600">Choose a lesson from the course content to begin your learning journey.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
