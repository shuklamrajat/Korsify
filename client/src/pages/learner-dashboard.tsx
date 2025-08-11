import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import CourseCard from "@/components/ui/course-card";
import { WelcomeWidget } from "@/components/WelcomeWidget";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search,
  BookOpen,
  Clock,
  CheckCircle,
  Zap,
  Trophy,
  Star,
  Filter,
  TrendingUp,
  Award,
  Play,
  Users,
  BarChart3
} from "lucide-react";

export default function LearnerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState<any>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);

  // Fetch user data
  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Fetch user enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  // Fetch all available courses with search query
  const { data: searchResults = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses/search", searchQuery],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/courses/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: true, // Always fetch to show all courses
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("POST", "/api/enrollments", { courseId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/search", searchQuery] });
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

  // Unenroll mutation
  const unenrollMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`);
      if (!response.ok) throw new Error("Failed to unenroll");
      return response.json();
    },
    onSuccess: () => {
      // Force immediate refetch instead of just invalidation for instant UI update
      queryClient.refetchQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/search", searchQuery] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/search"] }); // Also invalidate without search query
      toast({
        title: "Unenrolled successfully",
        description: "You have been removed from this course.",
      });
      setUnenrollDialogOpen(false);
      setCourseToUnenroll(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to unenroll",
        description: error.message || "Could not unenroll from the course",
        variant: "destructive",
      });
    },
  });

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId);
  };

  const handleContinueLearning = (courseId: string) => {
    console.log('Navigating to course:', courseId); // Debug log
    if (!courseId || typeof courseId !== 'string') {
      console.error('Invalid course ID:', courseId);
      toast({
        title: "Navigation Error",
        description: "Could not navigate to course. Invalid course ID.",
        variant: "destructive",
      });
      return;
    }
    setLocation(`/courses/${courseId}`);
  };

  // Long press handlers for unenroll
  const handleMouseDown = (enrollment: any) => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true);
      setCourseToUnenroll(enrollment);
      setUnenrollDialogOpen(true);
    }, 800); // 800ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressed(false);
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressed(false);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (enrollment: any) => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true);
      setCourseToUnenroll(enrollment);
      setUnenrollDialogOpen(true);
    }, 800);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressed(false);
  };

  const stats = [
    {
      title: "Enrolled Courses",
      value: enrollments.length.toString(),
      change: `${enrollments.filter((e: any) => e.progressPercentage < 100).length} in progress`,
      icon: BookOpen,
      color: "text-blue-600"
    },
    {
      title: "Completed",
      value: enrollments.filter((e: any) => e.progressPercentage === 100).length.toString(),
      change: `${enrollments.filter((e: any) => e.progressPercentage === 100).length} certificates`,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Learning Streak",
      value: "12",
      change: "days active",
      icon: Zap,
      color: "text-orange-600"
    },
    {
      title: "Study Time",
      value: "47h",
      change: "8h this week",
      icon: Clock,
      color: "text-purple-600"
    }
  ];

  const achievements = [
    {
      title: "First Course Completed",
      description: "Completed JavaScript Fundamentals",
      icon: Trophy,
      color: "bg-yellow-500"
    },
    {
      title: "Quick Learner",
      description: "Completed 3 modules in one week",
      icon: Zap,
      color: "bg-blue-500"
    },
    {
      title: "Perfect Score",
      description: "Scored 100% on React Basics quiz",
      icon: Star,
      color: "bg-green-500"
    }
  ];

  const filteredCourses = searchResults.filter((course: any) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Widget */}
        <div className="mb-8">
          <WelcomeWidget 
            user={user} 
            enrollments={enrollments}
            onBrowseCourses={() => {
              const tabList = document.querySelector('[role="tablist"]');
              const browseTab = tabList?.querySelector('[value="browse"]') as HTMLElement;
              browseTab?.click();
            }}
          />
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
                <div className="mt-4 flex items-center text-gray-600">
                  <stat.icon className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="learning" className="space-y-8">
          <TabsList>
            <TabsTrigger value="learning">My Learning</TabsTrigger>
            <TabsTrigger value="browse">Browse Courses</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Progress
              </Button>
            </div>

            {enrollmentsLoading ? (
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
            ) : enrollments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No enrolled courses</h3>
                  <p className="text-gray-600 mb-6">Discover and enroll in courses to start your learning journey.</p>
                  <Button onClick={() => {
                    const tabList = document.querySelector('[role="tablist"]');
                    const browseTab = tabList?.querySelector('[value="browse"]') as HTMLElement;
                    browseTab?.click();
                  }}>
                    <Search className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {enrollments.map((enrollment: any) => (
                  <Card 
                    key={enrollment.enrollment.id} 
                    className="hover:shadow-lg transition-shadow select-none"
                    onMouseDown={() => handleMouseDown(enrollment)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={() => handleTouchStart(enrollment)}
                    onTouchEnd={handleTouchEnd}
                    style={{ userSelect: 'none' }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{enrollment.course.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {enrollment.completedLessons} / {enrollment.totalLessons} lessons completed
                            </p>
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 max-w-xs">
                                <Progress value={enrollment.progressPercentage} className="h-2" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {Math.round(enrollment.progressPercentage)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Hold to unenroll</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleContinueLearning(enrollment.course.id)}
                          className="ml-4"
                        >
                          {enrollment.progressPercentage === 100 ? (
                            <>
                              <Trophy className="w-4 h-4 mr-2" />
                              Review
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Continue
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search all courses on the platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Browse all published courses from all creators on Korsify</p>

            {/* Display filtered courses */}
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
            ) : searchResults.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or browse all available courses.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((course: any) => {
                  const isEnrolled = enrollments.some((e: any) => e.course.id === course.id);
                  console.log('Course in browse:', course); // Debug log
                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEnroll={isEnrolled ? undefined : () => {
                        console.log('Enrolling in course:', course.id);
                        handleEnroll(course.id);
                      }}
                      onContinue={isEnrolled ? () => {
                        console.log('Continuing course:', course.id);
                        handleContinueLearning(course.id);
                      } : undefined}
                      isEnrolled={isEnrolled}
                      showEnrollButton={true}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Your Achievements</h2>
              <Badge variant="outline" className="text-sm">
                <Trophy className="w-4 h-4 mr-1" />
                3 Achievements
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <achievement.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep Learning!</h3>
                <p className="text-gray-600 mb-4">
                  Complete more courses and earn additional achievements. Your learning journey is just getting started!
                </p>
                <Button onClick={() => {
                  const tabList = document.querySelector('[role="tablist"]');
                  const browseTab = tabList?.querySelector('[value="browse"]') as HTMLElement;
                  browseTab?.click();
                }}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Explore More Courses
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Unenroll Confirmation Dialog */}
        <AlertDialog open={unenrollDialogOpen} onOpenChange={setUnenrollDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unenroll from Course?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unenroll from "{courseToUnenroll?.course?.title}"? 
                Your progress will be saved but you'll need to re-enroll to continue learning.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (courseToUnenroll?.enrollment?.id) {
                    unenrollMutation.mutate(courseToUnenroll.enrollment.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Unenroll
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
