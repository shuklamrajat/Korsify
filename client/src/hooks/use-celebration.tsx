import { useState, useCallback } from "react";

interface CelebrationData {
  type: 'lesson' | 'module' | 'course' | 'quiz' | 'achievement';
  title: string;
  description?: string;
  points?: number;
}

export function useCelebration() {
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const triggerCelebration = useCallback((data: CelebrationData) => {
    setCelebrationData(data);
    setIsVisible(true);
  }, []);

  const hideCelebration = useCallback(() => {
    setIsVisible(false);
    // Clear data after animation completes
    setTimeout(() => {
      setCelebrationData(null);
    }, 500);
  }, []);

  // Specific celebration triggers
  const celebrateLesson = useCallback((lessonTitle: string, points = 10) => {
    triggerCelebration({
      type: 'lesson',
      title: lessonTitle,
      description: 'Great job! You completed this lesson.',
      points
    });
  }, [triggerCelebration]);

  const celebrateModule = useCallback((moduleTitle: string, points = 50) => {
    triggerCelebration({
      type: 'module',
      title: moduleTitle,
      description: 'Excellent! You finished this entire module.',
      points
    });
  }, [triggerCelebration]);

  const celebrateCourse = useCallback((courseTitle: string, points = 200) => {
    triggerCelebration({
      type: 'course',
      title: courseTitle,
      description: 'Outstanding! You completed the entire course!',
      points
    });
  }, [triggerCelebration]);

  const celebrateQuiz = useCallback((quizTitle: string, score: number, passed: boolean) => {
    const points = passed ? Math.round(score / 10) : 0;
    triggerCelebration({
      type: 'quiz',
      title: quizTitle,
      description: passed 
        ? `Perfect! You scored ${Math.round(score)}%` 
        : `You scored ${Math.round(score)}%. Keep practicing!`,
      points
    });
  }, [triggerCelebration]);

  const celebrateAchievement = useCallback((title: string, description: string, points = 25) => {
    triggerCelebration({
      type: 'achievement',
      title,
      description,
      points
    });
  }, [triggerCelebration]);

  return {
    isVisible,
    celebrationData,
    hideCelebration,
    celebrateLesson,
    celebrateModule,
    celebrateCourse,
    celebrateQuiz,
    celebrateAchievement,
    triggerCelebration
  };
}