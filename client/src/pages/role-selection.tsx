import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, GraduationCap, ArrowRight, Sparkles, Users, PenTool, Brain } from "lucide-react";

export default function RoleSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"creator" | "learner" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose whether you want to create or learn",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update user role in backend
      const response = await apiRequest("POST", "/api/auth/update-role", {
        role: selectedRole
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Role selected!",
          description: `You're now in ${selectedRole} mode`
        });
        
        // Redirect to appropriate dashboard
        setLocation(selectedRole === "creator" ? "/creator" : "/learner");
      } else {
        throw new Error(data.message || "Failed to update role");
      }
    } catch (error: any) {
      console.error("Role update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Korsify!
          </h1>
          <p className="text-xl text-gray-600">
            How would you like to use the platform today?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Creator Card */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === "creator" 
                ? "ring-2 ring-primary shadow-lg" 
                : "hover:ring-1 hover:ring-gray-300"
            }`}
            onClick={() => setSelectedRole("creator")}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                {selectedRole === "creator" && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">Creator Mode</CardTitle>
              <CardDescription className="text-base">
                Create and manage AI-powered courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Brain className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-gray-700">Generate courses from documents with AI</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-gray-700">Use smart templates for quick course creation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-gray-700">Track student progress and engagement</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Learner Card */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === "learner" 
                ? "ring-2 ring-primary shadow-lg" 
                : "hover:ring-1 hover:ring-gray-300"
            }`}
            onClick={() => setSelectedRole("learner")}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                {selectedRole === "learner" && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">Learner Mode</CardTitle>
              <CardDescription className="text-base">
                Explore and learn from courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Access a wide variety of courses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Interactive lessons with quizzes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Track your learning progress</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg"
            onClick={handleRoleSelection}
            disabled={!selectedRole || isLoading}
            className="px-8 py-6 text-lg"
          >
            {isLoading ? "Setting up..." : "Continue"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          You can switch between roles anytime from your dashboard
        </p>
      </div>
    </div>
  );
}