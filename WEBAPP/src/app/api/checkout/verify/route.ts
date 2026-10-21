import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import Stripe from "stripe"
import { prisma } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    const metadata = checkoutSession.metadata
    if (!metadata) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 })
    }

    // Check if appointment was already created (by webhook)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        therapistId: metadata.therapistId,
        patientId: metadata.patientId,
        scheduledTime: new Date(metadata.scheduledTime),
        slotId: metadata.slotId || undefined,
      },
    })

    if (existingAppointment) {
      return NextResponse.json({
        success: true,
        appointment: existingAppointment,
        message: "Appointment already confirmed",
      })
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        therapistId: metadata.therapistId,
        patientId: metadata.patientId,
        scheduledTime: new Date(metadata.scheduledTime),
        duration: parseInt(metadata.duration) || 3600,
        type: metadata.type || "followup",
        notes: metadata.notes || null,
        slotId: metadata.slotId || null,
        status: "confirmed",
      },
      include: {
        therapist: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Mark the slot as booked
    if (metadata.slotId) {
      await prisma.therapistAvailability.update({
        where: { id: metadata.slotId },
        data: { isBooked: true },
      })
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: "Appointment confirmed after payment",
    })
  } catch (error: any) {
    console.error("Verify payment error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    )
  }
}
