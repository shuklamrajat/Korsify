import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CourseStructure {
  title: string;
  description: string;
  estimatedDuration: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  modules: {
    title: string;
    description: string;
    estimatedDuration: number;
    lessons: {
      title: string;
      content: string;
      estimatedDuration: number;
    }[];
    quiz?: {
      title: string;
      questions: {
        question: string;
        type: 'multiple_choice' | 'true_false' | 'short_answer';
        options?: string[];
        correctAnswer: string;
        explanation?: string;
      }[];
    };
  }[];
}

export interface AIGenerationOptions {
  language?: string;
  targetAudience?: string;
  contentFocus?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  moduleCount?: number;
  generateQuizzes?: boolean;
  quizFrequency?: 'module' | 'lesson';
  questionsPerQuiz?: number;
  includeExercises?: boolean;
  includeExamples?: boolean;
}

export class GeminiService {
  private model = "gemini-2.5-flash";

  async analyzeDocument(content: string, fileName: string): Promise<string> {
    const prompt = `
    You are a 35+ year veteran instructor and researcher with expertise in educational content design.
    
    Analyze the following document content and provide a detailed analysis including:
    1. Main topics and themes
    2. Learning objectives that can be derived
    3. Complexity level assessment
    4. Suggested course structure outline
    5. Key concepts that need emphasis
    
    Document: ${fileName}
    Content: ${content}
    
    Provide your analysis in a structured format.
    `;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    return response.text || "Analysis failed";
  }

