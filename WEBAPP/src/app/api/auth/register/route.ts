
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(4).max(10),
      role: z.enum(["patient", "therapist"]),
    });
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
    }
    const { email, password, role } = result.data;
    
    const existing = await prisma.user.findFirst({
      where: {
        email,
        role,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashed = await hash(password, 10);
    
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        role,
      },
    });

    return NextResponse.json({ message: "User registered" }, { status: 201 });
  } catch (e) {
    console.error('Registration error:', e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
