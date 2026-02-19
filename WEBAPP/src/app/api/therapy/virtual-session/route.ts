import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const therapistId = url.searchParams.get("therapistId")
    const patientId = url.searchParams.get("patientId")

    if (!therapistId && !patientId) {
      return NextResponse.json({ error: "Missing therapistId or patientId" }, { status: 400 })
    }

    const where: any = {}
    if (therapistId) where.therapistId = therapistId
    if (patientId) where.patientId = patientId

    const sessions = await prisma.therapySession.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        },
        therapist: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { startTime: "desc" }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching therapy sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { therapistId, patientId, startTime, duration, status, notes } = data

    if (!therapistId || !patientId || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const therapySession = await prisma.therapySession.create({
      data: {
        therapistId,
        patientId,
        startTime: new Date(startTime),
        duration: duration || 0,
        status: status || "scheduled",
        notes
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(therapySession, { status: 201 })
  } catch (error) {
    console.error("Error creating therapy session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
