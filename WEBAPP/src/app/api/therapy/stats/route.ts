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

    const [sessions, appointments, patients] = await Promise.all([
      prisma.therapySession.count({ where: { therapistId, status: "completed" } }),
      prisma.appointment.count({ where: { therapistId } }),
      prisma.therapySession.findMany({
        where: { therapistId },
        select: { patientId: true },
        distinct: ["patientId"]
      })
    ])

    const totalDuration = await prisma.therapySession.aggregate({
      where: { therapistId, status: "completed" },
      _sum: { duration: true }
    })

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activePatients = await prisma.therapySession.count({
      where: {
        therapistId,
        startTime: { gte: oneWeekAgo }
      },
      distinct: ["patientId"]
    })

    return NextResponse.json({
      totalPatients: patients.length,
      totalSessions: sessions,
      totalDuration: totalDuration._sum.duration || 0,
      weeklyAppointments: appointments,
      activePatients,
      avgSessionDuration: sessions > 0 ? Math.round((totalDuration._sum.duration || 0) / sessions / 60) : 0
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
