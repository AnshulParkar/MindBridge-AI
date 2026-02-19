import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verify } from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.NEXTAUTH_SECRET || "mindbridge-admin-secret-key";

// Verify admin token helper
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

// GET - List all therapists pending verification
export async function GET(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const therapists = await prisma.therapistProfile.findMany({
      where: { verificationStatus: status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            isBanned: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ therapists }, { status: 200 });
  } catch (error) {
    console.error("Fetch therapists error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Approve or reject therapist
export async function PUT(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { therapistProfileId, action, rejectionReason } = body;

    if (!therapistProfileId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updateData: {
      verificationStatus: string;
      isVerified: boolean;
      rejectionReason?: string;
    } = {
      verificationStatus: action === "approve" ? "approved" : "rejected",
      isVerified: action === "approve",
    };

    if (action === "reject" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await prisma.therapistProfile.update({
      where: { id: therapistProfileId },
      data: updateData,
    });

    return NextResponse.json(
      { message: `Therapist ${action}d successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify therapist error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
