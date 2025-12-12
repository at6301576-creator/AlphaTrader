/**
 * Sector Mapping Utility
 * Maps Finnhub industry names to standardized sector categories
 * Ensures consistent sector filtering across the application
 */

import { SECTORS } from "@/types/scanner";

/**
 * Map Finnhub industry to our standardized sector
 */
export function mapIndustryToSector(industry: string | null | undefined): string | null {
  if (!industry) return null;

  const industryLower = industry.toLowerCase();

  // Technology
  if (
    industryLower.includes("software") ||
    industryLower.includes("computer") ||
    industryLower.includes("technology") ||
    industryLower.includes("semiconductor") ||
    industryLower.includes("electronics") ||
    industryLower.includes("internet") ||
    industryLower.includes("information") ||
    industryLower.includes("it services") ||
    industryLower.includes("cloud") ||
    industryLower.includes("data") ||
    industryLower.includes("cybersecurity") ||
    industryLower.includes("telecom equipment")
  ) {
    return "Technology";
  }

  // Healthcare
  if (
    industryLower.includes("health") ||
    industryLower.includes("pharma") ||
    industryLower.includes("biotech") ||
    industryLower.includes("medical") ||
    industryLower.includes("hospital") ||
    industryLower.includes("drug") ||
    industryLower.includes("diagnostic") ||
    industryLower.includes("device")
  ) {
    return "Healthcare";
  }

  // Financial Services
  if (
    industryLower.includes("bank") ||
    industryLower.includes("financial") ||
    industryLower.includes("insurance") ||
    industryLower.includes("investment") ||
    industryLower.includes("capital markets") ||
    industryLower.includes("asset management") ||
    industryLower.includes("credit") ||
    industryLower.includes("mortgage")
  ) {
    return "Financial Services";
  }

  // Consumer Cyclical
  if (
    industryLower.includes("retail") ||
    industryLower.includes("auto") ||
    industryLower.includes("apparel") ||
    industryLower.includes("leisure") ||
    industryLower.includes("restaurant") ||
    industryLower.includes("hotel") ||
    industryLower.includes("travel") ||
    industryLower.includes("luxury") ||
    industryLower.includes("gaming") ||
    industryLower.includes("entertainment") ||
    industryLower.includes("media") ||
    industryLower.includes("publishing") ||
    industryLower.includes("residential construction") ||
    industryLower.includes("furnishing") ||
    industryLower.includes("packaging") ||
    industryLower.includes("textile")
  ) {
    return "Consumer Cyclical";
  }

  // Consumer Defensive
  if (
    industryLower.includes("food") ||
    industryLower.includes("beverage") ||
    industryLower.includes("tobacco") ||
    industryLower.includes("household") ||
    industryLower.includes("personal products") ||
    industryLower.includes("discount stores") ||
    industryLower.includes("grocery") ||
    industryLower.includes("farm products") ||
    industryLower.includes("packaged foods") ||
    industryLower.includes("confectioners")
  ) {
    return "Consumer Defensive";
  }

  // Industrials
  if (
    industryLower.includes("industrial") ||
    industryLower.includes("aerospace") ||
    industryLower.includes("defense") ||
    industryLower.includes("construction") ||
    industryLower.includes("machinery") ||
    industryLower.includes("transport") ||
    industryLower.includes("airline") ||
    industryLower.includes("railroad") ||
    industryLower.includes("trucking") ||
    industryLower.includes("logistics") ||
    industryLower.includes("engineering") ||
    industryLower.includes("infrastructure") ||
    industryLower.includes("waste management") ||
    industryLower.includes("rental") ||
    industryLower.includes("consulting") ||
    industryLower.includes("staffing") ||
    industryLower.includes("security") ||
    industryLower.includes("specialty business services")
  ) {
    return "Industrials";
  }

  // Energy
  if (
    industryLower.includes("energy") ||
    industryLower.includes("oil") ||
    industryLower.includes("gas") ||
    industryLower.includes("petroleum") ||
    industryLower.includes("coal") ||
    industryLower.includes("renewable") ||
    industryLower.includes("solar") ||
    industryLower.includes("wind") ||
    industryLower.includes("utilities - renewable")
  ) {
    return "Energy";
  }

  // Utilities
  if (
    industryLower.includes("utilities") ||
    industryLower.includes("electric") ||
    industryLower.includes("water") ||
    industryLower.includes("regulated") ||
    industryLower.includes("independent power")
  ) {
    return "Utilities";
  }

  // Real Estate
  if (
    industryLower.includes("real estate") ||
    industryLower.includes("reit") ||
    industryLower.includes("property")
  ) {
    return "Real Estate";
  }

  // Basic Materials
  if (
    industryLower.includes("materials") ||
    industryLower.includes("chemical") ||
    industryLower.includes("metal") ||
    industryLower.includes("mining") ||
    industryLower.includes("steel") ||
    industryLower.includes("aluminum") ||
    industryLower.includes("copper") ||
    industryLower.includes("gold") ||
    industryLower.includes("silver") ||
    industryLower.includes("lumber") ||
    industryLower.includes("paper") ||
    industryLower.includes("building materials") ||
    industryLower.includes("coking coal")
  ) {
    return "Basic Materials";
  }

  // Communication Services
  if (
    industryLower.includes("communication") ||
    industryLower.includes("telecom") ||
    industryLower.includes("broadcasting") ||
    industryLower.includes("advertising")
  ) {
    return "Communication Services";
  }

  // Cryptocurrency Mining
  if (
    industryLower.includes("crypto") ||
    industryLower.includes("bitcoin") ||
    industryLower.includes("blockchain") ||
    industryLower.includes("digital currency")
  ) {
    return "Cryptocurrency Mining";
  }

  // If no match found, return null
  return null;
}

