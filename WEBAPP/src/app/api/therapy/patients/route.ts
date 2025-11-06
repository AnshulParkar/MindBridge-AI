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

    if (!therapistId) {
      return NextResponse.json({ error: "Missing therapistId" }, { status: 400 })
    }

    const patientIds = await prisma.therapySession.findMany({
      where: { therapistId },
      select: { patientId: true },
      distinct: ["patientId"]
    })

    const uniquePatientIds = patientIds.map(p => p.patientId)

    const patients = await prisma.user.findMany({
      where: {
        id: { in: uniquePatientIds },
        role: "patient"
      },
      select: {
        id: true,
        name: true,
        email: true,
        patientProfile: true,
        therapySessions: {
          where: { therapistId },
          orderBy: { startTime: "desc" },
          take: 1
        }
      }
    })

    const patientsWithStats = patients.map(patient => ({
      id: patient.id,
      name: patient.name || "Unknown",
      email: patient.email,
      totalSessions: patient.patientProfile?.totalSessions || 0,
      lastSession: patient.therapySessions[0]?.startTime || null,
      dominantEmotion: patient.patientProfile?.dominantEmotion || "neutral",
      improvementTrend: patient.patientProfile?.improvementTrend || "stable"
    }))

    return NextResponse.json(patientsWithStats)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}
