import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { User } from "@shared/schema";
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  FileText, 
  Clock, 
  Award, 
  BarChart3,
  Calendar,
  Activity,
  Target
} from "lucide-react";

export default function CreatorAnalytics() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/creator/analytics"],
    enabled: !!user,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/creator/recent-activity"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Analytics</h1>
          <p className="text-gray-600 mt-2">Track your performance and understand your impact</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.activeCourses || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.totalCourses || 0} total courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.completionRate || 0}%</div>
              <Progress value={analytics?.completionRate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.engagementScore || 0}/10</div>
              <p className="text-xs text-muted-foreground">
                Based on student activity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>
                  Detailed analytics for each of your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">Introduction to AI</h3>
                        <p className="text-sm text-gray-500 mt-1">Created 2 weeks ago</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-semibold">156</div>
                          <div className="text-xs text-gray-500">Students</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">78%</div>
                          <div className="text-xs text-gray-500">Completion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">4.8</div>
                          <div className="text-xs text-gray-500">Rating</div>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Analytics</CardTitle>
                <CardDescription>
                  Understanding your student engagement and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Student Demographics</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Beginners</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Intermediate</span>
                          <span>35%</span>
                        </div>
                        <Progress value={35} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Advanced</span>
                          <span>20%</span>
                        </div>
                        <Progress value={20} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Learning Patterns</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Average Study Time</span>
                        <span className="font-semibold">2.5 hours/week</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Most Active Time</span>
                        <span className="font-semibold">7-9 PM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Preferred Content</span>
                        <span className="font-semibold">Video Lessons</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Quiz Pass Rate</span>
                        <span className="font-semibold">82%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>
                  Insights into your educational content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Document Processing</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">47</div>
                        <div className="text-xs text-gray-500">Total Documents</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">3.2 min</div>
                        <div className="text-xs text-gray-500">Avg Processing Time</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">95%</div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Quiz Analytics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Total Quizzes Created</span>
                        <span className="font-semibold">124</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average Questions per Quiz</span>
                        <span className="font-semibold">8</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Student Pass Rate</span>
                        <span className="font-semibold">82%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Most Challenging Topic</span>
                        <span className="font-semibold">Advanced Algorithms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>
                  Track your growth over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Monthly Overview</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Student Growth</span>
                        </div>
                        <span className="text-sm font-semibold">+23% this month</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Course Completions</span>
                        </div>
                        <span className="text-sm font-semibold">+15% this month</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">Engagement Rate</span>
                        </div>
                        <span className="text-sm font-semibold">+8% this month</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      {recentActivity?.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{activity.date}</span>
                          <span>{activity.description}</span>
                        </div>
                      )) || (
                        <>
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Today</span>
                            <span>15 new students enrolled</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Yesterday</span>
                            <span>New course published: "Advanced React"</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">2 days ago</span>
                            <span>8 students completed your course</span>
                          </div>
                        </>
                      )}
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