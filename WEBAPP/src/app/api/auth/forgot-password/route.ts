import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      email: z.string().email(),
      role: z.enum(["patient", "therapist"]),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = result.data;

    // Find user by email and role
    const user = await prisma.user.findFirst({
      where: { email, role },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email and role" },
        { status: 404 }
      );
    }

    // Invalidate any existing unused OTPs for this user
    await prisma.otpToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpToken.create({
      data: {
        userId: user.id,
        otp,
        expiresAt,
      },
    });

    // Send OTP email
    const emailSent = await sendEmail({
      to: email,
      subject: "MindBridge - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">MindBridge</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Password Reset</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Your OTP Code</h2>
            <p style="color: #475569; line-height: 1.6;">
              You have requested to reset your password. Use the OTP below to verify your identity:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #3B82F6; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #3B82F6; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #475569; line-height: 1.6;">
              This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
            </p>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (!emailSent) {
      // In dev, log the OTP for testing
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    return NextResponse.json(
      { message: "OTP sent to your email", userId: user.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
