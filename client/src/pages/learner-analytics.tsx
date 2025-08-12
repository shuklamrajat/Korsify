import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart3,
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  Calendar,
  Target,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function LearnerAnalytics() {
  // Fetch learning metrics
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ["/api/learner/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/learner/metrics");
      return response.json();
    },
  });

  // Fetch enrollments for course breakdown
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const metrics = metricsData?.metrics || {};
  const weeklyData = metricsData?.weeklyData || [];
  const completedCourses = metricsData?.completedCourses || 0;

  // Format time helper
  const formatTime = (minutes: number) => {
    if (!minutes || minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Sample data for charts (in production, this would come from the API)
  const weeklyStudyData = [
    { day: 'Mon', minutes: 45 },
    { day: 'Tue', minutes: 60 },
    { day: 'Wed', minutes: 30 },
    { day: 'Thu', minutes: 90 },
    { day: 'Fri', minutes: 75 },
    { day: 'Sat', minutes: 120 },
    { day: 'Sun', minutes: 90 },
  ];

  const monthlyProgressData = [
    { month: 'Jan', courses: 2, lessons: 15 },
    { month: 'Feb', courses: 3, lessons: 22 },
    { month: 'Mar', courses: 2, lessons: 18 },
    { month: 'Apr', courses: 4, lessons: 30 },
    { month: 'May', courses: 3, lessons: 25 },
    { month: 'Jun', courses: 5, lessons: 35 },
  ];

  const courseProgressData = enrollments.map((enrollment: any) => ({
    name: enrollment.course.title.substring(0, 20) + '...',
    progress: enrollment.progressPercentage || 0,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const statsCards = [
    {
      title: "Total Study Time",
      value: formatTime(metrics.totalStudyTime || 0),
      change: `+${formatTime(metrics.weeklyStudyTime || 0)} this week`,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Learning Streak",
      value: `${metrics.currentStreak || 0} days`,
      change: `Longest: ${metrics.longestStreak || 0} days`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Courses Completed",
      value: completedCourses.toString(),
      change: `${enrollments.length} enrolled`,
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Average Progress",
      value: `${Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progressPercentage || 0), 0) / (enrollments.length || 1))}%`,
      change: "Across all courses",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600 mt-2">Track your learning progress and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-gray-500">{stat.change}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Study Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Weekly Study Time</span>
                <Calendar className="w-5 h-5 text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyStudyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} min`} />
                  <Bar dataKey="minutes" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Monthly Progress</span>
                <TrendingUp className="w-5 h-5 text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="courses" stroke="#8B5CF6" name="Courses" />
                  <Line type="monotone" dataKey="lessons" stroke="#10B981" name="Lessons" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Course Progress</span>
              <BookOpen className="w-5 h-5 text-gray-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseProgressData.length > 0 ? (
              <div className="space-y-4">
                {courseProgressData.map((course: any, index: number) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{course.name}</span>
                      <span className="text-sm text-gray-500">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No courses enrolled yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Learning Goals</span>
              <Target className="w-5 h-5 text-gray-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Daily Goal</h4>
                <p className="text-2xl font-bold text-blue-600">30 min</p>
                <Progress value={65} className="mt-2 h-2" />
                <p className="text-xs text-gray-600 mt-1">19 min completed today</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Weekly Goal</h4>
                <p className="text-2xl font-bold text-green-600">5 hours</p>
                <Progress value={80} className="mt-2 h-2" />
                <p className="text-xs text-gray-600 mt-1">4 hours completed</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Monthly Goal</h4>
                <p className="text-2xl font-bold text-purple-600">2 courses</p>
                <Progress value={50} className="mt-2 h-2" />
                <p className="text-xs text-gray-600 mt-1">1 course completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}