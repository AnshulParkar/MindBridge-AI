import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      userId: z.string(),
      otp: z.string().length(6),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, otp } = result.data;

    // Find valid OTP
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        userId,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    return NextResponse.json(
      { message: "OTP verified successfully", verified: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
