import { NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature") || ""

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session
    const metadata = checkoutSession.metadata

    if (metadata) {
      try {
        // Create the appointment after successful payment
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

        console.log("Appointment created after payment:", appointment.id)
      } catch (error) {
        console.error("Error creating appointment from webhook:", error)
        return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
