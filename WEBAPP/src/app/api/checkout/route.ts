import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
})

// Price mapping based on session duration (in seconds)
const PRICE_MAP: Record<number, { amount: number; label: string }> = {
  1800: { amount: 2500, label: "30-minute session" },   // $25.00
  3600: { amount: 5000, label: "1-hour session" },       // $50.00
  5400: { amount: 7000, label: "1.5-hour session" },     // $70.00
  7200: { amount: 9000, label: "2-hour session" },       // $90.00
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      therapistId,
      therapistName,
      patientId,
      scheduledTime,
      duration,
      type,
      notes,
      slotId,
    } = body

    if (!therapistId || !patientId || !scheduledTime || !slotId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const priceInfo = PRICE_MAP[duration] || PRICE_MAP[3600]

    // Create a Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Therapy Session — ${priceInfo.label}`,
              description: `${type === "followup" ? "Follow-up" : type === "initial" ? "Initial Consultation" : type === "emergency" ? "Emergency" : type} session with ${therapistName || "Therapist"}`,
            },
            unit_amount: priceInfo.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        therapistId,
        patientId,
        scheduledTime,
        duration: String(duration),
        type,
        notes: notes || "",
        slotId,
      },
      success_url: `${process.env.NEXTAUTH_URL}/patient/appointments?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/patient/appointments?payment=cancelled`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
