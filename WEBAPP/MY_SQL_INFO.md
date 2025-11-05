# MySQL Database Migration - Summary


### Added Packages:
- `@prisma/client` - Prisma ORM client for MySQL
- `@next-auth/prisma-adapter` - Prisma adapter for NextAuth  
- `mysql2` - MySQL database driver
- `prisma` - Prisma CLI tools (dev dependency)

## Next Steps

### 1. Set up MySQL Database

You need to create your `.env` file:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and update the DATABASE_URL with your MySQL credentials:
```env
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/ai_therapist"
```

### 2. Create the MySQL Database

Open MySQL and run:
```sql
CREATE DATABASE ai_therapist;
```

Or use MySQL Workbench / phpMyAdmin to create the database.

### 3. Initialize the Database Schema

Run these commands to set up your database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Create all database tables
npx prisma db push

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 4. Start Your Application

```bash
npm run dev
```

## Quick Setup Commands

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your MySQL password

# 3. Create database in MySQL
# mysql -u root -p
# CREATE DATABASE ai_therapist;
# exit

# 4. Initialize Prisma
npx prisma generate
npx prisma db push

# 5. Start the app
npm run dev
```

## Database Schema

Your MySQL database will have these tables:

- **User** - User accounts (patients/therapists)
- **Account** - OAuth accounts
- **Session** - User sessions
- **VerificationToken** - Email verification tokens
- **PeerSupportPost** - Peer support forum posts
- **Reply** - Replies to forum posts

## Viewing Your Database

```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```

This opens at http://localhost:5555

## Troubleshooting

### "Can't connect to MySQL"
- Ensure MySQL is running
- Check your DATABASE_URL in `.env`
- Verify MySQL credentials

### "Database doesn't exist"
```sql
CREATE DATABASE ai_therapist;
```

### TypeScript errors about Prisma
```bash
npx prisma generate
```

Then restart your IDE.

## Full Migration Documentation

See `MIGRATION_GUIDE.md` for complete details and troubleshooting.

---

**Ready to test!** Make sure MySQL is running, then follow the steps above.
