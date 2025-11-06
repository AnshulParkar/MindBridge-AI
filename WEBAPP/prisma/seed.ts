import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create therapists
  const therapist1 = await prisma.user.upsert({
    where: { email: 'therapist1@example.com' },
    update: {},
    create: {
      email: 'therapist1@example.com',
      name: 'Dr. Sarah Johnson',
      password: await hash('password123', 10),
      role: 'therapist',
    },
  })

  const therapist2 = await prisma.user.upsert({
    where: { email: 'therapist2@example.com' },
    update: {},
    create: {
      email: 'therapist2@example.com',
      name: 'Dr. Michael Chen',
      password: await hash('password123', 10),
      role: 'therapist',
    },
  })

  const therapist3 = await prisma.user.upsert({
    where: { email: 'therapist3@example.com' },
    update: {},
    create: {
      email: 'therapist3@example.com',
      name: 'Dr. Emily Rodriguez',
      password: await hash('password123', 10),
      role: 'therapist',
    },
  })

  const therapist4 = await prisma.user.upsert({
    where: { email: 'therapist4@example.com' },
    update: {},
    create: {
      email: 'therapist4@example.com',
      name: 'Dr. James Williams',
      password: await hash('password123', 10),
      role: 'therapist',
    },
  })

  // Create patients
  const patient1 = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      name: 'John Doe',
      password: await hash('password123', 10),
      role: 'patient',
    },
  })

  const patient2 = await prisma.user.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      email: 'patient2@example.com',
      name: 'Jane Smith',
      password: await hash('password123', 10),
      role: 'patient',
    },
  })

  // Create patient profiles
  await prisma.patientProfile.upsert({
    where: { userId: patient1.id },
    update: {},
    create: {
      userId: patient1.id,
      totalSessions: 5,
      dominantEmotion: 'happy',
      improvementTrend: 'up',
    },
  })

  await prisma.patientProfile.upsert({
    where: { userId: patient2.id },
    update: {},
    create: {
      userId: patient2.id,
      totalSessions: 3,
      dominantEmotion: 'neutral',
      improvementTrend: 'stable',
    },
  })

  // Create sample sessions
  const session1 = await prisma.therapySession.create({
    data: {
      therapistId: therapist1.id,
      patientId: patient1.id,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      duration: 3600,
      status: 'completed',
      messageCount: 25,
      emotionsSummary: { happy: 8, neutral: 5, anxious: 2 },
    },
  })

  const session2 = await prisma.therapySession.create({
    data: {
      therapistId: therapist1.id,
      patientId: patient2.id,
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      duration: 2400,
      status: 'completed',
      messageCount: 18,
      emotionsSummary: { neutral: 10, happy: 5, sad: 3 },
    },
  })

  // Create sample appointments
  const appointment1 = await prisma.appointment.create({
    data: {
      therapistId: therapist1.id,
      patientId: patient1.id,
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      duration: 3600,
      status: 'confirmed',
      notes: 'Follow-up session on coping strategies',
    },
  })

  const appointment2 = await prisma.appointment.create({
    data: {
      therapistId: therapist2.id,
      patientId: patient2.id,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      duration: 3600,
      status: 'pending',
      notes: 'Initial consultation',
    },
  })

  console.log('Database seeded successfully!')
  console.log('\nTest Accounts Created:')
  console.log('\nTherapists:')
  console.log('  Email: therapist1@example.com | Password: password123 | Dr. Sarah Johnson')
  console.log('  Email: therapist2@example.com | Password: password123 | Dr. Michael Chen')
  console.log('  Email: therapist3@example.com | Password: password123 | Dr. Emily Rodriguez')
  console.log('  Email: therapist4@example.com | Password: password123 | Dr. James Williams')
  console.log('\nPatients:')
  console.log('  Email: patient1@example.com | Password: password123')
  console.log('  Email: patient2@example.com | Password: password123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
