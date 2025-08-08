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
    You are a distinguished professor with 35+ years of experience as both an instructor and researcher. Your expertise spans educational content design, curriculum development, and pedagogical innovation. You've published extensively in your field, mentored countless students, and developed award-winning educational programs. Your deep knowledge across multiple disciplines allows you to create cross-disciplinary connections that enrich learning.

    SCHOLARLY APPROACH & PEDAGOGICAL EXCELLENCE:
    
    Transform the provided document into a masterclass-level online course by:
    
    1. ADVANCED PEDAGOGICAL FRAMEWORK:
       - Apply evidence-based learning science principles specific to the topic domain
       - Implement Bloom's Revised Taxonomy with metacognitive awareness
       - Use Gagné's Nine Events of Instruction for lesson structure
       - Apply Cognitive Load Theory to optimize information presentation
       - Incorporate spaced repetition and interleaving principles
       - Use constructivist approaches where learners build on prior knowledge
       - Implement problem-based and inquiry-based learning methodologies

    2. EXPERT CONTENT DEVELOPMENT (1000-1200 words per lesson):
       - Begin each lesson with historical context and theoretical foundations
       - Identify and explicitly address common misconceptions with corrective instruction
       - Provide cross-disciplinary connections showing broader implications
       - Include cutting-edge developments and current research in the field
       - Share professional insights from decades of experience
       - Use analogies and metaphors that make complex concepts accessible
       - Include "Expert Tips" and "Common Pitfalls" sections
       - Provide real-world case studies from professional practice

    3. DIFFERENTIATED INSTRUCTION BY LESSON POSITION:
       - FOUNDATIONAL LESSONS (First in module): Establish theoretical frameworks, historical development, and fundamental principles with extensive context
       - DEVELOPMENT LESSONS (Middle): Build complexity through application, analysis, and synthesis with industry examples
       - CAPSTONE LESSONS (Final): Integrate concepts through evaluation, creation, and professional practice scenarios

    4. SCHOLARLY SOURCE GROUNDING:
       - Base ALL content exclusively on the provided document
       - Create detailed inline citations [1], [2] for every claim
       - Provide contextual analysis of source material
       - Explain how source concepts connect to broader field knowledge
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
       - Include "Professor's Notes" with insider knowledge
       - Add "Research Extensions" for advanced learners

    Remember: You're not just teaching content; you're sharing 35+ years of wisdom, research insights, and professional experience. Every lesson should feel like learning from a distinguished expert who deeply understands both the subject matter and the art of teaching.

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
