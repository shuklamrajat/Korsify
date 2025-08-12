import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Trophy,
  Star,
  Settings,
  Camera,
  Edit,
  Save,
  X
} from "lucide-react";

export default function LearnerProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  });

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Fetch enrollments
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  // Fetch learning metrics
  const { data: metricsData } = useQuery({
    queryKey: ["/api/learner/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/learner/metrics");
      return response.json();
    },
  });

  const metrics = metricsData?.metrics || {};
  const completedCourses = metricsData?.completedCourses || 0;

  // Initialize profile data when user data loads
  useState(() => {
    if (user) {
      setProfileData({
        name: user.name || user.email?.split('@')[0] || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
      });
    }
  });

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

  // Sample achievements (in production, these would come from the API)
  const achievements = [
    { id: 1, title: "First Course", description: "Completed your first course", icon: Award, earned: true },
    { id: 2, title: "Quick Learner", description: "Complete 5 lessons in one day", icon: Star, earned: true },
    { id: 3, title: "Week Warrior", description: "Study for 7 days in a row", icon: Trophy, earned: true },
    { id: 4, title: "Knowledge Seeker", description: "Enroll in 10 courses", icon: BookOpen, earned: false },
    { id: 5, title: "Master Student", description: "Complete 25 courses", icon: Award, earned: false },
    { id: 6, title: "Perfect Score", description: "Score 100% on 10 quizzes", icon: Star, earned: false },
  ];

  const handleSaveProfile = () => {
    // In production, this would save to the API
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
    setIsEditing(false);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                       user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full p-2"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Tell us about yourself"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-gray-900">{profileData.name || user?.email}</h1>
                      <p className="text-gray-600 mt-1">{profileData.bio || "Lifelong learner"}</p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {user?.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(user?.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSaveProfile} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{enrollments.length}</div>
              <div className="text-sm text-gray-600 mt-1">Courses Enrolled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{completedCourses}</div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{formatTime(metrics.totalStudyTime || 0)}</div>
              <div className="text-sm text-gray-600 mt-1">Total Study Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">{metrics.currentStreak || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Additional Information */}
        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${
                        achievement.earned
                          ? 'bg-white border-green-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <achievement.icon className={`w-5 h-5 ${
                            achievement.earned ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                        {achievement.earned && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Earned
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                {completedCourses > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {enrollments
                      .filter((e: any) => e.progressPercentage === 100)
                      .map((enrollment: any) => (
                        <div key={enrollment.enrollment.id} className="p-4 border rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">{enrollment.course.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Completed on {new Date(enrollment.enrollment.completedAt || Date.now()).toLocaleDateString()}
                          </p>
                          <Button size="sm" variant="outline">
                            <Award className="w-4 h-4 mr-2" />
                            View Certificate
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No certificates earned yet</p>
                    <p className="text-sm mt-1">Complete courses to earn certificates</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments.slice(0, 5).map((enrollment: any) => (
                    <div key={enrollment.enrollment.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{enrollment.course.title}</p>
                          <p className="text-sm text-gray-600">
                            {enrollment.progressPercentage}% complete • {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {enrollment.progressPercentage === 100 ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                  ))}
                  {enrollments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}