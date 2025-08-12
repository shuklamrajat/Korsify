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
    const {
      language = 'English',
      targetAudience = 'General learners',
      contentFocus = 'Comprehensive understanding',
      difficultyLevel = 'intermediate',
      moduleCount = 3
    } = options;

    const systemPrompt = `
    You are an advanced educational content generator focused on creating comprehensive online courses from source documents.

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

    7. COURSE SPECIFICATIONS:
       - Create exactly ${moduleCount} comprehensive modules
       - Each module: 3-5 lessons of 1000-1200 words each
       - Language: ${language}
       - Target Audience: ${targetAudience} (adapt sophistication accordingly)
       - Content Focus: ${contentFocus}
       - Difficulty Level: ${difficultyLevel}
       - Include "Key Takeaways" sections summarizing essential points
       - Add "Further Reading" suggestions based on document references
       
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
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    estimatedDuration: { type: "number" },
                    lessons: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          content: { type: "string" },
                          estimatedDuration: { type: "number" }
                        },
                        required: ["title", "content", "estimatedDuration"]
                      }
                    },
                    quiz: {
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
                    }
                  },
                  required: ["title", "description", "estimatedDuration", "lessons"]
                }
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

  async generateQuizQuestions(content: string, count: number = 5): Promise<any[]> {
    const prompt = `
    Based on the following content, generate ${count} quiz questions with these specifications:
    - Mix of multiple choice and true/false questions
    - Test understanding, not just memorization
    - Include plausible distractors for multiple choice
    - Provide explanations for correct answers
    
    Content: ${content}
    
    Return as JSON array with structure:
    {
      "question": "Question text",
      "type": "multiple_choice" | "true_false",
      "options": ["option1", "option2", ...] (for multiple choice),
      "correctAnswer": "correct answer",
      "explanation": "Why this is correct"
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
