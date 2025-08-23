# Document Scope Analysis Implementation Plan

## Current State Analysis

### How Content Scope is Currently Decided:
1. **Prompt-Based Constraints Only**: The AI is instructed through prompts to "stay within document content"
   - Lines like "Base ALL content exclusively on the provided document" (gemini.ts:140)
   - "Never introduce information not present in the source" (gemini.ts:144)
   
2. **No Systematic Scope Extraction**: The `analyzeDocument` method exists but:
   - Returns unstructured text analysis
   - Output isn't used to constrain generation
   - No validation against extracted scope

3. **Risk of Scope Creep**: 
   - AI might hallucinate related topics not in document
   - No mechanism to validate if generated content matches document scope
   - Difficulty level changes might inadvertently introduce external concepts

## Proposed Solution: Document Scope Analysis Pipeline

### Phase 1: Document Scope Extraction (Pre-Generation)

#### Step 1.1: Enhanced Document Analysis
```typescript
interface DocumentScope {
  mainTopic: string;
  subTopics: string[];
  concepts: ConceptMap[];
  boundaries: {
    included: string[];  // Topics explicitly covered
    excluded: string[];  // Topics mentioned but not covered
    depth: 'surface' | 'intermediate' | 'comprehensive';
  };
  contentMetrics: {
    wordCount: number;
    conceptDensity: number;  // concepts per 1000 words
    maxModules: number;      // recommended based on content
  };
}

interface ConceptMap {
  concept: string;
  definition: string;
  relatedConcepts: string[];
  sourceReferences: string[];  // Direct quotes from document
}
```

#### Step 1.2: Scope Extraction Implementation
```typescript
async analyzeDocumentScope(content: string, fileName: string): Promise<DocumentScope> {
  const prompt = `
    Analyze this document and extract its EXACT scope. Be extremely precise.
    
    CRITICAL INSTRUCTIONS:
    1. List ONLY topics that are explicitly discussed in the document
    2. Identify concepts with their exact definitions from the document
    3. Note topics that are mentioned but NOT explained (mark as excluded)
    4. Assess the depth of coverage for each topic
    5. Extract direct quotes as evidence for each concept
    
    Return a JSON object with this structure:
    {
      "mainTopic": "Primary subject of the document",
      "subTopics": ["List of subtopics actually covered"],
      "concepts": [
        {
          "concept": "Term or concept",
          "definition": "Exact definition from document",
          "relatedConcepts": ["Other related terms in doc"],
          "sourceReferences": ["Direct quotes showing this concept"]
        }
      ],
      "boundaries": {
        "included": ["Topics with substantial coverage"],
        "excluded": ["Topics mentioned but not explained"],
        "depth": "surface|intermediate|comprehensive"
      },
      "contentMetrics": {
        "wordCount": number,
        "conceptDensity": number,
        "maxModules": number
      }
    }
  `;
  
  // Use structured output with JSON schema
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: DocumentScopeSchema
    }
  });
  
  return JSON.parse(response.text);
}
```

### Phase 2: Scope-Constrained Generation

#### Step 2.1: Pass Scope to Course Generation
```typescript
async generateCourseStructure(
  documentContent: string,
  fileName: string,
  options: GenerationOptions,
  documentScope: DocumentScope  // NEW PARAMETER
) {
  const scopeConstraints = `
    CRITICAL SCOPE BOUNDARIES:
    
    Main Topic: ${documentScope.mainTopic}
    Allowed Subtopics: ${documentScope.subTopics.join(', ')}
    
    STRICT RULES:
    1. ONLY use these concepts: ${documentScope.concepts.map(c => c.concept).join(', ')}
    2. NEVER introduce topics from this excluded list: ${documentScope.boundaries.excluded.join(', ')}
    3. Each concept MUST use the exact definition provided in the scope
    4. Maximum depth: ${documentScope.boundaries.depth}
    5. Generate ${Math.min(options.moduleCount, documentScope.contentMetrics.maxModules)} modules
    
    VALIDATION REQUIREMENT:
    For every piece of content you generate, you must be able to point to a specific 
    concept or source reference from the document scope.
  `;
  
  // Add scope constraints to the generation prompt
  const systemPrompt = basePrompt + scopeConstraints;
}
```

#### Step 2.2: Scope Validation During Generation
```typescript
interface GeneratedContent {
  modules: Module[];
  scopeValidation: {
    usedConcepts: string[];
    unmappedContent: string[];  // Content that couldn't be mapped to scope
    scopeViolations: string[];   // Content outside document scope
  };
}
```

