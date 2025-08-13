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
  Globe,
  ChevronLeft,
  ChevronRight,
  SidebarOpen
} from "lucide-react";
import { LessonViewer } from "@/components/lesson-viewer";
import { SourceViewer } from "@/components/source-viewer";
import { QuizViewer } from "@/components/quiz-viewer";
import { CelebrationEffect } from "@/components/celebration-effect";
import { useCelebration } from "@/hooks/use-celebration";
import { FileQuestion } from "lucide-react";

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
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [selectedQuizType, setSelectedQuizType] = useState<'lesson' | 'module' | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, any>>({});
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<string, any>>({});
  
  // Celebration effects
  const {
    isVisible: celebrationVisible,
    celebrationData,
    hideCelebration,
    celebrateLesson,
    celebrateModule,
    celebrateCourse,
    celebrateQuiz
  } = useCelebration();

  // Fetch course details
  const { data: course, isLoading, error } = useQuery<any>({
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
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  // Fetch course documents for source references
  const { data: documents = [] } = useQuery({
    queryKey: [`/api/courses/${courseId}/documents`],
    enabled: !!courseId && isEnrolled,
  });

  // Check enrollment status
  useEffect(() => {
    if (enrollments && courseId) {
      const enrollment = enrollments.find((e: any) => e.course.id === courseId);
      setIsEnrolled(!!enrollment);
    }
  }, [enrollments, courseId]);

  // Fetch quizzes for all lessons and modules
  useEffect(() => {
    if (course && course.modules && isEnrolled) {
      const fetchQuizzes = async () => {
        const lessonQuizzesTemp: Record<string, any> = {};
        const moduleQuizzesTemp: Record<string, any> = {};
        
        for (const module of course.modules) {
          // Try to fetch module quiz
          try {
            const moduleQuizRes = await fetch(`/api/quizzes/module/${module.id}`, {
              credentials: 'include'
            });
            if (moduleQuizRes.ok) {
              const moduleQuiz = await moduleQuizRes.json();
              if (moduleQuiz) {
                moduleQuizzesTemp[module.id] = moduleQuiz;
              }
            }
          } catch (err) {
            console.log(`No module quiz for ${module.id}`);
          }
          
          // Fetch quizzes for each lesson
          if (module.lessons) {
            for (const lesson of module.lessons) {
              try {
                const lessonQuizRes = await fetch(`/api/quizzes/lesson/${lesson.id}`, {
                  credentials: 'include'
                });
                if (lessonQuizRes.ok) {
                  const lessonQuiz = await lessonQuizRes.json();
                  if (lessonQuiz) {
                    lessonQuizzesTemp[lesson.id] = lessonQuiz;
                  }
                }
              } catch (err) {
                console.log(`No quiz for lesson ${lesson.id}`);
              }
            }
          }
        }
        
        setLessonQuizzes(lessonQuizzesTemp);
        setModuleQuizzes(moduleQuizzesTemp);
      };
      
      fetchQuizzes();
    }
  }, [course, isEnrolled]);

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
      // Find the current lesson and module
      const currentModule = course?.modules?.find((m: any) => m.id === selectedModule);
      const currentLesson = currentModule?.lessons?.find((l: any) => l.id === selectedLesson);
      
      if (currentLesson) {
        // Trigger lesson completion celebration
        celebrateLesson(currentLesson.title, 10);
        
        // Check if module is now complete
        const moduleProgress = currentModule?.lessons?.length || 0;
        const completedLessons = enrollment.progress?.filter((p: any) => 
          currentModule?.lessons?.some((l: any) => l.id === p.lessonId && p.completed)
        ).length || 0;
        
        // If this completes the module, celebrate that too
        if (completedLessons + 1 === moduleProgress) {
          setTimeout(() => {
            celebrateModule(currentModule.title, 50);
          }, 2000);
        }
        
        // Check if course is now complete
        const totalLessons = course?.modules?.reduce((total: number, module: any) => 
          total + (module.lessons?.length || 0), 0) || 0;
        const totalCompletedLessons = enrollment.completedLessons || 0;
        
        // If this completes the course, celebrate that too
        if (totalCompletedLessons + 1 === totalLessons) {
          setTimeout(() => {
            celebrateCourse(course.title, 200);
          }, 4000);
        }
      }
      
      updateProgressMutation.mutate({
        enrollmentId: enrollment.enrollment.id,
        lessonId: selectedLesson,
        completed: true,
        timeSpent: Math.floor(currentTime),
      });
    }
  };

  const handleCitationClick = (citationId: string) => {
    setSelectedCitationId(citationId);
    setShowSources(true);
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
                                {(() => {
                                  const lessonQuizCount = module.lessons?.filter((l: any) => lessonQuizzes[l.id]).length || 0;
                                  const hasModuleQuiz = moduleQuizzes[module.id] ? 1 : 0;
                                  const totalQuizzes = lessonQuizCount || hasModuleQuiz;
                                  return totalQuizzes > 0 ? ` • ${totalQuizzes} quiz${totalQuizzes > 1 ? 'zes' : ''}` : '';
                                })()}
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        {selectedModule === module.id && module.lessons && isEnrolled && (
                          <div className="ml-6 space-y-1">
                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                              <>
                                {/* Lesson Button */}
                                <Button
                                  key={lesson.id}
                                  variant={selectedLesson === lesson.id && !selectedQuiz ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start text-left h-auto p-2"
                                  onClick={() => {
                                    setSelectedLesson(lesson.id);
                                    setSelectedQuiz(null);
                                    setSelectedQuizType(null);
                                  }}
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
                                
                                {/* Quiz for this lesson (if exists) */}
                                {lessonQuizzes[lesson.id] && (
                                  <Button
                                    key={`quiz-${lesson.id}`}
                                    variant={selectedQuiz === lessonQuizzes[lesson.id].id ? "secondary" : "ghost"}
                                    size="sm"
                                    className="w-full justify-start text-left h-auto p-2 ml-4"
                                    onClick={() => {
                                      setSelectedQuiz(lessonQuizzes[lesson.id].id);
                                      setSelectedQuizType('lesson');
                                      setSelectedLesson(lesson.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <FileQuestion className="w-4 h-4 text-purple-500" />
                                      <span className="truncate text-sm text-purple-600">
                                        Quiz: {lessonQuizzes[lesson.id].title || 'Lesson Quiz'}
                                      </span>
                                    </div>
                                  </Button>
                                )}
                              </>
                            ))}
                            
                            {/* Module Quiz (if exists and no lesson quizzes) */}
                            {moduleQuizzes[module.id] && !Object.keys(lessonQuizzes).some(lessonId => 
                              module.lessons.some((l: any) => l.id === lessonId)
                            ) && (
                              <Button
                                key={`module-quiz-${module.id}`}
                                variant={selectedQuiz === moduleQuizzes[module.id].id ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start text-left h-auto p-2"
                                onClick={() => {
                                  setSelectedQuiz(moduleQuizzes[module.id].id);
                                  setSelectedQuizType('module');
                                  setSelectedLesson(null);
                                }}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <FileQuestion className="w-4 h-4 text-purple-500" />
                                  <span className="truncate text-sm text-purple-600">
                                    Module Quiz: {moduleQuizzes[module.id].title || 'Module Quiz'}
                                  </span>
                                </div>
                              </Button>
                            )}
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
            ) : selectedQuiz ? (
              // Display Quiz when selected
              <div className="relative">
                <div className="w-full">
                  <QuizViewer
                    quiz={selectedQuizType === 'lesson' ? lessonQuizzes[selectedLesson!] : moduleQuizzes[selectedModule!]}
                    lessonId={selectedQuizType === 'lesson' && selectedLesson ? selectedLesson : undefined}
                    moduleId={selectedQuizType === 'module' && selectedModule ? selectedModule : undefined}
                    onComplete={(passed, score) => {
                      // Find quiz title for celebration
                      const quizTitle = selectedQuizType === 'lesson' 
                        ? lessonQuizzes[selectedLesson || '']?.title || 'Lesson Quiz'
                        : moduleQuizzes[selectedModule || '']?.title || 'Module Quiz';
                      
                      // Trigger quiz celebration
                      celebrateQuiz(quizTitle, score, passed);
                      
                      toast({
                        title: passed ? "Quiz Passed!" : "Quiz Completed",
                        description: `You scored ${score}%`,
                        variant: passed ? "default" : "destructive"
                      });
                      
                      // Navigate to next lesson or quiz
                      if (passed) {
                        setTimeout(() => {
                          navigateToNextLesson();
                        }, 3000); // Delay to let celebration play
                      }
                    }}
                    onRetry={() => {
                      // Handle retry
                      console.log('Retrying quiz');
                    }}
                  />
                </div>
              </div>
            ) : selectedLessonData ? (
              <div className="relative">
                {/* Main Lesson Content - No Sources */}
                <div className="w-full">
                  {/* Use LessonViewer Component without citations */}
                  <LessonViewer
                    lesson={selectedLessonData}
                    moduleTitle={selectedModuleData?.title}
                    isCompleted={false}
                    onComplete={handleLessonComplete}
                    onNext={navigateToNextLesson}
                    onPrevious={navigateToPreviousLesson}
                    hasNext={!(course.modules[course.modules.length - 1]?.lessons[course.modules[course.modules.length - 1]?.lessons.length - 1]?.id === selectedLesson)}
                    hasPrevious={!(course.modules[0]?.lessons[0]?.id === selectedLesson)}
                    sourceReferences={[]}
                    onCitationClick={() => {}}
                  />
                </div>
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
      
      {/* Celebration Effect */}
      {celebrationData && (
        <CelebrationEffect
          isVisible={celebrationVisible}
          type={celebrationData.type}
          title={celebrationData.title}
          description={celebrationData.description}
          points={celebrationData.points}
          onComplete={hideCelebration}
        />
      )}
    </div>
  );
}
