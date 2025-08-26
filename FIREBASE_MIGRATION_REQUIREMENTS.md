# Complete Firebase Migration Requirements

## Executive Summary
Migrating Korsify from current stack (Express/PostgreSQL/Local Storage) to Firebase ecosystem for unified management, scalability, and reduced operational complexity.

## 1. Firebase Services Required

### 1.1 Core Services Needed
- **Firebase Hosting** - For React frontend ($0-10/month)
- **Firebase Functions** - For backend APIs (Pay-as-you-go)
- **Firestore Database** - NoSQL document database ($0.18/GB stored)
- **Firebase Storage** - For file uploads ($0.026/GB stored)
- **Firebase Authentication** - User management (50K MAU free)
- **Firebase Admin SDK** - Server-side operations
- **Firebase Analytics** - Usage tracking (Free)

### 1.2 Optional But Recommended
- **Firebase Performance Monitoring** - Track app performance
- **Firebase Remote Config** - Feature flags
- **Firebase App Check** - Security against abuse
- **Firebase Extensions** - Pre-built functionality

## 2. Data Migration Requirements

### 2.1 PostgreSQL to Firestore Migration

#### Current PostgreSQL Tables → Firestore Collections
```
users → users (collection)
documents → documents (collection)
courses → courses (collection)
modules → courses/{courseId}/modules (subcollection)
lessons → courses/{courseId}/modules/{moduleId}/lessons (subcollection)
quizzes → quizzes (collection with references)
quiz_attempts → quiz_attempts (collection)
enrollments → enrollments (collection)
progress → progress (collection)
ai_processing_jobs → processing_jobs (collection)
```

#### Data Structure Changes Required
```javascript
// PostgreSQL (Relational)
{
  id: "uuid",
  user_id: "foreign_key",
  created_at: "timestamp"
}

// Firestore (Document)
{
  id: "auto_generated",
  userId: "reference",
  createdAt: "timestamp",
  // Denormalized data for performance
  userName: "string",
  userEmail: "string"
}
```

### 2.2 File Storage Migration
- Current: Local `/uploads` folder
- Target: Firebase Storage buckets
- Structure: `/users/{userId}/documents/{documentId}/{filename}`

## 3. Authentication Migration

### 3.1 Current Auth System
- bcrypt password hashing
- JWT tokens in httpOnly cookies
- Session management with express-session

### 3.2 Firebase Auth Requirements
- Migrate password hashes (Firebase supports bcrypt)
- Enable email/password authentication
- Enable Google OAuth
- Custom claims for roles (creator/learner)
- Session cookie management for SSR

## 4. Backend API Migration

### 4.1 Express Routes → Cloud Functions

#### Function Mapping
```javascript
// Current Express
app.post('/api/documents/upload') → uploadDocument()
app.post('/api/courses/generate-async') → generateCourse()
app.get('/api/courses/:id') → getCourse()
app.post('/api/auth/login') → (Firebase Auth SDK)
```

#### Cloud Functions Structure
```
functions/
├── auth/
│   ├── onCreate.js (trigger on user creation)
│   └── onDelete.js (cleanup on user deletion)
├── documents/
│   ├── upload.js
│   ├── process.js
│   └── delete.js
├── courses/
│   ├── generate.js
│   ├── get.js
│   └── update.js
├── ai/
│   ├── gemini.js
│   └── processing.js
└── utils/
    ├── firestore.js
    └── storage.js
```

### 4.2 API Changes Required
- Replace Express middleware with Firebase Functions middleware
- Update CORS configuration
- Implement Firebase Admin SDK for server operations
- Update error handling for serverless environment

## 5. Frontend Changes

### 5.1 API Client Updates
```javascript
// Current
fetch('/api/courses', { credentials: 'include' })

// Firebase
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const getCourses = httpsCallable(functions, 'getCourses');
```

### 5.2 Authentication Integration
```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
const auth = getAuth();
```

### 5.3 Real-time Updates
```javascript
// Firestore real-time listeners
import { onSnapshot } from 'firebase/firestore';
onSnapshot(doc(db, "courses", courseId), (doc) => {
  // Update UI in real-time
});
```

## 6. File Handling

### 6.1 Upload Process
```javascript
// Current: Multer + Local Storage
const upload = multer({ dest: 'uploads/' });

// Firebase: Direct browser upload
import { getStorage, ref, uploadBytes } from 'firebase/storage';
const storage = getStorage();
const storageRef = ref(storage, `documents/${file.name}`);
await uploadBytes(storageRef, file);
```

### 6.2 File Processing
- Move document processing to Cloud Functions
- Use Firebase Storage triggers for automatic processing
- Store processed content in Firestore

## 7. AI Integration (Gemini)

### 7.1 Environment Variables
```env
# Current (.env)
GEMINI_API_KEY=xxx

# Firebase (Functions Config)
firebase functions:config:set gemini.api_key="xxx"
```

### 7.2 Processing Jobs
- Replace PostgreSQL job queue with Firestore + Cloud Tasks
- Use Pub/Sub for long-running AI processes
- Implement retry logic with exponential backoff

## 8. Deployment & Hosting

### 8.1 Firebase Project Setup
```bash
# Initialize Firebase project
firebase init

# Select services:
- Hosting (for React app)
- Functions (for backend)
- Firestore (database)
- Storage (files)
- Emulators (local development)
```

