# 📋 সম্পূর্ণ সেটআপ গাইড

## প্রি-ইনস্টলেশন চেকলিস্ট

- [ ] Node.js 18+ ইনস্টল করা আছে
- [ ] npm 9+ ইনস্টল করা আছে
- [ ] PostgreSQL 14+ ইনস্টল করা আছে (অথবা Docker)
- [ ] Git ইনস্টল করা আছে

## ধাপ 1: প্রজেক্ট সেটআপ

### A. ক্লোন এবং নির্ভরতা ইনস্টল করুন

```bash
git clone <repository-url>
cd property-management-system
npm install
```

### B. পরিবেশ ভেরিয়েবল সেট করুন

```bash
cp .env.example .env.local
```

#### .env.local সম্পাদনা করুন:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/property_management_db"

# NextAuth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-secret-key"

# App
NEXT_PUBLIC_APP_NAME="বাড়ি ব্যবস্থাপনা"
NEXT_PUBLIC_APP_ENV="development"
```

**NEXTAUTH_SECRET তৈরি করুন:**
```bash
openssl rand -base64 32
```

## ধাপ 2: ডাটাবেস সেটআপ

### অপশন A: Docker দিয়ে PostgreSQL চালান (সুপারিশকৃত)

```bash
docker run --name pms_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=property_management_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:16-alpine
```

### অপশন B: স্থানীয় PostgreSQL ইনস্টলেশন

```bash
# macOS
brew install postgresql@16

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Windows
# সরাসরি ডাউনলোড করুন: https://www.postgresql.org/download/
```

### ডাটাবেস তৈরি করুন

```bash
# PostgreSQL ক্লায়েন্টে প্রবেশ করুন
psql -U postgres

# ডাটাবেস তৈরি করুন
CREATE DATABASE property_management_db;

# Exit
\q
```

## ধাপ 3: Prisma মাইগ্রেশন

### Prisma স্কিমা যাচাই করুন

```bash
npx prisma validate
```

### প্রথম মাইগ্রেশন চালান

```bash
npx prisma migrate dev --name init
```

এটি:
1. ডাটাবেস স্কিমা তৈরি করবে
2. Prisma Client জেনারেট করবে
3. মাইগ্রেশন ফাইল তৈরি করবে

### Prisma Studio দিয়ে যাচাই করুন

```bash
npx prisma studio
```

> `http://localhost:5555` এ খোলা হবে

## ধাপ 4: প্রাথমিক ডেটা সেটআপ

### Admin ব্যবহারকারী তৈরি করুন (ঐচ্ছিক)

