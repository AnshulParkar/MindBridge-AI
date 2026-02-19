import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      userId: z.string(),
      fullName: z.string().min(2),
      dateOfBirth: z.string(), // ISO date string
      gender: z.string(),
      age: z.number().min(1).max(150),
      height: z.string().optional(),
      weight: z.string().optional(),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, fullName, dateOfBirth, gender, age, height, weight } = result.data;

    // Check if user exists and is a patient
    const user = await prisma.user.findFirst({
      where: { id: userId, role: "patient" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or update patient details
    await prisma.patientDetails.upsert({
      where: { userId },
      create: {
        userId,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        age,
        height: height || null,
        weight: weight || null,
      },
      update: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        age,
        height: height || null,
        weight: weight || null,
      },
    });

    // Update user name and profile completion status
    await prisma.user.update({
      where: { id: userId },
      data: { name: fullName, isProfileComplete: true },
    });

    return NextResponse.json(
      { message: "Patient profile completed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Patient profile error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
