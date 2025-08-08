import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/rich-text-editor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Plus, FileText, Clock, Video } from "lucide-react";
import type { Lesson } from "@shared/schema";

interface LessonEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  moduleId: string;
  lesson?: Lesson | null;
  onSuccess?: () => void;
}

export default function LessonEditorDialog({
  open,
  onOpenChange,
  courseId,
  moduleId,
  lesson,
  onSuccess
}: LessonEditorDialogProps) {
  const { toast } = useToast();
  const isEditing = !!lesson;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Initialize form with lesson data if editing
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || "");
      setContent(lesson.content || "");
      setEstimatedDuration(lesson.estimatedDuration?.toString() || "");
      setVideoUrl(lesson.videoUrl || "");
    } else {
      setTitle("");
      setContent("");
      setEstimatedDuration("10");
      setVideoUrl("");
    }
  }, [lesson, open]);

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/modules/${moduleId}/lessons`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lesson Created",
        description: "The lesson has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Lesson",
        description: error.message || "An error occurred while creating the lesson.",
        variant: "destructive",
      });
    },
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/lessons/${lesson?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lesson Updated",
        description: "The lesson has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Lesson",
        description: error.message || "An error occurred while updating the lesson.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEstimatedDuration("10");
    setVideoUrl("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the lesson.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please add content for the lesson.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title: title.trim(),
      content: content.trim(),
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : 10,
      videoUrl: videoUrl.trim() || null,
    };

    if (isEditing) {
      updateLessonMutation.mutate(data);
    } else {
      createLessonMutation.mutate(data);
    }
  };

  const isLoading = createLessonMutation.isPending || updateLessonMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Save className="w-5 h-5" />
                Edit Lesson
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Add New Lesson
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the lesson details below."
              : "Create a new lesson for this module."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lesson Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Understanding Variables and Data Types"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Lesson Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Lesson Content *</Label>
            <div className="text-sm text-gray-500 mb-1">
              Create rich, engaging content with text formatting, images, and more
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your lesson content here. You can format text, add images, create lists, and more..."
              minHeight="400px"
              editable={!isLoading}
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video URL (Optional)
            </Label>
            <Input
              id="video"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Add a video to complement your written content
            </p>
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Estimated Duration (minutes) *
            </Label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g., 15"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              How long will it take to complete this lesson?
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Update Lesson" : "Create Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}