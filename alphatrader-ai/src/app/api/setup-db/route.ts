import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This endpoint initializes the database schema
export async function GET() {
  try {
    // Test the connection by running a simple query
    await prisma.$executeRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: "Database connection successful"
    });
  } catch (error: any) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Database setup failed",
        details: error,
      },
      { status: 500 }
    );
  }
}
