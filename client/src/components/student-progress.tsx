import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  FileQuestion,
  Star,
  Zap,
  Calendar,
  BarChart3
} from "lucide-react";

interface StudentProgressProps {
  courseId: string;
  enrollmentId: string;
  userId: string;
}

export function StudentProgress({ courseId, enrollmentId, userId }: StudentProgressProps) {
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Fetch enrollment details with progress
  const { data: enrollment } = useQuery({
    queryKey: [`/api/enrollments/${enrollmentId}`],
    enabled: !!enrollmentId,
  });

  // Fetch quiz attempts for this enrollment
  const { data: quizAttempts = [] } = useQuery({
    queryKey: [`/api/enrollments/${enrollmentId}/quiz-attempts`],
    enabled: !!enrollmentId,
  });

  // Fetch progress records for lessons
  const { data: lessonProgress = [] } = useQuery({
    queryKey: [`/api/enrollments/${enrollmentId}/progress`],
    enabled: !!enrollmentId,
  });

  // Fetch course details
  const { data: course } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Calculate overall progress
  useEffect(() => {
    if (course && lessonProgress.length > 0) {
      const totalLessons = course.modules?.reduce((total: number, module: any) => 
        total + (module.lessons?.length || 0), 0) || 0;
      
      const completedLessons = lessonProgress.filter((p: any) => p.completed).length;
      
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      setOverallProgress(progress);
    }
  }, [course, lessonProgress]);

  // Calculate quiz statistics
  const calculateQuizStats = () => {
    if (!quizAttempts || quizAttempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passedQuizzes: 0,
        failedQuizzes: 0,
        bestScore: 0,
        recentScore: 0
      };
    }

    const totalAttempts = quizAttempts.length;
    const scores = quizAttempts.map((attempt: any) => attempt.score);
    const averageScore = scores.reduce((a: number, b: number) => a + b, 0) / totalAttempts;
    const passedQuizzes = quizAttempts.filter((attempt: any) => attempt.passed).length;
    const failedQuizzes = totalAttempts - passedQuizzes;
    const bestScore = Math.max(...scores);
    const recentScore = quizAttempts[quizAttempts.length - 1]?.score || 0;

    return {
      totalAttempts,
      averageScore,
      passedQuizzes,
      failedQuizzes,
      bestScore,
      recentScore
    };
  };

  const quizStats = calculateQuizStats();

  // Calculate module progress
  const getModuleProgress = (moduleId: string) => {
    if (!course || !lessonProgress) return 0;
    
    const module = course.modules?.find((m: any) => m.id === moduleId);
    if (!module || !module.lessons) return 0;
    
    const moduleLessonIds = module.lessons.map((l: any) => l.id);
    const completedModuleLessons = lessonProgress.filter((p: any) => 
      moduleLessonIds.includes(p.lessonId) && p.completed
    ).length;
    
    return module.lessons.length > 0 
      ? (completedModuleLessons / module.lessons.length) * 100 
      : 0;
  };

  // Get time spent learning
  const getTotalTimeSpent = () => {
    if (!lessonProgress) return 0;
    return lessonProgress.reduce((total: number, p: any) => 
      total + (p.timeSpent || 0), 0);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Overall Progress
            </span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {Math.round(overallProgress)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {lessonProgress.filter((p: any) => p.completed).length}
              </p>
              <p className="text-sm text-gray-600">Lessons Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatTime(getTotalTimeSpent())}
              </p>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {course?.modules?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Total Modules</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(quizStats.averageScore)}%
              </p>
              <p className="text-sm text-gray-600">Avg Quiz Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">Module Progress</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz Performance</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Module Progress Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Module by Module Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {course?.modules?.map((module: any, index: number) => {
                    const moduleProgress = getModuleProgress(module.id);
                    const isCompleted = moduleProgress === 100;
                    
                    return (
                      <div key={module.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              isCompleted ? 'bg-green-500' : 'bg-gray-400'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-6 h-6" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{module.title}</h4>
                              <p className="text-sm text-gray-600">
                                {module.lessons?.length || 0} lessons
                              </p>
                            </div>
                          </div>
                          <Badge variant={isCompleted ? "default" : "outline"}>
                            {Math.round(moduleProgress)}%
                          </Badge>
                        </div>
                        <Progress value={moduleProgress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Performance Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Quiz Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quiz Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Attempts</span>
                    <span className="font-bold">{quizStats.totalAttempts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="font-bold text-blue-600">
                      {Math.round(quizStats.averageScore)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Best Score</span>
                    <span className="font-bold text-green-600">
                      {Math.round(quizStats.bestScore)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Recent Score</span>
                    <span className="font-bold text-purple-600">
                      {Math.round(quizStats.recentScore)}%
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Passed</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {quizStats.passedQuizzes} quizzes
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Failed</span>
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        {quizStats.failedQuizzes} quizzes
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Quiz Attempts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="w-5 h-5" />
                  Recent Quiz Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {quizAttempts.slice(-5).reverse().map((attempt: any, index: number) => (
                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {attempt.passed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              Quiz #{quizAttempts.length - index}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(attempt.attemptedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={attempt.passed ? "default" : "destructive"}>
                          {Math.round(attempt.score)}%
                        </Badge>
                      </div>
                    ))}
                    {quizAttempts.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No quiz attempts yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Your Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* First Lesson Achievement */}
                <div className={`p-4 rounded-lg border-2 ${
                  lessonProgress.length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      lessonProgress.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}>
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium">First Steps</h4>
                      <p className="text-sm text-gray-600">Complete your first lesson</p>
                    </div>
                  </div>
                </div>

                {/* Quiz Master Achievement */}
                <div className={`p-4 rounded-lg border-2 ${
                  quizStats.passedQuizzes >= 5 ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      quizStats.passedQuizzes >= 5 ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}>
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium">Quiz Master</h4>
                      <p className="text-sm text-gray-600">Pass 5 quizzes</p>
                    </div>
                  </div>
                </div>

                {/* Perfect Score Achievement */}
                <div className={`p-4 rounded-lg border-2 ${
                  quizStats.bestScore === 100 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      quizStats.bestScore === 100 ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}>
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium">Perfect Score</h4>
                      <p className="text-sm text-gray-600">Get 100% on a quiz</p>
                    </div>
                  </div>
                </div>

                {/* Module Complete Achievement */}
                <div className={`p-4 rounded-lg border-2 ${
                  course?.modules?.some((m: any) => getModuleProgress(m.id) === 100) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      course?.modules?.some((m: any) => getModuleProgress(m.id) === 100)
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium">Module Master</h4>
                      <p className="text-sm text-gray-600">Complete a module</p>
                    </div>
                  </div>
                </div>

                {/* Dedicated Learner Achievement */}
                <div className={`p-4 rounded-lg border-2 ${
                  getTotalTimeSpent() >= 60 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      getTotalTimeSpent() >= 60 ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium">Dedicated Learner</h4>
                      <p className="text-sm text-gray-600">Study for 1 hour</p>
                    </div>
                  </div>
                </div>

                {/* Course Complete Achievement */}
                <div className={`p-4 rounded-lg border-2 ${
                  overallProgress === 100 ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      overallProgress === 100 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}>
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium">Course Champion</h4>
                      <p className="text-sm text-gray-600">Complete the course</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}