import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Star,
  ChevronRight,
  Calendar,
  Trophy
} from "lucide-react";
import { useState, useEffect } from "react";

interface WelcomeWidgetProps {
  user: any;
  enrollments: any[];
  onBrowseCourses: () => void;
}

interface DailyInspiration {
  quote: string;
  author: string;
  tip: string;
  focus: string;
}

export function WelcomeWidget({ user, enrollments, onBrowseCourses }: WelcomeWidgetProps) {
  const [dailyInspiration, setDailyInspiration] = useState<DailyInspiration | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Daily inspirations based on learning themes
  const inspirations: DailyInspiration[] = [
    {
      quote: "The beautiful thing about learning is that no one can take it away from you.",
      author: "B.B. King",
      tip: "Focus on one concept at a time to build solid understanding.",
      focus: "Deep Learning"
    },
    {
      quote: "Education is the most powerful weapon which you can use to change the world.",
      author: "Nelson Mandela",
      tip: "Apply what you learn immediately to reinforce new knowledge.",
      focus: "Practical Application"
    },
    {
      quote: "The expert in anything was once a beginner.",
      author: "Helen Hayes",
      tip: "Celebrate small wins - every lesson completed is progress.",
      focus: "Growth Mindset"
    },
    {
      quote: "Learning never exhausts the mind.",
      author: "Leonardo da Vinci",
      tip: "Take breaks between study sessions to let your brain process.",
      focus: "Mindful Learning"
    },
    {
      quote: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
      author: "Dr. Seuss",
      tip: "Connect new concepts to things you already know.",
      focus: "Knowledge Building"
    },
    {
      quote: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.",
      author: "Pelé",
      tip: "Set daily learning goals to maintain consistent progress.",
      focus: "Consistency"
    },
    {
      quote: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
      author: "Brian Herbert",
      tip: "Question everything - curiosity is your best learning tool.",
      focus: "Curiosity"
    }
  ];

  useEffect(() => {
    // Get daily inspiration based on current date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const inspirationIndex = dayOfYear % inspirations.length;
    setDailyInspiration(inspirations[inspirationIndex]);

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const totalEnrollments = enrollments.length;
    const completedCourses = enrollments.filter((e: any) => e.progress?.completionPercentage === 100).length;
    
    if (totalEnrollments === 0) {
      return "Ready to start your learning journey? Explore our courses to begin!";
    }
    
    if (completedCourses > 0) {
      return `Amazing! You've completed ${completedCourses} course${completedCourses > 1 ? 's' : ''}. Keep up the excellent work!`;
    }
    
    return `You're enrolled in ${totalEnrollments} course${totalEnrollments > 1 ? 's' : ''}. Time to make some progress today!`;
  };

  const getPersonalizedGoal = () => {
    const inProgressCourses = enrollments.filter((e: any) => 
      e.progress?.completionPercentage > 0 && e.progress?.completionPercentage < 100
    );
    
    if (inProgressCourses.length > 0) {
      const course = inProgressCourses[0];
      const progress = course.progress?.completionPercentage || 0;
      return {
        text: `Continue "${course.course.title}" (${Math.round(progress)}% complete)`,
        action: "Continue Learning",
        courseId: course.course.id
      };
    }
    
    return {
      text: "Start a new learning adventure today",
      action: "Browse Courses",
      courseId: null
    };
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goal = getPersonalizedGoal();

  if (!dailyInspiration) return null;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {user?.firstName || 'Learner'}! 
            </h2>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate()}
            </div>
          </div>
          <div className="flex items-center bg-blue-100 rounded-full px-3 py-1">
            <Star className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-sm font-medium text-blue-700">Daily Inspiration</span>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-white/60 rounded-lg p-4 mb-4 border border-blue-200">
          <p className="text-gray-700 font-medium">{getMotivationalMessage()}</p>
        </div>

        {/* Daily Quote & Tip */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white/60 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start mb-2">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Today's Quote</h3>
                <blockquote className="text-sm text-gray-700 italic mb-2">
                  "{dailyInspiration.quote}"
                </blockquote>
                <p className="text-xs text-gray-500">— {dailyInspiration.author}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start mb-2">
              <Target className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Learning Tip</h3>
                  <Badge variant="secondary" className="text-xs">
                    {dailyInspiration.focus}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{dailyInspiration.tip}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Goal */}
        <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Today's Goal</h3>
                <p className="text-sm text-gray-600">{goal.text}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (goal.courseId) {
                  // Navigate to specific course
                  window.location.href = `/course/${goal.courseId}`;
                } else {
                  onBrowseCourses();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {goal.action}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-lg font-bold text-gray-900">{enrollments.length}</span>
            </div>
            <p className="text-xs text-gray-600">Enrolled Courses</p>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-lg font-bold text-gray-900">
                {enrollments.filter((e: any) => e.progress?.completionPercentage === 100).length}
              </span>
            </div>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 text-center border border-blue-200">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-purple-600 mr-1" />
              <span className="text-lg font-bold text-gray-900">
                {Math.round(enrollments.reduce((acc: number, e: any) => 
                  acc + (e.progress?.completionPercentage || 0), 0) / Math.max(enrollments.length, 1))}%
              </span>
            </div>
            <p className="text-xs text-gray-600">Avg Progress</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}