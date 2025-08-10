import * as fs from 'fs';
import * as path from 'path';
import { geminiService, type AIGenerationOptions } from './gemini';
import { storage } from '../storage';
import type { InsertCourse, InsertModule, InsertLesson, InsertQuiz, SourceReference } from '@shared/schema';

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

  async processDocumentAsync(
    documentId: string,
    userId: string,
    courseId: string,
    jobId?: string,
    options: AIGenerationOptions = {}
  ): Promise<void> {
    try {
      // Phase 1: Document Analysis (0-30%)
      if (jobId) {
        await this.updateJobPhase(jobId, 'document_analysis', 10, 'processing');
      }
      
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

      if (jobId) {
        await this.updateJobPhase(jobId, 'document_analysis', 30, 'completed');
      }

      // Phase 2: Content Analysis (30-50%)
      if (jobId) {
        await this.updateJobPhase(jobId, 'content_analysis', 35, 'processing');
      }
      
      const analysis = await geminiService.analyzeDocument(documentContent, document.fileName);
      
      if (jobId) {
        await this.updateJobPhase(jobId, 'content_analysis', 50, 'completed');
      }

      // Phase 3: Content Generation (50-85%)
      if (jobId) {
        await this.updateJobPhase(jobId, 'content_generation', 55, 'processing');
      }
      
      const courseStructure = await geminiService.generateCourseStructure(
        documentContent,
        document.fileName,
        options
      );

      if (jobId) {
        await this.updateJobPhase(jobId, 'content_generation', 85, 'completed');
      }

      // Phase 4: Validation (85-95%)
      if (jobId) {
        await this.updateJobPhase(jobId, 'validation', 90, 'processing');
      }
      
      // Validate the generated structure
      if (!courseStructure || !courseStructure.modules || courseStructure.modules.length === 0) {
        throw new Error('Generated course structure is invalid');
      }

      if (jobId) {
        await this.updateJobPhase(jobId, 'validation', 95, 'completed');
      }

      // Phase 5: Finalization (95-100%)
      if (jobId) {
        await this.updateJobPhase(jobId, 'finalization', 96, 'processing');
      }

      // Update the existing course with generated content
      await storage.updateCourse(courseId, {
        title: courseStructure.title,
        description: courseStructure.description,
      });

      // Create modules and lessons
      for (let moduleIndex = 0; moduleIndex < courseStructure.modules.length; moduleIndex++) {
        const module = courseStructure.modules[moduleIndex];
        const moduleData: InsertModule = {
          courseId: courseId,
          title: module.title,
          description: module.description || '',
          orderIndex: moduleIndex,
        };
        const createdModule = await storage.createModule(moduleData);

        // Create lessons for this module
        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
          const lesson = module.lessons[lessonIndex];
          
          // Generate source references from content citations
          const doc = await storage.getDocument(documentId);
          const documentName = doc?.fileName || 'Document';
          const sourceReferences = this.extractSourceReferences(lesson.content, documentId, documentName);
          
          const lessonData: InsertLesson = {
            moduleId: createdModule.id,
            title: lesson.title,
            content: lesson.content,
            orderIndex: lessonIndex,
            estimatedDuration: lesson.estimatedDuration || 10,
            videoUrl: undefined,
            attachments: [],
            sourceReferences: sourceReferences
          };
          await storage.createLesson(lessonData);
        }

        // Create quiz if available
        if (module.quiz) {
          const quizData: InsertQuiz = {
            moduleId: createdModule.id,
            title: module.quiz.title,
            questions: module.quiz.questions,
            passingScore: 70,
          };
          await storage.createQuiz(quizData);
        }
      }

      if (jobId) {
        await this.updateJobPhase(jobId, 'finalization', 100, 'completed');
      }
      if (jobId) {
        await storage.updateAiProcessingJob(jobId, { status: 'completed' });
      }

    } catch (error) {
      console.error('Document processing error:', error);
      if (jobId) {
        await storage.updateAiProcessingJob(jobId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      throw error;
    }
  }

  private extractSourceReferences(content: string, documentId: string, documentName: string): SourceReference[] {
    const references: SourceReference[] = [];
    const citationPattern = /\[(\d+)\]/g;
    let match;
    
    // Extract all citations and create proper source references
    while ((match = citationPattern.exec(content)) !== null) {
      const citationNum = parseInt(match[1]);
      const citationId = `ref-${documentId}-${citationNum}`;
      
      // Get meaningful context around the citation
      const beforeStart = Math.max(0, match.index - 200);
      const beforeText = content.substring(beforeStart, match.index);
      
      // Extract the sentence containing the citation
      const sentences = beforeText.split(/[.!?]/);
      const relevantText = sentences[sentences.length - 1]?.trim() || 
                           sentences[sentences.length - 2]?.trim() || 
                           beforeText.trim();
      
      // Get broader context
      const contextStart = Math.max(0, match.index - 300);
      const contextEnd = Math.min(content.length, match.index + 100);
      const contextText = content.substring(contextStart, contextEnd).trim();
      
      references.push({
        id: citationId,
        documentId: documentId,
        documentName: documentName,
        text: relevantText || `Reference ${citationNum}`,
        context: contextText,
        startOffset: contextStart,
        endOffset: contextEnd,
        pageNumber: undefined
      });
    }
    
    return references;
  }

  private async updateJobPhase(
    jobId: string,
    phase: 'document_analysis' | 'content_analysis' | 'content_generation' | 'validation' | 'finalization',
    progress: number,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    await storage.updateAiProcessingJob(jobId, {
      phase,
      progress,
      status
    });
  }

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
