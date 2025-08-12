import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  Target,
  Award
} from "lucide-react";

interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts?: number;
}

interface QuizViewerProps {
  quiz: Quiz;
  lessonId?: string;
  moduleId?: string;
  onComplete?: (passed: boolean, score: number) => void;
  onRetry?: () => void;
}

export function QuizViewer({
  quiz,
  lessonId,
  moduleId,
  onComplete,
  onRetry
}: QuizViewerProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (value: string) => {
    if (!submitted) {
      setAnswers({ ...answers, [currentQuestionIndex]: value });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / totalQuestions) * 100);
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = quiz.questions.findIndex((_, index) => !answers[index]);
    if (unanswered !== -1) {
      setCurrentQuestionIndex(unanswered);
      toast({
        title: "Incomplete Quiz",
        description: `Please answer question ${unanswered + 1} before submitting.`,
        variant: "destructive"
      });
      return;
    }

    const finalScore = calculateScore();
    setScore(finalScore);
    setSubmitted(true);
    setShowResults(true);
    
    // Save quiz attempt to backend
    try {
      await apiRequest("POST", "/api/quiz-attempts", {
        quizId: quiz.id,
        lessonId,
        moduleId,
        score: finalScore,
        answers: answers,
        attemptNumber: 1
      });

      const passed = finalScore >= quiz.passingScore;
      onComplete?.(passed, finalScore);

      if (passed) {
        toast({
          title: "Quiz Completed! 🎉",
          description: `You scored ${finalScore}%! Great job!`,
        });
      } else {
        toast({
          title: "Quiz Completed",
          description: `You scored ${finalScore}%. You need ${quiz.passingScore}% to pass.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to save quiz attempt:", error);
    }
  };

  const handleReview = () => {
    setReviewing(true);
    setCurrentQuestionIndex(0);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSubmitted(false);
    setShowResults(false);
    setScore(0);
    setReviewing(false);
    onRetry?.();
  };

  if (showResults && !reviewing) {
    const passed = score >= quiz.passingScore;
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <Trophy className="w-12 h-12 text-green-600" />
            ) : (
              <Target className="w-12 h-12 text-red-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Quiz Complete'}
          </h2>
          
          <div className="text-4xl font-bold mb-4">
            {score}%
          </div>
          
          <Badge 
            variant={passed ? 'default' : 'destructive'} 
            className="mb-6"
          >
            {passed ? 'PASSED' : 'NOT PASSED'}
          </Badge>
          
          <p className="text-gray-600 mb-8">
            {passed 
              ? `Excellent work! You've mastered this material.`
              : `You need ${quiz.passingScore}% to pass. Keep studying and try again!`}
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleReview}>
              Review Answers
            </Button>
            {!passed && (
              <Button onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {quiz.title}
          </CardTitle>
          <Badge variant="secondary">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Question */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {currentQuestion.question}
            </h3>
            
            {/* Answer Options */}
            {currentQuestion.type === 'multiple_choice' ? (
              <RadioGroup
                value={answers[currentQuestionIndex] || ''}
                onValueChange={handleAnswerSelect}
                disabled={submitted && !reviewing}
              >
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => {
                    const isSelected = answers[currentQuestionIndex] === option;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const showFeedback = reviewing || submitted;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                          showFeedback && isCorrect
                            ? 'border-green-500 bg-green-50'
                            : showFeedback && isSelected && !isCorrect
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                        {showFeedback && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            ) : (
              // True/False Question
              <RadioGroup
                value={answers[currentQuestionIndex] || ''}
                onValueChange={handleAnswerSelect}
                disabled={submitted && !reviewing}
              >
                <div className="space-y-3">
                  {['True', 'False'].map((option) => {
                    const isSelected = answers[currentQuestionIndex] === option;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const showFeedback = reviewing || submitted;
                    
                    return (
                      <div
                        key={option}
                        className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                          showFeedback && isCorrect
                            ? 'border-green-500 bg-green-50'
                            : showFeedback && isSelected && !isCorrect
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${option}`} />
                        <Label
                          htmlFor={`option-${option}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                        {showFeedback && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            )}
          </div>
          
          {/* Explanation (shown when reviewing) */}
          {reviewing && currentQuestion.explanation && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-500">
              {Object.keys(answers).length} of {totalQuestions} answered
            </span>
            
            {currentQuestionIndex === totalQuestions - 1 && !submitted ? (
              <Button onClick={handleSubmit}>
                Submit Quiz
              </Button>
            ) : reviewing && currentQuestionIndex === totalQuestions - 1 ? (
              <Button onClick={() => setShowResults(true)}>
                View Results
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}