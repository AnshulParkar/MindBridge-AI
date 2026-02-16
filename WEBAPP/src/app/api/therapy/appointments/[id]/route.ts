import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { sendEmail, generateBookingConfirmationEmail } from "@/lib/email"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { status, notes } = data

    // Get the current user and appointment
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      select: { status: true, patientId: true, therapistId: true },
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Patients can only cancel pending appointments, not confirmed ones
    if (
      currentUser.role === "patient" &&
      status === "cancelled" &&
      existingAppointment.status === "confirmed"
    ) {
      return NextResponse.json(
        { error: "Cannot cancel a confirmed appointment. Please contact your therapist to reschedule." },
        { status: 403 }
      )
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status, notes },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        therapist: { select: { id: true, name: true, email: true } }
      }
    })

    // Send confirmation email to patient when therapist confirms the appointment
    if (status === "confirmed" && currentUser.role === "therapist" && appointment.patient.email) {
      try {
        const confirmationEmail = generateBookingConfirmationEmail({
          patientName: appointment.patient.name || "Patient",
          therapistName: appointment.therapist.name || "Therapist",
          scheduledTime: appointment.scheduledTime,
          duration: appointment.duration,
          status: "confirmed",
        })

        await sendEmail({
          to: appointment.patient.email,
          subject: confirmationEmail.subject,
          html: confirmationEmail.html,
        })
      } catch (emailError) {
        console.warn("Failed to send confirmation email:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.appointment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Appointment deleted" })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 })
  }
}
