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
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/rich-text-editor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Plus } from "lucide-react";
import type { Module } from "@shared/schema";

interface ModuleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  module?: Module | null;
  onSuccess?: () => void;
}

export default function ModuleEditorDialog({
  open,
  onOpenChange,
  courseId,
  module,
  onSuccess
}: ModuleEditorDialogProps) {
  const { toast } = useToast();
  const isEditing = !!module;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  // Initialize form with module data if editing
  useEffect(() => {
    if (module) {
      setTitle(module.title || "");
      setDescription(module.description || "");
      setEstimatedDuration(module.estimatedDuration?.toString() || "");
    } else {
      setTitle("");
      setDescription("");
      setEstimatedDuration("");
    }
  }, [module, open]);

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/modules`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Module Created",
        description: "The module has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Module",
        description: error.message || "An error occurred while creating the module.",
        variant: "destructive",
      });
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/modules/${module?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Module Updated",
        description: "The module has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Module",
        description: error.message || "An error occurred while updating the module.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEstimatedDuration("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the module.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
    };

    if (isEditing) {
      updateModuleMutation.mutate(data);
    } else {
      createModuleMutation.mutate(data);
    }
  };

  const isLoading = createModuleMutation.isPending || updateModuleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Save className="w-5 h-5" />
                Edit Module
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add New Module
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the module details below."
              : "Create a new module for your course."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Module Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Module Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Introduction to Web Development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Module Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Module Description</Label>
            <div className="text-sm text-gray-500 mb-1">
              Provide a rich description of what this module covers
            </div>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe what students will learn in this module..."
              minHeight="200px"
              editable={!isLoading}
            />
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g., 60"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              How long will it take to complete this module?
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
            {isEditing ? "Update Module" : "Create Module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}