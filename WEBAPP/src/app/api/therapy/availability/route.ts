import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"

// GET - Fetch availability slots for a therapist
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const therapistId = url.searchParams.get("therapistId")
    const dayOfWeek = url.searchParams.get("dayOfWeek")
    const date = url.searchParams.get("date") // specific date YYYY-MM-DD
    const availableOnly = url.searchParams.get("availableOnly") === "true"

    if (!therapistId) {
      return NextResponse.json({ error: "therapistId is required" }, { status: 400 })
    }

    const where: any = {
      therapistId,
      isActive: true,
    }

    if (dayOfWeek !== null && dayOfWeek !== undefined && dayOfWeek !== "") {
      where.dayOfWeek = parseInt(dayOfWeek)
    }

    if (availableOnly) {
      where.isBooked = false
    }

    // If a specific date is provided, get slots for that day of week
    // plus any specific-date overrides
    if (date) {
      const targetDate = new Date(date)
      const targetDayOfWeek = targetDate.getDay()

      const slots = await prisma.therapistAvailability.findMany({
        where: {
          therapistId,
          isActive: true,
          ...(availableOnly ? { isBooked: false } : {}),
          OR: [
            { dayOfWeek: targetDayOfWeek, isRecurring: true },
            {
              specificDate: {
                gte: new Date(date + "T00:00:00"),
                lte: new Date(date + "T23:59:59"),
              },
            },
          ],
        },
        orderBy: { startTime: "asc" },
      })

      // For recurring slots, check if already booked for this specific date
      const slotsWithBookingStatus = await Promise.all(
        slots.map(async (slot) => {
          if (slot.isRecurring && !slot.specificDate) {
            // Check if there's an appointment booked for this slot on this date
            const existingAppointment = await prisma.appointment.findFirst({
              where: {
                slotId: slot.id,
                scheduledTime: {
                  gte: new Date(date + "T00:00:00"),
                  lte: new Date(date + "T23:59:59"),
                },
                status: { notIn: ["cancelled"] },
              },
            })
            return { ...slot, isBooked: !!existingAppointment }
          }
          return slot
        })
      )

      return NextResponse.json(slotsWithBookingStatus)
    }

    const slots = await prisma.therapistAvailability.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })

    return NextResponse.json(slots)
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}

// POST - Create availability slots (therapist only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a therapist
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "therapist") {
      return NextResponse.json({ error: "Only therapists can set availability" }, { status: 403 })
    }

    const data = await req.json()

    // Support bulk creation of slots
    if (Array.isArray(data)) {
      const slots = await prisma.$transaction(
        data.map((slot: any) =>
          prisma.therapistAvailability.create({
            data: {
              therapistId: user.id,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isRecurring: slot.isRecurring ?? true,
              specificDate: slot.specificDate ? new Date(slot.specificDate) : null,
              isActive: true,
            },
          })
        )
      )
      return NextResponse.json(slots, { status: 201 })
    }

    // Single slot creation
    const { dayOfWeek, startTime, endTime, isRecurring, specificDate } = data

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "dayOfWeek, startTime, and endTime are required" }, { status: 400 })
    }

    // Check for overlapping slots
    const existingSlot = await prisma.therapistAvailability.findFirst({
      where: {
        therapistId: user.id,
        dayOfWeek,
        isActive: true,
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
    })

    if (existingSlot) {
      return NextResponse.json(
        { error: "Time slot overlaps with existing slot" },
        { status: 409 }
      )
    }

    const slot = await prisma.therapistAvailability.create({
      data: {
        therapistId: user.id,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring: isRecurring ?? true,
        specificDate: specificDate ? new Date(specificDate) : null,
        isActive: true,
      },
    })

    return NextResponse.json(slot, { status: 201 })
  } catch (error) {
    console.error("Error creating availability:", error)
    return NextResponse.json({ error: "Failed to create availability" }, { status: 500 })
  }
}

// DELETE - Remove availability slots
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "therapist") {
      return NextResponse.json({ error: "Only therapists can manage availability" }, { status: 403 })
    }

    const url = new URL(req.url)
    const slotId = url.searchParams.get("slotId")

    if (!slotId) {
      return NextResponse.json({ error: "slotId is required" }, { status: 400 })
    }

    // Soft delete - mark as inactive
    await prisma.therapistAvailability.update({
      where: { id: slotId, therapistId: user.id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Slot deactivated" })
  } catch (error) {
    console.error("Error deleting availability:", error)
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 })
  }
}
