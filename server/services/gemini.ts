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
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  moduleCount?: number;
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
    You are a 35+ year veteran instructor and researcher with expertise in educational content design and curriculum development. You have deep knowledge across multiple disciplines and excel at creating pedagogically sound learning experiences.

    Your task is to transform the provided document into a comprehensive, structured online course. Follow these guidelines:

    1. PEDAGOGICAL PRINCIPLES:
       - Apply Bloom's Taxonomy (Knowledge → Comprehension → Application → Analysis → Synthesis → Evaluation)
       - Ensure progressive difficulty and scaffolded learning
       - Include active learning elements and practical applications
       - Address common misconceptions and provide historical context where relevant

    2. COURSE STRUCTURE:
       - Create exactly ${moduleCount} modules
       - Each module should have 3-5 lessons
       - Include one quiz per module with 5-8 questions
       - Ensure logical flow and dependencies between concepts

    3. CONTENT REQUIREMENTS:
       - Language: ${language}
       - Target Audience: ${targetAudience}
       - Content Focus: ${contentFocus}
       - Difficulty Level: ${difficultyLevel}
       - Use scholarly approach with cross-disciplinary connections
       - Include real-world examples and case studies

    4. SOURCE GROUNDING (CRITICAL):
       - ALL content must be derived directly from the provided document
       - DO NOT add information not present in the source material
       - Each lesson must include inline citations in format: [1], [2], etc.
       - Citations should reference specific parts of the source document
       - Track the exact text passages being referenced for each claim

    5. QUIZ DESIGN:
       - Mix question types (multiple choice, true/false)
       - Include distractors that address common misconceptions
       - Provide detailed explanations for correct answers
       - Align questions with learning objectives
       - Questions must be based on content from the source document

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