/**
 * Get industries that belong to a specific sector
 * Used for sector-based stock filtering
 */
export function getIndustriesForSector(sector: string): string[] {
  const sectorLower = sector.toLowerCase();

  switch (sectorLower) {
    case "technology":
      return [
        "software",
        "computer",
        "technology",
        "semiconductor",
        "electronics",
        "internet",
        "information",
        "it services",
        "cloud",
        "data",
        "cybersecurity",
        "telecom equipment",
      ];

    case "healthcare":
      return [
        "health",
        "pharma",
        "biotech",
        "medical",
        "hospital",
        "drug",
        "diagnostic",
        "device",
      ];

    case "financial services":
      return [
        "bank",
        "financial",
        "insurance",
        "investment",
        "capital markets",
        "asset management",
        "credit",
        "mortgage",
      ];

    case "consumer cyclical":
      return [
        "retail",
        "auto",
        "apparel",
        "leisure",
        "restaurant",
        "hotel",
        "travel",
        "luxury",
        "gaming",
        "entertainment",
        "media",
        "publishing",
        "residential construction",
        "furnishing",
        "packaging",
        "textile",
      ];

    case "consumer defensive":
      return [
        "food",
        "beverage",
        "tobacco",
        "household",
        "personal products",
        "discount stores",
        "grocery",
        "farm products",
        "packaged foods",
        "confectioners",
      ];

    case "industrials":
      return [
        "industrial",
        "aerospace",
        "defense",
        "construction",
        "machinery",
        "transport",
        "airline",
        "railroad",
        "trucking",
        "logistics",
        "engineering",
        "infrastructure",
        "waste management",
        "rental",
        "consulting",
        "staffing",
        "security",
        "specialty business services",
      ];

    case "energy":
      return [
        "energy",
        "oil",
        "gas",
        "petroleum",
        "coal",
        "renewable",
        "solar",
        "wind",
        "utilities - renewable",
      ];

    case "utilities":
      return [
        "utilities",
        "electric",
        "water",
        "regulated",
        "independent power",
      ];

    case "real estate":
      return ["real estate", "reit", "property"];

    case "basic materials":
      return [
        "materials",
        "chemical",
        "metal",
        "mining",
        "steel",
        "aluminum",
        "copper",
        "gold",
        "silver",
        "lumber",
        "paper",
        "building materials",
        "coking coal",
      ];

    case "communication services":
      return [
        "communication",
        "telecom",
        "broadcasting",
        "advertising",
      ];

    case "cryptocurrency mining":
      return ["crypto", "bitcoin", "blockchain", "digital currency"];

    default:
      return [];
  }
}

/**
 * Check if an industry belongs to a sector
 */
export function industryMatchesSector(
  industry: string | null | undefined,
  sector: string
): boolean {
  if (!industry) return false;

  const industries = getIndustriesForSector(sector);
  const industryLower = industry.toLowerCase();

  return industries.some((ind) => industryLower.includes(ind));
}
