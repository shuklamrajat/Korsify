import * as fs from 'fs';
import * as path from 'path';
import { geminiService, type AIGenerationOptions } from './gemini';
import { storage } from '../storage';
import type { InsertCourse, InsertModule, InsertLesson, InsertQuiz } from '@shared/schema';

export interface ProcessingPhase {
  name: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class DocumentProcessor {
  private phases: ProcessingPhase[] = [
    { name: 'document_analysis', progress: 0, status: 'pending' },
    { name: 'content_analysis', progress: 0, status: 'pending' },
    { name: 'content_generation', progress: 0, status: 'pending' },
    { name: 'validation', progress: 0, status: 'pending' },
    { name: 'finalization', progress: 0, status: 'pending' },
  ];

  async processDocument(
    documentId: string,
    userId: string,
    options: AIGenerationOptions = {},
    onProgressUpdate?: (phase: string, progress: number) => void
  ): Promise<string> {
    try {
      // Create AI processing job
      const job = await storage.createAiProcessingJob({
        documentId,
        status: 'processing',
        phase: 'document_analysis',
        progress: 0,
      });

      // Phase 1: Document Analysis (0-30%)
      await this.updatePhase(job.id, 'document_analysis', 10, 'processing', onProgressUpdate);
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      let documentContent = document.processedContent;
      if (!documentContent) {
        // Extract content from file if not already processed
        documentContent = await this.extractTextFromFile(document.storageUrl, document.fileType);
        await storage.updateDocumentContent(documentId, documentContent);
      }

      await this.updatePhase(job.id, 'document_analysis', 30, 'completed', onProgressUpdate);

      // Phase 2: Content Analysis (30-50%)
      await this.updatePhase(job.id, 'content_analysis', 35, 'processing', onProgressUpdate);
      
      const analysis = await geminiService.analyzeDocument(documentContent, document.fileName);
      
      await this.updatePhase(job.id, 'content_analysis', 50, 'completed', onProgressUpdate);

      // Phase 3: Content Generation (50-85%)
      await this.updatePhase(job.id, 'content_generation', 55, 'processing', onProgressUpdate);
      
      const courseStructure = await geminiService.generateCourseStructure(
        documentContent,
        document.fileName,
        options
      );

      await this.updatePhase(job.id, 'content_generation', 85, 'completed', onProgressUpdate);

      // Phase 4: Validation (85-95%)
      await this.updatePhase(job.id, 'validation', 90, 'processing', onProgressUpdate);
      
      // Validate the generated structure
      this.validateCourseStructure(courseStructure);
      
      await this.updatePhase(job.id, 'validation', 95, 'completed', onProgressUpdate);

      // Phase 5: Finalization (95-100%)
      await this.updatePhase(job.id, 'finalization', 96, 'processing', onProgressUpdate);
      
      const courseId = await this.createCourseFromStructure(courseStructure, userId, documentId, options);
      
      await this.updatePhase(job.id, 'finalization', 100, 'completed', onProgressUpdate);

      // Update job as completed
      await storage.updateAiProcessingJob(job.id, {
        status: 'completed',
        progress: 100,
        result: { courseId, analysis },
      });

      return courseId;
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  private async updatePhase(
    jobId: string,
    phase: string,
    progress: number,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    onProgressUpdate?: (phase: string, progress: number) => void
  ): Promise<void> {
    await storage.updateAiProcessingJob(jobId, {
      phase: phase as any,
      progress,
    });

    if (onProgressUpdate) {
      onProgressUpdate(phase, progress);
    }

    // Small delay to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    // For demo purposes, return placeholder content
    // In production, implement actual file parsing based on fileType
    return `Processed content from ${fileType} file. This would contain the actual extracted text from the uploaded document.`;
  }

  private validateCourseStructure(structure: any): void {
    if (!structure.title || !structure.modules || !Array.isArray(structure.modules)) {
      throw new Error('Invalid course structure generated');
    }

    if (structure.modules.length === 0) {
      throw new Error('No modules generated');
    }

    for (const module of structure.modules) {
      if (!module.title || !module.lessons || !Array.isArray(module.lessons)) {
        throw new Error('Invalid module structure');
      }

      if (module.lessons.length === 0) {
        throw new Error('Module has no lessons');
      }
    }
  }

  private async createCourseFromStructure(
    structure: any,
    userId: string,
    documentId: string,
    options: AIGenerationOptions
  ): Promise<string> {
    // Create course
    const courseData: InsertCourse = {
      title: structure.title,
      description: structure.description,
      creatorId: userId,
      documentId,
      status: 'draft',
      language: options.language || 'en',
      targetAudience: options.targetAudience,
      contentFocus: options.contentFocus,
      difficultyLevel: structure.difficultyLevel,
      estimatedDuration: structure.estimatedDuration,
    };

    const course = await storage.createCourse(courseData);

    // Create modules and lessons
    for (let i = 0; i < structure.modules.length; i++) {
      const moduleData = structure.modules[i];
      
      const moduleRecord: InsertModule = {
        courseId: course.id,
        title: moduleData.title,
        description: moduleData.description,
        orderIndex: i,
        estimatedDuration: moduleData.estimatedDuration,
      };

      const module = await storage.createModule(moduleRecord);

      // Create lessons
      for (let j = 0; j < moduleData.lessons.length; j++) {
        const lessonData = moduleData.lessons[j];
        
        const lessonRecord: InsertLesson = {
          moduleId: module.id,
          title: lessonData.title,
          content: lessonData.content,
          orderIndex: j,
          estimatedDuration: lessonData.estimatedDuration,
        };

        const lesson = await storage.createLesson(lessonRecord);
      }

      // Create quiz if present
      if (moduleData.quiz) {
        const quizRecord: InsertQuiz = {
          moduleId: module.id,
          title: moduleData.quiz.title,
          questions: moduleData.quiz.questions,
          passingScore: 70,
          maxAttempts: 3,
        };

        await storage.createQuiz(quizRecord);
      }
    }

    return course.id;
  }

  async getProcessingStatus(jobId: string): Promise<any> {
    const job = await storage.getAiProcessingJob(jobId);
    if (!job) {
      throw new Error('Processing job not found');
    }

    return {
      status: job.status,
      phase: job.phase,
      progress: job.progress,
      error: job.error,
      result: job.result,
    };
  }
}

export const documentProcessor = new DocumentProcessor();
