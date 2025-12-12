import type { ShariahDetails } from "@/types/stock";

// Industries that are not Shariah compliant
const HARAM_INDUSTRIES = [
  "alcoholic beverages",
  "tobacco",
  "gambling",
  "casinos",
  "adult entertainment",
  "pork",
  "conventional banking",
  "conventional insurance",
  "interest-based financial services",
];

// Keywords that indicate non-compliant business activities
// Note: Defense companies are debatable - some scholars allow, others don't
const HARAM_KEYWORDS = [
  "alcohol",
  "beer",
  "wine",
  "spirits",
  "liquor",
  "tobacco",
  "cigarette",
  "casino",
  "gambling",
  "betting",
  "nightclub",
  "pork",
  "swine",
];

export interface FinancialData {
  totalDebt?: number;
  totalEquity?: number;
  totalAssets?: number;
  marketCap?: number;
  cash?: number;
  shortTermInvestments?: number;
  accountsReceivable?: number;
  totalRevenue?: number;
  interestIncome?: number;
  interestExpense?: number;
}

export interface CompanyProfile {
  sector?: string;
  industry?: string;
  businessSummary?: string;
}

export function screenShariahCompliance(
  profile: CompanyProfile,
  financials: FinancialData
): ShariahDetails {
  const businessScreening = screenBusinessActivity(profile);
  const financialScreening = screenFinancialRatios(financials);

  // Overall status
  let overallStatus: ShariahDetails["overallStatus"] = "unknown";

  if (!businessScreening.passed) {
    overallStatus = "non-compliant";
  } else if (
    financialScreening.debtToEquityPassed &&
    financialScreening.interestIncomePassed &&
    financialScreening.receivablesPassed &&
    financialScreening.cashAndInterestBearingPassed
  ) {
    overallStatus = "compliant";
  } else if (
    financialScreening.debtToEquityPassed ||
    financialScreening.interestIncomePassed
  ) {
    overallStatus = "doubtful";
  } else {
    overallStatus = "non-compliant";
  }

  // Calculate purification ratio
  const purificationRatio = calculatePurificationRatio(financials);

  return {
    overallStatus,
    businessScreening,
    financialScreening,
    purificationRatio,
    lastUpdated: new Date().toISOString(),
  };
}

function screenBusinessActivity(profile: CompanyProfile): ShariahDetails["businessScreening"] {
  const concerns: string[] = [];
  let halalPercentage = 100;

  const industry = (profile.industry || "").toLowerCase();
  const sector = (profile.sector || "").toLowerCase();
  const summary = (profile.businessSummary || "").toLowerCase();

  // Check industry against haram list
  for (const haramIndustry of HARAM_INDUSTRIES) {
    if (industry.includes(haramIndustry) || sector.includes(haramIndustry)) {
      concerns.push(`Industry classified as ${haramIndustry}`);
      halalPercentage = 0;
    }
  }

  // Check business summary for haram keywords
  for (const keyword of HARAM_KEYWORDS) {
    if (summary.includes(keyword)) {
      if (!concerns.some((c) => c.includes(keyword))) {
        concerns.push(`Business description mentions "${keyword}"`);
        halalPercentage = Math.max(0, halalPercentage - 20);
      }
    }
  }

  // Financial services sector gets special scrutiny
  if (sector.includes("financial") || industry.includes("bank")) {
    if (!industry.includes("islamic") && !summary.includes("islamic")) {
      concerns.push("Conventional financial services");
      halalPercentage = 0;
    }
  }

  return {
    passed: concerns.length === 0,
    halalPercentage,
    concerns,
  };
}

