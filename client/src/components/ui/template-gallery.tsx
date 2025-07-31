import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { CourseTemplate } from "@shared/schema";
import {
  Sparkles,
  BookOpen,
  Clock,
  Users,
  Star,
  Zap,
  Filter,
  Plus,
  Wand2
} from "lucide-react";

interface TemplateGalleryProps {
  onCourseCreated?: (courseId: string) => void;
}

interface CustomTemplateForm {
  title: string;
  description: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: string;
  estimatedDuration: number;
}

const categories = [
  'business',
  'technology',
  'education',
  'health',
  'creative',
  'lifestyle'
];

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

export default function TemplateGallery({ onCourseCreated }: TemplateGalleryProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState<CustomTemplateForm>({
    title: '',
    description: '',
    category: '',
    difficultyLevel: 'beginner',
    targetAudience: '',
    estimatedDuration: 60
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<CourseTemplate[]>({
    queryKey: ["/api/templates", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory ? `/api/templates?category=${selectedCategory}` : '/api/templates';
      const response = await apiRequest("GET", url);
      return response.json();
    }
  });

  // Generate course from template mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { templateId: string; customization?: any }) => {
      const response = await apiRequest("POST", `/api/templates/${data.templateId}/generate`, data.customization || {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course generated successfully!",
        description: "Your new course is ready for editing.",
      });
      if (onCourseCreated) {
        onCourseCreated(data.course.id);
      } else {
        setLocation(`/courses/${data.course.id}/edit`);
      }
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate course from template",
        variant: "destructive",
      });
    },
  });

  // Create custom course mutation
  const customMutation = useMutation({
    mutationFn: async (data: CustomTemplateForm) => {
      const response = await apiRequest("POST", "/api/templates/custom", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Custom course generated!",
        description: "Your course has been created and is ready for editing.",
      });
      setIsCustomModalOpen(false);
      setCustomForm({
        title: '',
        description: '',
        category: '',
        difficultyLevel: 'beginner',
        targetAudience: '',
        estimatedDuration: 60
      });
      if (onCourseCreated) {
        onCourseCreated(data.course.id);
      } else {
        setLocation(`/courses/${data.course.id}/edit`);
      }
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate custom course",
        variant: "destructive",
      });
    },
  });

  const handleGenerateFromTemplate = (templateId: string) => {
    generateMutation.mutate({ templateId });
  };

  const handleCreateCustom = () => {
    if (!customForm.title || !customForm.description || !customForm.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    customMutation.mutate(customForm);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Course Templates
          </h2>
          <p className="text-gray-600 mt-1">Generate professional courses in seconds with AI-powered templates</p>
        </div>
        
        <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Wand2 className="w-4 h-4 mr-2" />
              Create Custom Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Course with AI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={customForm.title}
                    onChange={(e) => setCustomForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Advanced JavaScript Concepts"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={customForm.category} onValueChange={(value) => setCustomForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={customForm.description}
                  onChange={(e) => setCustomForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your course will teach..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={customForm.difficultyLevel} onValueChange={(value: any) => setCustomForm(prev => ({ ...prev, difficultyLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    value={customForm.targetAudience}
                    onChange={(e) => setCustomForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., Developers, Students"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={customForm.estimatedDuration}
                    onChange={(e) => setCustomForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    max="480"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateCustom} 
                disabled={customMutation.isPending}
                className="w-full"
              >
                {customMutation.isPending ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Custom Course
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        <Button
          variant={selectedCategory === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('')}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow border border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className={getDifficultyColor(template.difficultyLevel || 'beginner')}>
                    {template.difficultyLevel}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {template.category}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {template.estimatedDuration}min
                    </div>
                  </div>
                  
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => handleGenerateFromTemplate(template.id)}
                    disabled={generateMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Course
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {selectedCategory 
              ? `No templates available in the ${selectedCategory} category.`
              : "No course templates are currently available."
            }
          </p>
          <Button onClick={() => setIsCustomModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Course
          </Button>
        </div>
      )}
    </div>
  );
}