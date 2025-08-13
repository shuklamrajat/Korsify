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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Trash2,
  CheckCircle,
  X,
  HelpCircle,
  Save,
  AlertCircle,
  Copy,
} from "lucide-react";

interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Quiz {
  id?: string;
  moduleId: string;
  lessonId?: string;
  title: string;
  questions: QuizQuestion[];
  passingScore?: number;
}

interface QuizEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz?: Quiz | null;
  moduleId: string;
  lessonId?: string;
  courseId: string;
}

export default function QuizEditorDialog({
  open,
  onOpenChange,
  quiz,
  moduleId,
  lessonId,
  courseId
}: QuizEditorDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setPassingScore(quiz.passingScore || 70);
      setQuestions(quiz.questions || []);
    } else {
      // Default new quiz with one MCQ question
      setTitle(lessonId ? "Lesson Quiz" : "Module Quiz");
      setPassingScore(70);
      setQuestions([{
        question: "",
        type: "multiple_choice",
        options: ["", "", "", "", ""], // 5 options by default
        correctAnswer: "0",
        explanation: ""
      }]);
    }
    setCurrentQuestionIndex(0);
  }, [quiz, lessonId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const quizData = {
        moduleId,
        lessonId,
        title,
        questions,
        passingScore
      };

      if (quiz?.id) {
        // Update existing quiz
        return await apiRequest("PATCH", `/api/quizzes/${quiz.id}`, quizData);
      } else {
        // Create new quiz
        return await apiRequest("POST", "/api/quizzes", quizData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Quiz Saved",
        description: `Quiz "${title}" has been ${quiz ? 'updated' : 'created'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${moduleId}/quizzes`] });
      if (lessonId) {
        queryClient.invalidateQueries({ queryKey: [`/api/quizzes/lesson/${lessonId}`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save quiz",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!quiz?.id) return;
      return await apiRequest("DELETE", `/api/quizzes/${quiz.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Quiz Deleted",
        description: "Quiz has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${moduleId}/quizzes`] });
      if (lessonId) {
        queryClient.invalidateQueries({ queryKey: [`/api/quizzes/lesson/${lessonId}`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quiz",
        variant: "destructive",
      });
    }
  });

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: "",
      type: "multiple_choice",
      options: ["", "", "", "", ""], // 5 options by default
      correctAnswer: "0",
      explanation: ""
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "A quiz must have at least one question.",
        variant: "destructive",
      });
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (currentQuestionIndex >= newQuestions.length) {
      setCurrentQuestionIndex(newQuestions.length - 1);
    }
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = { ...questions[index] };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, questionToDuplicate);
    setQuestions(newQuestions);
    setCurrentQuestionIndex(index + 1);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    
    // Ensure MCQ has 4-5 options
    if (updates.type === 'multiple_choice' && !newQuestions[index].options) {
      newQuestions[index].options = ["", "", "", "", ""];
    }
    
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options![optionIndex] = value;
      setQuestions(newQuestions);
    }
  };

  const handleSave = () => {
    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} is empty.`,
          variant: "destructive",
        });
        setCurrentQuestionIndex(i);
        return;
      }
      
      if (q.type === 'multiple_choice') {
        const validOptions = q.options?.filter(opt => opt.trim()) || [];
        if (validOptions.length < 4) {
          toast({
            title: "Validation Error",
            description: `Question ${i + 1} must have at least 4 options.`,
            variant: "destructive",
          });
          setCurrentQuestionIndex(i);
          return;
        }
        
        if (!q.correctAnswer || q.correctAnswer === '') {
          toast({
            title: "Validation Error",
            description: `Question ${i + 1} must have a correct answer selected.`,
            variant: "destructive",
          });
          setCurrentQuestionIndex(i);
          return;
        }
      }
    }

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Quiz title is required.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate();
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {quiz ? 'Edit Quiz' : 'Create New Quiz'}
          </DialogTitle>
          <DialogDescription>
            Create multiple choice questions with 4-5 options each. All questions will be MCQ format.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Quiz Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiz-title">Quiz Title</Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <Label htmlFor="passing-score">Passing Score (%)</Label>
              <Input
                id="passing-score"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
              />
            </div>
          </div>

          {/* Question Navigator */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <ScrollArea className="flex-1">
              <div className="flex gap-2">
                {questions.map((q, index) => (
                  <Button
                    key={index}
                    variant={currentQuestionIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className="min-w-[80px]"
                  >
                    Q{index + 1}
                    {!q.question && (
                      <AlertCircle className="w-3 h-3 ml-1 text-yellow-500" />
                    )}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addQuestion}
                  className="min-w-[80px]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </ScrollArea>
          </div>

          {/* Current Question Editor */}
          {currentQuestion && (
            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-4 h-full overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Question {currentQuestionIndex + 1}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateQuestion(currentQuestionIndex)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(currentQuestionIndex)}
                      disabled={questions.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="question-text">Question</Label>
                  <Textarea
                    id="question-text"
                    value={currentQuestion.question}
                    onChange={(e) => updateQuestion(currentQuestionIndex, { question: e.target.value })}
                    placeholder="Enter your question here..."
                    rows={3}
                  />
                </div>

                {/* MCQ Options */}
                <div>
                  <Label>Answer Options (Select the correct one)</Label>
                  <RadioGroup
                    value={currentQuestion.correctAnswer}
                    onValueChange={(value) => updateQuestion(currentQuestionIndex, { correctAnswer: value })}
                  >
                    <div className="space-y-2 mt-2">
                      {(currentQuestion.options || ["", "", "", "", ""]).map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <RadioGroupItem value={optIndex.toString()} id={`option-${optIndex}`} />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(currentQuestionIndex, optIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            className="flex-1"
                          />
                          {optIndex < 4 && !option && (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    value={currentQuestion.explanation || ""}
                    onChange={(e) => updateQuestion(currentQuestionIndex, { explanation: e.target.value })}
                    placeholder="Explain why this answer is correct..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          {quiz?.id && (
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Quiz
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {quiz ? 'Update Quiz' : 'Create Quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}