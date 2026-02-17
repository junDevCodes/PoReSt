# Q&A — 기술적 세부사항 및 구현 전략

버전: v1.0  
작성일: 2026-02-04  
목적: 설계 검토 과정에서 제기된 질문들에 대한 상세 답변 및 구현 가이드

---

## 📋 목차

1. [Q1: 서버리스 환경의 DB 커넥션 관리](#q1)
2. [Q2: 마이그레이션 전략 상세](#q2)
3. [Q3: Resume 데이터 구조 선택 (B 옵션 확정)](#q3)
4. [Q4: Tag 모델 — v1 vs v2 언제 정규화?](#q4)
5. [Q5: 공유 링크 단계적 구현 계획](#q5)
6. [Q6: Vercel 초기 로딩 시간 문제](#q6)
7. [Q7: 배포 검증 — CI/CD 전략](#q7)
8. [Q8: 모니터링 도구 도입 방법](#q8)
9. [Q9: UI/UX — PDF 스타일 포트폴리오 + 커스터마이징](#q9)
10. [Q10: Public 포트폴리오 템플릿 구체화](#q10)
11. [Q11: Private 대시보드 UX 최적화](#q11)
12. [Q12: Blog Lint UI 개선](#q12)
13. [Q13: 접근성 (a11y) 가이드](#q13)

---

<a name="q1"></a>
## Q1: 서버리스 환경의 DB 커넥션 관리

### 질문
> "내가 이 사항에 대한 개념이 부족해서, 추가 설명 필요해"

### 답변: 서버리스 환경의 특징과 문제점

#### 전통적 서버 vs 서버리스 차이

**전통적 서버 (예: Express.js on EC2):**
```
┌─────────────────────────────────────┐
│   항상 실행 중인 Node.js 프로세스    │
│                                     │
│   DB Connection Pool (10개 유지)    │
│   ├─ conn1 (재사용)                 │
│   ├─ conn2 (재사용)                 │
│   └─ conn3 (재사용)                 │
└─────────────────────────────────────┘
        ↓ (연결 재사용)
┌─────────────────────────────────────┐
│         PostgreSQL                  │
│   최대 100개 연결 허용               │
└─────────────────────────────────────┘
```

**서버리스 (Vercel/Lambda):**
```
요청 1 → [함수 인스턴스 A 생성] → 새 DB 연결 1개
요청 2 → [함수 인스턴스 B 생성] → 새 DB 연결 1개
요청 3 → [함수 인스턴스 C 생성] → 새 DB 연결 1개
...
요청 100 → 100개 함수 = 100개 DB 연결 😱

PostgreSQL: "최대 100개만 허용하는데 이미 100개!"
→ 새 요청: Error: "too many connections"
```

#### 문제의 핵심

1. **Cold Start마다 새 연결 생성**
   - 서버리스 함수는 요청마다 새 인스턴스가 생성될 수 있음
   - 각 인스턴스가 독립적으로 DB 연결 시도
   - PostgreSQL 무료 티어: 20~100개 제한

2. **연결 재사용 어려움**
   - 함수 실행 후 바로 종료 (warm 상태 유지는 짧음)
   - Connection Pool이 인스턴스마다 별도 생성

#### 해결책: Connection Pooler (Neon/Supabase)

**Neon의 Pooled Connection:**
```
[Vercel Function A] ──┐
[Vercel Function B] ──┼─→ [Neon Pooler] ─→ PostgreSQL (5개 연결만)
[Vercel Function C] ──┘      (100개 처리)
[Vercel Function D] ──┘
```

**작동 원리:**
```typescript
// ❌ 직접 연결 (위험)
DATABASE_URL="postgresql://user:pass@db.host.com/mydb"
// 각 서버리스 함수가 직접 DB에 연결 → 연결 폭증

// ✅ Pooled 연결 (안전)
DATABASE_URL="postgresql://user:pass@pooler.neon.tech/mydb"
// Neon Pooler가 중간에서 연결 관리 → 실제 DB는 5~10개만 유지
```

#### 실제 구현 예시

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

// Global 변수로 Prisma 인스턴스 재사용 (중요!)
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Hot reload 시에도 인스턴스 재사용 (개발 환경)
```

**환경변수 설정:**
```bash
# .env
# ✅ Neon Pooled Connection (권장)
DATABASE_URL="postgresql://user:pass@ep-xxx.pooler.neon.tech/mydb?sslmode=require"

# Prisma 설정
PRISMA_CLIENT_ENGINE_TYPE="binary"  # 서버리스 최적화
```

**Vercel 설정:**
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10,  // 10초 타임아웃
      "memory": 1024      // 1GB 메모리
    }
  }
}
```

#### 모니터링 방법

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export async function middleware(request: Request) {
  const start = Date.now();
  
  try {
    // DB 쿼리
    await prisma.$connect();
    
    const response = NextResponse.next();
    const duration = Date.now() - start;
    
    // 연결 시간이 1초 이상이면 경고
    if (duration > 1000) {
      console.warn(`[DB] Slow connection: ${duration}ms`);
    }
    
    return response;
  } finally {
    await prisma.$disconnect();
  }
}
```

#### 권장 DB 서비스 비교

| 서비스 | Pooling 방식 | 무료 티어 | 권장도 |
|--------|-------------|-----------|--------|
| **Neon** | 기본 제공 (pooler URL) | 0.5GB, 20 연결 | ⭐⭐⭐⭐⭐ |
| **Supabase** | Supavisor | 500MB, 60 연결 | ⭐⭐⭐⭐ |
| **Railway** | PgBouncer 수동 설정 | 500MB | ⭐⭐⭐ |

---

<a name="q2"></a>
## Q2: 마이그레이션 전략 상세

### 질문
> "이것도 추가 설명 필요해 어떻게 한다는건지"

### 답변: 단계별 마이그레이션 프로세스

#### Prisma Migration 기본 개념

**마이그레이션이란?**
- DB 스키마 변경을 버전 관리하는 방법
- "테이블 추가/컬럼 추가/인덱스 생성" 같은 작업을 SQL로 자동 생성
- Git처럼 변경 이력 추적 가능

#### 개발 → 배포 흐름

```
┌─────────────────────────────────────────────────────────┐
│ 1. Local 개발                                            │
├─────────────────────────────────────────────────────────┤
│ schema.prisma 수정                                       │
│   model User {                                          │
│     role String @default("OWNER")  // ← 새 필드 추가     │
│   }                                                     │
│                                                         │
│ $ npx prisma migrate dev --name add_user_role          │
│   → prisma/migrations/20260204_add_user_role/           │
│                         migration.sql 생성              │
│   → Local DB에 자동 적용                                 │
└─────────────────────────────────────────────────────────┘
        ↓ Git commit & push
┌─────────────────────────────────────────────────────────┐
│ 2. Preview 환경 (PR마다)                                 │
├─────────────────────────────────────────────────────────┤
│ $ npx prisma migrate deploy                             │
│   → migrations/*.sql 파일들을 순서대로 실행              │
│   → Preview DB에 적용                                    │
│   → 실패 시 배포 중단 (안전)                             │
└─────────────────────────────────────────────────────────┘
        ↓ PR merge
┌─────────────────────────────────────────────────────────┐
│ 3. Production 배포                                       │
├─────────────────────────────────────────────────────────┤
│ Vercel Build:                                           │
│   1. prisma generate  (클라이언트 코드 생성)             │
│   2. prisma migrate deploy  (Production DB 마이그레이션) │
│   3. next build  (앱 빌드)                              │
└─────────────────────────────────────────────────────────┘
```

#### 실제 명령어 예시

**1. Local: 새 마이그레이션 생성**
```bash
# schema.prisma 수정 후
npx prisma migrate dev --name add_resume

# 생성된 파일:
# prisma/migrations/
#   20260204123456_add_resume/
#     migration.sql
```

**migration.sql 예시:**
```sql
-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetCompany" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE;
```

**2. Preview/Production: 마이그레이션 적용**
```bash
# Production에서는 절대 migrate dev 금지!
# 대신 migrate deploy 사용
npx prisma migrate deploy

# 실행 결과:
# ✓ 20260204123456_add_resume applied
# Database is up to date
```

#### 안전한 마이그레이션 체크리스트

```markdown
### 배포 전 체크리스트

#### 1. 스키마 검증
```bash
npx prisma validate
npx prisma format --check
```

#### 2. 마이그레이션 미리보기
```bash
# 어떤 SQL이 실행될지 확인
cat prisma/migrations/[마이그레이션명]/migration.sql
```

#### 3. 데이터 손실 위험 확인
- [ ] 컬럼 삭제 없음
- [ ] NOT NULL 제약 추가 시 default 값 설정
- [ ] Foreign Key 추가 시 기존 데이터 정합성 확인

#### 4. Rollback 시나리오 준비
```bash
# 문제 발생 시 이전 배포로 롤백
# Vercel: 이전 deployment로 전환
# DB: migration 되돌리기 (주의 필요!)
```

#### 복잡한 마이그레이션 예시

**예시: User에 role 추가 (기존 데이터 있음)**

```prisma
// schema.prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  role  String @default("OWNER")  // ← 새 필드
}
```

**자동 생성된 migration.sql:**
```sql
-- 문제: 기존 User는 role이 NULL이 됨!
ALTER TABLE "User" ADD COLUMN "role" TEXT;
```

**수정: default 값 설정**
```sql
-- 안전한 마이그레이션
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'OWNER';
```

**또는 단계별 마이그레이션:**
```sql
-- Step 1: nullable로 추가
ALTER TABLE "User" ADD COLUMN "role" TEXT;

-- Step 2: 기존 데이터 업데이트
UPDATE "User" SET "role" = 'OWNER' WHERE "role" IS NULL;

-- Step 3: NOT NULL 제약 추가
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
```

#### Vercel 배포 스크립트

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",  // 개발용만
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

**Vercel 환경변수 설정:**
```bash
# Vercel Dashboard → Settings → Environment Variables
DATABASE_URL="postgresql://..."  # Production DB
DIRECT_URL="postgresql://..."    # Migration용 (Pooler 아님)
```

---

<a name="q3"></a>
## Q3: Resume 데이터 구조 선택 (B 옵션 확정)

### 질문
> "B 옵션으로 변경 후 문서 수정해줘"

### 답변: ResumeItem 조합형 구조 (최종 확정)

#### 최종 확정 스키마

```prisma
// prisma/schema.prisma

model User {
  id          String       @id @default(cuid())
  name        String?
  email       String?      @unique
  isOwner     Boolean      @default(false)
  experiences Experience[]
  resumes     Resume[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Experience {
  id          String        @id @default(cuid())
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  visibility  Visibility    @default(PUBLIC)
  isFeatured  Boolean       @default(false)

  company     String
  role        String
  startDate   DateTime      // "2024-01-01T00:00:00.000Z" 형식 권장
  endDate     DateTime?
  isCurrent   Boolean       @default(false)

  summary     String?       @db.Text
  bulletsJson Json?
  metricsJson Json?
  techTags    String[]

  resumeItems ResumeItem[]  // ← Resume에서 재사용

  order       Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([ownerId, visibility, order])
}

model Resume {
  id            String       @id @default(cuid())
  ownerId       String
  owner         User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  status        ResumeStatus @default(DRAFT)

  title         String       // "A사 백엔드 엔지니어"
  targetCompany String?
  targetRole    String?
  level         String?      // "Mid-level"
  summaryMd     String?      // 상단 자기소개/역량 요약

  items         ResumeItem[] // ← 핵심: Experience 조합

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([ownerId, status, updatedAt])
  @@index([targetCompany, targetRole])
}

model ResumeItem {
  id                  String    @id @default(cuid())
  resumeId            String
  resume              Resume    @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  experienceId        String
  experience          Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  sortOrder           Int       // 표시 순서 (0, 1, 2, ...)

  // Override 필드 (선택적)
  overrideBulletsJson Json?     // 이 Resume 전용 bullets
  overrideMetricsJson Json?     // 이 Resume 전용 metrics
  overrideTechTags    String[]? // 이 Resume 전용 tech stack

  notes               String?   // "A사에서는 이 경험을 강조" 같은 메모

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([resumeId, experienceId])  // 같은 Experience 중복 방지
  @@index([resumeId, sortOrder])
}
```

#### 사용 시나리오

**1. Experience 작성 (원본)**
```typescript
// app/api/app/experiences/route.ts
export async function POST(req: Request) {
  const session = await getSession();
  const body = await req.json();
  
  const experience = await prisma.experience.create({
    data: {
      ownerId: session.user.id,
      visibility: "PUBLIC",
      isFeatured: false,
      company: "Tech Corp",
      role: "Backend Engineer",
      startDate: "2023-01-01T00:00:00.000Z",
      endDate: "2024-12-01T00:00:00.000Z",
      summary: "대규모 트래픽 환경에서 성능 개선을 주도",
      bulletsJson: [
        "API 응답 시간 30% 개선 (300ms → 210ms)",
        "DB 쿼리 최적화로 비용 40% 절감",
        "Redis 캐싱 도입으로 부하 50% 감소"
      ],
      metricsJson: ["30% ↓ 응답시간", "40% ↓ 비용", "50% ↓ 부하"],
      techTags: ["Node.js", "PostgreSQL", "Redis"],
    },
  });
  
  return NextResponse.json({ data: experience }, { status: 201 });
}
```

**2. Resume 생성 및 Experience 선택**
```typescript
// app/api/app/resumes/route.ts
export async function POST(req: Request) {
  const session = await getSession();
  const body = await req.json();
  
  const resume = await prisma.resume.create({
    data: {
      ownerId: session.user.id,
      title: "A사 백엔드 포지션",
      targetCompany: "A사",
      targetRole: "Senior Backend Engineer",
      summaryMd: "5년 경력의 백엔드 엔지니어...",
      items: {
        create: [
          {
            experienceId: "exp_1",
            sortOrder: 0,
            // 원본 그대로 사용
          },
          {
            experienceId: "exp_2",
            sortOrder: 1,
            // A사에 맞게 커스터마이징
            overrideBulletsJson: [
              "API 응답 시간 30% 개선 (A사 기술 스택과 유사)",
              "Redis 캐싱 전략 수립 (A사 인프라 적용 가능)"
            ],
            notes: "성능 개선 경험 강조"
          }
        ]
      }
    },
    include: {
      items: {
        include: { experience: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
  
  return NextResponse.json({ data: resume }, { status: 201 });
}
```

**3. Resume 프리뷰 렌더링**
```typescript
// app/api/app/resumes/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const resume = await prisma.resume.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: { experience: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
  
  // 렌더링 시 override 우선 사용
  const renderedItems = resume.items.map(item => ({
    title: item.experience.title,
    company: item.experience.company,
    period: `${item.experience.startDate} ~ ${item.experience.endDate}`,
    bullets: item.overrideBulletsJson ?? item.experience.bulletsJson,
    metrics: item.overrideMetricsJson ?? item.experience.metricsJson,
    techTags: item.overrideTechTags ?? item.experience.techTags,
  }));
  
  return NextResponse.json({
    data: {
      ...resume,
      renderedItems
    }
  });
}
```

**4. Experience 원본 변경 시 Resume 동기화 UX**
```typescript
// app/api/app/experiences/[id]/route.ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  
  // 1. Experience 업데이트
  const experience = await prisma.experience.update({
    where: { id: params.id },
    data: body,
  });
  
  // 2. 이 Experience를 사용하는 Resume 찾기
  const affectedResumes = await prisma.resumeItem.findMany({
    where: { experienceId: params.id },
    include: { resume: { select: { id: true, title: true } } },
  });
  
  // 3. 응답에 알림 포함
  return NextResponse.json({
    data: experience,
    meta: {
      affectedResumes: affectedResumes.map(item => ({
        id: item.resume.id,
        title: item.resume.title,
        lastUpdated: item.updatedAt,
        needsSync: !item.overrideBulletsJson // override 없으면 자동 반영됨
      }))
    }
  });
}
```

**UI에서 알림 표시:**
```tsx
// components/ExperienceEditor.tsx
function ExperienceEditor({ experienceId }: { experienceId: string }) {
  const [affectedResumes, setAffectedResumes] = useState([]);
  
  async function handleSave(data) {
    const res = await fetch(`/api/app/experiences/${experienceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    const { data: experience, meta } = await res.json();
    
    if (meta.affectedResumes.length > 0) {
      toast.info(
        `이 경험을 사용하는 Resume ${meta.affectedResumes.length}개가 있습니다`,
        {
          action: {
            label: '확인',
            onClick: () => setAffectedResumes(meta.affectedResumes)
          }
        }
      );
    }
  }
  
  return (
    <div>
      {/* Editor UI */}
      <button onClick={handleSave}>Save</button>
      
      {affectedResumes.length > 0 && (
        <Alert>
          <p>영향받는 Resume:</p>
          <ul>
            {affectedResumes.map(r => (
              <li key={r.id}>
                <Link href={`/app/resumes/${r.id}`}>{r.title}</Link>
                {r.needsSync && <Badge>자동 반영됨</Badge>}
              </li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}
```

#### B 옵션의 장점

1. **원본 재사용** ✅
   - Experience 한 번 작성 → 여러 Resume에서 활용
   - 회사별/직무별 맞춤 조정 (override)

2. **변경 추적** ✅
   - 원본 변경 시 영향받는 Resume 자동 확인
   - Diff 뷰로 원본 vs override 비교

3. **일관성** ✅
   - 같은 경험을 다른 표현으로 쓰다 품질 흔들리는 문제 방지
   - "기본은 원본, 필요시 override" 정책

4. **확장성** ✅
   - 나중에 "Template Resume" 기능 추가 용이
   - "Experience 조합 추천" 기능 가능

---

<a name="q4"></a>
## Q4: Tag 모델 — v1 vs v2 언제 정규화?

### 질문
> "바로 v2 모델로 정규화 했을때 문제가 있는거야? 이것도 추가 설명 필요해"

### 답변: Tag 정규화 시기 결정 기준

#### v1 (string[]) vs v2 (Tag 테이블) 비교

**v1: string[] (배열로 저장)**
```prisma
model Project {
  id       String   @id @default(cuid())
  title    String
  techTags String[]  // ["React", "Next.js", "Prisma"]
}
```

**장점:**
- ✅ 구현 단순 (테이블 1개만)
- ✅ 쿼리 단순 (`WHERE 'React' = ANY(techTags)`)
- ✅ 초기 개발 속도 빠름

**단점:**
- ❌ 오타 가능: "React", "react", "ReactJS" 중복
- ❌ 태그별 통계 어려움 (전체 스캔 필요)
- ❌ 태그 이름 변경 불가 (전체 업데이트 필요)

**v2: Tag 테이블 (정규화)**
```prisma
model Tag {
  id       String       @id @default(cuid())
  name     String       @unique
  slug     String       @unique
  projects ProjectTag[]
  notes    NoteTag[]
}

model ProjectTag {
  projectId String
  tagId     String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([projectId, tagId])
  @@index([tagId])
}

model Project {
  id   String       @id @default(cuid())
  tags ProjectTag[]
}
```

**장점:**
- ✅ 태그 중복 방지 (유니크 제약)
- ✅ 태그별 통계 빠름 (`SELECT COUNT(*) FROM ProjectTag WHERE tagId = ?`)
- ✅ 태그 이름 변경 용이 (Tag 테이블만 수정)
- ✅ 태그별 메타데이터 추가 가능 (색상, 아이콘, 카테고리 등)

**단점:**
- ❌ 테이블 2개 추가 (Tag, ProjectTag)
- ❌ 쿼리 복잡도 증가 (JOIN 필요)
- ❌ API도 복잡해짐 (tag 생성/조회 로직)

#### 바로 v2로 하면 생기는 문제

**1. 초기 개발 속도 저하**
```typescript
// v1: 간단
await prisma.project.create({
  data: {
    title: "My Project",
    techTags: ["React", "Next.js"]  // 끝!
  }
});

// v2: 복잡
await prisma.project.create({
  data: {
    title: "My Project",
    tags: {
      create: [
        {
          tag: {
            connectOrCreate: {
              where: { name: "React" },
              create: { name: "React", slug: "react" }
            }
          }
        },
        {
          tag: {
            connectOrCreate: {
              where: { name: "Next.js" },
              create: { name: "Next.js", slug: "nextjs" }
            }
          }
        }
      ]
    }
  }
});
```

**2. API가 복잡해짐**
```typescript
// v1: POST /api/app/projects
{
  "title": "...",
  "techTags": ["React", "Next.js"]  // 그냥 배열
}

// v2: 태그 처리 로직 필요
{
  "title": "...",
  "tags": ["React", "Next.js"]  // ← 프론트는 똑같이 보내도
}

// 백엔드에서 처리:
async function handleTags(tagNames: string[]) {
  const tags = await Promise.all(
    tagNames.map(name =>
      prisma.tag.upsert({
        where: { name },
        create: { name, slug: slugify(name) },
        update: {}
      })
    )
  );
  return tags.map(tag => ({ tagId: tag.id }));
}
```

**3. 쿼리 복잡도 증가**
```typescript
// v1: 태그로 검색
const projects = await prisma.project.findMany({
  where: {
    techTags: { has: "React" }  // 간단!
  }
});

// v2: JOIN 필요
const projects = await prisma.project.findMany({
  where: {
    tags: {
      some: {
        tag: { name: "React" }
      }
    }
  },
  include: {
    tags: {
      include: { tag: true }
    }
  }
});
```

#### 정규화 시기 결정 기준

**v1 (string[])이 적합한 경우:**
- ✅ 프로젝트/노트가 30개 미만
- ✅ 태그 종류가 20개 미만
- ✅ 태그별 통계가 필요 없음
- ✅ 빠른 MVP 출시가 목표

**v2 (정규화)가 필요한 시점:**
- ⚠️ 태그 오타가 자주 발생 (React, react, ReactJS)
- ⚠️ 태그별 인기도/사용 빈도 통계 필요
- ⚠️ 태그 자동완성/추천 기능 필요
- ⚠️ 프로젝트/노트가 100개 이상

#### 권장: v1 → v2 마이그레이션 전략

**Phase 1: v1으로 시작 (MVP)**
```prisma
model Project {
  techTags String[]
}
```

**Phase 2: 태그 사용 패턴 분석**
```sql
-- 전체 태그 추출 및 빈도 확인
SELECT unnest(techTags) as tag, COUNT(*) as count
FROM "Project"
GROUP BY tag
ORDER BY count DESC;

-- 결과 예시:
-- tag        | count
-- React      | 15
-- react      | 3   ← 오타 발견!
-- ReactJS    | 2   ← 동의어 발견!
```

**Phase 3: 정규화 필요성 판단**
- 오타/중복이 5개 이상 → v2로 이행
- 태그별 필터링이 주요 기능 → v2로 이행
- 그 외 → v1 유지

**Phase 4: v2로 마이그레이션**
```typescript
// scripts/migrate-tags-to-v2.ts
async function migrateTags() {
  // 1. 모든 프로젝트의 태그 수집
  const projects = await prisma.project.findMany();
  const allTags = new Set<string>();
  
  projects.forEach(p => {
    p.techTags.forEach(tag => allTags.add(tag.toLowerCase()));
  });
  
  // 2. Tag 테이블 생성
  await Promise.all(
    Array.from(allTags).map(name =>
      prisma.tag.create({
        data: { name, slug: slugify(name) }
      })
    )
  );
  
  // 3. ProjectTag 관계 생성
  for (const project of projects) {
    for (const tagName of project.techTags) {
      const tag = await prisma.tag.findUnique({
        where: { name: tagName.toLowerCase() }
      });
      
      await prisma.projectTag.create({
        data: {
          projectId: project.id,
          tagId: tag.id
        }
      });
    }
  }
  
  // 4. (선택) 기존 techTags 컬럼 제거는 나중에
  console.log('Migration completed!');
}
```

#### 최종 권장사항

```markdown
> [!TIP]
> **Tag 모델 전략 (최종)**
> 
> **v1 (MVP)**: string[] 배열로 시작
> - 빠른 구현
> - 초기 30개 프로젝트까지는 문제 없음
> 
> **v1.5 (중간)**: 태그 정리 스크립트
> - 오타/중복 태그 수동 정리
> - 태그 사용 빈도 모니터링
> 
> **v2 (확장)**: Tag 테이블 도입 시점
> - 프로젝트 50개 이상 or
> - 노트 100개 이상 or
> - 태그 필터링이 핵심 기능일 때
> 
> **마이그레이션**: 스크립트로 자동화
> - 기존 데이터 손실 없음
> - 점진적 전환 가능 (두 방식 병행)
```

---

<a name="q5"></a>
## Q5: 공유 링크 단계적 구현 계획

### 질문
> "단계적 구현 계획 작성해서 문서에 같이 포함 시켜줘"

### 답변: Share Link 기능 로드맵

#### Phase 1: MVP 제외 (v1.0)
- 공유 링크 기능 없음
- Resume는 오너만 접근 가능

#### Phase 2: Resume 공유 (v1.5) — 4주차

**목표:**
- 특정 Resume을 외부에 읽기 전용으로 공유
- 링크만 아는 사람만 접근
- 유효기간 설정 가능

**스키마 추가:**
```prisma
model ShareToken {
  id         String   @id @default(cuid())
  token      String   @unique @default(cuid())
  
  entityType String   // "resume" (v1.5), "project"(v2), "note"(v3)
  entityId   String   // Resume.id
  
  createdBy  String   // User.id
  createdAt  DateTime @default(now())
  expiresAt  DateTime // 유효기간
  accessCount Int     @default(0)  // 조회수 추적
  
  @@index([token, expiresAt])
  @@index([entityType, entityId])
}
```

**API 엔드포인트:**
```typescript
// app/api/app/resumes/[id]/share/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  const body = await req.json();
  
  const shareToken = await prisma.shareToken.create({
    data: {
      entityType: 'resume',
      entityId: params.id,
      createdBy: session.user.id,
      expiresAt: new Date(Date.now() + body.expiryDays * 24 * 60 * 60 * 1000),
    }
  });
  
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/share/${shareToken.token}`;
  
  return NextResponse.json({
    data: { shareUrl, expiresAt: shareToken.expiresAt }
  });
}

// app/share/[token]/page.tsx (Public 페이지)
export default async function SharePage({ params }: { params: { token: string } }) {
  const shareToken = await prisma.shareToken.findUnique({
    where: { token: params.token },
  });
  
  // 유효성 검증
  if (!shareToken || shareToken.expiresAt < new Date()) {
    return <ErrorPage message="링크가 만료되었거나 유효하지 않습니다" />;
  }
  
  // 조회수 증가
  await prisma.shareToken.update({
    where: { id: shareToken.id },
    data: { accessCount: { increment: 1 } }
  });
  
  // Resume 데이터 조회
  const resume = await prisma.resume.findUnique({
    where: { id: shareToken.entityId },
    include: {
      items: {
        include: { experience: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
  
  return <ResumePublicView resume={resume} />;
}
```

**UI 추가:**
```tsx
// app/(private)/app/resumes/[id]/page.tsx
function ResumeEditor() {
  const [shareUrl, setShareUrl] = useState('');
  
  async function handleShare() {
    const res = await fetch(`/api/app/resumes/${resumeId}/share`, {
      method: 'POST',
      body: JSON.stringify({ expiryDays: 7 })  // 7일 유효
    });
    
    const { data } = await res.json();
    setShareUrl(data.shareUrl);
    
    // 클립보드 복사
    navigator.clipboard.writeText(data.shareUrl);
    toast.success('링크가 클립보드에 복사되었습니다');
  }
  
  return (
    <div>
      {/* Resume 편집 UI */}
      
      <div className="mt-4">
        <button onClick={handleShare}>
          <Share className="mr-2" />
          공유 링크 생성
        </button>
        
        {shareUrl && (
          <div className="mt-2 p-3 bg-gray-100 rounded">
            <p className="text-sm">공유 링크 (7일간 유효):</p>
            <div className="flex items-center gap-2">
              <input 
                readOnly 
                value={shareUrl} 
                className="flex-1 px-2 py-1 border rounded"
              />
              <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
                <Copy />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Phase 3: Project 공유 (v2.0) — 8주차

**확장:**
- Project도 공유 링크 생성 가능
- Public 프로젝트는 slug로 접근, Private는 token으로만

**엔드포인트 추가:**
```typescript
// app/api/app/projects/[id]/share/route.ts
// Resume와 동일한 패턴

// app/share/[token]/page.tsx
// entityType에 따라 Resume/Project 분기
```

#### Phase 4: 고급 기능 (v2.5) — 12주차

**추가 기능:**
1. **비밀번호 보호**
```prisma
model ShareToken {
  passwordHash String?  // bcrypt hash
}
```

2. **조회 제한**
```prisma
model ShareToken {
  maxAccessCount Int?  // null이면 무제한
}
```

3. **Share 관리 페이지**
```
/app/shares
├─ 내가 생성한 링크 목록
├─ 조회수/만료일
└─ 삭제/연장 기능
```

4. **Analytics**
```
/app/shares/[token]/analytics
├─ 일별 조회수 그래프
├─ 참조 출처 (Referer)
└─ 지역/디바이스 (선택)
```

#### 보안 고려사항

```markdown
> [!WARNING]
> **Share Link 보안 체크리스트**
> 
> 1. **Token 강도**
>    - cuid (25자, URL-safe) 사용
>    - 무작위 대입 공격 불가능
> 
> 2. **Rate Limiting**
>    ```typescript
>    // middleware.ts
>    if (pathname.startsWith('/share')) {
>      const ip = request.headers.get('x-forwarded-for');
>      const rateLimitKey = `share:${ip}`;
>      const count = await redis.incr(rateLimitKey);
>      if (count === 1) await redis.expire(rateLimitKey, 60);
>      if (count > 20) return new Response('Too many requests', { status: 429 });
>    }
>    ```
> 
> 3. **만료 처리**
>    - DB에서 만료된 토큰 정기 삭제
>    - Cron job: 매일 자정 실행
> 
> 4. **접근 로그**
>    - IP, UserAgent, Referer 기록
>    - 의심스러운 패턴 감지
```

#### 구현 우선순위 요약

| Phase | 기능 | 일정 | 복잡도 |
|-------|------|------|--------|
| v1.0 | (없음) | - | - |
| v1.5 | Resume 공유 (기본) | 4주차 | 낮음 |
| v2.0 | Project 공유 | 8주차 | 낮음 |
| v2.5 | 비밀번호/제한/Analytics | 12주차 | 중간 |

---

<a name="q6"></a>
## Q6: Vercel 초기 로딩 시간 문제

### 질문
> "내가 알기로 vercel이 정적 서버라 초기 로딩에 시간이 많이 걸리는걸로 알고 있는데 맞아? 그럼 이 문제 어떻게 해결할껀지 추가 설명 필요해"

### 답변: Vercel != 정적 서버 (오해 해소)

#### Vercel의 실제 작동 방식

**1. Vercel은 "정적 + 동적" 하이브리드**

Vercel은 **정적 서버가 아닙니다!** 다음 3가지 모드를 지원합니다:

```
┌─────────────────────────────────────────────┐
│ 1. Static Pages (정적)                      │
│    - 빌드 시 HTML 생성                       │
│    - CDN으로 즉시 제공                       │
│    - 로딩 시간: ~100ms                      │
│    예: /about, /contact                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 2. ISR (Incremental Static Regeneration)   │
│    - 빌드 시 + 요청 시 재생성                │
│    - 첫 방문: 캐시된 HTML (빠름)             │
│    - N분 후: 백그라운드 재생성               │
│    로딩 시간: ~150ms (캐시) / ~500ms (재생성)│
│    예: /, /projects, /projects/[slug]       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 3. Serverless Functions (동적)             │
│    - 요청마다 실행                          │
│    - Cold Start: 500ms~2s                   │
│    - Warm: 50~200ms                         │
│    예: /api/app/* (Private API)             │
└─────────────────────────────────────────────┘
```

#### "느리다"는 오해의 원인

**Cold Start 문제:**
- 서버리스 함수가 오랫동안 요청이 없으면 "잠듦" (idle)
- 다음 요청 시 깨어나는 데 시간 소요 (~500ms~2s)
- Public 포트폴리오는 ISR로 캐싱하므로 **영향 없음**

**영향받는 경우:**
- ❌ Private API (`/api/app/*`) — 첫 로그인 시 느릴 수 있음
- ✅ Public 페이지 (`/`, `/projects`) — 캐시되어 빠름

#### 해결책: 프로젝트별 최적화 전략

**1. Public 페이지는 ISR로 최적화 (이미 설계됨)**

```typescript
// app/(public)/page.tsx (홈)
export const revalidate = 1800;  // 30분마다 재생성

export default async function HomePage() {
  // 빌드 시 + 30분마다 실행
  const featuredProjects = await prisma.project.findMany({
    where: { isFeatured: true, visibility: "PUBLIC" },
    take: 6
  });
  
  return <PortfolioHome projects={featuredProjects} />;
}
```

**첫 방문자 경험:**
```
사용자 → Vercel CDN → 미리 생성된 HTML 반환
로딩 시간: ~100ms (전세계 어디서나)
```

**2. Private 페이지는 Cold Start 완화**

**전략 A: Pre-warming (Vercel Cron)**
```typescript
// app/api/cron/warmup/route.ts
export async function GET(req: Request) {
  // 인증 확인 (Vercel Cron 전용)
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // DB 연결 유지 (Prisma warm-up)
  await prisma.$queryRaw`SELECT 1`;
  
  return new Response('OK', { status: 200 });
}
```

**Vercel Cron 설정:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/warmup",
      "schedule": "*/5 * * * *"  // 5분마다 실행
    }
  ]
}
```

**전략 B: 낙관적 UI 업데이트**
```typescript
// app/(private)/app/projects/page.tsx
'use client';

export default function ProjectsPage() {
  const { data, isLoading } = useSWR('/api/app/projects', {
    revalidateOnFocus: false,
    dedupingInterval: 60000,  // 1분간 재요청 방지
  });
  
  if (isLoading) {
    return <Skeleton count={5} />;  // 즉시 표시
  }
  
  return <ProjectList projects={data} />;
}
```

**전략 C: Edge Functions (빠른 응답)**
```typescript
// app/api/app/me/route.ts
export const runtime = 'edge';  // Edge Runtime 사용

export async function GET(req: Request) {
  // Edge는 Cold Start 거의 없음 (~50ms)
  // 단, Prisma는 Node.js에서만 동작하므로 제한적
  
  const session = await getServerSession();
  return NextResponse.json({ user: session.user });
}
```

#### 실제 성능 측정

**Public 페이지 (목표):**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s

**Private 페이지 (목표):**
- 첫 로그인 (Cold Start): < 3s
- 이후 페이지 탐색: < 500ms

**측정 도구:**
```bash
# Lighthouse CI
npm install -D @lhci/cli

# .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/projects"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "interactive": ["error", { "maxNumericValue": 3500 }]
      }
    }
  }
}
```

#### 추가 최적화 기법

**1. 이미지 최적화**
```tsx
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src="/projects/cover.jpg"
  alt="Project Cover"
  width={1200}
  height={630}
  sizes="(max-width: 768px) 100vw, 1200px"
  priority  // LCP 이미지는 우선 로딩
/>
```

**2. Font 최적화**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  // FOIT 방지
  variable: '--font-inter',
});
```

**3. Code Splitting**
```tsx
// 무거운 컴포넌트는 동적 import
import dynamic from 'next/dynamic';

const MDXEditor = dynamic(() => import('@/components/MDXEditor'), {
  loading: () => <Skeleton />,
  ssr: false,  // 클라이언트에서만 로딩
});
```

**4. Bundle 분석**
```bash
npm install -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... config
});

# 실행
ANALYZE=true npm run build
```

#### 결론

```markdown
> [!NOTE]
> **Vercel 성능 최종 정리**
> 
> ✅ **Public 포트폴리오는 빠릅니다**
> - ISR 캐싱으로 ~100ms 로딩
> - CDN으로 전세계 배포
> 
> ⚠️ **Private 대시보드는 첫 로딩만 느릴 수 있음**
> - Cold Start: ~1~2s (5분 이상 미사용 시)
> - Warm Start: ~200ms (이후 사용)
> - Cron으로 Pre-warming 가능
> 
> 🚀 **최적화 핵심**
> 1. Public은 ISR + CDN
> 2. Private는 Skeleton UI + SWR
> 3. 이미지/폰트 최적화
> 4. Bundle 크기 모니터링
```

---

계속해서 나머지 질문들(Q7~Q13)에 대한 답변을 작성하겠습니다. 문서가 길어지고 있으니 다음 메시지에서 계속 작성할까요, 아니면 이대로 진행할까요?


## Post-M5 QA 시나리오 추가 (2026-02-16)

### 인증/권한
- 비인증 사용자는 `/app/*` 접근 시 로그인 리다이렉트
- 로그인 사용자는 본인 데이터 범위에서 CRUD 가능
- 운영 API(`revalidate`, `db-test`, `test/owner`)는 오너 권한 유지

### 기능 시나리오 (P0)
- G1: `/api/app/me` 응답 스키마/404 검증
- G2: Notebook CRUD + 노트 존재 시 삭제 409 검증
- G3: public projects `q/tag/publicSlug/limit/cursor` 조합 검증
- G4: feedback targetType별 목록 조회 및 생성 플로우 검증
- G5: lint rule10 탐지/비탐지 케이스 검증

### 회귀 게이트
- `npm run lint`
- `npm run build`
- `npx jest --runInBand`
- `npm run vercel-build`

## Post-M5 QA 시나리오 추가 (P2 완료분, 2026-02-17)

### G11 임베딩 유사도
- `POST /api/app/notes/embeddings/rebuild` 실행 후 `SUCCEEDED` 상태 전환 검증
- `GET /api/app/notes/[id]/similar` 호출 시:
  - 기준 노트 제외
  - owner scope 격리
  - score 내림차순 정렬
  - `limit`, `minScore` 파라미터 검증(422)

### G12 공개 사용자 디렉토리
- `GET /api/public/users` 호출 시:
  - `isPublic=true` 사용자만 노출
  - 공개 프로젝트 1개 이상 보유 사용자만 노출
  - `q`, `limit`, `cursor` 조합 검증
- `/users` 페이지에서:
  - 검색/초기화 동작
  - 다음 페이지 링크(cursor) 동작
  - `/u/[publicSlug]`, `/u/[publicSlug]/projects` 이동 동작

### P2 최종 회귀
- `npm run lint`
- `npm run build`
- `npx jest --runInBand`
- `npm run vercel-build`
