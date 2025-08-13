import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { User } from "@shared/schema";
import { 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Award, 
  BarChart3,
  Calendar,
  Activity,
  Target,
  Brain,
  Trophy,
  Flame,
  CheckCircle
} from "lucide-react";

export default function LearnerAnalytics() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/learner/analytics"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600 mt-2">Track your progress and optimize your learning journey</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.currentStreak || 0} days</div>
              <p className="text-xs text-muted-foreground">
                Best: {analytics?.bestStreak || 0} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalStudyHours || 0}h</div>
              <p className="text-xs text-muted-foreground">
                This month: {analytics?.monthlyStudyHours || 0}h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Courses Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.coursesCompleted || 0}/{analytics?.coursesEnrolled || 0}</div>
              <Progress value={(analytics?.coursesCompleted || 0) / (analytics?.coursesEnrolled || 1) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quiz Score</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.averageQuizScore || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.quizzesPassed || 0} quizzes passed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Progress Overview</CardTitle>
                <CardDescription>
                  Track your progress across all enrolled courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Introduction to Machine Learning", progress: 65, lessons: "8/12", time: "2h left" },
                    { name: "Web Development Fundamentals", progress: 100, lessons: "15/15", time: "Completed" },
                    { name: "Data Science Basics", progress: 30, lessons: "4/15", time: "6h left" },
                    { name: "Python Programming", progress: 85, lessons: "17/20", time: "1h left" },
                  ].map((course, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{course.name}</h3>
                          <p className="text-sm text-gray-500">{course.lessons} lessons • {course.time}</p>
                        </div>
                        <span className="text-sm font-semibold">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Pace</CardTitle>
                <CardDescription>
                  Your learning speed compared to average
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Your Pace</p>
                      <p className="text-2xl font-bold text-primary">2.5 lessons/day</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Average Pace</p>
                      <p className="text-2xl font-bold">1.8 lessons/day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>You're learning 38% faster than average!</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed breakdown of your learning performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Quiz Performance</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>First Attempt Pass Rate</span>
                          <span>78%</span>
                        </div>
                        <Progress value={78} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Average Score</span>
                          <span>85%</span>
                        </div>
                        <Progress value={85} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Improvement Rate</span>
                          <span>92%</span>
                        </div>
                        <Progress value={92} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Subject Mastery</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Programming</span>
                          <span>90%</span>
                        </div>
                        <Progress value={90} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Data Science</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Machine Learning</span>
                          <span>68%</span>
                        </div>
                        <Progress value={68} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-3">Knowledge Retention</h3>
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">Retention Score</p>
                        <p className="text-sm text-gray-500">Based on quiz retakes and reviews</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">88%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Activity</CardTitle>
                <CardDescription>
                  Your study patterns and habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Study Time Distribution</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                        <div key={day} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">{day}</div>
                          <div className={`h-20 rounded ${i < 5 ? 'bg-primary' : 'bg-primary/30'}`} 
                               style={{ height: `${Math.random() * 60 + 20}px` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Peak Learning Hours</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Morning (6AM - 12PM)</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Afternoon (12PM - 6PM)</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Evening (6PM - 12AM)</span>
                        <span className="font-medium">40%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Today</span>
                        <span>Completed 3 lessons in Machine Learning</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Yesterday</span>
                        <span>Passed Python Programming quiz (92%)</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">2 days ago</span>
                        <span>Started Data Science Basics course</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Milestones</CardTitle>
                <CardDescription>
                  Celebrate your learning accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Recent Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { icon: Trophy, title: "Course Champion", desc: "Completed 5 courses", color: "text-yellow-500" },
                        { icon: Flame, title: "On Fire!", desc: "7-day learning streak", color: "text-orange-500" },
                        { icon: Brain, title: "Quiz Master", desc: "Perfect score on 10 quizzes", color: "text-purple-500" },
                        { icon: Target, title: "Goal Getter", desc: "Achieved monthly goal", color: "text-green-500" },
                      ].map((achievement, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                          <achievement.icon className={`h-8 w-8 ${achievement.color}`} />
                          <div>
                            <p className="font-medium">{achievement.title}</p>
                            <p className="text-sm text-gray-500">{achievement.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Upcoming Milestones</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Complete 10 courses</p>
                            <p className="text-xs text-gray-500">5 more to go</p>
                          </div>
                        </div>
                        <Progress value={50} className="w-20" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">100 hours of learning</p>
                            <p className="text-xs text-gray-500">23 hours remaining</p>
                          </div>
                        </div>
                        <Progress value={77} className="w-20" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">30-day streak</p>
                            <p className="text-xs text-gray-500">23 days to go</p>
                          </div>
                        </div>
                        <Progress value={23} className="w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}