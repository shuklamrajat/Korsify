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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { User as UserIcon, Mail, Calendar, Award, BookOpen, Users, FileText, Camera } from "lucide-react";

interface CreatorAnalytics {
  totalCourses: number;
  totalLearners: number;
  totalLessons: number;
  averageRating: number;
  completionRate: number;
  engagementRate: number;
  recentActivity: Array<{
    date: string;
    enrollments: number;
    completions: number;
  }>;
}

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().optional(),
  expertise: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CreatorProfile() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      expertise: user?.expertise || "",
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

  const { data: stats } = useQuery<CreatorAnalytics>({
    queryKey: ["/api/creator/analytics"],
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
          <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and view your creator statistics</p>
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
                    <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Award className="h-4 w-4 mr-2 text-gray-500" />
                    <Badge variant="secondary">{user.currentRole}</Badge>
                  </div>
                </div>

                {/* Creator Stats */}
                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold text-sm">Creator Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.totalCourses || 0}
                      </div>
                      <div className="text-xs text-gray-500">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.totalLearners || 0}
                      </div>
                      <div className="text-xs text-gray-500">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.totalLessons || 0}
                      </div>
                      <div className="text-xs text-gray-500">Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(stats?.completionRate || 0)}%
                      </div>
                      <div className="text-xs text-gray-500">Completion</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
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
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Tell us about yourself..."
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

              <TabsContent value="professional" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription>
                      Share your expertise and professional background
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="expertise"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Areas of Expertise</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="e.g., Machine Learning, Web Development, Data Science..."
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <Label>Teaching Experience</Label>
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Courses Created</span>
                              <span className="font-semibold">{stats?.totalCourses || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total Students Taught</span>
                              <span className="font-semibold">{stats?.totalLearners || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Average Course Rating</span>
                              <span className="font-semibold">{stats?.averageRating ? stats.averageRating.toFixed(1) : "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        <Button type="submit" disabled={updateProfile.isPending}>
                          {updateProfile.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                      Customize your experience and notification settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Email Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm">New student enrollments</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm">Course completion notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm">Weekly progress reports</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm">Platform updates and news</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Privacy Settings</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm">Show profile to students</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm">Allow students to message me</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm">Display course statistics publicly</span>
                        </label>
                      </div>
                    </div>

                    <Button>Save Preferences</Button>
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