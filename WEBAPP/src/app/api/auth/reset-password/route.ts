import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      userId: z.string(),
      newPassword: z.string().min(4).max(20),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, newPassword } = result.data;

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
