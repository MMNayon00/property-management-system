# 🏗️ প্রকল্প আর্কিটেকচার

## প্রকল্প সংগঠন

```
property-management-system/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication routes
│   │   │   ├── login/                # Login page
│   │   │   └── signup/               # Signup page
│   │   ├── admin/                    # Admin dashboard
│   │   │   └── page.tsx              # Admin panel for user approval
│   │   ├── dashboard/                # Owner/Manager dashboard
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication APIs
│   │   │   ├── admin/                # Admin APIs
│   │   │   ├── buildings/            # Building management
│   │   │   ├── flats/                # Flat management
│   │   │   ├── tenants/              # Tenant management
│   │   │   ├── rent/                 # Rent management
│   │   │   ├── payments/             # Payment management
│   │   │   └── reports/              # Report generation
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home/Landing page
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   │   ├── ui/                       # ShadCN UI components
│   │   ├── forms/                    # Form components
│   │   └── layout/                   # Layout components
│   ├── lib/                          # Utility functions
│   │   ├── i18n/                     # Internationalization (Bangla)
│   │   │   ├── bn.ts                 # Bangla translations
│   │   │   └── index.ts              # i18n hook
│   │   ├── auth.config.ts            # NextAuth configuration
│   │   ├── prisma.ts                 # Prisma client
│   │   └── utils.ts                  # Helper functions
│   ├── hooks/                        # Custom React hooks
│   ├── services/                     # API services
│   └── middleware/                   # Express-like middleware
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # Database migrations
├── public/                           # Static files
│   └── uploads/                      # File uploads (local storage)
├── .env.example                      # Environment template
├── .env.local                        # Local development env
├── Dockerfile                        # Docker image configuration
├── docker-compose.yml                # Multi-container setup
├── nginx.conf                        # Nginx reverse proxy
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── README.md                         # Project overview
├── SETUP.md                          # Setup instructions
├── API.md                            # API documentation
├── ARCHITECTURE.md                   # This file
└── .eslintrc.json                    # ESLint config
```

## ডাটাবেস স্কিমা

### User (ব্যবহারকারী)
- `id`: অনন্য শনাক্তকারী
- `email`: ইমেইল (অনন্য)
- `phone`: ফোন নম্বর (অনন্য)
- `password`: হ্যাশড পাসওয়ার্ড
- `firstName`: প্রথম নাম
- `lastName`: শেষ নাম
- `role`: ADMIN | OWNER | MANAGER
- `status`: PENDING | APPROVED | REJECTED
- `approvedAt`: অনুমোদনের সময়
- `approvedBy`: অনুমোদনকারী অ্যাডমিনের ID
- `createdAt`: তৈরির সময়
- `updatedAt`: আপডেটের সময়
- `lastLoginAt`: সর্বশেষ লগইন

### Building (বাড়ি)
- `id`: অনন্য শনাক্তকারী
- `name`: বাড়ির নাম
- `address`: ঠিকানা
- `area`: এলাকা
- `totalFlats`: মোট ফ্ল্যাট সংখ্যা
- `ownerId`: মালিকের ID (Foreign Key: User)
- `managerId`: ম্যানেজারের ID (Foreign Key: User)
- `createdAt`: তৈরির সময়

### Flat (ফ্ল্যাট)
- `id`: অনন্য শনাক্তকারী
- `flatNumber`: ফ্ল্যাট নম্বর
- `floor`: ফ্লোর নম্বর
- `baseRent`: মূল ভাড়া
- `status`: VACANT | OCCUPIED
- `buildingId`: বাড়ির ID (Foreign Key)
- `currentTenantId`: বর্তমান ভাড়াটিয়ার ID (Foreign Key)

### Tenant (ভাড়াটিয়া)
- `id`: অনন্য শনাক্তকারী
- `name`: নাম
- `phone`: ফোন নম্বর
- `whatsapp`: হোয়াটসঅ্যাপ
- `nidNumber`: এনআইডি নম্বর
- `nidImage`: এনআইডি ছবির URL
- `profileImage`: প্রোফাইল ছবির URL
- `moveInDate`: প্রবেশের তারিখ
- `moveOutDate`: প্রস্থানের তারিখ
- `currentFlatId`: বর্তমান ফ্ল্যাটের ID

### TenantHistory (ভাড়াটিয়া ইতিহাস)
- `id`: অনন্য শনাক্তকারী
- `tenantId`: ভাড়াটিয়ার ID (Foreign Key)
- `flatId`: ফ্ল্যাটের ID (Foreign Key)
- `moveInDate`: প্রবেশের তারিখ
- `moveOutDate`: প্রস্থানের তারিখ (NULL = বর্তমান)
- `rentAmount`: সেই সময়ের ভাড়া
- `createdAt`: রেকর্ড তৈরির সময় (অপরিবর্তনীয়)

### RentRecord (ভাড়া রেকর্ড)
- `id`: অনন্য শনাক্তকারী
- `flatId`: ফ্ল্যাটের ID
- `buildingId`: বাড়ির ID
- `year`: বছর
- `month`: মাস (1-12)
- `baseRent`: মূল ভাড়া
- `extraCharges`: অতিরিক্ত চার্জ
- `serviceCharges`: সেবা চার্জ
- `total`: মোট ভাড়া
- `paymentStatus`: PAID | UNPAID | PARTIAL