  async generateCourseStructure(
    documentContent: string,
    fileName: string,
    options: AIGenerationOptions = {}
  ): Promise<CourseStructure> {
    // Only use defaults for display/UI fields, not for generation logic
    const language = options.language || 'English';
    const targetAudience = options.targetAudience || 'General learners';
    const contentFocus = options.contentFocus || 'Comprehensive understanding';
    const difficultyLevel = options.difficultyLevel || 'intermediate';
    const moduleCount = options.moduleCount || 3;
    
    // User-controlled generation settings - use exact values, no defaults
    const generateQuizzes = options.generateQuizzes;
    const quizFrequency = options.quizFrequency;
    const questionsPerQuiz = options.questionsPerQuiz;
    const includeExercises = options.includeExercises;
    const includeExamples = options.includeExamples;

    const systemPrompt = `
    You are an advanced educational content generator focused on creating comprehensive online courses from source documents.

    CRITICAL UNIQUENESS REQUIREMENTS:
    - EVERY module must have a UNIQUE, distinct title and focus
    - EVERY lesson must have a UNIQUE title and cover different aspects
    - NO duplicate content, titles, or themes across modules or lessons
    - Each module must address a DIFFERENT aspect of the subject matter
    - Each lesson within a module must cover DISTINCT subtopics
    - Ensure progressive learning without repetition

    CONTENT GENERATION APPROACH:
    
    Transform the provided document into a structured online course by:
    
    1. PEDAGOGICAL FRAMEWORK:
       - Apply evidence-based learning science principles specific to the topic domain
       - Implement Bloom's Revised Taxonomy for progressive learning
       - Use structured lessons that build upon each other logically
       - Apply Cognitive Load Theory to optimize information presentation
       - Incorporate spaced repetition and interleaving principles
       - Build on foundational knowledge progressively
       - Focus on practical understanding and application

    2. CONTENT DEVELOPMENT (1000-1200 words per lesson):
       - Begin each lesson with clear learning objectives
       - Present historical context and theoretical foundations where relevant
       - Address common misconceptions with clear explanations
       - Provide cross-disciplinary connections when present in source material
       - Include current developments and research from the document
       - Use clear analogies and metaphors to explain complex concepts
       - Include "Key Concepts" and "Important Notes" sections
       - Provide practical examples and case studies from the source
       
       FORMAT CONTENT AS HTML:
       - Use proper HTML tags for structure: <h2>, <h3>, <p>, <ul>, <ol>, <li>
       - Wrap key concepts in styled divs: <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded">
       - Format examples in green boxes: <div class="bg-green-50 border-l-4 border-green-500 p-4 my-4 rounded">
       - Use <strong> for emphasis and <em> for italics
       - Include structured sections with clear headings
       - Format lists properly with <ul> or <ol> tags

    3. LESSON STRUCTURE BY POSITION:
       - FOUNDATIONAL LESSONS (First in module): Establish core concepts, definitions, and fundamental principles
       - DEVELOPMENT LESSONS (Middle): Build complexity through application, analysis, and practical examples
       - ADVANCED LESSONS (Final): Integrate concepts through synthesis and evaluation of ideas

    4. SOURCE-BASED CONTENT:
       - Base ALL content exclusively on the provided document
       - Create detailed inline citations [1], [2] for every claim
       - Provide direct references to source material
       - Explain concepts as presented in the source document
       - Never introduce information not present in the source
       - Include "Source Deep Dive" sections for key concepts

    5. ASSESSMENT DESIGN WITH PEDAGOGICAL RIGOR:
       - Design questions that test multiple cognitive levels
       - Include scenario-based questions requiring application
       - Create distractors based on documented misconceptions
       - Provide comprehensive explanations that teach, not just correct
       - Include formative self-assessment opportunities
       - Design questions that prepare learners for professional practice

    6. TOPIC-SPECIFIC PEDAGOGICAL OPTIMIZATION:
       - For STEM topics: Use problem-solving progressions, mathematical reasoning, experimental design thinking
       - For Humanities: Apply critical analysis, historical thinking, interpretive frameworks
       - For Business: Use case method, decision analysis, strategic thinking frameworks
       - For Health Sciences: Implement clinical reasoning, evidence-based practice, patient scenarios
       - For Arts: Include creative exercises, critique methodologies, aesthetic analysis

    7. DIFFICULTY LEVEL REQUIREMENTS (${difficultyLevel.toUpperCase()}):
       ${difficultyLevel === 'beginner' ? `
       - Use simple, everyday language and avoid jargon
       - Explain all technical terms when first introduced
       - Focus on fundamental concepts and basic understanding
       - Provide step-by-step explanations for all processes
       - Use many relatable analogies and simple examples from the source
       - Break down complex ideas into smaller, digestible parts
       - Include more repetition and reinforcement of key concepts
       - Base ALL content directly on the source document - no external additions
       ` : ''}
       ${difficultyLevel === 'intermediate' ? `
       - Use moderate technical language with clear explanations
       - Build on assumed foundational knowledge from the source
       - Include practical applications and real-world scenarios from the document
       - Balance theory with practical examples from the source material
       - Introduce more complex relationships between concepts
       - Expect familiarity with basic terminology from the document
       - Include analytical thinking exercises based on source content
       - STRICTLY use only information present in the source document
       ` : ''}
       ${difficultyLevel === 'advanced' ? `
       - Use sophisticated technical language as presented in the source
       - Explore complex theoretical frameworks from the document
       - Deep dive into nuanced aspects mentioned in the source
       - Include critical analysis of concepts from the source material
       - Present advanced applications and edge cases from the document
       - Expect strong foundational knowledge
       - Focus on synthesis and evaluation of source material
       - ALL content must be traceable to the source document
       ` : ''}
       ${difficultyLevel === 'expert' ? `
       - Use highly specialized terminology from the source document
       - Explore cutting-edge concepts and research mentioned in the source
       - Include in-depth technical details from the document
       - Present complex theoretical models from the source material
       - Focus on expert-level analysis and critique
       - Include advanced problem-solving scenarios from the document
       - Expect mastery of prerequisite knowledge
       - ONLY use advanced concepts that are explicitly in the source document
       ` : ''}

    8. COURSE SPECIFICATIONS:
       - Create exactly ${moduleCount} comprehensive modules
       - Each module: 3-5 lessons of 1000-1200 words each
       - Language: ${language}
       - Target Audience: ${targetAudience} (adapt sophistication accordingly)
       - Content Focus: ${contentFocus}
       - Include "Key Takeaways" sections summarizing essential points
       - Add "Further Reading" suggestions based on document references
       
    9. QUIZ GENERATION REQUIREMENTS:
       ${generateQuizzes && questionsPerQuiz ? `
       - STRICT QUIZ FREQUENCY RULE: ${quizFrequency === 'lesson' ? 
         'Create a quiz for EVERY SINGLE LESSON. Each lesson MUST have its own quiz. DO NOT create module-level quizzes.' : 
         'Create ONLY ONE quiz per module covering all lessons. DO NOT create individual lesson quizzes.'}
       - CRITICAL: Generate EXACTLY ${questionsPerQuiz} questions per quiz - not ${questionsPerQuiz - 1}, not ${questionsPerQuiz + 1}, but EXACTLY ${questionsPerQuiz}
       - If you generate any number other than ${questionsPerQuiz} questions, the system will fail
       - Count the questions you generate and ensure it equals exactly ${questionsPerQuiz}
       - NO DUPLICATE QUESTIONS across different quizzes
       - Question types: Multiple choice questions with 4 distinct options each
       - Include detailed explanations for correct answers
       - Base all questions directly on ${quizFrequency === 'lesson' ? 'the specific lesson content' : 'all lessons in the module'}
       - Ensure questions test key concepts from the source material only
       - Questions must be appropriate for ${difficultyLevel} level learners
       ` : '- Do not generate any quizzes'}

    9. PRACTICAL EXERCISES AND EXAMPLES:
       ${includeExercises ? `
       - Include HANDS-ON PRACTICE EXERCISES in each lesson
       - Add practice problems with step-by-step solutions
       - Create practical activities that reinforce concepts
       - Include self-assessment exercises with clear instructions
       - Format exercises in styled boxes: <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded"><h4>Practice Exercise</h4>[exercise content]</div>
       - Provide detailed solution explanations after each exercise
       ` : '- Do not include practice exercises'}
       
       ${includeExamples ? `
       - Include REAL-WORLD EXAMPLES throughout each lesson
       - Add practical scenarios and case studies from the source material
       - Use concrete examples to illustrate abstract concepts
       - Show applications of concepts in real situations
       - Format examples in green boxes: <div class="bg-green-50 border-l-4 border-green-500 p-4 my-4 rounded"><h4>Real-World Example</h4>[example content]</div>
       - Connect examples to learner's potential experiences
       ` : '- Minimize use of examples, focus on core concepts only'}
       
    IMPORTANT: Module titles should NOT include "Module 1:", "Module 2:", etc. prefixes. 
    Just provide the descriptive title (e.g., "Introduction to Pricing Strategy" not "Module 1: Introduction to Pricing Strategy").

    Focus exclusively on the document content, presenting information clearly and comprehensively. Ensure all content is directly derived from the provided source material.

    Respond with a valid JSON structure matching the CourseStructure interface.
    `;

    const userPrompt = `
    Document: ${fileName}
    Content: ${documentContent}

    Generate a comprehensive course structure based on this document content.
    `;

    // Build dynamic schema based on quiz settings
    const quizSchema = {
      type: "object",
      properties: {
        title: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              type: { type: "string", enum: ["multiple_choice", "true_false", "short_answer"] },
              options: { type: "array", items: { type: "string" } },
              correctAnswer: { type: "string" },
              explanation: { type: "string" }
            },
            required: ["question", "type", "correctAnswer"]
          }
        }
      },
      required: ["title", "questions"]
    };

    const lessonSchema: any = {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        estimatedDuration: { type: "number" }
      },
      required: ["title", "content", "estimatedDuration"]
    };

    // Add quiz to lessons if frequency is 'lesson'
    if (generateQuizzes && quizFrequency === 'lesson') {
      lessonSchema.properties.quiz = quizSchema;
    }

    const moduleSchema: any = {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        estimatedDuration: { type: "number" },
        lessons: {
          type: "array",
          items: lessonSchema
        }
      },
      required: ["title", "description", "estimatedDuration", "lessons"]
    };

    // Add quiz to modules if frequency is 'module'
    if (generateQuizzes && quizFrequency === 'module') {
      moduleSchema.properties.quiz = quizSchema;
    }

    try {
      const response = await ai.models.generateContent({
        model: this.model,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              estimatedDuration: { type: "number" },
              difficultyLevel: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              modules: {
                type: "array",
                items: moduleSchema
              }
            },
            required: ["title", "description", "estimatedDuration", "difficultyLevel", "modules"]
          }
        },
        contents: userPrompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error("Empty response from model");
      }

      const courseStructure: CourseStructure = JSON.parse(rawJson);
      return courseStructure;
    } catch (error) {
      console.error("Failed to generate course structure:", error);
      throw new Error(`Failed to generate course structure: ${error}`);
    }
  }

  async enhanceContent(content: string, context: string): Promise<string> {
    const prompt = `
    As an expert educator, enhance the following content with:
    1. Clear explanations and examples
    2. Relevant real-world applications
    3. Key takeaways and summaries
    4. Interactive elements suggestions
    
    Context: ${context}
    Content: ${content}
    
    Enhanced content:
    `;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    return response.text || content;
  }

  async generateQuizQuestions(content: string, count: number, difficultyLevel: string): Promise<any[]> {
    const difficultyInstructions: Record<string, string> = {
      beginner: `
        - Use simple, clear language in questions
        - Test basic understanding and recall
        - Ask about fundamental concepts from the content
        - Provide straightforward options with clear distinctions
        - Focus on "what" and "who" questions
        - Base ALL questions directly on explicit facts from the content`,
      intermediate: `
        - Use moderate technical language appropriate to the content
        - Test comprehension and application
        - Ask about relationships between concepts from the content
        - Include some analytical questions
        - Mix "what", "how", and "why" questions
        - Base ALL questions on information present in the content`,
      advanced: `
        - Use sophisticated language from the source material
        - Test analysis and synthesis
        - Ask about complex relationships and implications
        - Include critical thinking questions
        - Focus on "why", "how", and "what if" questions from the content
        - Base ALL questions on advanced concepts from the content`,
      expert: `
        - Use highly technical language from the source
        - Test evaluation and creation abilities
        - Ask about nuanced distinctions and edge cases from the content
        - Include questions requiring deep analysis
        - Focus on synthesis and critique of source material
        - Base ALL questions on expert-level content provided`
    };

    const prompt = `
    Based on the following content, generate EXACTLY ${count} quiz questions - no more, no less.
    
    CRITICAL REQUIREMENT: You MUST generate EXACTLY ${count} questions. Not ${count - 1}, not ${count + 1}, but EXACTLY ${count} questions.
    
    UNIQUENESS REQUIREMENTS:
    - EVERY question must be completely different and unique
    - NO duplicate or similar questions
    - Each question must test a DIFFERENT concept or aspect
    - Avoid rephrasing the same question in different ways
    - Ensure variety in topics covered across all questions
    
    DIFFICULTY LEVEL: ${difficultyLevel.toUpperCase()}
    ${difficultyInstructions[difficultyLevel] || difficultyInstructions.intermediate}
    
    QUESTION SPECIFICATIONS:
    - Mix of multiple choice and true/false questions
    - Test understanding appropriate to ${difficultyLevel} level
    - Include plausible distractors for multiple choice
    - Provide explanations for correct answers
    - ALL questions must be based ONLY on the provided content
    - Do NOT introduce external knowledge or assumptions
    
    Content: ${content}
    
    Return as JSON array with structure:
    {
      "question": "Question text",
      "type": "multiple_choice" | "true_false",
      "options": ["option1", "option2", ...] (for multiple choice),
      "correctAnswer": "correct answer",
      "explanation": "Why this is correct based on the content"
    }
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.model,
        config: {
          responseMimeType: "application/json",
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error("Empty response from model");
      }

      return JSON.parse(rawJson);
    } catch (error) {
      console.error("Failed to generate quiz questions:", error);
      return [];
    }
  }
}

export const geminiService = new GeminiService();
