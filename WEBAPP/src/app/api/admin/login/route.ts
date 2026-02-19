import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { sign } from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.NEXTAUTH_SECRET || "mindbridge-admin-secret-key";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schema = z.object({
      adminId: z.string(),
      password: z.string(),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { adminId, password } = result.data;

    // Find admin in DB
    let admin = await prisma.adminUser.findUnique({
      where: { adminId },
    });

    // If no admin exists, seed the default admin (ID: 123456, Password: 123456)
    if (!admin && adminId === "123456") {
      const hashedPassword = await hash("123456", 10);
      admin = await prisma.adminUser.create({
        data: {
          adminId: "123456",
          password: hashedPassword,
        },
      });
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    // Compare password
    const isValid = await compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    // Create a JWT token for admin session
    const token = sign(
      { adminId: admin.adminId, role: "admin", id: admin.id },
      ADMIN_JWT_SECRET,
      { expiresIn: "8h" }
    );

    return NextResponse.json(
      { message: "Admin login successful", token },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