### 8.2 Build Configuration
```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

## 9. Security Rules

### 9.1 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Course access control
    match /courses/{courseId} {
      allow read: if request.auth != null && 
        (resource.data.creatorId == request.auth.uid ||
         exists(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + courseId)));
      allow write: if request.auth != null && resource.data.creatorId == request.auth.uid;
    }
  }
}
```

### 9.2 Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/documents/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 10. Cost Estimation

### 10.1 Monthly Costs (Estimated)
- **Hosting**: $0-10 (based on bandwidth)
- **Functions**: $0-50 (first 2M invocations free)
- **Firestore**: $0-30 (50K reads/day free)
- **Storage**: $0-10 (5GB free)
- **Authentication**: $0 (50K MAU free)
- **Total**: $0-100/month for moderate usage

### 10.2 Free Tier Limits
- Firestore: 50K reads, 20K writes, 20K deletes/day
- Storage: 5GB stored, 1GB/day download
- Functions: 125K invocations/month
- Hosting: 10GB/month transfer

## 11. Migration Steps

### Phase 1: Setup (Week 1)
1. Create Firebase project
2. Install Firebase CLI
3. Initialize all services
4. Set up development environment
5. Configure authentication providers

### Phase 2: Data Migration (Week 2)
1. Export PostgreSQL data to JSON
2. Transform data structure for Firestore
3. Write migration scripts
4. Test data integrity
5. Migrate user accounts

### Phase 3: Backend Migration (Week 3-4)
1. Rewrite API endpoints as Cloud Functions
2. Implement file upload to Firebase Storage
3. Update Gemini AI integration
4. Set up job processing with Cloud Tasks
5. Test all API endpoints

### Phase 4: Frontend Migration (Week 5)
1. Install Firebase SDK
2. Update authentication flow
3. Replace API calls with Firebase Functions
4. Implement real-time listeners
5. Update file upload components

### Phase 5: Testing & Deployment (Week 6)
1. Comprehensive testing
2. Security rules validation
3. Performance optimization
4. Production deployment
5. DNS configuration

## 12. Required Skills & Resources

### 12.1 Technical Skills Needed
- Firebase/Firestore experience
- NoSQL data modeling
- Serverless architecture
- Cloud Functions development
- Security rules configuration

### 12.2 Tools Required
- Firebase CLI
- Google Cloud Console access
- Postman/API testing tools
- Firebase Emulator Suite
- Migration scripts

## 13. Backup & Rollback Plan

### 13.1 Backup Strategy
- Keep PostgreSQL database running during migration
- Daily Firestore backups
- Version control for Functions code
- Storage bucket versioning

### 13.2 Rollback Procedure
1. Revert DNS changes
2. Restore from PostgreSQL backup
3. Redeploy Express application
4. Verify data integrity

## 14. Post-Migration Benefits

### 14.1 Operational Benefits
- Unified Google Cloud platform
- Automatic scaling
- Built-in authentication
- Real-time database updates
- Integrated analytics

### 14.2 Development Benefits
- Simplified deployment
- Local emulation for testing
- Better debugging tools
- Automatic SSL certificates
- CDN for static assets

### 14.3 Cost Benefits
- Pay-per-use pricing
- Generous free tier
- No server maintenance
- Automatic backups included

## 15. Risks & Mitigation

### 15.1 Risks
- Data loss during migration
- Learning curve for NoSQL
- Vendor lock-in
- Function cold starts
- Query limitations in Firestore

### 15.2 Mitigation Strategies
- Thorough testing in staging
- Gradual migration approach
- Maintain abstraction layers
- Implement caching strategies
- Design around Firestore limits

## 16. Alternative Considerations

### Alternative to Full Migration
- **Hybrid Approach**: Keep PostgreSQL, migrate only files to Firebase Storage
- **Supabase**: PostgreSQL-compatible Firebase alternative
- **AWS Amplify**: Similar all-in-one platform
- **Keep Current Stack**: Optimize existing architecture

## 17. Decision Checklist

Before proceeding with migration:
- [ ] Backup all current data
- [ ] Document current system thoroughly
- [ ] Train team on Firebase/NoSQL
- [ ] Create detailed migration timeline
- [ ] Set up staging environment
- [ ] Prepare rollback plan
- [ ] Notify users of potential downtime
- [ ] Budget for migration costs
- [ ] Plan for post-migration monitoring

## 18. Firebase-Specific Considerations

### 18.1 Firestore Limitations
- 1MB document size limit
- 500 fields per document
- 1 write per second per document
- No full-text search (need Algolia/Elasticsearch)

### 18.2 Cloud Functions Limitations
- 540 second timeout
- 32MB request size
- Cold start latency
- Regional restrictions

### 18.3 Storage Limitations
- 5TB file size limit
- No server-side image processing
- Bandwidth costs for high traffic

## Conclusion

Migration to Firebase offers significant benefits but requires careful planning and execution. The unified platform will simplify operations, reduce costs, and provide better scalability. However, it requires substantial refactoring of the current architecture and learning new paradigms (NoSQL, serverless).

**Recommendation**: Consider a phased approach, starting with Firebase Storage for files and Firebase Auth for authentication, before migrating the database and backend functions. This allows gradual transition and learning while maintaining system stability.

---

**Next Steps**:
1. Review this requirements document
2. Make go/no-go decision
3. If proceeding, start with Phase 1 setup
4. Create detailed project timeline
5. Assign resources and responsibilities