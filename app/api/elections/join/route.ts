import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const joinSchema = z.object({
  code: z.string().min(6).max(10).toUpperCase(),
});

export async function POST(req: NextRequest) {
  const jwtUser = await getUserFromRequest(req);
  if (!jwtUser || jwtUser.role !== "VOTER") {
    return NextResponse.json({ error: "Only voters can join elections" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = joinSchema.parse(body);

    const election = await prisma.election.findUnique({
      where: { searchCode: data.code } as any,
    });

    if (!election) {
      return NextResponse.json({ error: "Invalid election code" }, { status: 404 });
    }

    // Fetch the full user to get their current email for eligibility checks
    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- VOTER ELIGIBILITY ENFORCEMENT ---
    if (election.settings && typeof election.settings === 'object') {
      const settings = election.settings as Record<string, any>;
      const eligibilityType = settings.eligibilityType;

      if (eligibilityType === 'DOMAIN' && Array.isArray(settings.allowedDomains)) {
        const userDomain = user.email.split('@')[1]?.toLowerCase();
        const allowed = settings.allowedDomains.some((domain: string) => 
          userDomain === domain.toLowerCase().trim()
        );
        if (!allowed) {
          return NextResponse.json({ 
            error: "Eligibility Denied: Your email domain is not authorized for this election." 
          }, { status: 403 });
        }
      }

      if (eligibilityType === 'WHITELIST' && Array.isArray(settings.whitelistEmails)) {
        const allowed = settings.whitelistEmails.some((email: string) => 
          user.email.toLowerCase() === email.toLowerCase().trim()
        );
        if (!allowed) {
          return NextResponse.json({ 
            error: "Eligibility Denied: Your email address is not on the whitelist for this election." 
          }, { status: 403 });
        }
      }
    }
    // -------------------------------------

    // Add voter to enrolledVoters
    await prisma.election.update({
      where: { id: election.id },
      data: {
        enrolledVoters: {
          connect: { id: user.id }
        }
      } as any
    });

    return NextResponse.json({ success: true, message: "Successfully joined election", electionId: election.id }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid code format", issues: err.errors }, { status: 400 });
    }
    console.error("[elections/join POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
