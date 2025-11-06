import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const therapists = await prisma.user.findMany({
      where: { role: "therapist" },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return NextResponse.json(therapists)
  } catch (error) {
    console.error("Error fetching therapists:", error)
    return NextResponse.json({ error: "Failed to fetch therapists" }, { status: 500 })
  }
}
