import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate learning time based on word count
 * Research shows educational content is processed at ~125 words/minute
 * when accounting for comprehension and retention (not just reading)
 * 
 * Sources:
 * - Average reading speed: 200-250 wpm for general text
 * - Educational content: 100-150 wpm (slower for comprehension)
 * - Technical material: 50-125 wpm
 * 
 * We use 125 wpm as a balanced baseline for educational courses
 */
export function calculateLearningTime(wordCount: number): number {
  const WORDS_PER_MINUTE = 125; // Educational content comprehension rate
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}

/**
 * Format learning time into human-readable string
 */
export function formatLearningTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Count words in a text string (basic implementation)
 */
export function countWords(text: string): number {
  if (!text) return 0;
  // Remove HTML tags if present
  const plainText = text.replace(/<[^>]*>/g, '');
  // Split by whitespace and filter empty strings
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Calculate total learning time for a course
 */
export function calculateCourseLearningTime(course: any): number {
  let totalMinutes = 0;
  
  if (course.modules && Array.isArray(course.modules)) {
    for (const module of course.modules) {
      if (module.lessons && Array.isArray(module.lessons)) {
        for (const lesson of module.lessons) {
          // Count words in lesson content
          const contentWords = countWords(lesson.content || '');
          // Add time for this lesson
          totalMinutes += calculateLearningTime(contentWords);
        }
      }
    }
  }
  
  return totalMinutes;
}