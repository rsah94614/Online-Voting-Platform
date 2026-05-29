// lib/email.ts — Email notification system using Nodemailer
import nodemailer from "nodemailer";

// ─── Config ───────────────────────────────────────────────────────────────────

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "VOTEX <noreply@votex.io>";

const isConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

function getTransporter() {
  if (!isConfigured) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// ─── Template wrapper ─────────────────────────────────────────────────────────

function wrapTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060611;font-family:'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);border-radius:10px;padding:8px 12px;">
        <span style="font-weight:900;font-size:16px;color:#fff;letter-spacing:2px;">VX</span>
      </div>
      <div style="font-weight:700;font-size:22px;color:#00d4ff;letter-spacing:4px;margin-top:8px;">VOTEX</div>
      <div style="font-size:10px;color:#00d4ff;letter-spacing:3px;text-transform:uppercase;">Enterprise Election Platform</div>
    </div>

    <!-- Card -->
    <div style="background:#0e0e24;border:1px solid rgba(0,212,255,0.18);border-radius:16px;padding:32px;color:#e2e8f0;">
      <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 16px 0;">${title}</h1>
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:#475569;font-size:11px;">
      <p>© ${new Date().getFullYear()} VOTEX Technologies Inc. All rights reserved.</p>
      <p style="margin-top:4px;">This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send helper ──────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!isConfigured) {
    console.log(`[EMAIL] SMTP not configured. Would have sent to ${to}:`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] (Enable SMTP by setting SMTP_HOST, SMTP_USER, SMTP_PASS env vars)`);
    return false;
  }

  try {
    const transporter = getTransporter()!;
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err);
    return false;
  }
}

// ─── Email functions ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(name: string, email: string, password: string, role: string) {
  const html = wrapTemplate("Welcome to VOTEX", `
    <p style="color:#94a3b8;line-height:1.7;">Hello <strong style="color:#fff;">${name}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.7;">Your account has been created on the VOTEX Election Platform. Here are your login credentials:</p>

    <div style="background:#060611;border:1px solid rgba(0,212,255,0.18);border-radius:10px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#94a3b8;padding:6px 0;font-size:13px;">Email</td>
          <td style="color:#00d4ff;padding:6px 0;font-size:13px;font-family:monospace;text-align:right;">${email}</td>
        </tr>
        <tr>
          <td style="color:#94a3b8;padding:6px 0;font-size:13px;">Password</td>
          <td style="color:#00d4ff;padding:6px 0;font-size:13px;font-family:monospace;text-align:right;">${password}</td>
        </tr>
        <tr>
          <td style="color:#94a3b8;padding:6px 0;font-size:13px;">Role</td>
          <td style="color:#7c3aed;padding:6px 0;font-size:13px;font-weight:600;text-align:right;">${role}</td>
        </tr>
      </table>
    </div>

    <p style="color:#ff2d6a;font-size:12px;">⚠ Please change your password after your first login for security.</p>
    <p style="color:#94a3b8;font-size:13px;margin-top:16px;">— The VOTEX Team</p>
  `);

  return sendEmail(email, "Welcome to VOTEX — Your Account is Ready", html);
}

export async function sendOtpEmail(name: string, email: string, otp: string) {
  const html = wrapTemplate("Password Reset", `
    <p style="color:#94a3b8;line-height:1.7;">Hello <strong style="color:#fff;">${name}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.7;">You requested a password reset. Use the code below to set a new password:</p>

    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);border-radius:12px;padding:16px 40px;">
        <span style="font-size:32px;font-weight:900;color:#fff;letter-spacing:8px;font-family:monospace;">${otp}</span>
      </div>
    </div>

    <p style="color:#94a3b8;font-size:13px;">This code expires in <strong style="color:#f59e0b;">15 minutes</strong>.</p>
    <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#94a3b8;font-size:13px;margin-top:16px;">— The VOTEX Team</p>
  `);

  return sendEmail(email, `${otp} — Your VOTEX Password Reset Code`, html);
}

export async function sendElectionInvite(name: string, email: string, electionTitle: string, searchCode: string) {
  const html = wrapTemplate("Election Invitation", `
    <p style="color:#94a3b8;line-height:1.7;">Hello <strong style="color:#fff;">${name}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.7;">You've been invited to participate in an election:</p>

    <div style="background:#060611;border:1px solid rgba(0,212,255,0.18);border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
      <div style="color:#fff;font-size:16px;font-weight:700;margin-bottom:12px;">${electionTitle}</div>
      <div style="color:#94a3b8;font-size:12px;margin-bottom:8px;">Your Election Code:</div>
      <div style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);border-radius:8px;padding:10px 28px;">
        <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:6px;font-family:monospace;">${searchCode}</span>
      </div>
    </div>

    <p style="color:#94a3b8;font-size:13px;">Log in to your VOTEX account and enter this code to join the election.</p>
    <p style="color:#94a3b8;font-size:13px;margin-top:16px;">— The VOTEX Team</p>
  `);

  return sendEmail(email, `You're Invited — ${electionTitle}`, html);
}

export async function sendResultsNotification(name: string, email: string, electionTitle: string, winnerName: string) {
  const html = wrapTemplate("Election Results", `
    <p style="color:#94a3b8;line-height:1.7;">Hello <strong style="color:#fff;">${name}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.7;">The results for <strong style="color:#00d4ff;">${electionTitle}</strong> are now available.</p>

    <div style="background:#060611;border:1px solid rgba(0,255,136,0.18);border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
      <div style="color:#00ff88;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">🏆 Winner</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">${winnerName}</div>
    </div>

    <p style="color:#94a3b8;font-size:13px;">Log in to your dashboard to view the full results breakdown.</p>
    <p style="color:#94a3b8;font-size:13px;margin-top:16px;">— The VOTEX Team</p>
  `);

  return sendEmail(email, `Results Available — ${electionTitle}`, html);
}