### Payment (পেমেন্ট)
- `id`: অনন্য শনাক্তকারী
- `rentRecordId`: ভাড়া রেকর্ডের ID
- `flatId`: ফ্ল্যাটের ID
- `buildingId`: বাড়ির ID
- `amount`: পেমেন্টের পরিমাণ
- `method`: পেমেন্ট পদ্ধতি
- `reference`: লেনদেন রেফারেন্স
- `createdById`: পেমেন্ট রেকর্ডকারীর ID
- `createdAt`: পেমেন্টের তারিখ

## API আর্কিটেকচার

### অথেন্টিকেশন ফ্লো

```
User Signup
    ↓
Create User (status: PENDING)
    ↓
Admin Reviews
    ↓
Admin Approves/Rejects
    ↓
User Can Login (if APPROVED)
    ↓
Generate JWT Token
    ↓
Access Dashboard
```

### API লেয়ার

```
Next.js App Router
    ↓
API Routes (/api/*)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

## ফ্রন্টএন্ড আর্কিটেকচার

### পেজ স্ট্রাকচার

```
/ (Home/Landing)
├── /login (Authentication)
├── /signup (Registration)
├── /dashboard (Owner Dashboard)
│   ├── Buildings
│   ├── Flats
│   ├── Tenants
│   ├── Rent Management
│   ├── Payments
│   └── Reports
└── /admin (Admin Panel)
    ├── Pending Users
    ├── User Approval
    └── Statistics
```

### স্টেট ম্যানেজমেন্ট

```
React Context (Session)
    ↓
Zustand (Global State - if needed)
    ↓
React Query (Server State)
    ↓
Component Local State
```

## ডেটা ফ্লো

### মাসিক ভাড়া রেকর্ড তৈরি

```
Cron Job (Monthly)
    ↓
Loop through all flats
    ↓
Check if flat is occupied
    ↓
Get current rent amount
    ↓
Create RentRecord (status: UNPAID)
    ↓
Add to tenant's rent history
```

### পেমেন্ট প্রসেসিং

```
Record Payment
    ↓
Add to RentRecord.payments
    ↓
Calculate total paid vs total due
    ↓
Update RentRecord.paymentStatus
    ├── If fully paid → PAID
    ├── Else if partial → PARTIAL
    └── Else → UNPAID
    ↓
Generate payment receipt (optional)
```

## নিরাপত্তা আর্কিটেকচার

```
Frontend
    ↓
HTTPS (SSL/TLS in production)
    ↓
Nginx Reverse Proxy
    ├── Rate Limiting
    ├── CORS Validation
    └── Security Headers
    ↓
Next.js API Routes
    ├── NextAuth Session Validation
    ├── Role-based Authorization
    └── Input Validation (Zod)
    ↓
Prisma ORM
    ├── SQL Injection Protection
    └── Query Optimization
    ↓
PostgreSQL
    └── Encrypted Connections
```

## ডিপ্লয়মেন্ট আর্কিটেকচার

### ডেভেলপমেন্ট

```
Developer Machine
    ↓
Next.js Dev Server (port 3000)
    ↓
PostgreSQL Local (port 5432)
```

### প্রোডাকশন (Docker)

```
Docker Compose
    ├── Next.js Container (port 3000)
    ├── PostgreSQL Container (port 5432)
    └── Nginx Container (port 80/443)
        ↓
        Reverse Proxy & SSL Termination
        ↓
        Application Load Balancing
```

## কর্মক্ষমতা অপটিমাইজেশন

### ডাটাবেস
- Indexes on foreign keys
- Indexes on frequently queried fields
- Connection pooling with Prisma

### ফ্রন্টএন্ড
- Next.js Image Optimization
- Code Splitting
- Server-Side Rendering (SSR)
- Static Generation where possible

### API
- Response Caching
- Pagination for large datasets
- Query optimization

## স্কেলিং কৌশল

### স্বল্পমেয়াদী
- Vertical scaling (more resources)
- Database optimization
- Caching layer (Redis)

### দীর্ঘমেয়াদী
- Microservices architecture
- Message queues (RabbitMQ/Bull)
- API Gateway
- Load Balancing
- CDN for static assets

## পরিবেশ কনফিগারেশন

### ডেভেলপমেন্ট
```
NODE_ENV=development
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=dev-secret
JWT_SECRET=dev-secret
```

### প্রোডাকশন
```
NODE_ENV=production
DATABASE_URL=postgresql://...@prod-db
NEXTAUTH_SECRET=<secure-random>
JWT_SECRET=<secure-random>
NEXTAUTH_URL=https://domain.com
```

## মনিটরিং এবং লগিং

### লগিং লেভেল
- `DEBUG`: বিস্তারিত তথ্য
- `INFO`: সাধারণ তথ্য
- `WARN`: সতর্কতা
- `ERROR`: ত্রুটি

### মেট্রিক্স
- API response time
- Database query time
- Error rate
- User activity
- Payment processing

---

**পরবর্তী পাঠ**: [API ডকুমেন্টেশন](./API.md)
