import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { User } from "@shared/schema";
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Video, 
  FileText,
  ChevronDown,
  Search,
  Send,
  ExternalLink,
  Mail,
  Phone,
  Clock
} from "lucide-react";

const faqs = [
  {
    question: "How do I create my first course?",
    answer: "To create your first course, navigate to the Creator Dashboard and click 'Create New Course'. Upload your document (PDF, DOC, DOCX, TXT, or MD), and our AI will automatically generate a structured course with modules, lessons, and quizzes."
  },
  {
    question: "What file formats are supported?",
    answer: "Korsify supports PDF, DOC, DOCX, TXT, and Markdown (.md) files. The maximum file size is 10MB per document."
  },
  {
    question: "How does the AI course generation work?",
    answer: "Our World Class Fine-Tuned AI uses a 5-phase pipeline: Document Analysis, Content Analysis, Content Generation, Validation, and Finalization. This ensures high-quality, structured educational content."
  },
  {
    question: "Can I edit the AI-generated content?",
    answer: "Yes! All AI-generated content is fully editable. You can modify modules, lessons, quizzes, and add your own custom content using our rich text editor."
  },
  {
    question: "How do I track student progress?",
    answer: "The Creator Analytics dashboard provides comprehensive insights into student progress, including completion rates, quiz scores, study time, and engagement metrics."
  },
  {
    question: "Is there a limit to the number of courses I can create?",
    answer: "With the Pro plan, you can create unlimited courses. The Free plan allows up to 3 active courses at a time."
  }
];

const tutorials = [
  {
    title: "Getting Started with Korsify",
    duration: "5 min",
    type: "video",
    description: "Learn the basics of creating your first course"
  },
  {
    title: "Advanced Course Customization",
    duration: "8 min",
    type: "video",
    description: "Master the course editor and customization options"
  },
  {
    title: "Managing Quizzes and Assessments",
    duration: "6 min",
    type: "article",
    description: "Create effective quizzes to test student knowledge"
  },
  {
    title: "Understanding Analytics",
    duration: "4 min",
    type: "article",
    description: "Make data-driven decisions with analytics insights"
  }
];

export default function CreatorHelp() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubject, setSupportSubject] = useState("");

  if (!user) return null;

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-2">Find answers, tutorials, and get support</p>
        </div>

        {/* Quick Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">FAQs</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="support">Contact Support</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <Collapsible key={index}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-left p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="font-medium">{faq.question}</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 pt-2">
                      <p className="text-gray-600">{faq.answer}</p>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Tutorials & Guides</CardTitle>
                <CardDescription>
                  Step-by-step tutorials to help you get the most out of Korsify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tutorials.map((tutorial, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {tutorial.type === 'video' ? (
                            <Video className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                          <h3 className="font-medium">{tutorial.title}</h3>
                        </div>
                        <span className="text-xs text-gray-500">{tutorial.duration}</span>
                      </div>
                      <p className="text-sm text-gray-600">{tutorial.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between">
                  <span>Creator's Guide to Success</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  <span>Best Practices for Course Design</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  <span>Maximizing Student Engagement</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Comprehensive documentation for all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Getting Started
                    </h3>
                    <div className="space-y-2">
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Account Setup
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Creating Your First Course
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Understanding the Dashboard
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Document Upload Guidelines
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Advanced Features
                    </h3>
                    <div className="space-y-2">
                      <Button variant="link" className="p-0 h-auto justify-start">
                        AI Course Generation
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Quiz Management System
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Analytics & Insights
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Custom Branding Options
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      API & Integrations
                    </h3>
                    <div className="space-y-2">
                      <Button variant="link" className="p-0 h-auto justify-start">
                        API Documentation
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Webhook Setup
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Third-party Integrations
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Export & Import Data
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Troubleshooting
                    </h3>
                    <div className="space-y-2">
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Common Issues
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Error Messages Guide
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Performance Optimization
                      </Button>
                      <Button variant="link" className="p-0 h-auto justify-start">
                        Browser Compatibility
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                    <CardDescription>
                      Get help from our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe your issue in detail..."
                        rows={6}
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select 
                        id="category"
                        className="w-full mt-2 p-2 border rounded-md"
                      >
                        <option>Technical Issue</option>
                        <option>Billing Question</option>
                        <option>Feature Request</option>
                        <option>Account Help</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <Button className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Other Ways to Get Help</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Email</p>
                        <p className="text-sm text-gray-600">support@korsify.com</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Live Chat</p>
                        <p className="text-sm text-gray-600">Available 9am-5pm EST</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Response Time</p>
                        <p className="text-sm text-gray-600">Usually within 24 hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Community</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Join Discord Community
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read the Blog
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Video className="h-4 w-4 mr-2" />
                      YouTube Channel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}