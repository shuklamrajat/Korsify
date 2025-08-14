import { useState } from "react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  Search,
  ExternalLink,
  FileText,
  Video,
  Users,
  Zap,
  Shield,
  CreditCard,
  Settings,
  ChevronRight
} from "lucide-react";

export default function LearnerHelp() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Getting Started",
      icon: BookOpen,
      questions: [
        {
          question: "How do I enroll in a course?",
          answer: "To enroll in a course, browse the available courses in the 'Browse Courses' section, click on a course you're interested in, and press the 'Enroll' button. You'll have immediate access to all course content."
        },
        {
          question: "Can I access courses offline?",
          answer: "Currently, courses require an internet connection to access. We're working on offline functionality for future updates. You can download course materials where available."
        },
        {
          question: "How do I track my progress?",
          answer: "Your progress is automatically tracked as you complete lessons. You can view your overall progress on the dashboard, and detailed progress for each course in your 'My Learning' section."
        }
      ]
    },
    {
      category: "Learning Features",
      icon: Zap,
      questions: [
        {
          question: "What are learning streaks?",
          answer: "Learning streaks count consecutive days you've studied. Maintain your streak by completing at least one lesson per day. Streaks help build consistent learning habits."
        },
        {
          question: "How do achievements work?",
          answer: "Achievements are earned by completing specific milestones like finishing courses, maintaining streaks, or scoring well on quizzes. View your achievements in your profile."
        },
        {
          question: "Can I retake quizzes?",
          answer: "Yes, you can retake quizzes as many times as you want to improve your score. Your highest score will be recorded."
        }
      ]
    },
    {
      category: "Account & Settings",
      icon: Settings,
      questions: [
        {
          question: "How do I change my password?",
          answer: "Go to Settings > Account > Change Password. Enter your current password and your new password twice to confirm the change."
        },
        {
          question: "Can I change my email address?",
          answer: "Email changes require verification. Contact support through the Help section to initiate an email change request."
        },
        {
          question: "How do I delete my account?",
          answer: "Account deletion is permanent. Contact our support team to request account deletion. Note that all your progress and certificates will be permanently removed."
        }
      ]
    },
    {
      category: "Technical Issues",
      icon: Shield,
      questions: [
        {
          question: "Videos aren't playing properly",
          answer: "Try refreshing the page, clearing your browser cache, or switching to a different browser. Ensure you have a stable internet connection. If issues persist, contact support."
        },
        {
          question: "I can't log into my account",
          answer: "First, try resetting your password using the 'Forgot Password' link. If you're still unable to access your account, contact support with your registered email address."
        },
        {
          question: "Course content isn't loading",
          answer: "Check your internet connection and try refreshing the page. If the problem continues, try clearing your browser cache or using a different browser."
        }
      ]
    }
  ];

  const resources = [
    {
      title: "Video Tutorials",
      description: "Watch step-by-step guides on using the platform",
      icon: Video,
      link: "#"
    },
    {
      title: "User Guide",
      description: "Comprehensive documentation for all features",
      icon: FileText,
      link: "#"
    },
    {
      title: "Community Forum",
      description: "Connect with other learners and get help",
      icon: Users,
      link: "#"
    },
    {
      title: "Blog",
      description: "Tips, updates, and learning strategies",
      icon: BookOpen,
      link: "#"
    }
  ];

  const contactMethods = [
    {
      title: "Email Support",
      description: "Get help via email within 24-48 hours",
      icon: Mail,
      action: "support@korsify.com",
      buttonText: "Send Email"
    },
    {
      title: "Live Chat",
      description: "Chat with our support team (Mon-Fri, 9am-5pm)",
      icon: MessageCircle,
      action: "Start chat",
      buttonText: "Start Chat"
    },
    {
      title: "Community Forum",
      description: "Get help from the community",
      icon: Users,
      action: "Visit forum",
      buttonText: "Visit Forum"
    }
  ];

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How can we help you?</h1>
          <p className="text-gray-600">Find answers to common questions or contact our support team</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
        </div>

        {/* Quick Resources */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Resources</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <resource.icon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    Learn more
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          {filteredFAQs.length > 0 ? (
            <div className="space-y-6">
              {filteredFAQs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <category.icon className="w-5 h-5 mr-2" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((qa, qaIndex) => (
                        <AccordionItem key={qaIndex} value={`item-${categoryIndex}-${qaIndex}`}>
                          <AccordionTrigger className="text-left">
                            {qa.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-gray-600">{qa.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No FAQs found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Support */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Still need help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <method.icon className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                  <Button className="w-full">
                    {method.buttonText}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Help Text */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Can't find what you're looking for?</h3>
          <p className="text-gray-600 mb-4">
            Our support team is here to help. Don't hesitate to reach out with any questions or concerns.
          </p>
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}