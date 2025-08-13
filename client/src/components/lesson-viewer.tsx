import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Video,
  CheckCircle,
  Circle,
  BookOpen,
  Play,
  ChevronRight,
  ChevronLeft,
  Star,
  Award,
  Target,
  Lightbulb,
  AlertCircle,
  FileText,
  MessageCircle,
  Brain
} from "lucide-react";
import type { Lesson } from "@shared/schema";
import { CitationRenderer } from "@/components/citation-renderer";
import RichTextViewer from "@/components/rich-text-viewer";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { QuizViewer } from "@/components/quiz-viewer";
import { CelebrationEffect } from "@/components/celebration-effect";
import { useCelebration } from "@/hooks/use-celebration";

interface LessonViewerProps {
  lesson: Lesson;
  moduleTitle?: string;
  isCompleted?: boolean;
  onComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  sourceReferences?: any[];
  onCitationClick?: (citationId: string) => void;
}

export function LessonViewer({
  lesson,
  moduleTitle,
  isCompleted = false,
  onComplete,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  sourceReferences = [],
  onCitationClick
}: LessonViewerProps) {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const timeTrackerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Celebration effects
  const {
    isVisible: celebrationVisible,
    celebrationData,
    hideCelebration,
    celebrateLesson,
    celebrateQuiz
  } = useCelebration();
  
  // Fetch quiz for this lesson
  const { data: quiz, error: quizError } = useQuery<{
    id: string;
    title: string;
    questions: Array<{
      question: string;
      type: 'multiple_choice' | 'true_false';
      options?: string[];
      correctAnswer: string;
      explanation?: string;
    }>;
    passingScore: number;
    maxAttempts?: number;
  }>({
    queryKey: [`/api/quizzes/lesson/${lesson.id}`],
    enabled: !!lesson.id,
    retry: false // Don't retry on 401 errors
  });

  // Debug logging
  useEffect(() => {
    if (quizError) {
      console.log('Quiz fetch error:', quizError);
    }
    if (quiz) {
      console.log('Quiz loaded:', quiz.title);
      console.log('Number of questions:', quiz.questions?.length);
    }
  }, [quiz, quizError]);

  // Function to track time spent on lesson
  const trackLessonTime = async () => {
    if (startTime && lesson.id) {
      const endTime = new Date();
      const timeSpentMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      if (timeSpentMinutes > 0) {
        try {
          await apiRequest("POST", "/api/learner/track-progress", {
            lessonId: lesson.id,
            timeSpent: timeSpentMinutes
          });
        } catch (error) {
          console.error("Failed to track lesson progress:", error);
        }
      }
    }
  };

  useEffect(() => {
    const lessonStartTime = new Date();
    setStartTime(lessonStartTime);
    
    // Track reading progress
    const handleScroll = () => {
      const element = document.getElementById('lesson-content');
      if (element) {
        const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
        setReadingProgress(Math.min(100, Math.max(0, scrollPercentage)));
      }
    };

    const contentElement = document.getElementById('lesson-content');
    contentElement?.addEventListener('scroll', handleScroll);
    
    // Set up periodic tracking (every 2 minutes)
    timeTrackerRef.current = setInterval(() => {
      trackLessonTime();
      setStartTime(new Date()); // Reset start time after tracking
    }, 120000); // 2 minutes
    
    // Cleanup function
    return () => {
      contentElement?.removeEventListener('scroll', handleScroll);
      
      // Track time when leaving the lesson
      trackLessonTime();
      
      // Clear the interval
      if (timeTrackerRef.current) {
        clearInterval(timeTrackerRef.current);
      }
    };
  }, [lesson.id]);



  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <Card className="mb-6 border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {moduleTitle && (
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">{moduleTitle}</span>
                </div>
              )}
              <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                {lesson.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {lesson.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{lesson.estimatedDuration} min</span>
                  </div>
                )}
                {lesson.videoUrl && (
                  <div className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    <span>Video included</span>
                  </div>
                )}
                <Badge variant={isCompleted ? "default" : "secondary"}>
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="w-3 h-3 mr-1" />
                      In Progress
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Reading Progress</span>
            <span>{Math.round(readingProgress)}%</span>
          </div>
          <Progress value={readingProgress} className="h-2" />
        </div>
      </Card>

      {/* Video Section */}
      {lesson.videoUrl && (
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <div className="relative bg-gray-900 aspect-video">
            <iframe
              src={lesson.videoUrl.replace('watch?v=', 'embed/')}
              title="Lesson Video"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Card className="mb-6 border-0 shadow-lg">
        <CardContent className="p-0">
          <ScrollArea id="lesson-content" className="h-[600px]">
            <div className="p-8">


              {/* Content - Rich Text without Citations */}
              <RichTextViewer 
                content={lesson.content}
                enableCitations={false}
                sourceReferences={[]}
                onCitationClick={() => {}}
                className="lesson-content"
              />


            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quiz Section */}
      {quiz && !showQuiz && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Test Your Knowledge</h3>
                  <p className="text-gray-600 text-sm">
                    {quizCompleted 
                      ? `You scored ${quizScore}% on the quiz`
                      : "Take a quiz to reinforce your learning"}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowQuiz(true)}
                variant={quizCompleted ? "outline" : "default"}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                {quizCompleted ? "Retake Quiz" : "Take Quiz"}
              </Button>
            </div>
            {quizCompleted && quizScore !== null && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Quiz completed with {quizScore}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Authentication Error Message for Quiz */}
      {quizError && !quiz && !showQuiz && (
        <Card className="border-0 shadow-lg border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Quiz Available</h3>
                <p className="text-gray-600 text-sm">
                  A quiz is available for this lesson. Please ensure you're logged in to access it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display Quiz */}
      {showQuiz && quiz && (
        <QuizViewer
          quiz={quiz}
          lessonId={lesson.id}
          onComplete={(passed, score) => {
            setQuizCompleted(true);
            setQuizScore(score);
            setShowQuiz(false);
            if (passed && !isCompleted) {
              onComplete?.();
            }
          }}
          onRetry={() => {
            setQuizCompleted(false);
            setQuizScore(null);
          }}
        />
      )}

      {/* Navigation and Actions */}
      {!showQuiz && (
        <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {hasPrevious && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await trackLessonTime();
                    onPrevious?.();
                  }}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Lesson
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {!isCompleted && onComplete && (
                <Button
                  onClick={async () => {
                    await trackLessonTime();
                    // Trigger lesson completion celebration
                    celebrateLesson(lesson.title, 10);
                    setTimeout(() => {
                      onComplete();
                    }, 1000); // Small delay to show celebration
                  }}
                  variant="default"
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </Button>
              )}
              
              {hasNext && (
                <Button
                  onClick={async () => {
                    await trackLessonTime();
                    onNext?.();
                  }}
                  variant={isCompleted ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  Next Lesson
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {isCompleted && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
              <Award className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-semibold">
                Congratulations! You've completed this lesson.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
      
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