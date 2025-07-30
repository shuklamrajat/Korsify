import { useState } from "react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  FileText, 
  Globe, 
  BarChart3, 
  Brain, 
  Smartphone,
  Upload,
  Settings,
  Rocket,
  Star,
  CheckCircle,
  Clock,
  Play,
  Users,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("creator");

  const features = [
    {
      icon: Brain,
      title: "5-Phase AI Pipeline",
      description: "Advanced document analysis with Google Gemini 2.5 Flash, featuring intelligent content extraction and structure recognition.",
      tags: ["Document Analysis", "Content Generation", "Validation"],
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: FileText,
      title: "Multi-Format Processing",
      description: "Upload PDF, DOC, DOCX, TXT, and MD files with intelligent text extraction and OCR capabilities for scanned documents.",
      tags: ["PDF", "DOC/DOCX", "TXT/MD"],
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: Globe,
      title: "12+ Languages",
      description: "Generate courses in multiple languages with cultural context and localized examples for global audiences.",
      tags: ["English", "Spanish", "+10 More"],
      gradient: "from-yellow-500 to-yellow-600"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track learner progress, engagement metrics, and course performance with detailed analytics dashboards.",
      tags: ["Progress Tracking", "Engagement"],
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: Brain,
      title: "Adaptive Quizzes",
      description: "AI-generated assessments that adapt to learner performance with multiple question types and difficulty levels.",
      tags: ["Multiple Choice", "Adaptive"],
      gradient: "from-pink-500 to-red-500"
    },
    {
      icon: Smartphone,
      title: "Cross-Platform Access",
      description: "Responsive design that works seamlessly across desktop, tablet, and mobile devices with offline capabilities.",
      tags: ["Responsive", "PWA"],
      gradient: "from-teal-500 to-cyan-600"
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Upload Your Document",
      description: "Drag and drop your PDF, DOC, DOCX, TXT, or MD files. Our system supports up to 50MB files with intelligent validation and security scanning.",
      tags: ["PDF Support", "OCR Technology", "50MB Max"],
      icon: Upload
    },
    {
      number: 2,
      title: "AI Analysis & Processing",
      description: "Google Gemini 2.5 Flash analyzes your document through our 5-phase pipeline: Document Analysis, Content Analysis, Content Generation, Validation, and Finalization.",
      tags: ["Gemini 2.5 Flash", "Expert Persona", "5-Phase Pipeline"],
      icon: Settings
    },
    {
      number: 3,
      title: "Customize & Edit",
      description: "Review and customize your AI-generated course structure. Edit modules, lessons, add your own content, and adjust AI-generated quizzes to match your teaching style.",
      tags: ["Visual Editor", "Real-time Preview", "Drag & Drop"],
      icon: Settings
    },
    {
      number: 4,
      title: "Publish & Share",
      description: "Publish your course and share it with learners worldwide. Track enrollment, progress, and engagement through comprehensive analytics dashboards.",
      tags: ["Global Distribution", "Analytics", "Progress Tracking"],
      icon: Rocket
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Technical Training Manager",
      content: "Korsify turned my 50-page technical manual into a comprehensive course in just 15 minutes. The AI understood the content perfectly and created engaging quizzes that actually test understanding.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b152862c?w=40&h=40&fit=crop&crop=face"
    },
    {
      name: "Marcus Rodriguez",
      role: "Software Developer",
      content: "As a learner, I love how Korsify breaks down complex topics into digestible modules. The progress tracking keeps me motivated, and the mobile experience is seamless.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    },
    {
      name: "Dr. Amanda Foster",
      role: "Corporate Learning Director",
      content: "The multi-language support is incredible! I created the same course in English and Spanish, and the AI adapted cultural context perfectly. My global team loves it.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face"
    }
  ];

  const creatorStats = [
    { label: "Total Courses", value: "12", change: "+2 this month", icon: FileText },
    { label: "Total Students", value: "1,847", change: "+124 this month", icon: Users },
    { label: "Completion Rate", value: "78%", change: "+5% this month", icon: TrendingUp },
    { label: "Avg. Rating", value: "4.8", change: "Excellent", icon: Star }
  ];

  const learnerStats = [
    { label: "Enrolled Courses", value: "8", change: "3 in progress", icon: FileText },
    { label: "Completed", value: "5", change: "5 certificates", icon: CheckCircle },
    { label: "Learning Streak", value: "12", change: "days active", icon: Zap },
    { label: "Study Time", value: "47h", change: "8h this week", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Transform Documents into{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  AI-Powered Courses
                </span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-blue-100">
                Upload any document and watch Google Gemini AI create structured, interactive courses with modules, lessons, and quizzes in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => setLocation("/creator")}
                >
                  <Zap className="w-5 h-5" />
                  Start Creating Courses
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>12+ Languages</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>5 File Formats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  <span>Gemini 2.5 Flash</span>
                </div>
              </div>
            </div>

            {/* Hero Dashboard Preview */}
            <div className="relative animate-slide-up">
              <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-semibold text-lg">AI Course Generation</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-900 font-medium">Document Analysis</span>
                      </div>
                      <Badge variant="secondary" className="text-green-600 bg-green-100">Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-900 font-medium">Content Analysis</span>
                      </div>
                      <Badge variant="secondary" className="text-green-600 bg-green-100">Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-primary">
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-gray-900 font-medium">Content Generation</span>
                      </div>
                      <Badge className="text-blue-600 bg-blue-100">85%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600 font-medium">Validation</span>
                      </div>
                      <Badge variant="secondary" className="text-gray-400">Pending</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm">Generating: Advanced React Concepts</span>
                      <span className="text-primary text-sm font-medium">3 modules, 12 lessons</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful AI-Driven Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leverage cutting-edge AI technology to create engaging educational experiences for both creators and learners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Korsify Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From document upload to published course in just minutes with our AI-powered 5-phase processing pipeline
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className={`relative flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
                <div className="lg:w-1/2">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 text-lg mb-6">{step.description}</p>
                  <div className="flex flex-wrap gap-3">
                    {step.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <Card className="shadow-xl">
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <step.icon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-2">Step {step.number} Preview</h4>
                        <p className="text-gray-600">Interactive preview would be shown here</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Creator & Learner Dashboards</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored experiences for both course creators and learners with comprehensive analytics and progress tracking
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="creator">Creator Dashboard</TabsTrigger>
                <TabsTrigger value="learner">Learner Dashboard</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="creator" className="space-y-8">
              <Card className="bg-gray-50">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Creator Dashboard</h3>
                      <p className="text-gray-600">Manage your courses and track performance</p>
                    </div>
                    <Button className="mt-4 lg:mt-0" onClick={() => setLocation("/creator")}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Create New Course
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {creatorStats.map((stat, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-600 text-sm">{stat.label}</p>
                              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <stat.icon className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className="text-sm">{stat.change}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learner" className="space-y-8">
              <Card className="bg-gray-50">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">My Learning Dashboard</h3>
                      <p className="text-gray-600">Track your progress and continue learning</p>
                    </div>
                    <Button className="mt-4 lg:mt-0" onClick={() => setLocation("/learner")}>
                      <FileText className="w-4 h-4 mr-2" />
                      Browse Courses
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {learnerStats.map((stat, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-600 text-sm">{stat.label}</p>
                              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <stat.icon className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center text-blue-600">
                            <stat.icon className="w-4 h-4 mr-1" />
                            <span className="text-sm">{stat.change}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Course Generation Demo */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">See AI Course Creation in Action</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Watch how a simple document transforms into a fully structured course with our 5-phase AI pipeline
            </p>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Upload Your Document</h3>
                  <div className="border-2 border-dashed border-primary rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">React_Advanced_Concepts.pdf</p>
                    <p className="text-sm text-gray-600 mb-4">2.4 MB • PDF Document</p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>File validated and uploaded</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. AI Processing Results</h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Detected Modules:</span>
                        <span className="text-primary font-semibold">3</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Generated Lessons:</span>
                        <span className="text-primary font-semibold">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Quiz Questions:</span>
                        <span className="text-primary font-semibold">24</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Estimated Duration:</span>
                        <span className="text-primary font-semibold">4 hours</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Generated Course Title:</p>
                      <p className="font-semibold text-gray-900">"Advanced React Development: Hooks, Context, and Performance Optimization"</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" onClick={() => setLocation("/creator")}>
                  <Zap className="w-5 h-5 mr-2" />
                  Try Course Generation Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from creators and learners who've transformed their educational experiences with Korsify
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-500">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600 text-sm">5.0</span>
                  </div>
                  <p className="text-gray-600 mb-6">{testimonial.content}</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Documents into Courses?
          </h2>
          <p className="text-xl lg:text-2xl mb-8 text-blue-100">
            Join thousands of creators and learners who are revolutionizing education with AI-powered course generation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              onClick={() => setLocation("/creator")}
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Creating for Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10"
            >
              <Award className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>5-minute setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Korsify</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Transform any document into engaging, AI-powered courses with Google Gemini 2.5 Flash. Join the future of educational content creation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-6">Product</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-6">Support</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Korsify. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
