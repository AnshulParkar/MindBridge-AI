import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verify } from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.NEXTAUTH_SECRET || "mindbridge-admin-secret-key";

function verifyAdmin(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, ADMIN_JWT_SECRET) as { role: string };
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

// GET - Fetch all users (patients + therapists)
export async function GET(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // "patient", "therapist", or null for all
    const search = searchParams.get("search") || "";

    const whereClause: Record<string, unknown> = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }
    // Exclude admin role from user list
    whereClause.role = role ? role : { in: ["patient", "therapist"] };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        isProfileComplete: true,
        createdAt: true,
        image: true,
        patientDetails: true,
        therapistProfile: {
          select: {
            id: true,
            fullName: true,
            degree: true,
            experience: true,
            isVerified: true,
            verificationStatus: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Ban/unban or delete a user
export async function PUT(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !["ban", "unban", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ message: "User deleted" }, { status: 200 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: action === "ban" },
    });

    return NextResponse.json(
      { message: `User ${action === "ban" ? "banned" : "unbanned"} successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("User action error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
