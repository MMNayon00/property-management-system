# 🏠 বাড়ি ব্যবস্থাপনা - Property Management System

একটি সম্পূর্ণ উৎপাদন-প্রস্তুত SaaS প্ল্যাটফর্ম বাংলাদেশের জন্য যা বাড়ির মালিক, সম্পত্তি ব্যবস্থাপক এবং অ্যাডমিনদের সম্পত্তি পরিচালনা করতে সাহায্য করে।

---

## 🎯 Table of Contents

- [বৈশিষ্ট্য](#বৈশিষ্ট্য)
- [দ্রুত শুরু](#দ্রুত-শুরু)
- [প্রযুক্তি স্ট্যাক](#প্রযুক্তি-স্ট্যাক)
- [API আর্কিটেকচার](#api-আর্কিটেকচার)
- [প্রক্রিয়া প্রবাহ](#প্রক্রিয়া-প্রবাহ)
- [সম্পূর্ণ API ডকুমেন্টেশন](#সম্পূর্ণ-api-ডকুমেন্টেশন)
- [ডাটাবেস স্কিমা](#ডাটাবেস-স্কিমা)
- [নিরাপত্তা](#নিরাপত্তা)

---

## 🌟 বৈশিষ্ট্য

- ✅ **Bangla-First UI** - সম্পূর্ণ বাংলায় ইউজার ইন্টারফেস
- ✅ **Multi-role System** - Admin, Owner (Bariwala), Manager
- ✅ **Admin Approval System** - নতুন মালিকদের অনুমোদন প্রক্রিয়া
- ✅ **Building & Flat Management** - বাড়ি এবং ফ্ল্যাট পরিচালনা
- ✅ **Tenant Management** - ভাড়াটিয়া তথ্য এবং ইতিহাস
- ✅ **Rent Tracking** - মাসিক ভাড়া রেকর্ড এবং পেমেন্ট
- ✅ **Advanced Reporting** - মাসিক এবং টেন্যান্ট রিপোর্ট
- ✅ **Secure Authentication** - NextAuth.js এবং JWT

---

## 🚀 দ্রুত শুরু

### প্রয়োজনীয়তা
- Node.js 18+
- PostgreSQL 14+
- npm বা yarn

### ইনস্টলেশন

1. **ডিপেন্ডেন্সি ইনস্টল করুন**
```bash
npm install
```

2. **পরিবেশ কনফিগারেশন**
```bash
cp .env.example .env.local
```

3. **ডাটাবেস সেটআপ**
```bash
npx prisma migrate dev --name init
```

4. **উন্নয়ন সার্ভার চালান**
```bash
npm run dev
```

অ্যাপ্লিকেশন http://localhost:3000 এ উপলব্ধ থাকবে।

---

## 🛠 প্রযুক্তি স্ট্যাক

### ফ্রন্টএন্ড
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form + Zod

### ব্যাকএন্ড
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js + JWT
- **Validation**: Zod
- **ORM**: Prisma

### ডাটাবেস
- **Primary**: PostgreSQL 14+
- **Migrations**: Prisma Migrate

### ডেভপস
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Production)

---

## 📋 API আর্কিটেকচার

### API লেয়ার ডিজাইন

সিস্টেমে একটি **REST API** আর্কিটেকচার রয়েছে যা Next.js API Routes দ্বারা নির্মিত:

```
Client (React Frontend)
    ↓ HTTP Request
Nginx Reverse Proxy
    ↓ Forward Request
Next.js API Route
    ↓ Middleware (Authentication)
Prisma ORM
    ↓
PostgreSQL Database
```

### API হ্যান্ডলিং প্রক্রিয়া

প্রতিটি API রুট নিম্নলিখিত পদক্ষেপ অনুসরণ করে:

1. **অনুরোধ গ্রহণ** - Client থেকে HTTP অনুরোধ
2. **প্রমাণীকরণ** - NextAuth সেশন যাচাই করুন
3. **অনুমোদন** - ব্যবহারকারীর ভূমিকা এবং অনুমতি চেক করুন
4. **ইনপুট যাচাইকরণ** - Zod স্কিমা ব্যবহার করে ডেটা যাচাই করুন
5. **ডাটাবেস অপারেশন** - Prisma ব্যবহার করে ডাটাবেসে কাজ করুন
6. **রেসপন্স প্রেরণ** - JSON ফলাফল ফেরত পাঠান
7. **ত্রুটি পরিচালনা** - যেকোনো ত্রুটি ক্যাচ এবং ফেরত পাঠান

---

## 🔄 প্রক্রিয়া প্রবাহ

### 1. ব্যবহারকারী নিবন্ধন প্রক্রিয়া

```
┌─────────────────────────────────────────────┐
│ Step 1: ব্যবহারকারী সাইনআপ পেজ খোলেন      │
│ URL: /signup                                │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 2: ফর্ম পূরণ করেন এবং জমা দেন       │
│ - নাম, ইমেইল, ফোন, পাসওয়ার্ড             │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 3: Frontend ডেটা যাচাই করে           │
│ - ইমেইল ফরম্যাট                           │
│ - ফোন নম্বর (বাংলাদেশ)                   │
│ - পাসওয়ার্ড (min 6 চর)                    │
└────────────┬────────────────────────────────┘
             │
             ↓ POST /api/auth/signup
┌─────────────────────────────────────────────┐
│ Step 4: Backend ডেটা যাচাই করে (Zod)     │
│ - ডুপ্লিকেট ইমেইল চেক                    │
│ - ডুপ্লিকেট ফোন চেক                      │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 5: ব্যবহারকারী তৈরি করুন              │
│ - পাসওয়ার্ড: bcryptjs দিয়ে হ্যাশ করুন   │
│ - Status: PENDING                           │
│ - Role: OWNER                               │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 6: সফল বার্তা দিন                    │
│ "অপেক্ষা করুন অ্যাডমিন অনুমোদনের জন্য" │
└─────────────────────────────────────────────┘
```

#### API Endpoint Details:

```
POST /api/auth/signup
Content-Type: application/json

Request Body:
{
  "firstName": "Ahmed",
  "lastName": "Khan",
  "email": "ahmed@example.com",
  "phone": "+8801700000000",
  "password": "password123",
  "confirmPassword": "password123"
}

Response (201 Created):
{
  "success": true,
  "message": "Account created. Waiting for admin approval.",
  "userId": "user-123-id"
}

Error Response (400):
{
  "error": "Email already exists",
  "status": 400
}
```

---

### 2. অ্যাডমিন অনুমোদন প্রক্রিয়া

```
┌─────────────────────────────────────────────┐
│ Step 1: অ্যাডমিন প্যানেল খোলেন             │
│ URL: /admin (শুধুমাত্র ADMIN রোল)         │
└────────────┬────────────────────────────────┘
             │ Authentication চেক করুন
             ↓
┌─────────────────────────────────────────────┐
│ Step 2: অপেক্ষমাণ ব্যবহারকারী লোড করুন     │
│ GET /api/admin/pending-users                │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 3: তালিকা দেখান                       │
│ - সব অনুমোদিত হওয়া অপেক্ষা করা ব্যবহারকারী│
│ - অনুমোদন/প্রত্যাখ্যান বোতাম              │
└────────────┬────────────────────────────────┘
             │
             ↓ User "অনুমোদন" বাটন ক্লিক করে
┌─────────────────────────────────────────────┐
│ Step 4: অনুমোদন অনুরোধ পাঠান              │
│ POST /api/admin/approve-user                │
│ { "userId": "X", "approve": true }          │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 5: ডাটাবেস আপডেট করুন                │
│ - Status: PENDING → APPROVED               │
│ - approvedAt: বর্তমান সময়                 │
│ - approvedBy: অ্যাডমিন ID                  │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 6: Success রেসপন্স পাঠান              │
│ ব্যবহারকারী এখন লগইন করতে পারবেন          │
└─────────────────────────────────────────────┘
```

#### API Endpoint Details:

```
GET /api/admin/pending-users
Header: Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "users": [
    {
      "id": "user-123",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "email": "ahmed@example.com",
      "phone": "+8801700000000",
      "status": "PENDING",
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "total": 1
}

---

POST /api/admin/approve-user
Header: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "userId": "user-123",
  "approve": true,
  "rejectReason": null
}

Response (200 OK):
{
  "success": true,
  "message": "User approved successfully",
  "user": {
    "id": "user-123",
    "status": "APPROVED",
    "approvedAt": "2026-04-28T10:30:00Z"
  }
}
```

---

### 3. বাড়ি ব্যবস্থাপনা প্রক্রিয়া

```
┌─────────────────────────────────────────────┐
│ Step 1: মালিক ড্যাশবোর্ড খোলেন            │
│ URL: /dashboard                             │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 2: "নতুন বাড়ি যোগ করুন" ক্লিক করেন   │
│ ফর্ম খোলে: নাম, ঠিকানা, মোট ফ্ল্যাট সংখ্যা│
└────────────┬────────────────────────────────┘
             │
             ↓ POST /api/buildings
┌─────────────────────────────────────────────┐
│ Step 3: Backend তৈরি করে                   │
│ - বাড়ির রেকর্ড ডাটাবেসে                 │
│ - ওনারশিপ লিঙ্ক করে                       │
│ - Success রেসপন্স পাঠায়                   │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 4: ড্যাশবোর্ড রিফ্রেশ হয়               │
│ নতুন বাড়ি তালিকায় দেখা যায়              │
└─────────────────────────────────────────────┘
```

#### API Endpoint Details:

```
POST /api/buildings
Header: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "name": "আমাদের বাড়ি",
  "address": "ঢাকা, বাংলাদেশ",
  "area": "গুলশান",
  "managerId": null
}

Response (201 Created):
{
  "id": "building-123",
  "name": "আমাদের বাড়ি",
  "address": "ঢাকা, বাংলাদেশ",
  "area": "গুলশান",
  "ownerId": "user-123",
  "createdAt": "2026-04-28T10:00:00Z"
}

---

GET /api/buildings
Header: Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "buildings": [
    {
      "id": "building-123",
      "name": "আমাদের বাড়ি",
      "address": "ঢাকা, বাংলাদেশ",
      "totalFlats": 10,
      "ownerId": "user-123"
    }
  ],
  "total": 1
}
```

---

### 4. ফ্ল্যাট যোগ করার প্রক্রিয়া

```
┌─────────────────────────────────────────────┐
│ Step 1: মালিক বাড়ি নির্বাচন করেন           │
│ URL: /dashboard/buildings/[buildingId]     │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 2: "ফ্ল্যাট যোগ করুন" ফর্ম দেখেন      │
│ - ফ্ল্যাট নম্বর                           │
│ - ফ্লোর নম্বর                            │
│ - মূল ভাড়া (মাসিক)                       │
└────────────┬────────────────────────────────┘
             │
             ↓ POST /api/flats
┌─────────────────────────────────────────────┐
│ Step 3: Backend প্রসেস করে                 │
│ - ফ্ল্যাট রেকর্ড তৈরি করে                 │
│ - স্ট্যাটাস: VACANT                        │
│ - প্রথম মাসের RentRecord তৈরি করে         │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 4: ফ্ল্যাট তালিকায় যুক্ত হয়          │
│ মালিক ভাড়াটিয়া যোগ করতে পারেন             │
└─────────────────────────────────────────────┘
```

#### API Endpoint Details:

```
POST /api/flats?buildingId=building-123
Header: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "flatNumber": "101",
  "floor": 1,
  "baseRent": 15000,
  "status": "VACANT"
}

Response (201 Created):
{
  "id": "flat-123",
  "flatNumber": "101",
  "floor": 1,
  "baseRent": 15000,
  "status": "VACANT",
  "buildingId": "building-123",
  "rentRecordCreated": true
}

---

GET /api/flats?buildingId=building-123
Header: Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "flats": [
    {
      "id": "flat-123",
      "flatNumber": "101",
      "floor": 1,
      "baseRent": 15000,
      "status": "VACANT",
      "currentTenantId": null
    }
  ],
  "total": 1
}
```

---

### 5. ভাড়াটিয়া যোগ করার প্রক্রিয়া

```
┌─────────────────────────────────────────────┐
│ Step 1: মালিক ফ্ল্যাট নির্বাচন করেন        │
│ URL: /dashboard/flats/[flatId]              │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 2: "ভাড়াটিয়া যোগ করুন" ফর্ম         │
│ - নাম, ফোন, এনআইডি সংখ্যা                │
│ - প্রবেশের তারিখ                          │
│ - এনআইডি এবং প্রোফাইল ছবি              │
└────────────┬────────────────────────────────┘
             │
             ↓ POST /api/tenants
┌─────────────────────────────────────────────┐
│ Step 3: Backend প্রসেস করে                 │
│ - ভাড়াটিয়া রেকর্ড তৈরি করে              │
│ - TenantHistory এন্ট্রি তৈরি করে          │
│ - ফ্ল্যাট স্ট্যাটাস: OCCUPIED             │
│ - ফ্ল্যাটে ভাড়াটিয়া লিঙ্ক করে            │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 4: সিস্টেম আপডেট হয়                  │
│ - ফ্ল্যাট "দখলীকৃত" হিসেবে দেখা যায়     │
│ - ভাড়াটিয়া তথ্য সংরক্ষিত হয়              │
└─────────────────────────────────────────────┘
```

#### API Endpoint Details:

```
POST /api/tenants
Header: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "name": "রহিম আহমেদ",
  "phone": "+8801700000001",
  "whatsapp": "+8801700000001",
  "nidNumber": "1234567890123",
  "profileImageUrl": "https://...",
  "nidImageUrl": "https://...",
  "moveInDate": "2026-04-28",
  "flatId": "flat-123"
}

Response (201 Created):
{
  "id": "tenant-123",
  "name": "রহিম আহমেদ",
  "phone": "+8801700000001",
  "status": "ACTIVE",
  "flatId": "flat-123",
  "moveInDate": "2026-04-28",
  "historyCreated": true,
  "flatStatusUpdated": "OCCUPIED"
}

---

GET /api/tenants?flatId=flat-123
Header: Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "current": {
    "id": "tenant-123",
    "name": "রহিম আহমেদ",
    "phone": "+8801700000001",
    "moveInDate": "2026-04-28"
  },
  "history": [
    {
      "id": "history-1",
      "name": "পূর্ববর্তী ভাড়াটিয়া",
      "moveInDate": "2025-01-01",
      "moveOutDate": "2026-03-31",
      "rentAmount": 15000
    }
  ]
}
```

---

### 6. ভাড়া এবং পেমেন্ট প্রক্রিয়া

```
┌─────────────────────────────────────────────┐
│ Step 1: সিস্টেম (Cron Job) ট্রিগার করে    │
│ প্রতি মাসের প্রথম দিন রাত ১২:০০          │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 2: সব দখলীকৃত ফ্ল্যাট চেক করে       │
│ লুপ সব বিল্ডিংয়ের মধ্য দিয়ে              │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 3: প্রতিটি ফ্ল্যাটের জন্য RentRecord │
│ তৈরি করে বর্তমান মাসের জন্য            │
│ - Base Rent                                 │
│ - Extra Charges (যদি থাকে)               │
│ - Service Charges                           │
│ - Total = Base + Extra + Service           │
│ - Status: UNPAID                           │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 4: ভাড়াটিয়া নোটিফিকেশন পায়        │
│ (Email/SMS - ভবিষ্যত বৈশিষ্ট্য)          │
│ "আপনার মাসিক ভাড়া: ১৫,০০০ টাকা"        │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 5: ভাড়াটিয়া পেমেন্ট রেকর্ড করে      │
│ POST /api/payments                          │
│ { "rentRecordId": "X", "amount": 15000 }   │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 6: Backend সিস্টেম:                   │
│ - Payment রেকর্ড তৈরি করে                 │
│ - RentRecord আপডেট করে (payment array)   │
│ - Status আপডেট করে                       │
│   IF (total_paid == total_due)             │
│     Status = PAID                          │
│   ELSE IF (total_paid > 0)                 │
│     Status = PARTIAL                       │
│   ELSE                                     │
│     Status = UNPAID                        │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│ Step 7: সফল প্রতিক্রিয়া পাঠান             │
│ পেমেন্ট রসিদ তৈরি হয়                     │
└─────────────────────────────────────────────┘
```

#### API Endpoint Details:

```
GET /api/rent?flatId=flat-123&year=2026&month=4
Header: Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "rentRecords": [
    {
      "id": "rent-123",
      "flatId": "flat-123",
      "year": 2026,
      "month": 4,
      "baseRent": 15000,
      "extraCharges": 1000,
      "serviceCharges": 500,
      "total": 16500,
      "paymentStatus": "UNPAID",
      "payments": [],
      "createdAt": "2026-04-01T00:00:00Z"
    }
  ]
}

---

POST /api/payments
Header: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "rentRecordId": "rent-123",
  "flatId": "flat-123",
  "amount": 16500,
  "method": "CASH",
  "reference": "2026-04-28-payment-001",
  "notes": "সম্পূর্ণ পেমেন্ট"
}

Response (201 Created):
{
  "id": "payment-123",
  "rentRecordId": "rent-123",
  "amount": 16500,
  "method": "CASH",
  "createdAt": "2026-04-28T14:30:00Z",
  "rentRecordStatus": "PAID",
  "message": "পেমেন্ট সফলভাবে রেকর্ড করা হয়েছে"
}

---

GET /api/payments
Header: Authorization: Bearer <JWT_TOKEN>

Query Parameters:
- rentRecordId: ফিল্টার করুন নির্দিষ্ট ভাড়া রেকর্ডের জন্য
- flatId: নির্দিষ্ট ফ্ল্যাটের সব পেমেন্ট
- month: মাস অনুযায়ী ফিল্টার

Response (200 OK):
{
  "payments": [
    {
      "id": "payment-123",
      "rentRecordId": "rent-123",
      "flatId": "flat-123",
      "amount": 16500,
      "method": "CASH",
      "reference": "2026-04-28-payment-001",
      "createdAt": "2026-04-28T14:30:00Z"
    }
  ],
  "total": 1,
  "totalAmount": 16500
}
```

---

## 📋 সম্পূর্ণ API ডকুমেন্টেশন

### প্রমাণীকরণ এপিআই

#### 1. সাইনআপ (নিবন্ধন)

```
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "firstName": "আহমেদ",
  "lastName": "খান",
  "email": "ahmed@example.com",
  "phone": "+8801700000000",
  "password": "password123",
  "confirmPassword": "password123"
}

Success Response (201):
{
  "success": true,
  "message": "অ্যাকাউন্ট তৈরি হয়েছে। অ্যাডমিন অনুমোদনের অপেক্ষা করুন।",
  "userId": "user-123"
}

Error Response (400):
{
  "error": "ইমেইল ইতিমধ্যে বিদ্যমান"
}
```

#### 2. লগইন

```
POST /api/auth/[...nextauth]

Request:
{
  "email": "ahmed@example.com",
  "password": "password123"
}

Success Response:
{
  "user": {
    "id": "user-123",
    "name": "আহমেদ খান",
    "email": "ahmed@example.com",
    "role": "OWNER",
    "status": "APPROVED"
  },
  "token": "eyJhbGc..."
}

Error Response (401):
{
  "error": "অনুমোদিত নন। অ্যাডমিনের জন্য অপেক্ষা করুন।",
  "userStatus": "PENDING"
}
```

### অ্যাডমিন এপিআই

#### 1. অপেক্ষমাণ ব্যবহারকারী পান

```
GET /api/admin/pending-users
Headers: Authorization: Bearer <TOKEN>

Response (200):
{
  "users": [
    {
      "id": "user-123",
      "firstName": "আহমেদ",
      "lastName": "খান",
      "email": "ahmed@example.com",
      "phone": "+8801700000000",
      "status": "PENDING",
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "total": 5
}
```

#### 2. ব্যবহারকারী অনুমোদন করুন

```
POST /api/admin/approve-user
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "userId": "user-123",
  "approve": true,
  "rejectReason": null
}

Response (200):
{
  "success": true,
  "message": "ব্যবহারকারী অনুমোদিত হয়েছেন",
  "user": {
    "status": "APPROVED",
    "approvedAt": "2026-04-28T10:30:00Z"
  }
}
```

#### 3. ড্যাশবোর্ড পরিসংখ্যান

```
GET /api/admin/stats
Headers: Authorization: Bearer <TOKEN>

Response (200):
{
  "totalOwners": 25,
  "totalBuildings": 45,
  "totalTenants": 180,
  "pendingUsers": 3,
  "monthlyIncome": 2750000,
  "totalPayments": 2450000,
  "outstandingAmount": 300000
}
```

---

## 🗄️ ডাটাবেস স্কিমা

### ডেটা মডেল সম্পর্ক

```
User (অ্যাডমিন/মালিক/ম্যানেজার)
  ├─── Building (বাড়ি - মালিক এর মালিকানায়)
  │     └─── Flat (ফ্ল্যাট)
  │           ├─── Tenant (ভাড়াটিয়া)
  │           │     └─── TenantHistory (ইতিহাস)
  │           ├─── RentRecord (ভাড়া রেকর্ড)
  │           │     └─── Payment (পেমেন্ট)
  │           └─── Charge (অতিরিক্ত চার্জ)
```

### মূল টেবিল

**User টেবিল**
- id: UUID (প্রাথমিক কী)
- email: String (ইউনিক)
- phone: String (ইউনিক)
- password: String (হ্যাশড)
- firstName, lastName: String
- role: Enum (ADMIN, OWNER, MANAGER)
- status: Enum (PENDING, APPROVED, REJECTED)
- approvedBy, approvedAt: রেফারেন্স এবং টাইমস্ট্যাম্প

**Building টেবিল**
- id: UUID
- name, address, area: String
- totalFlats: Int
- ownerId, managerId: UUID (Foreign Keys)

**Flat টেবিল**
- id: UUID
- flatNumber, floor: String/Int
- baseRent: Int
- status: Enum (VACANT, OCCUPIED)
- buildingId, currentTenantId: UUID (Foreign Keys)

**RentRecord টেবিল**
- id: UUID
- flatId, buildingId: UUID
- year, month: Int
- baseRent, extraCharges, serviceCharges, total: Int
- paymentStatus: Enum (PAID, UNPAID, PARTIAL)

---

## 🔐 নিরাপত্তা

### প্রমাণীকরণ প্রবাহ

```
User লগইন → Email/Password যাচাই → JWT Token জেনারেট → Session কুকিতে সংরক্ষিত
    ↓
প্রতিটি API অনুরোধে → JWT Token যাচাই → User Info এক্সট্র্যাক্ট → Role চেক করুন
```

### পাসওয়ার্ড নিরাপত্তা
- bcryptjs দিয়ে হ্যাশ করুন (salt rounds: 10)
- ডাটাবেসে প্লেইনটেক্সট পাসওয়ার্ড সংরক্ষণ করবেন না
- প্রতিটি লগইনে পাসওয়ার্ড যাচাই করুন

### ভূমিকা-ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ

| এপিআই | অ্যাডমিন | মালিক | ম্যানেজার |
|-------|---------|-------|----------|
| পেন্ডিং ব্যবহারকারী | ✅ | ❌ | ❌ |
| ব্যবহারকারী অনুমোদন | ✅ | ❌ | ❌ |
| সব বাড়ি দেখুন | ✅ | নিজের | নিজের |
| বাড়ি তৈরি করুন | ✅ | ✅ | ❌ |
| ভাড়াটিয়া ব্যবস্থাপনা | ✅ | ✅ | ✅ |
| পেমেন্ট রেকর্ড করুন | ✅ | ✅ | ✅ |
| রিপোর্ট দেখুন | ✅ | ✅ | ✅ |

---

**Production-ready SaaS platform for Bangladesh** ❤️
