import { NextRequest, NextResponse } from "next/server";
import { getAnalystData } from "@/lib/api/analyst-ratings";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    const analystData = await getAnalystData(symbol);

    return NextResponse.json(analystData);
  } catch (error) {
    console.error("[API] Error fetching analyst ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyst ratings" },
      { status: 500 }
    );
  }
}
