import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock, 
  Target, 
  Camera,
  Trophy,
  TrendingUp,
  Flame
} from "lucide-react";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().optional(),
  learningGoals: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function LearnerProfile() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      learningGoals: "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormValues) => 
      apiRequest("/api/user/profile", "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/learner/stats"],
    enabled: !!user,
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learner Profile</h1>
          <p className="text-gray-600 mt-2">Track your learning journey and achievements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Award className="h-4 w-4 mr-2 text-gray-500" />
                    <Badge variant="secondary">{user.currentRole}</Badge>
                  </div>
                </div>

                {/* Learning Stats */}
                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold text-sm">Learning Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.coursesEnrolled || 0}
                      </div>
                      <div className="text-xs text-gray-500">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.coursesCompleted || 0}
                      </div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.totalStudyHours || 0}h
                      </div>
                      <div className="text-xs text-gray-500">Study Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary flex items-center justify-center">
                        {stats?.currentStreak || 0}
                        <Flame className="h-4 w-4 ml-1 text-orange-500" />
                      </div>
                      <div className="text-xs text-gray-500">Day Streak</div>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-sm mb-3">Recent Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Fast Learner
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Quiz Master
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      7-Day Streak
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings & Progress */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="progress">My Progress</TabsTrigger>
                <TabsTrigger value="goals">Learning Goals</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <Label>Email Address</Label>
                          <Input value={user.email} disabled className="mt-2" />
                          <p className="text-sm text-gray-500 mt-1">
                            Email cannot be changed for security reasons
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>About Me</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Tell us about yourself and your learning interests..."
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={updateProfile.isPending}>
                          {updateProfile.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Progress</CardTitle>
                    <CardDescription>
                      Track your progress across all enrolled courses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">Introduction to Machine Learning</h3>
                            <p className="text-sm text-gray-500">Started 2 weeks ago</p>
                          </div>
                          <Badge>In Progress</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">65%</span>
                          </div>
                          <Progress value={65} />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>8 of 12 lessons completed</span>
                            <span>Est. 2h remaining</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">Web Development Fundamentals</h3>
                            <p className="text-sm text-gray-500">Completed last week</p>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Final Score</span>
                            <span className="font-medium">92%</span>
                          </div>
                          <Progress value={100} className="bg-green-100" />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>All lessons completed</span>
                            <span>Certificate earned</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">Data Science Basics</h3>
                            <p className="text-sm text-gray-500">Started yesterday</p>
                          </div>
                          <Badge>New</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">15%</span>
                          </div>
                          <Progress value={15} />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>2 of 15 lessons completed</span>
                            <span>Est. 8h remaining</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Overall Statistics</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">85%</div>
                          <div className="text-xs text-gray-500">Avg. Score</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">47</div>
                          <div className="text-xs text-gray-500">Quizzes Passed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">12</div>
                          <div className="text-xs text-gray-500">Certificates</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Goals</CardTitle>
                    <CardDescription>
                      Set and track your learning objectives
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="learningGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>My Learning Goals</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="What do you want to achieve? (e.g., Master Python programming, Complete 5 courses this month)"
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <h3 className="font-medium mb-3">Goal Tracking</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm">Complete 3 courses this month</span>
                          </div>
                          <Badge variant="outline">2/3</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm">Study 20 hours per week</span>
                          </div>
                          <Badge variant="outline">18/20h</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-sm">Maintain 7-day streak</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Achieved!</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Recommended Next Steps</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Complete the Machine Learning course to unlock Advanced ML</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Take the Python assessment to earn your certificate</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Join the study group for collaborative learning</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => form.handleSubmit(onSubmit)()}
                      disabled={updateProfile.isPending}
                    >
                      Save Goals
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}