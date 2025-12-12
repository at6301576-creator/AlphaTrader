export interface PortfolioPosition {
  id: string;
  userId: string;
  symbol: string;
  companyName: string | null;
  shares: number;
  avgCost: number;
  currency: string;
  purchaseDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Computed fields (added on client)
  currentPrice?: number;
  marketValue?: number;
  totalCost?: number;
  unrealizedGain?: number;
  unrealizedGainPercent?: number;
  dayChange?: number;
  dayChangePercent?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positionsCount: number;
  topGainer: PortfolioPosition | null;
  topLoser: PortfolioPosition | null;
}

export interface PortfolioAllocation {
  symbol: string;
  companyName: string;
  value: number;
  percentage: number;
  sector: string;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  positionsCount: number;
}

export interface PortfolioPerformance {
  date: string;
  value: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface AddPositionInput {
  symbol: string;
  companyName?: string;
  shares: number;
  avgCost: number;
  currency?: string;
  purchaseDate?: Date;
  notes?: string;
}

export interface UpdatePositionInput {
  id: string;
  shares?: number;
  avgCost?: number;
  notes?: string;
}
