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

// GET - Overall analytics
export async function GET(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Total counts
    const [totalPatients, totalTherapists, totalSessions, totalAppointments] =
      await Promise.all([
        prisma.user.count({ where: { role: "patient" } }),
        prisma.user.count({ where: { role: "therapist" } }),
        prisma.therapySession.count(),
        prisma.appointment.count(),
      ]);

    // Active users (logged in within last 7 days via session)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [activePatients, activeTherapists] = await Promise.all([
      prisma.user.count({
        where: {
          role: "patient",
          chatSessions: { some: { updatedAt: { gte: sevenDaysAgo } } },
        },
      }),
      prisma.user.count({
        where: {
          role: "therapist",
          therapistSessions: { some: { updatedAt: { gte: sevenDaysAgo } } },
        },
      }),
    ]);

    // Pending therapist verifications
    const pendingVerifications = await prisma.therapistProfile.count({
      where: { verificationStatus: "pending" },
    });

    // Banned users
    const bannedUsers = await prisma.user.count({
      where: { isBanned: true },
    });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newRegistrations = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Appointments by status
    const appointmentStats = await prisma.appointment.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // Daily registrations for the last 30 days (for chart)
    const dailyRegistrations = await prisma.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        overview: {
          totalPatients,
          totalTherapists,
          totalUsers: totalPatients + totalTherapists,
          totalSessions,
          totalAppointments,
          activePatients,
          activeTherapists,
          pendingVerifications,
          bannedUsers,
          newRegistrations,
        },
        appointmentStats: appointmentStats.reduce(
          (acc, item) => ({ ...acc, [item.status]: item._count.status }),
          {}
        ),
        dailyRegistrations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
