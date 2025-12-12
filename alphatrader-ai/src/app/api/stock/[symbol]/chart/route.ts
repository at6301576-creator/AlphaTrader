import { NextRequest, NextResponse } from "next/server";
import { getHistoricalData } from "@/lib/api/yahoo-finance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "1mo") as "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max";
    const interval = (searchParams.get("interval") || "1d") as "1d" | "1wk" | "1mo";

    const symbolUpper = symbol.toUpperCase();

    const historicalData = await getHistoricalData(symbolUpper, range, interval);

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json({ error: "No historical data found" }, { status: 404 });
    }

    return NextResponse.json({ data: historicalData });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
