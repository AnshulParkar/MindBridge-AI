import nodemailer from "nodemailer"

// Email configuration — set these in your .env file:
// EMAIL_HOST=smtp.gmail.com
// EMAIL_PORT=587
// EMAIL_USER=your-email@gmail.com
// EMAIL_PASS=your-app-password (use Gmail App Password, not your login password)
// EMAIL_FROM=MindBridge <noreply@mindbridge.com>

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email not configured. Skipping email to:", to)
      return false
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `MindBridge <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    })

    console.log(`Email sent to ${to}: ${subject}`)
    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

export function generateReminderEmail(params: {
  patientName: string
  therapistName: string
  scheduledTime: Date
  duration: number
  type: "patient" | "therapist"
}): { subject: string; html: string } {
  const { patientName, therapistName, scheduledTime, duration, type } = params
  const dateStr = scheduledTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = scheduledTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const durationMin = Math.floor(duration / 60)

  const isPatient = type === "patient"
  const recipientName = isPatient ? patientName : therapistName
  const otherName = isPatient ? therapistName : patientName

  return {
    subject: `Reminder: Therapy Session Tomorrow - ${dateStr}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🧠 MindBridge</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Session Reminder</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${recipientName},</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            This is a friendly reminder about your upcoming therapy session.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Date</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🕐 Time</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${timeStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">⏱️ Duration</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${durationMin} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">👤 ${isPatient ? "Therapist" : "Patient"}</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${otherName}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #475569; line-height: 1.6;">
            ${isPatient
              ? "Please make sure you're in a quiet, comfortable space for your session. If you need to reschedule, please do so at least 24 hours in advance."
              : "Please review the patient's notes before the session begins."
            }
          </p>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/${isPatient ? "patient" : "therapist"}/dashboard" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Go to Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            This is an automated reminder from MindBridge. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  }
}

export function generateBookingConfirmationEmail(params: {
  patientName: string
  therapistName: string
  scheduledTime: Date
  duration: number
  status: string
}): { subject: string; html: string } {
  const { patientName, therapistName, scheduledTime, duration, status } = params
  const dateStr = scheduledTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = scheduledTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const durationMin = Math.floor(duration / 60)

  return {
    subject: `Appointment ${status === "confirmed" ? "Confirmed" : "Booked"}: ${dateStr}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🧠 MindBridge</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Appointment ${status === "confirmed" ? "Confirmed ✅" : "Booked 📅"}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${patientName},</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            Your therapy session has been ${status === "confirmed" ? "confirmed" : "booked"}.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">📅 Date</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">🕐 Time</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${timeStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">⏱️ Duration</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${durationMin} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">👨‍⚕️ Therapist</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${therapistName}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            MindBridge — Your AI Mental Health Platform
          </p>
        </div>
      </div>
    `,
  }
}
