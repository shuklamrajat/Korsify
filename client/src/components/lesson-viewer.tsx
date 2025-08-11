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
  MessageCircle
} from "lucide-react";
import type { Lesson } from "@shared/schema";
import { CitationRenderer } from "@/components/citation-renderer";
import RichTextViewer from "@/components/rich-text-viewer";
import { apiRequest } from "@/lib/queryClient";

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
  const timeTrackerRef = useRef<NodeJS.Timeout | null>(null);

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


              {/* Content */}
              <RichTextViewer 
                content={lesson.content}
                enableCitations={sourceReferences.length > 0}
                sourceReferences={sourceReferences}
                onCitationClick={onCitationClick}
                className="lesson-content"
              />


            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Navigation and Actions */}
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
                    onComplete();
                  }}
                  variant="default"
                  className="flex items-center gap-2"
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
    </div>
  );
}