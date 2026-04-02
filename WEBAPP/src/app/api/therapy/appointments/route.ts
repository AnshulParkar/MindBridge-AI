import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { createCalendarEvent } from "@/lib/googleCalendar"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const therapistId = url.searchParams.get("therapistId")
    const patientId = url.searchParams.get("patientId")

    const where: any = {}
    if (therapistId) where.therapistId = therapistId
    if (patientId) where.patientId = patientId

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        therapist: { select: { id: true, name: true, email: true } },
        slot: true, // Include slot info
      },
      orderBy: { scheduledTime: "asc" }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { therapistId, patientId, scheduledTime, duration, notes, slotId, type } = data

    if (!therapistId || !patientId || !scheduledTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const appointmentTime = new Date(scheduledTime)
    const appointmentDuration = duration || 3600
    const endTime = new Date(appointmentTime.getTime() + appointmentDuration * 1000)

    // Use a Prisma transaction for atomic booking
    const result = await prisma.$transaction(async (tx) => {
      // 1. If booking via a slot, atomically claim it
      if (slotId) {
        const slot = await tx.therapistAvailability.findFirst({
          where: { id: slotId, therapistId, isActive: true },
        })

        if (!slot) {
          throw new Error("SLOT_NOT_FOUND")
        }

        // For recurring slots, check if already booked on this date
        const dateStr = appointmentTime.toISOString().split("T")[0]
        const existingOnDate = await tx.appointment.findFirst({
          where: {
            slotId,
            scheduledTime: {
              gte: new Date(dateStr + "T00:00:00"),
              lte: new Date(dateStr + "T23:59:59"),
            },
            status: { notIn: ["cancelled"] },
          },
        })

        if (existingOnDate) {
          throw new Error("SLOT_ALREADY_BOOKED")
        }

        // For non-recurring slots, mark as booked
        if (!slot.isRecurring) {
          await tx.therapistAvailability.update({
            where: { id: slotId },
            data: { isBooked: true },
          })
        }
      }

      // 2. Check for time conflicts (regardless of slot)
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          therapistId,
          status: { notIn: ["cancelled"] },
          OR: [
            {
              scheduledTime: { lte: appointmentTime },
              AND: {
                scheduledTime: {
                  gte: new Date(appointmentTime.getTime() - appointmentDuration * 1000),
                },
              },
            },
          ],
          // Direct time overlap check
          scheduledTime: {
            gte: new Date(appointmentTime.getTime() - appointmentDuration * 1000),
            lt: endTime,
          },
        },
      })

      if (conflictingAppointment) {
        throw new Error("TIME_CONFLICT")
      }

      // 3. Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          therapistId,
          patientId,
          scheduledTime: appointmentTime,
          duration: appointmentDuration,
          status: "pending",
          type: type || "followup",
          notes,
          slotId: slotId || null,
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          therapist: { select: { id: true, name: true, email: true } },
          slot: true,
        },
      })

      return appointment
    })

    // Try to create Google Calendar event (non-blocking)
    try {
      const calendarEventId = await createCalendarEvent({
        summary: `MindBridge Therapy Session`,
        description: `Therapy session: ${result.patient.name} with ${result.therapist.name}${notes ? `\nNotes: ${notes}` : ""}`,
        startTime: result.scheduledTime.toISOString(),
        endTime: endTime.toISOString(),
        attendees: [result.patient.email, result.therapist.email].filter(Boolean) as string[],
      })

      if (calendarEventId) {
        await prisma.appointment.update({
          where: { id: result.id },
          data: { calendarEventId },
        })
      }
    } catch (calendarError) {
      console.warn("Google Calendar sync skipped:", calendarError)
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error creating appointment:", error)

    // Handle specific transaction errors
    if (error.message === "SLOT_NOT_FOUND") {
      return NextResponse.json({ error: "Selected time slot not found or inactive" }, { status: 404 })
    }
    if (error.message === "SLOT_ALREADY_BOOKED") {
      return NextResponse.json({ error: "This time slot is already booked. Please select another slot." }, { status: 409 })
    }
    if (error.message === "TIME_CONFLICT") {
      return NextResponse.json({ error: "This time conflicts with an existing appointment" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
