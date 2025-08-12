import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, calculateCourseLearningTime, formatLearningTime } from "@/lib/utils";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play, 
  Edit,
  Eye,
  MoreVertical,
  CheckCircle,
  Calendar,
  Target,
  Globe,
  Trash2,
  FileQuestion
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'processing' | 'published';
  language?: string;
  targetAudience?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;
  enrollmentCount?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  modules?: any[];
}

interface CourseCardProps {
  course: Course;
  onEdit?: () => void;
  onView?: () => void;
  onEnroll?: () => void;
  onContinue?: () => void;
  onDelete?: () => void;
  isEnrolled?: boolean;
  showEnrollButton?: boolean;
  progress?: number;
  className?: string;
}

export default function CourseCard({
  course,
  onEdit,
  onView,
  onEnroll,
  onContinue,
  onDelete,
  isEnrolled = false,
  showEnrollButton = false,
  progress = 0,
  className,
}: CourseCardProps) {
  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const lessonCount = course.modules?.reduce((total, module) => 
    total + (module.lessons?.length || 0), 0) || 0;

  // Calculate quiz count from modules and lessons
  const quizCount = course.modules?.reduce((total, module) => {
    let count = 0;
    // Check for module-level quiz
    if (module.quiz) count++;
    // Check for lesson-level quizzes
    if (module.lessons) {
      module.lessons.forEach((lesson: any) => {
        if (lesson.quiz) count++;
      });
    }
    return total + count;
  }, 0) || 0;

  // Calculate total learning time based on lesson content
  const totalLearningMinutes = calculateCourseLearningTime(course);
  const formattedLearningTime = formatLearningTime(totalLearningMinutes);

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={getStatusColor(course.status)}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </Badge>
              {course.difficultyLevel && (
                <Badge variant="outline" className={getDifficultyColor(course.difficultyLevel)}>
                  {course.difficultyLevel.charAt(0).toUpperCase() + course.difficultyLevel.slice(1)}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Course thumbnail or icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center ml-3 flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {course.description}
          </p>
        )}

        {/* Progress bar for enrolled courses */}
        {isEnrolled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.modules?.length || 0} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{lessonCount} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{totalLearningMinutes > 0 ? formattedLearningTime : 'Calculating...'}</span>
          </div>
          {quizCount > 0 ? (
            <div className="flex items-center gap-1">
              <FileQuestion className="w-4 h-4" />
              <span>{quizCount} quiz{quizCount !== 1 ? 'zes' : ''}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.enrollmentCount || 0} students</span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Updated {formatDate(course.updatedAt)}</span>
          </div>
          {course.language && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{course.language}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {course.rating && course.rating > 0 && (
          <div className="flex items-center gap-1 mb-4">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-900">{course.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">rating</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {showEnrollButton && !isEnrolled && onEnroll && (
            <Button onClick={onEnroll} className="w-full" size="sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Enroll Now
            </Button>
          )}

          {isEnrolled && onContinue && (
            <Button onClick={onContinue} className="w-full" size="sm">
              {progress === 100 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review Course
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                </>
              )}
            </Button>
          )}

          {!showEnrollButton && (
            <div className="flex gap-2">
              {onView && (
                <Button variant="outline" onClick={onView} className="flex-1" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              )}
              {onEdit && (
                <Button onClick={onEdit} className="flex-1" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }} 
                  variant="destructive" 
                  size="sm"
                  className="px-2"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Creator info for public courses */}
        {showEnrollButton && course.targetAudience && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Target audience: <span className="font-medium text-gray-700">{course.targetAudience}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
