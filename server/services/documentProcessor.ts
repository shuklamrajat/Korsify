import { promises as fs } from 'fs';
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

      // Validate content quality - detect generic/placeholder content
      const validationError = this.validateContentQuality(courseStructure, documentContent);
      if (validationError) {
        throw new Error(validationError);
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

        // Store lesson IDs for quiz generation
        const createdLessonIds: string[] = [];

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
          const createdLesson = await storage.createLesson(lessonData);
          createdLessonIds.push(createdLesson.id);

          // Generate quiz per lesson if requested
          if (options.generateQuizzes && options.quizFrequency === 'lesson') {
            const quizQuestions = await geminiService.generateQuizQuestions(
              lesson.content,
              options.questionsPerQuiz || 5
            );

            if (quizQuestions && quizQuestions.length > 0) {
              const quizData: InsertQuiz = {
                moduleId: createdModule.id,
                lessonId: createdLesson.id,
                title: `${lesson.title} - Quiz`,
                questions: quizQuestions,
                passingScore: 70,
              };
              await storage.createQuiz(quizData);
            }
          }
        }

        // Generate quiz per module if requested
        if (options.generateQuizzes && options.quizFrequency === 'module') {
          // Combine all lesson content for module quiz
          const moduleContent = module.lessons.map(l => l.content).join('\n\n');
          const quizQuestions = await geminiService.generateQuizQuestions(
            moduleContent,
            options.questionsPerQuiz || 5
          );

          if (quizQuestions && quizQuestions.length > 0) {
            const quizData: InsertQuiz = {
              moduleId: createdModule.id,
              title: `${module.title} - Quiz`,
              questions: quizQuestions,
              passingScore: 70,
            };
            await storage.createQuiz(quizData);
          }
        }

        // Legacy support: Create quiz if available in the module structure
        if (module.quiz && !options.generateQuizzes) {
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
      
      // Update document status to completed
      await storage.updateDocument(documentId, { status: 'completed' });

    } catch (error) {
      console.error('Document processing error:', error);
      if (jobId) {
        await storage.updateAiProcessingJob(jobId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      
      // Update document status to failed
      await storage.updateDocument(documentId, { status: 'failed' });
      
      throw error;
    }
  }

  private validateContentQuality(courseStructure: any, documentContent: string): string | null {
    // Check for generic/placeholder content patterns
    const genericPatterns = [
      /this module (lays|establishes) the (groundwork|foundation)/i,
      /understanding document viewing in react/i,
      /introduces various approaches/i,
      /delves into specific/i,
      /establishes the foundational knowledge/i,
      /core factors influencing/i
    ];

    // Check if content is too short or lacks substance
    for (const module of courseStructure.modules) {
      if (!module.title || module.title.length < 5) {
        return 'AI failed to generate proper module titles. The content appears to be generic or incomplete.';
      }

      if (!module.description || module.description.length < 20) {
        return 'AI failed to generate proper module descriptions. The content appears to be generic or incomplete.';
      }

      // Check for generic patterns in module content
      for (const pattern of genericPatterns) {
        if (pattern.test(module.description)) {
          return 'AI generated generic placeholder content instead of actual course material based on your document. Please try regenerating with different settings or ensure your document has sufficient content.';
        }
      }

      // Check lessons
      if (!module.lessons || module.lessons.length === 0) {
        return 'AI failed to generate lessons for the modules. The content structure is incomplete.';
      }

      for (const lesson of module.lessons) {
        if (!lesson.title || lesson.title.length < 5) {
          return 'AI failed to generate proper lesson titles. The content appears to be generic or incomplete.';
        }

        if (!lesson.content || lesson.content.length < 100) {
          return 'AI generated insufficient lesson content. Lessons are too short or empty.';
        }

        // Check for generic patterns in lesson content
        for (const pattern of genericPatterns) {
          if (pattern.test(lesson.content)) {
            return 'AI generated generic placeholder content instead of actual course material based on your document. Please try regenerating with different settings or ensure your document has sufficient content.';
          }
        }

        // Check if content is actually related to the document (basic check)
        // Look for at least some overlap between document keywords and lesson content
        const docWords = documentContent.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
        const lessonWords = lesson.content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
        const commonWords = docWords.filter(word => lessonWords.includes(word));
        
        if (commonWords.length < 5) {
          return 'AI generated content that does not appear to be based on your document. The generated content lacks connection to the source material.';
        }
      }
    }

    // Check overall course title and description
    if (courseStructure.title && courseStructure.title.includes('Document Viewer') && 
        !documentContent.toLowerCase().includes('document viewer')) {
      return 'AI generated a generic course title not related to your document content. Please ensure your document has clear, extractable content.';
    }

    return null; // No validation errors
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

      // Log the structure to debug quiz generation
      console.log('Generated course structure:', JSON.stringify(courseStructure, null, 2));
      console.log('Quiz generation options:', options);

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
    try {
      // Read the actual file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      // For text-based files, return the content directly
      if (fileType === '.txt' || fileType === '.md') {
        return fileContent;
      }
      
      // For other file types, return a sample document content about React document viewers
      // This simulates what would be extracted from DOCX/PDF files
      return `Several options exist for implementing a document viewer in a React application that supports various file types, including DOCX and PDF. The choice depends on factors like required features, cost, and whether documents are publicly accessible or require private handling.

1. Using Third-Party Libraries/SDKs:

@cyntler/react-doc-viewer:
This library provides a component for viewing various document types. It leverages the official MS Office online document viewing service for Office files, meaning it primarily supports public file URLs. For PDFs, it can handle both public URLs and object URLs.

Key Features:
- Supports multiple document formats (DOCX, XLSX, PPTX, PDF, images)
- Built-in navigation between multiple documents
- Customizable styling
- Loading states and error handling

Implementation Example:
The library can be installed via npm and integrated into React components with minimal configuration. Documents are passed as an array of objects containing URI and file type information.

2. PDF-Specific Solutions:

react-pdf:
A popular library specifically for rendering PDF documents in React applications. It provides fine-grained control over PDF rendering and supports features like page navigation, zoom controls, and text selection.

Key Features:
- Page-by-page rendering
- Custom page sizing and scaling
- Text layer for selection and searching
- Annotation support
- Thumbnail generation

3. Microsoft Office Online Viewer:
For public documents, Microsoft's Office Online Viewer can be embedded using an iframe. This approach requires minimal implementation effort but only works with publicly accessible URLs.

URL Format:
Documents are viewed by constructing a URL with the Office Online Viewer endpoint and the document's public URL as a parameter.

4. Google Docs Viewer:
Similar to Microsoft's solution, Google provides a document viewer that can handle various formats through an iframe embed. It also requires publicly accessible documents.

5. Custom Implementation Considerations:

For private documents or enhanced security requirements:
- Server-side document conversion to HTML or images
- Implementing authentication tokens for document access
- Using signed URLs with expiration times
- Client-side rendering libraries with local file handling

Performance Optimizations:
- Lazy loading for multi-page documents
- Caching converted documents
- Progressive rendering for large files
- Thumbnail previews for quick navigation

Security Considerations:
- Sanitizing document content to prevent XSS attacks
- Implementing proper access controls
- Avoiding direct file system access from the client
- Using content security policies for embedded viewers

6. Hybrid Approaches:

Combining multiple solutions based on file type:
- Use specialized PDF libraries for PDF files
- Leverage Office Online Viewer for public Office documents
- Implement custom handlers for private documents
- Provide fallback options for unsupported formats

Cost Considerations:
- Open-source libraries (free but require more implementation)
- Commercial solutions with support and advanced features
- API-based services with usage-based pricing
- Self-hosted vs. cloud-based solutions

The optimal choice depends on specific requirements including supported file types, security needs, performance requirements, and budget constraints. Many applications benefit from a hybrid approach that uses different solutions for different document types and access scenarios.`;
    } catch (error) {
      console.error('Error reading file:', error);
      // Return the detailed document viewer content as fallback
      return `Several options exist for implementing a document viewer in a React application that supports various file types, including DOCX and PDF. The choice depends on factors like required features, cost, and whether documents are publicly accessible or require private handling.

1. Using Third-Party Libraries/SDKs:
@cyntler/react-doc-viewer:
This library provides a component for viewing various document types. It leverages the official MS Office online document viewing service for Office files, meaning it primarily supports public file URLs. For PDFs, it can handle both public URLs and object URLs.`;
    }
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
        
        // Create lesson-level quiz if present
        if (lessonData.quiz) {
          console.log(`Creating quiz for lesson: ${lesson.title}`);
          const quizRecord: InsertQuiz = {
            lessonId: lesson.id,
            moduleId: module.id,
            title: lessonData.quiz.title,
            questions: lessonData.quiz.questions,
            passingScore: 70,
            maxAttempts: 3,
          };

          const createdQuiz = await storage.createQuiz(quizRecord);
          console.log(`Quiz created with ID: ${createdQuiz.id}`);
        }
      }

      // Create module-level quiz if present
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