### Phase 3: Post-Generation Validation

#### Step 3.1: Content-to-Scope Mapping
```typescript
async validateGeneratedContent(
  generatedContent: CourseStructure,
  documentScope: DocumentScope
): Promise<ValidationResult> {
  const violations = [];
  const mappings = [];
  
  for (const module of generatedContent.modules) {
    // Check if module topic is within scope
    const moduleInScope = documentScope.subTopics.some(topic => 
      similarity(module.title, topic) > 0.7
    );
    
    if (!moduleInScope) {
      violations.push({
        type: 'out_of_scope',
        content: module.title,
        suggestion: findClosestTopic(module.title, documentScope.subTopics)
      });
    }
    
    for (const lesson of module.lessons) {
      // Extract concepts from lesson content
      const lessonConcepts = extractConcepts(lesson.content);
      
      // Validate each concept against document scope
      for (const concept of lessonConcepts) {
        const validConcept = documentScope.concepts.find(c => 
          similarity(c.concept, concept) > 0.8
        );
        
        if (!validConcept) {
          violations.push({
            type: 'undefined_concept',
            content: concept,
            lesson: lesson.title
          });
        } else {
          mappings.push({
            generatedConcept: concept,
            sourceConcept: validConcept.concept,
            sourceReference: validConcept.sourceReferences[0]
          });
        }
      }
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations,
    mappings,
    coverage: mappings.length / documentScope.concepts.length
  };
}
```

### Phase 4: User Feedback Integration

#### Step 4.1: Scope Preview Before Generation
```typescript
// In AI Generation Dialog
const ScopePreview = ({ documentScope }) => (
  <Card>
    <CardHeader>
      <h3>Document Analysis Complete</h3>
      <Badge>{documentScope.mainTopic}</Badge>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <p>Topics to be covered: {documentScope.subTopics.length}</p>
        <p>Key concepts identified: {documentScope.concepts.length}</p>
        <p>Recommended modules: {documentScope.contentMetrics.maxModules}</p>
        
        <Alert>
          <AlertDescription>
            The course will strictly cover only the topics found in your document.
            No external information will be added.
          </AlertDescription>
        </Alert>
        
        <Button onClick={proceedWithGeneration}>
          Generate Course Within This Scope
        </Button>
      </div>
    </CardContent>
  </Card>
);
```

## Implementation Steps

### Step 1: Update Document Analysis (Day 1)
1. Modify `analyzeDocument` to return structured `DocumentScope`
2. Add JSON schema for structured output
3. Store scope analysis in database

### Step 2: Integrate Scope into Generation (Day 2)
1. Pass `DocumentScope` to `generateCourseStructure`
2. Add scope constraints to generation prompt
3. Include concept mapping in prompts

### Step 3: Add Validation Layer (Day 3)
1. Implement `validateGeneratedContent` function
2. Add scope violation detection
3. Create concept mapping validation

### Step 4: Update UI (Day 4)
1. Add scope preview in generation dialog
2. Show document analysis results
3. Display scope coverage metrics

### Step 5: Testing & Refinement (Day 5)
1. Test with various document types
2. Tune similarity thresholds
3. Add retry logic for scope violations

## Benefits of This Approach

1. **Guaranteed Scope Adherence**: Content mathematically validated against document
2. **Transparency**: Users see exactly what will be covered
3. **Quality Control**: Automatic detection of hallucinations
4. **Smart Limits**: Module count based on actual content density
5. **Traceability**: Every generated concept maps to source

## Monitoring & Metrics

### Key Metrics to Track:
- Scope violation rate per generation
- Concept coverage percentage
- User satisfaction with scope accuracy
- Generation retry rate due to violations

### Success Criteria:
- 0% out-of-scope content in generated courses
- 95%+ concept coverage from document
- <5% generation retries due to scope violations

## Rollback Plan

If scope analysis causes issues:
1. Keep current prompt-based approach as fallback
2. Make scope validation optional (warning mode)
3. Allow manual scope override by users

## Next Steps

1. **Immediate**: Implement structured document analysis
2. **Short-term**: Add scope validation to generation
3. **Long-term**: Machine learning model for scope extraction

---

**Recommendation**: Start with Phase 1 (Document Scope Extraction) as it provides immediate value without breaking existing functionality. Then progressively add validation layers to ensure perfect scope adherence.