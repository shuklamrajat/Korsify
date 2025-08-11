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

  const formatContent = (content: string) => {
    // Handle null or undefined content
    if (!content) {
      return <div className="text-gray-500 italic">No content available for this lesson.</div>;
    }

    // Decode HTML entities if present
    const decodeHTMLEntities = (text: string) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    // Check if content contains HTML tags
    const isHTML = /<[a-z][\s\S]*>/i.test(content);
    const decodedContent = isHTML ? content : decodeHTMLEntities(content);
    
    // Parse and enhance the content
    return (
      <div className="prose prose-lg max-w-none lesson-content">
        <style dangerouslySetInnerHTML={{ __html: `
          .lesson-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          .lesson-content h1 {
            color: #1a202c;
            font-size: 2.25rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 700;
            line-height: 1.2;
          }
          .lesson-content h2 {
            color: #2d3748;
            font-size: 1.875rem;
            margin-top: 1.75rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.5rem;
            line-height: 1.3;
          }
          .lesson-content h3 {
            color: #4a5568;
            font-size: 1.5rem;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
            font-weight: 600;
            line-height: 1.4;
          }
          .lesson-content p {
            color: #4a5568;
            line-height: 1.8;
            margin-bottom: 1.25rem;
            font-size: 1.125rem;
          }
          .lesson-content strong, .lesson-content b {
            font-weight: 600;
            color: #2d3748;
          }
          .lesson-content em, .lesson-content i {
            font-style: italic;
          }
          .lesson-content u {
            text-decoration: underline;
          }
          .lesson-content s {
            text-decoration: line-through;
          }
          .lesson-content ul, .lesson-content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
            color: #4a5568;
          }
          .lesson-content ul {
            list-style-type: disc;
          }
          .lesson-content ol {
            list-style-type: decimal;
          }
          .lesson-content li {
            margin: 0.5rem 0;
            line-height: 1.7;
          }
          .lesson-content blockquote {
            border-left: 4px solid #4299e1;
            background: #ebf8ff;
            padding: 1rem 1.5rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #2c5282;
            border-radius: 0 0.5rem 0.5rem 0;
          }
          .lesson-content code {
            background: #f7fafc;
            color: #e53e3e;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-family: 'Courier New', Courier, monospace;
          }
          .lesson-content pre {
            background: #1a202c;
            color: #e2e8f0;
            padding: 1.5rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            font-family: 'Courier New', Courier, monospace;
          }
          .lesson-content pre code {
            background: transparent;
            color: inherit;
            padding: 0;
          }
          .lesson-content img {
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            margin: 2rem auto;
            max-width: 100%;
            height: auto;
            display: block;
          }
          .lesson-content a {
            color: #4299e1;
            text-decoration: underline;
            transition: color 0.2s;
          }
          .lesson-content a:hover {
            color: #3182ce;
          }
          .lesson-content table {
            width: 100%;
            margin: 1.5rem 0;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .lesson-content th {
            background: #f7fafc;
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
            border: 1px solid #e2e8f0;
            color: #2d3748;
          }
          .lesson-content td {
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            color: #4a5568;
          }
          .lesson-content hr {
            margin: 2rem 0;
            border: none;
            height: 2px;
            background: linear-gradient(to right, transparent, #e2e8f0, transparent);
          }
          .lesson-content mark {
            background-color: #fef3c7;
            color: #92400e;
            padding: 0.125rem 0.25rem;
            border-radius: 0.125rem;
          }
          
          /* Special content blocks from rich text editor */
          .lesson-content .key-concept {
            background: #f0f9ff;
            border-left: 4px solid #0369a1;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0.5rem;
          }
          .lesson-content .example {
            background: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0.5rem;
          }
          .lesson-content .warning {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0.5rem;
          }
          .lesson-content .tip {
            background: #fefce8;
            border-left: 4px solid #ca8a04;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 0.5rem;
          }
          
          /* Text alignment classes */
          .lesson-content .text-left {
            text-align: left;
          }
          .lesson-content .text-center {
            text-align: center;
          }
          .lesson-content .text-right {
            text-align: right;
          }
          .lesson-content .text-justify {
            text-align: justify;
          }
        `}} />
        
        {sourceReferences.length > 0 ? (
          <CitationRenderer
            content={decodedContent}
            sourceReferences={sourceReferences}
            onCitationClick={onCitationClick}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: decodedContent }} />
        )}
      </div>
    );
  };

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
              {formatContent(lesson.content)}


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