function screenFinancialRatios(financials: FinancialData): ShariahDetails["financialScreening"] {
  // AAOIFI-based financial screening thresholds (percentage-based)
  const DEBT_TO_MARKET_CAP_THRESHOLD = 33; // 33%
  const INTEREST_INCOME_THRESHOLD = 5; // 5%
  const RECEIVABLES_TO_MARKET_CAP_THRESHOLD = 45; // 45%
  const CASH_AND_INTEREST_TO_MARKET_CAP_THRESHOLD = 33; // 33%

  const totalDebt = financials.totalDebt || 0;
  const marketCap = financials.marketCap || financials.totalEquity || 1; // Use market cap or equity
  const totalAssets = financials.totalAssets || 1;
  const totalRevenue = financials.totalRevenue || 1;
  const interestIncome = financials.interestIncome || 0;
  const cash = financials.cash || 0;
  const shortTermInvestments = financials.shortTermInvestments || 0;
  const accountsReceivable = financials.accountsReceivable || 0;

  // Calculate ratios as percentages
  const debtToMarketCapRatio = (totalDebt / marketCap) * 100;
  const interestIncomeRatio = (interestIncome / totalRevenue) * 100;
  const receivablesRatio = (accountsReceivable / marketCap) * 100;
  const cashAndInterestBearingRatio = ((cash + shortTermInvestments) / marketCap) * 100;

  return {
    debtToEquityRatio: debtToMarketCapRatio,
    debtToEquityPassed: debtToMarketCapRatio <= DEBT_TO_MARKET_CAP_THRESHOLD,
    interestIncomeRatio: interestIncomeRatio,
    interestIncomePassed: interestIncomeRatio <= INTEREST_INCOME_THRESHOLD,
    receivablesRatio: receivablesRatio,
    receivablesPassed: receivablesRatio <= RECEIVABLES_TO_MARKET_CAP_THRESHOLD,
    cashAndInterestBearingRatio: cashAndInterestBearingRatio,
    cashAndInterestBearingPassed: cashAndInterestBearingRatio <= CASH_AND_INTEREST_TO_MARKET_CAP_THRESHOLD,
  };
}

function calculatePurificationRatio(financials: FinancialData): number {
  // Calculate the percentage of income that should be purified (donated)
  // This is based on the interest income as a percentage of total revenue
  const interestIncome = financials.interestIncome || 0;
  const totalRevenue = financials.totalRevenue || 1;

  // The purification ratio is the percentage of dividends that should be donated
  // to offset the non-compliant income
  return (interestIncome / totalRevenue) * 100;
}

// Helper function to calculate purification amount for a dividend
export function calculatePurificationAmount(
  dividendAmount: number,
  purificationRatio: number
): number {
  return dividendAmount * (purificationRatio / 100);
}

// Check if a stock is likely Shariah compliant based on sector/industry
// NOTE: This is a preliminary check only. Full screening requires financial data.
// Returns: true = likely compliant, false = likely non-compliant or unknown
export function quickShariahCheck(sector?: string, industry?: string): boolean {
  const s = (sector || "").toLowerCase();
  const i = (industry || "").toLowerCase();

  // If no sector/industry info, mark as unknown (false)
  // This prevents false positives in the scanner
  if (!s && !i) {
    return false; // Changed from true to false - conservative approach
  }

  // Financial services are generally not compliant (unless Islamic)
  if (s.includes("financial") || i.includes("bank") || i.includes("insurance")) {
    // Exception for Islamic finance
    if (s.includes("islamic") || i.includes("islamic")) {
      return true;
    }
    return false;
  }

  // Check for haram industries
  for (const haram of HARAM_INDUSTRIES) {
    if (i.includes(haram) || s.includes(haram)) {
      return false;
    }
  }

  // If it's not in the prohibited list, consider it potentially compliant
  // Note: This is still preliminary - full financial screening needed for certainty
  return true;
}

// Get compliance status label
export function getComplianceLabel(status: ShariahDetails["overallStatus"]): string {
  switch (status) {
    case "compliant":
      return "Shariah Compliant";
    case "non-compliant":
      return "Not Shariah Compliant";
    case "doubtful":
      return "Requires Review";
    default:
      return "Unknown Status";
  }
}

// Get compliance color
export function getComplianceColor(status: ShariahDetails["overallStatus"]): string {
  switch (status) {
    case "compliant":
      return "text-emerald-500";
    case "non-compliant":
      return "text-red-500";
    case "doubtful":
      return "text-amber-500";
    default:
      return "text-gray-500";
  }
}
