import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";

/**
 * Same shape as Sample Dig registration. If SMTP is added later, gate verification;
 * for now auto-verify when email is not configured (Dig pattern).
 */
function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim(),
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const smtp = isSmtpConfigured();

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name ? String(name).trim() || null : null,
        emailVerified: smtp ? null : new Date(),
        emailVerificationToken: smtp ? rawToken : null,
        emailVerificationExpires: smtp ? expires : null,
      },
    });

    if (!smtp) {
      return NextResponse.json(
        {
          message:
            "Account created. Email verification is not configured, so you can log in now.",
          needsVerification: false,
        },
        { status: 201 },
      );
    }

    // SMTP configured but we do not send mail from marketplace yet — verify anyway.
    console.warn(
      "[auth/register] SMTP env set but send not implemented; auto-verifying:",
      normalizedEmail,
    );
    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.json(
      {
        message: "Account created. You can sign in now.",
        needsVerification: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