একটি `seed.ts` ফাইল তৈরি করুন:

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  // Admin ব্যবহারকারী তৈরি করুন
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: await hashPassword("admin123"), // পরিবর্তন করুন!
      firstName: "এডমিন",
      lastName: "ব্যবহারকারী",
      role: UserRole.ADMIN,
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  console.log("✅ Admin ব্যবহারকারী তৈরি হয়েছে:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: admin123 (পরিবর্তন করুন)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Seed চালান

```bash
npx prisma db seed
```

## ধাপ 5: উন্নয়ন সার্ভার চালান

```bash
npm run dev
```

> http://localhost:3000 এ পাওয়া যাবে

**লগইন শংসাপত্র:**
- Email: `admin@example.com`
- Password: `admin123`

## ধাপ 6: সাইন আপ এবং অনুমোদন টেস্ট করুন

1. http://localhost:3000/signup এ যান
2. নতুন অ্যাকাউন্ট তৈরি করুন
3. Admin লগইন করুন (admin@example.com)
4. `/admin` পেজে গিয়ে অপেক্ষমাণ ব্যবহারকারী অনুমোদন করুন
5. নতুন অ্যাকাউন্ট দিয়ে লগইন করুন

## ধাপ 7: Docker দিয়ে সম্পূর্ণ স্ট্যাক চালান (প্রোডাকশন)

### পরিবেশ ফাইল তৈরি করুন

```bash
cp .env.example .env
```

### .env সম্পাদনা করুন

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/property_management_db
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost
NODE_ENV=production
```

### Docker Compose চালান

```bash
docker-compose up -d
```

### লগ দেখুন

```bash
docker-compose logs -f app
```

### বন্ধ করুন

```bash
docker-compose down
```

## ট্রাবলশুটিং

### সমস্যা 1: "Connection refused" ত্রুটি

**সমাধান:**
```bash
# পোস্টগ্রেসকিউএল চলছে কিনা যাচাই করুন
psql -U postgres -d property_management_db

# Docker দিয়ে চালাবেন:
docker ps | grep postgres

# DATABASE_URL যাচাই করুন
echo $DATABASE_URL
```

### সমস্যা 2: Prisma Client ত্রুটি

**সমাধান:**
```bash
# Prisma পুনরায় জেনারেট করুন
npx prisma generate

# মাইগ্রেশন পুনর্নির্মাণ করুন
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

### সমস্যা 3: পোর্ট ব্যবহৃত

**সমাধান:**
```bash
# পোর্ট পরিবর্তন করুন
PORT=3001 npm run dev

# অথবা প্রক্রিয়া বন্ধ করুন
lsof -ti:3000 | xargs kill -9
```

### সমস্যা 4: কোন স্কিমা মাইগ্রেশন নেই

**সমাধান:**
```bash
# স্কিমা পুনর্নির্মাণ করুন (উন্নয়ন শুধুমাত্র)
npx prisma migrate reset
```

## উৎপাদন স্থাপনা

### Vercel-এ ডিপ্লয় করুন

```bash
npm install -g vercel
vercel
```

### AWS-এ ডিপ্লয় করুন

```bash
# ECR রেজিস্ট্রি তৈরি করুন
aws ecr create-repository --repository-name pms

# ডকার ইমেজ বিল্ড করুন
docker build -t pms:latest .

# ট্যাগ করুন
docker tag pms:latest <AWS_ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/pms:latest

# পুশ করুন
aws ecr get-login-password | docker login ...
docker push <AWS_ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/pms:latest
```

### Digital Ocean-এ ডিপ্লয় করুন

```bash
doctl auth init
doctl apps create --spec app.yaml
```

## স্ক্রিপ্ট এবং কমান্ড

```bash
# উন্নয়ন
npm run dev              # উন্নয়ন সার্ভার চালান
npm run lint             # লিন্ট চেক
npm run type-check       # টাইপস্ক্রিপ্ট চেক

# উৎপাদন
npm run build            # উৎপাদন বিল্ড
npm start                # উৎপাদন সার্ভার চালান

# ডাটাবেস
npx prisma studio       # Prisma Studio চালান
npx prisma db seed      # বীজ ডেটা যোগ করুন
npx prisma migrate dev  # নতুন মাইগ্রেশন তৈরি করুন
npx prisma migrate reset # স্কিমা রিসেট করুন (dev)

# Docker
docker-compose up       # সমস্ত সেবা চালান
docker-compose down     # সেবা বন্ধ করুন
docker-compose logs -f  # লগ দেখুন
docker-compose build    # পুনরায় বিল্ড করুন
```

## পরবর্তী পদক্ষেপ

1. ✅ প্রাথমিক সেটআপ সম্পূর্ণ করুন
2. ✅ অ্যাডমিন এবং মালিক অ্যাকাউন্ট তৈরি করুন
3. ✅ বাড়ি এবং ফ্ল্যাট ডেটা পরীক্ষা করুন
4. ✅ ভাড়া এবং পেমেন্ট সিস্টেম টেস্ট করুন
5. ✅ রিপোর্ট জেনারেশন টেস্ট করুন
6. ✅ প্রোডাকশনে স্থাপন করুন

---

**সমস্যা বা প্রশ্নের জন্য GitHub Issues তৈরি করুন।**
