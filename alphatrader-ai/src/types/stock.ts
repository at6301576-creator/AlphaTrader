export interface Stock {
  id: string;
  symbol: string;
  name: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  currency: string;

  // Price data
  currentPrice: number | null;
  previousClose: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  avgVolume: number | null;
  priceChange?: number;
  priceChangePercent?: number;

  // Fundamentals
  marketCap: number | null;
  peRatio: number | null;
  forwardPE: number | null;
  pbRatio: number | null;
  psRatio: number | null;
  pegRatio: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;
  beta: number | null;
  week52High: number | null;
  week52Low: number | null;
  eps: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  roe: number | null;
  roa: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  freeCashFlow: number | null;

  // Shariah compliance
  isShariahCompliant: boolean | null;
  shariahDetails: ShariahDetails | null;

  // Technical data
  technicalData: TechnicalIndicators | null;

  // Full fundamental data
  fundamentalData: FundamentalData | null;

  // Chart data
  chartData: ChartDataPoint[] | null;

  lastUpdated: Date;
}

export interface ShariahDetails {
  overallStatus: "compliant" | "non-compliant" | "doubtful" | "unknown";
  businessScreening: {
    passed: boolean;
    halalPercentage: number;
    concerns: string[];
  };
  financialScreening: {
    debtToEquityRatio: number;
    debtToEquityPassed: boolean;
    interestIncomeRatio: number;
    interestIncomePassed: boolean;
    receivablesRatio: number;
    receivablesPassed: boolean;
    cashAndInterestBearingRatio: number;
    cashAndInterestBearingPassed: boolean;
  };
  purificationRatio: number;
  lastUpdated: string;
}

export interface TechnicalIndicators {
  // Moving Averages
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;

  // Momentum
  rsi: number | null;
  rsi14: number | null;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  } | null;
  stochastic: {
    k: number;
    d: number;
  } | null;
  williamsR: number | null;

  // Volatility
  atr: number | null;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    width: number;
  } | null;
  keltnerChannels: {
    upper: number;
    middle: number;
    lower: number;
  } | null;

  // Volume
  obv: number | null;
  vwap: number | null;
  volumeProfile: VolumeLevel[] | null;

  // Trend
  adx: number | null;
  parabolicSar: number | null;
  ichimoku: {
    tenkan: number;
    kijun: number;
    senkouA: number;
    senkouB: number;
    chikou: number;
  } | null;

  // Support/Resistance
  supportLevels: number[];
  resistanceLevels: number[];

  // Signals
  overallSignal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  trendSignal: "bullish" | "bearish" | "neutral";
}

export interface VolumeLevel {
  price: number;
  volume: number;
  percentage: number;
}

export interface FundamentalData {
  incomeStatement: FinancialStatement[];
  balanceSheet: BalanceSheetStatement[];
  cashFlow: CashFlowStatement[];
  keyMetrics: KeyMetrics;
}

export interface FinancialStatement {
  period: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
}

export interface BalanceSheetStatement {
  period: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cash: number;
  debt: number;
}

export interface CashFlowStatement {
  period: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  freeCashFlow: number;
}

export interface KeyMetrics {
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  forwardPE: number;
  pegRatio: number;
  priceToBook: number;
  priceToSales: number;
  evToEbitda: number;
  evToRevenue: number;
  returnOnEquity: number;
  returnOnAssets: number;
  returnOnCapital: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
}

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  symbol: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  imageUrl: string | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  sentimentScore: number | null;
  publishedAt: Date;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  exchange: string;
}
