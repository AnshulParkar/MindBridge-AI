import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "therapist") {
      return NextResponse.json({ error: "Only therapists can manage availability" }, { status: 403 })
    }

    const data = await req.json()
    const { isActive, startTime, endTime, isRecurring } = data

    const slot = await prisma.therapistAvailability.update({
      where: { id, therapistId: user.id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...(isRecurring !== undefined ? { isRecurring } : {}),
      },
    })

    return NextResponse.json(slot)
  } catch (error) {
    console.error("Error updating availability:", error)
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "therapist") {
      return NextResponse.json({ error: "Only therapists can manage availability" }, { status: 403 })
    }

    // Check if slot has future appointments
    const hasAppointments = await prisma.appointment.findFirst({
      where: {
        slotId: id,
        scheduledTime: { gte: new Date() },
        status: { notIn: ["cancelled", "completed"] },
      },
    })

    if (hasAppointments) {
      // Soft delete if appointments exist
      await prisma.therapistAvailability.update({
        where: { id, therapistId: user.id },
        data: { isActive: false },
      })
      return NextResponse.json({ message: "Slot deactivated (has future appointments)" })
    }

    await prisma.therapistAvailability.delete({
      where: { id, therapistId: user.id },
    })

    return NextResponse.json({ message: "Slot deleted" })
  } catch (error) {
    console.error("Error deleting availability:", error)
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 })
  }
}
