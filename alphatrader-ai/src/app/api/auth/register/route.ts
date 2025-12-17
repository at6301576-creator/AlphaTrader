import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  validatePasswordStrength,
  validateInput,
  createSecureErrorResponse,
  createSecureResponse,
  rateLimit,
  getClientIdentifier,
} from "@/lib/security";

// Validation schema
const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 registration attempts per hour per IP
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`register:${clientId}`, {
      interval: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
    });

    if (!rateLimitResult.success) {
      return createSecureErrorResponse(
        "Too many registration attempts. Please try again later.",
        429
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateInput(RegisterSchema, body);
    if (!validation.success) {
      return createSecureErrorResponse((validation as any).error, 400);
    }

    const { name, email, password } = validation.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return createSecureErrorResponse(
        passwordValidation.errors.join(". "),
        400
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return createSecureErrorResponse(
        "User with this email already exists",
        400
      );
    }

    // Hash password with stronger cost factor
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create default watchlist for new user
    await prisma.watchlist.create({
      data: {
        userId: user.id,
        name: "My Watchlist",
        description: "Your default watchlist",
        symbols: JSON.stringify([]),
      },
    });

    return createSecureResponse(
      { message: "User created successfully" },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return createSecureErrorResponse(
      "An error occurred during registration",
      500
    );
  }
}
