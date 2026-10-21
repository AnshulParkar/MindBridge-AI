import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Helper to generate an anonymous student ID.
 */
function generateAnonymousId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const letterPart = letters.charAt(Math.floor(Math.random() * letters.length));
  const numberPart = Array.from({ length: 3 }, () =>
    numbers.charAt(Math.floor(Math.random() * numbers.length))
  ).join("");
  return `Student_${letterPart}${numberPart}`;
}

/**
 * POST: Add a reply to a peer support post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, isVolunteer = false } = body;

    // ✅ Validation
    const validation = validateReplyData({ content });
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // ✅ Check if post exists and active
    const post = await prisma.peerSupportPost.findUnique({
      where: { id },
    });

    if (!post || !post.isActive) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // ✅ Create reply - Use Prisma's proper nested create
    const updatedPost = await prisma.peerSupportPost.update({
      where: { id },
      data: {
        replies: {
          create: {
            content: content.trim(),
            isVolunteer,
            anonymousId: generateAnonymousId(),
          }
        },
        updatedAt: new Date(),
      },
      include: {
        replies: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error adding reply:", error);
    if (error instanceof Error && error.message.includes("Invalid")) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
  }
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface ReplyData {
  content: string;
}

function validateReplyData(data: ReplyData): ValidationResult {
  if (!data.content || typeof data.content !== "string") {
    return { isValid: false, error: "Content is required." };
  }

  const trimmed = data.content.trim();

  if (trimmed.length < 5) {
    return { isValid: false, error: "Reply must be at least 5 characters long." };
  }

  if (trimmed.length > 1000) {
    return { isValid: false, error: "Reply is too long (max 1000 characters)." };
  }

  return { isValid: true };
}
