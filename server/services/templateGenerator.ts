import { GoogleGenAI } from "@google/genai";
import type { CourseTemplate, Course, Module, Lesson } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CourseStructure {
  modules: {
    title: string;
    description: string;
    orderIndex: number;
    estimatedDuration: number;
    lessons: {
      title: string;
      content: string;
      orderIndex: number;
      estimatedDuration: number;
    }[];
  }[];
}

export interface TemplateGenerationRequest {
  title: string;
  description: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: string;
  estimatedDuration: number;
}

export class TemplateGenerator {
  async generateCourseFromTemplate(
    template: CourseTemplate,
    customization: {
      title?: string;
      targetAudience?: string;
      difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    } = {}
  ): Promise<CourseStructure> {
    const prompt = `
Create a detailed course structure based on this template:

Template: ${template.name}
Description: ${template.description}
Category: ${template.category}
Difficulty: ${customization.difficultyLevel || template.difficultyLevel}
Target Audience: ${customization.targetAudience || 'General learners'}

Generate a comprehensive course with:
1. 3-5 modules with clear learning objectives
2. 3-4 lessons per module with practical content
3. Realistic duration estimates (5-15 minutes per lesson)
4. Progressive difficulty building on previous concepts

Make the content engaging, practical, and suitable for online learning.
Focus on actionable knowledge and real-world applications.

Respond with JSON in this exact format:
{
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "orderIndex": 1,
      "estimatedDuration": 45,
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed lesson content with learning objectives, key concepts, and practical examples",
          "orderIndex": 1,
          "estimatedDuration": 15
        }
      ]
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              modules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    orderIndex: { type: "number" },
                    estimatedDuration: { type: "number" },
                    lessons: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          content: { type: "string" },
                          orderIndex: { type: "number" },
                          estimatedDuration: { type: "number" }
                        },
                        required: ["title", "content", "orderIndex", "estimatedDuration"]
                      }
                    }
                  },
                  required: ["title", "description", "orderIndex", "estimatedDuration", "lessons"]
                }
              }
            },
            required: ["modules"]
          }
        },
        contents: prompt,
      });

      const courseStructure = JSON.parse(response.text || "{}") as CourseStructure;
      return courseStructure;
    } catch (error) {
      console.error("Template generation error:", error);
      throw new Error(`Failed to generate course from template: ${error}`);
    }
  }

  async createCustomTemplate(request: TemplateGenerationRequest): Promise<CourseStructure> {
    const prompt = `
Create a custom course template for:

Title: ${request.title}
Description: ${request.description}
Category: ${request.category}
Difficulty: ${request.difficultyLevel}
Target Audience: ${request.targetAudience}
Total Duration: ${request.estimatedDuration} minutes

Generate a well-structured course with:
1. Appropriate number of modules for the total duration
2. Balanced lesson distribution
3. Learning objectives that build progressively
4. Practical, actionable content
5. Real-world examples and applications

Each lesson should be substantial with clear learning outcomes.
Include introductory content, core concepts, practical examples, and summary.

Respond with JSON in this exact format:
{
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "orderIndex": 1,
      "estimatedDuration": 45,
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed lesson content with learning objectives, key concepts, and practical examples",
          "orderIndex": 1,
          "estimatedDuration": 15
        }
      ]
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              modules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    orderIndex: { type: "number" },
                    estimatedDuration: { type: "number" },
                    lessons: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          content: { type: "string" },
                          orderIndex: { type: "number" },
                          estimatedDuration: { type: "number" }
                        },
                        required: ["title", "content", "orderIndex", "estimatedDuration"]
                      }
                    }
                  },
                  required: ["title", "description", "orderIndex", "estimatedDuration", "lessons"]
                }
              }
            },
            required: ["modules"]
          }
        },
        contents: prompt,
      });

      const courseStructure = JSON.parse(response.text || "{}") as CourseStructure;
      return courseStructure;
    } catch (error) {
      console.error("Custom template generation error:", error);
      throw new Error(`Failed to create custom template: ${error}`);
    }
  }
}

export const templateGenerator = new TemplateGenerator();