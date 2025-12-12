"use client";

import { CheckCircle, XCircle, AlertTriangle, Info, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ShariahDetails } from "@/types/stock";

interface ShariahPanelProps {
  details: ShariahDetails | null;
}

export function ShariahPanel({ details }: ShariahPanelProps) {
  if (!details) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="py-12 text-center">
          <Info className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">Shariah Screening Unavailable</h3>
          <p className="text-gray-400 mt-2">
            Insufficient financial data to perform Shariah compliance screening for this stock.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "non-compliant":
        return <XCircle className="h-8 w-8 text-red-500" />;
      case "doubtful":
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      default:
        return <Info className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "text-green-500";
      case "non-compliant":
        return "text-red-500";
      case "doubtful":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-900/20 border-green-800";
      case "non-compliant":
        return "bg-red-900/20 border-red-800";
      case "doubtful":
        return "bg-yellow-900/20 border-yellow-800";
      default:
        return "bg-gray-900 border-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card className={`${getStatusBg(details.overallStatus)}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {getStatusIcon(details.overallStatus)}
            <div>
              <h2 className={`text-2xl font-bold ${getStatusColor(details.overallStatus)}`}>
                {details.overallStatus.replace("-", " ").toUpperCase()}
              </h2>
              <p className="text-gray-400 mt-1">Based on AAOIFI Shariah Standards</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Business Screening */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Business Activity Screening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <span className={`flex items-center gap-1 ${details.businessScreening.passed ? "text-green-500" : "text-red-500"}`}>
                {details.businessScreening.passed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {details.businessScreening.passed ? "Passed" : "Failed"}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Halal Revenue</span>
                <span className="text-white font-medium">{details.businessScreening.halalPercentage.toFixed(0)}%</span>
              </div>
              <Progress
                value={details.businessScreening.halalPercentage}
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 95% required</p>
            </div>

            {details.businessScreening.concerns.length > 0 && (
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Concerns:</p>
                <ul className="space-y-1">
                  {details.businessScreening.concerns.map((concern, index) => (
                    <li key={index} className="text-sm text-red-400 flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Screening */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Financial Ratio Screening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Debt to Equity */}
            <FinancialRatioRow
              label="Debt / Market Cap"
              value={details.financialScreening.debtToEquityRatio}
              threshold={33}
              passed={details.financialScreening.debtToEquityPassed}
              unit="%"
            />

            {/* Interest Income */}
            <FinancialRatioRow
              label="Interest Income / Revenue"
              value={details.financialScreening.interestIncomeRatio}
              threshold={5}
              passed={details.financialScreening.interestIncomePassed}
              unit="%"
            />

            {/* Receivables */}
            <FinancialRatioRow
              label="Receivables / Market Cap"
              value={details.financialScreening.receivablesRatio}
              threshold={45}
              passed={details.financialScreening.receivablesPassed}
              unit="%"
            />

            {/* Cash & Interest-Bearing */}
            <FinancialRatioRow
              label="Cash & Interest / Market Cap"
              value={details.financialScreening.cashAndInterestBearingRatio}
              threshold={33}
              passed={details.financialScreening.cashAndInterestBearingPassed}
              unit="%"
            />
          </CardContent>
        </Card>
      </div>

      {/* Purification */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Dividend Purification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Purification Ratio</p>
              <p className="text-2xl font-bold text-white">{details.purificationRatio.toFixed(2)}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Per $100 dividend received,</p>
              <p className="text-sm text-white">donate ${(details.purificationRatio).toFixed(2)} to charity</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            This ratio represents the portion of dividends derived from non-permissible income that should be purified through charitable donation.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-blue-900/20 border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Disclaimer</p>
              <p className="text-blue-400">
                This Shariah screening is based on publicly available financial data and AAOIFI standards.
                For investment decisions, please consult with a qualified Shariah scholar or your financial advisor.
                Screening results may vary based on data availability and interpretation.
              </p>
              <p className="text-xs text-blue-500 mt-2">Last updated: {details.lastUpdated}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FinancialRatioRowProps {
  label: string;
  value: number;
  threshold: number;
  passed: boolean;
  unit: string;
}

function FinancialRatioRow({ label, value, threshold, passed, unit }: FinancialRatioRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`flex items-center gap-1 ${passed ? "text-green-500" : "text-red-500"}`}>
          {passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="relative">
        <Progress
          value={Math.min(value, 100)}
          className="h-1.5"
        />
        <div
          className="absolute top-0 h-1.5 w-0.5 bg-yellow-500"
          style={{ left: `${threshold}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">Threshold: {threshold}{unit}</p>
    </div>
  );
}
