/**
 * Migration Script: Move existing ChatMessages to default sessions
 * 
 * This script creates a default session for each user and moves their
 * orphaned messages (messages without sessionId) to that session.
 * 
 * Run with: npx tsx scripts/migrate-messages-to-sessions.ts
 * or: node --loader tsx scripts/migrate-messages-to-sessions.ts
 * 
 * This script is a one-time data migration utility.

Why it is used
It is used to fix older data after introducing chatSession support:

Some existing chatMessage records have sessionId = null (orphaned messages).
The app now expects messages to belong to a session.
This script:
Finds orphaned messages.
Groups them per user.
Creates (or reuses) a default session named "Previous Conversations" for each user.
Updates those messages to point to that session.
Prints a summary and remaining orphaned count.
 * 
 * When to run it
Run it after deploying schema/session changes, so old messages remain visible and organized in the new session-based model.
Without this migration, old messages may be missing from session-based queries/UI.
 * 
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateMessagesToSessions() {
  console.log('🔄 Starting migration of orphaned messages to sessions...\n');

  try {
    // Find all users with orphaned messages
    const orphanedMessages = await prisma.chatMessage.findMany({
      where: {
        sessionId: null
      },
      orderBy: {
        timestamp: 'asc'
      },
      include: {
        user: true
      }
    });

    if (orphanedMessages.length === 0) {
      console.log('✅ No orphaned messages found. All messages are already in sessions.\n');
      return;
    }

    console.log(`📊 Found ${orphanedMessages.length} orphaned messages\n`);

    // Group messages by user
    const messagesByUser = orphanedMessages.reduce((acc, message) => {
      if (!acc[message.userId]) {
        acc[message.userId] = [];
      }
      acc[message.userId].push(message);
      return acc;
    }, {} as Record<string, typeof orphanedMessages>);

    const userIds = Object.keys(messagesByUser);
    console.log(`� Found ${userIds.length} users with orphaned messages\n`);

    for (const userId of userIds) {
      const userMessages = messagesByUser[userId];
      const user = userMessages[0].user;

      console.log(`👤 Processing user: ${user.email}`);
      console.log(`   Messages to migrate: ${userMessages.length}`);

      // Create or get default session for this user
      let defaultSession = await prisma.chatSession.findFirst({
        where: {
          userId: userId,
          title: 'Previous Conversations'
        }
      });

      if (!defaultSession) {
        defaultSession = await prisma.chatSession.create({
          data: {
            userId: userId,
            title: 'Previous Conversations',
            createdAt: userMessages[0]?.timestamp || new Date(),
            updatedAt: userMessages[userMessages.length - 1]?.timestamp || new Date()
          }
        });
        console.log(`   ✅ Created default session: ${defaultSession.id}`);
      } else {
        console.log(`   ♻️  Using existing session: ${defaultSession.id}`);
      }

      // Move all orphaned messages to this session
      const updateResult = await prisma.chatMessage.updateMany({
        where: {
          userId: userId,
          sessionId: null
        },
        data: {
          sessionId: defaultSession.id
        }
      });

      console.log(`   ✅ Migrated ${updateResult.count} messages to session\n`);
    }

    console.log('✨ Migration completed successfully!');
    
    // Summary
    const totalSessions = await prisma.chatSession.count();
    const totalMessages = await prisma.chatMessage.count();
    const remainingOrphanedMessages = await prisma.chatMessage.count({
      where: { sessionId: null }
    });

    console.log('\n📈 Summary:');
    console.log(`   Total Sessions: ${totalSessions}`);
    console.log(`   Total Messages: ${totalMessages}`);
    console.log(`   Remaining Orphaned Messages: ${remainingOrphanedMessages}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateMessagesToSessions()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
