// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = await getUserFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: {
      id: true, email: true, name: true, role: true,
      isApproved: true, isVerified: true, avatarUrl: true,
      phone: true, createdAt: true,
      candidate: {
        select: {
          id: true,
          isApproved: true,
          partyId: true,
          bio: true,
          manifesto: true,
          assetDecl: true,
        }
      },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Map the candidate profile fields from assetDecl for client code
  let candidateProfile = null;
  if (user.candidate) {
    const assetDeclObj = user.candidate.assetDecl && typeof user.candidate.assetDecl === 'object' 
      ? (user.candidate.assetDecl as Record<string, unknown>) 
      : {};
    candidateProfile = {
      id: user.candidate.id,
      userId: user.id,
      partyId: user.candidate.partyId,
      status: user.candidate.isApproved ? 'approved' : 'pending',
      bio: user.candidate.bio,
      manifesto: user.candidate.manifesto,
      ...assetDeclObj,
    };
  }

  // Support both response formats: `{ user }` directly at root and `{ success: true, data: { user, candidateProfile } }`
  const responseBody = {
    success: true,
    data: {
      user,
      candidateProfile,
    },
    user, // for backwards compatibility
  };

  return NextResponse.json(responseBody);
}