import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      userId: z.string(),
      fullName: z.string().min(2),
      dateOfBirth: z.string(),
      gender: z.string(),
      age: z.number().min(1).max(150),
      degree: z.string().min(2),
      experience: z.string().min(1),
      hospitalAffiliation: z.string().min(2),
      photoUrl: z.string().min(1), // Base64 or URL of uploaded photo
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      userId,
      fullName,
      dateOfBirth,
      gender,
      age,
      degree,
      experience,
      hospitalAffiliation,
      photoUrl,
    } = result.data;

    // Check if user exists and is a therapist
    const user = await prisma.user.findFirst({
      where: { id: userId, role: "therapist" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or update therapist profile
    await prisma.therapistProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        age,
        degree,
        experience,
        hospitalAffiliation,
        photoUrl,
        isVerified: false,
        verificationStatus: "pending",
      },
      update: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        age,
        degree,
        experience,
        hospitalAffiliation,
        photoUrl,
        // Don't change verification status on update
      },
    });

    // Update user name and profile completion status
    await prisma.user.update({
      where: { id: userId },
      data: { name: fullName, isProfileComplete: true, image: photoUrl },
    });

    return NextResponse.json(
      { message: "Therapist profile submitted for verification" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Therapist profile error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
