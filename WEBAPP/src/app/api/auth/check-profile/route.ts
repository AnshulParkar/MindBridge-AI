import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      userId: z.string(),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { userId } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        therapistProfile: {
          select: {
            verificationStatus: true,
            isVerified: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      isProfileComplete: user.isProfileComplete,
      role: user.role,
      isBanned: user.isBanned,
      therapistVerification: user.therapistProfile
        ? {
            status: user.therapistProfile.verificationStatus,
            isVerified: user.therapistProfile.isVerified,
            rejectionReason: user.therapistProfile.rejectionReason,
          }
        : null,
    });
  } catch (error) {
    console.error("Check profile error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
