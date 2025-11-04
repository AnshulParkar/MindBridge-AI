# Migration from MongoDB to MySQL

This guide will help you migrate your MindBridge application from MongoDB to MySQL using Prisma ORM.

## Prerequisites

1. **Install MySQL locally:**
   - Download and install MySQL Server from https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP/MAMP which includes MySQL
   - Set a root password during installation

2. **Create the database:**
   ```sql
   CREATE DATABASE ai_therapist;
   ```

## Migration Steps

### 1. Install Dependencies

```bash
cd WEBAPP
npm install
```

This will install:
- `@prisma/client` - Prisma ORM client
- `@next-auth/prisma-adapter` - NextAuth adapter for Prisma
- `mysql2` - MySQL driver
- `prisma` (dev dependency) - Prisma CLI

### 2. Configure Database Connection

Create a `.env` file in the `WEBAPP` directory (copy from `.env.example`):

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/ai_therapist"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
NODE_ENV=development
```

**Replace `YOUR_PASSWORD` with your MySQL root password.**

### 3. Generate Prisma Client and Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 4. Verify the Migration

The following tables will be created:
- `User` - User accounts (patients and therapists)
- `Session` - NextAuth sessions
- `Account` - NextAuth accounts
- `VerificationToken` - NextAuth tokens
- `PeerSupportPost` - Peer support posts
- `Reply` - Replies to peer support posts

## Key Changes Made

### Files Updated:
1. **`package.json`** - Replaced MongoDB packages with Prisma and MySQL
2. **`src/lib/db.ts`** - New Prisma client connection (replaces mongodb.ts)
3. **`prisma/schema.prisma`** - New database schema
4. **`.env.example`** - Updated environment variables
5. **`src/app/api/auth/[...nextauth]/route.ts`** - Updated to use Prisma
6. **`src/app/api/auth/register/route.ts`** - Updated to use Prisma
7. **`src/app/api/peer-support/posts/route.ts`** - Updated to use Prisma
8. **`src/app/api/peer-support/posts/[id]/like/route.ts`** - Updated to use Prisma
9. **`src/app/api/peer-support/posts/[id]/reply/route.ts`** - Updated to use Prisma

### Files Backed Up:
- **`src/lib/mongodb.ts`** → `src/lib/mongodb.ts.bak` (old MongoDB connection)

## Running the Application

```bash
cd WEBAPP
npm run dev
```

Visit http://localhost:3000

## Prisma Commands Reference

```bash
# View and edit data in browser
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset

# Generate Prisma Client after schema changes
npx prisma generate

# Create a migration (for production)
npx prisma migrate dev --name migration_name
```

## Troubleshooting

### Error: "Can't connect to MySQL server"
- Make sure MySQL is running
- Verify your DATABASE_URL in `.env`
- Check MySQL credentials (username/password)

### Error: "Access denied for user"
- Verify your MySQL password in DATABASE_URL
- Make sure the user has permissions on the database

### Error: "Database does not exist"
- Create the database manually:
  ```sql
  CREATE DATABASE ai_therapist;
  ```

### TypeScript Errors
- Run `npx prisma generate` to generate Prisma Client types
- Restart your IDE/editor

## Data Migration (Optional)

If you have existing data in MongoDB you want to migrate:

1. Export data from MongoDB:
   ```bash
   mongoexport --db=ai_therapist --collection=users --out=users.json
   mongoexport --db=ai_therapist --collection=peer_support_posts --out=posts.json
   ```

2. Create a migration script to import into MySQL (custom script needed based on your data structure)

## Production Deployment

For production, use:
- PlanetScale (MySQL-compatible, recommended)
- AWS RDS MySQL
- Digital Ocean MySQL
- Or any MySQL hosting provider

Update your DATABASE_URL in production environment variables.
