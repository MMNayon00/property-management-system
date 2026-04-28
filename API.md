# 📖 API ডকুমেন্টেশন

## বেসিক তথ্য

- **Base URL**: `http://localhost:3000/api` (ডেভেলপমেন্ট)
- **Authentication**: Bearer JWT Token (NextAuth)
- **Content-Type**: `application/json`
- **Response Format**: JSON

## অথেন্টিকেশন

### সাইন আপ

**এন্ডপয়েন্ট**: `POST /api/auth/signup`

**রিকোয়েস্ট বডি**:
```json
{
  "firstName": "জন",
  "lastName": "ডো",
  "email": "john@example.com",
  "phone": "+8801234567890",
  "password": "SecurePassword123"
}
```

**রেসপন্স** (সাফল্য):
```json
{
  "message": "Signup successful. Please wait for admin approval.",
  "user": {
    "id": "user-123",
    "email": "john@example.com",
    "firstName": "জন"
  }
}
```

**রেসপন্স** (ব্যর্থ):
```json
{
  "error": "User already exists with this email or phone"
}
```

### লগইন

**এন্ডপয়েন্ট**: `POST /api/auth/[...nextauth]/signin`

**রিকোয়েস্ট**:
```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

## অ্যাডমিন API

### অপেক্ষমাণ ব্যবহারকারী পান

**এন্ডপয়েন্ট**: `GET /api/admin/pending-users`

**হেডার**:
```
Authorization: Bearer <jwt-token>
```

**রেসপন্স**:
```json
[
  {
    "id": "user-456",
    "firstName": "আলী",
    "lastName": "খান",
    "email": "ali@example.com",
    "phone": "+8801987654321",
    "role": "OWNER",
    "status": "PENDING",
    "createdAt": "2024-04-28T10:00:00Z"
  }
]
```

### ব্যবহারকারী অনুমোদন/প্রত্যাখ্যান করুন

**এন্ডপয়েন্ট**: `POST /api/admin/approve-user`

**রিকোয়েস্ট বডি** (অনুমোদন):
```json
{
  "userId": "user-456",
  "action": "approve"
}
```

**রিকোয়েস্ট বডি** (প্রত্যাখ্যান):
```json
{
  "userId": "user-456",
  "action": "reject",
  "rejectionReason": "নথি অসম্পূর্ণ"
}
```

**রেসপন্স**:
```json
{
  "message": "User approved successfully",
  "user": {
    "id": "user-456",
    "status": "APPROVED",
    "approvedAt": "2024-04-28T10:30:00Z"
  }
}
```

### অ্যাডমিন ড্যাশবোর্ড পরিসংখ্যান

**এন্ডপয়েন্ট**: `GET /api/admin/stats`

**রেসপন্স**:
```json
{
  "totalOwners": 42,
  "totalBuildings": 156,
  "totalTenants": 487,
  "monthlyIncome": 125000,
  "pendingUsers": 3
}
```

## বাড়ি API

### সমস্ত বাড়ি পান

**এন্ডপয়েন্ট**: `GET /api/buildings`

**রেসপন্স**:
```json
[
  {
    "id": "building-001",
    "name": "গাজী ভিলা",
    "address": "ধানমন্ডি, ঢাকা",
    "area": "ধানমন্ডি",
    "totalFlats": 12,
    "ownerId": "user-123",
    "owner": {
      "firstName": "রহিম",
      "lastName": "খান"
    },
    "flats": [
      {
        "id": "flat-001",
        "flatNumber": "১",
        "floor": 1,
        "baseRent": 15000,
        "status": "OCCUPIED"
      }
    ],
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

### নতুন বাড়ি তৈরি করুন

**এন্ডপয়েন্ট**: `POST /api/buildings`

**রিকোয়েস্ট বডি**:
```json
{
  "name": "নতুন বাড়ি",
  "address": "মিরপুর, ঢাকা",
  "area": "মিরপুর",
  "managerId": "user-789" // optional
}
```

**রেসপন্স**:
```json
{
  "id": "building-002",
  "name": "নতুন বাড়ি",
  "address": "মিরপুর, ঢাকা",
  "ownerId": "user-123",
  "createdAt": "2024-04-28T10:00:00Z"
}
```

## ফ্ল্যাট API

### বাড়ির সমস্ত ফ্ল্যাট পান

**এন্ডপয়েন্ট**: `GET /api/flats?buildingId=building-001`

**রেসপন্স**:
```json
[
  {
    "id": "flat-001",
    "flatNumber": "১",
    "floor": 1,
    "baseRent": 15000,
    "status": "OCCUPIED",
    "buildingId": "building-001",
    "currentTenantId": "tenant-001",
    "currentTenant": {
      "id": "tenant-001",
      "name": "করিম আহমেদ",
      "phone": "+8801234567890"
    }
  }
]
```

### নতুন ফ্ল্যাট তৈরি করুন

**এন্ডপয়েন্ট**: `POST /api/flats?buildingId=building-001`

**রিকোয়েস্ট বডি**:
```json
{
  "flatNumber": "২",
  "floor": 1,
  "baseRent": 15000,
  "status": "VACANT"
}
```

## ভাড়াটিয়া API

### ফ্ল্যাটের ভাড়াটিয়া পান

**এন্ডপয়েন্ট**: `GET /api/tenants?flatId=flat-001`

**রেসপন্স**:
```json
[
  {
    "id": "tenant-001",
    "name": "করিম আহমেদ",
    "phone": "+8801234567890",
    "whatsapp": "+8801234567891",
    "nidNumber": "1234567890123",
    "moveInDate": "2024-01-01T00:00:00Z",
    "moveOutDate": null,
    "history": [
      {
        "id": "history-001",
        "moveInDate": "2024-01-01",
        "rentAmount": 15000
      }
    ]
  }
]
```

### নতুন ভাড়াটিয়া যোগ করুন

**এন্ডপয়েন্ট**: `POST /api/tenants`

**রিকোয়েস্ট বডি**:
```json
{
  "name": "করিম আহমেদ",
  "phone": "+8801234567890",
  "whatsapp": "+8801234567891",
  "nidNumber": "1234567890123",
  "moveInDate": "2024-01-01",
  "flatId": "flat-001"
}
```

## ভাড়া API

### ভাড়া রেকর্ড পান

**এন্ডপয়েন্ট**: `GET /api/rent?flatId=flat-001&year=2024&month=4`

**রেসপন্স**:
```json
[
  {
    "id": "rent-001",
    "flatId": "flat-001",
    "year": 2024,
    "month": 4,
    "baseRent": 15000,
    "extraCharges": 500,
    "serviceCharges": 1000,
    "total": 16500,
    "paymentStatus": "UNPAID",
    "payments": []
  }
]
```

### নতুন ভাড়া রেকর্ড তৈরি করুন

**এন্ডপয়েন্ট**: `POST /api/rent`

**রিকোয়েস্ট বডি**:
```json
{
  "flatId": "flat-001",
  "buildingId": "building-001",
  "year": 2024,
  "month": 4,
  "baseRent": 15000,
  "extraCharges": 500,
  "serviceCharges": 1000
}
```

## পেমেন্ট API

### পেমেন্ট রেকর্ড পান

**এন্ডপয়েন্ট**: `GET /api/payments?rentRecordId=rent-001`

**রেসপন্স**:
```json
[
  {
    "id": "payment-001",
    "rentRecordId": "rent-001",
    "amount": 16500,
    "method": "cash",
    "reference": "PM-2024-001",
    "createdBy": {
      "firstName": "রহিম",
      "lastName": "খান"
    },
    "createdAt": "2024-04-28T10:00:00Z"
  }
]
```

### নতুন পেমেন্ট রেকর্ড করুন

**এন্ডপয়েন্ট**: `POST /api/payments`

**রিকোয়েস্ট বডি**:
```json
{
  "rentRecordId": "rent-001",
  "flatId": "flat-001",
  "buildingId": "building-001",
  "amount": 16500,
  "method": "cash",
  "reference": "PM-2024-001"
}
```

**রেসপন্স**:
```json
{
  "id": "payment-001",
  "amount": 16500,
  "paymentStatus": "PAID",
  "createdAt": "2024-04-28T10:00:00Z"
}
```

## রিপোর্ট API

### মাসিক রিপোর্ট পান

**এন্ডপয়েন্ট**: `GET /api/reports?type=monthly&buildingId=building-001&year=2024&month=4`

**রেসপন্স**:
```json
{
  "type": "monthly",
  "buildingId": "building-001",
  "year": 2024,
  "month": 4,
  "records": [
    {
      "flatNumber": "১",
      "tenant": "করিম আহমেদ",
      "baseRent": 15000,
      "total": 16500,
      "paid": 16500,
      "status": "PAID"
    }
  ],
  "totalCollection": 99000,
  "totalDue": 5000,
  "collectionRate": 0.95
}
```

### ভাড়াটিয়া রিপোর্ট পান

**এন্ডপয়েন্ট**: `GET /api/reports?type=tenant&tenantId=tenant-001`

**রেসপন্স**:
```json
{
  "type": "tenant",
  "tenantId": "tenant-001",
  "payments": [
    {
      "month": 1,
      "year": 2024,
      "amount": 15000
    }
  ],
  "totalPaid": 450000,
  "paymentCount": 12
}
```

## ত্রুটি হ্যান্ডলিং

### সাধারণ ত্রুটি

**401 - Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**403 - Forbidden**:
```json
{
  "error": "Forbidden"
}
```

**404 - Not Found**:
```json
{
  "error": "Resource not found"
}
```

**400 - Bad Request**:
```json
{
  "error": "Invalid input: Field 'name' is required"
}
```

**500 - Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```

## রেট লিমিটিং

- প্রতি ঘণ্টায় 1000 রিকোয়েস্ট
- প্রতি সেকেন্ডে 10 রিকোয়েস্ট

## CORS কনফিগারেশন

অনুমোদিত অরিজিন:
- `http://localhost:3000`
- `http://localhost:3001`
- প্রোডাকশন ডোমেইন

---

বিস্তারিত জন্য [README.md](./README.md) দেখুন।
