// Utility functions for content deduplication and uniqueness validation

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(shorter, longer);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Check if a title is too similar to existing titles
 */
export function isTitleDuplicate(newTitle: string, existingTitles: string[], threshold: number = 0.85): boolean {
  for (const existingTitle of existingTitles) {
    const similarity = calculateSimilarity(newTitle, existingTitle);
    if (similarity >= threshold) {
      console.log(`Duplicate detected: "${newTitle}" is ${(similarity * 100).toFixed(1)}% similar to "${existingTitle}"`);
      return true;
    }
  }
  return false;
}

/**
 * Deduplicate an array of items based on their titles
 */
export function deduplicateByTitle<T extends { title: string }>(items: T[], threshold: number = 0.85): T[] {
  const unique: T[] = [];
  const titles: string[] = [];
  
  for (const item of items) {
    if (!isTitleDuplicate(item.title, titles, threshold)) {
      unique.push(item);
      titles.push(item.title);
    } else {
      console.log(`Removed duplicate: "${item.title}"`);
    }
  }
  
  return unique;
}

/**
 * Generate a unique title by appending a suffix if needed
 */
export function generateUniqueTitle(baseTitle: string, existingTitles: string[]): string {
  let title = baseTitle;
  let counter = 1;
  
  while (existingTitles.some(t => t.toLowerCase() === title.toLowerCase())) {
    counter++;
    title = `${baseTitle} (${counter})`;
  }
  
  return title;
}

/**
 * Validate course structure for duplicate content
 */
export function validateCourseStructure(courseStructure: any): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const moduleTitles: string[] = [];
  
  // Check for duplicate module titles
  for (const module of courseStructure.modules || []) {
    if (isTitleDuplicate(module.title, moduleTitles, 0.85)) {
      issues.push(`Duplicate module title detected: "${module.title}"`);
    }
    moduleTitles.push(module.title);
    
    // Check for duplicate lesson titles within each module
    const lessonTitles: string[] = [];
    for (const lesson of module.lessons || []) {
      if (isTitleDuplicate(lesson.title, lessonTitles, 0.85)) {
        issues.push(`Duplicate lesson title in module "${module.title}": "${lesson.title}"`);
      }
      lessonTitles.push(lesson.title);
    }
    
    // Check for duplicate quiz questions
    if (module.quiz) {
      const questions: string[] = [];
      for (const q of module.quiz.questions || []) {
        if (isTitleDuplicate(q.question, questions, 0.85)) {
          issues.push(`Duplicate quiz question in module "${module.title}": "${q.question}"`);
        }
        questions.push(q.question);
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Clean and deduplicate course structure before saving
 */
export function cleanCourseStructure(courseStructure: any): any {
  const cleaned = { ...courseStructure };
  
  // Deduplicate modules
  if (cleaned.modules) {
    cleaned.modules = deduplicateByTitle(cleaned.modules);
    
    // Deduplicate lessons within each module
    for (const module of cleaned.modules) {
      if (module.lessons) {
        module.lessons = deduplicateByTitle(module.lessons);
      }
      
      // Deduplicate quiz questions
      if (module.quiz && module.quiz.questions) {
        const uniqueQuestions: any[] = [];
        const questionTexts: string[] = [];
        
        for (const q of module.quiz.questions) {
          if (!isTitleDuplicate(q.question, questionTexts, 0.85)) {
            uniqueQuestions.push(q);
            questionTexts.push(q.question);
          }
        }
        
        module.quiz.questions = uniqueQuestions;
      }
    }
  }
  
  return cleaned;
}