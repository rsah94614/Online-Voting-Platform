// lib/audit.ts - Audit logging utility
import prisma from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { NextRequest } from "next/server";

interface AuditParams {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  req?: NextRequest;
}

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.req
          ? (params.req.headers.get("x-forwarded-for") ?? params.req.headers.get("x-real-ip") ?? "unknown")
          : undefined,
        userAgent: params.req?.headers.get("user-agent") ?? undefined,
      },
    });
  } catch (err) {
    // Never let audit failures break the main flow
    console.error("[audit] Failed to write audit log:", err);
  }
}