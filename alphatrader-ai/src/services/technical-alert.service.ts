import { BaseService } from "./base.service";
import { ApiError, ErrorCode } from "@/lib/api-response";
import type {
  CreateTechnicalAlertRequest,
  UpdateTechnicalAlertRequest,
  TechnicalAlertResponse,
  IndicatorParameters,
  RSIParameters,
  MACDParameters,
  StochasticParameters,
  MACrossoverParameters,
  BollingerBandsParameters,
  IndicatorType,
  AlertCondition,
} from "@/types/technical-alert";

export interface TechnicalAlertFilters {
  symbol?: string;
  indicatorType?: string;
  isActive?: boolean;
}

export class TechnicalAlertService extends BaseService {
  /**
   * Get all technical alerts for a user with optional filters
   */
  async getAlerts(
    userId: string,
    filters?: TechnicalAlertFilters
  ): Promise<TechnicalAlertResponse[]> {
    const where: any = { userId };

    if (filters?.symbol) {
      where.symbol = filters.symbol.toUpperCase();
    }
    if (filters?.indicatorType) {
      where.indicatorType = filters.indicatorType;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const alerts = await this.handleDatabaseOperation(
      () =>
        this.prisma.technicalAlert.findMany({
          where,
          orderBy: { createdAt: "desc" },
        }),
      "Failed to fetch technical alerts"
    );

    return alerts.map((alert) => this.mapAlertToResponse(alert));
  }

  /**
   * Get a single alert by ID
   */
  async getAlert(
    userId: string,
    alertId: string
  ): Promise<TechnicalAlertResponse> {
    const alert = await this.handleDatabaseOperation(
      () =>
        this.prisma.technicalAlert.findUnique({
          where: { id: alertId },
        }),
      "Failed to fetch technical alert"
    );

    this.assertExists(alert, "Technical alert not found");
    this.assertOwnership(alert.userId, userId);

    return this.mapAlertToResponse(alert);
  }

  /**
   * Create a new technical alert with parameter validation
   */
  async createAlert(
    userId: string,
    data: CreateTechnicalAlertRequest
  ): Promise<TechnicalAlertResponse> {
    // Validate required fields
    this.validateRequired(data.symbol, "symbol");
    this.validateRequired(data.indicatorType, "indicatorType");
    this.validateRequired(data.condition, "condition");
    this.validateRequired(data.parameters, "parameters");

    // Validate indicator-specific parameters
    this.validateIndicatorParameters(data.indicatorType, data.parameters);

    // Validate condition matches indicator type
    this.validateConditionForIndicator(data.indicatorType, data.condition);

    // Validate threshold if provided
    if (data.threshold !== undefined) {
      this.validateRange(data.threshold, 0, 100, "threshold");
    }

    // Validate cooldown minutes
    if (data.cooldownMinutes !== undefined) {
      this.validatePositive(data.cooldownMinutes, "cooldownMinutes");
    }

    const alert = await this.handleDatabaseOperation(
      () =>
        this.prisma.technicalAlert.create({
          data: {
            userId,
            symbol: data.symbol.toUpperCase(),
            companyName: data.companyName,
            indicatorType: data.indicatorType,
            condition: data.condition,
            parameters: this.prepareJsonField(data.parameters),
            threshold: data.threshold,
            message: data.message,
            notifyEmail: data.notifyEmail ?? false,
            notifyPush: data.notifyPush ?? true,
            notifyInApp: data.notifyInApp ?? true,
            repeatAlert: data.repeatAlert ?? false,
            cooldownMinutes: data.cooldownMinutes ?? 60,
          },
        }),
      "Failed to create technical alert"
    );

    return this.mapAlertToResponse(alert);
  }

  /**
   * Update an existing technical alert
   */
  async updateAlert(
    userId: string,
    alertId: string,
    updates: UpdateTechnicalAlertRequest
  ): Promise<TechnicalAlertResponse> {
    // Verify ownership
    const alert = await this.handleDatabaseOperation(
      () =>
        this.prisma.technicalAlert.findUnique({
          where: { id: alertId },
        }),
      "Failed to fetch technical alert"
    );

    this.assertExists(alert, "Technical alert not found");
    this.assertOwnership(alert.userId, userId);

    // Validate cooldown minutes if provided
    if (updates.cooldownMinutes !== undefined) {
      this.validatePositive(updates.cooldownMinutes, "cooldownMinutes");
    }

    const updatedAlert = await this.handleDatabaseOperation(
      () =>
        this.prisma.technicalAlert.update({
          where: { id: alertId },
          data: {
            ...(updates.isActive !== undefined && { isActive: updates.isActive }),
            ...(updates.message !== undefined && { message: updates.message }),
            ...(updates.notifyEmail !== undefined && {
              notifyEmail: updates.notifyEmail,
            }),
            ...(updates.notifyPush !== undefined && {
              notifyPush: updates.notifyPush,
            }),
            ...(updates.notifyInApp !== undefined && {
              notifyInApp: updates.notifyInApp,
            }),
            ...(updates.repeatAlert !== undefined && {
              repeatAlert: updates.repeatAlert,
            }),
            ...(updates.cooldownMinutes !== undefined && {
              cooldownMinutes: updates.cooldownMinutes,
            }),
          },
        }),
      "Failed to update technical alert"
    );

    return this.mapAlertToResponse(updatedAlert);
  }

  /**
   * Delete a technical alert
   */
  async deleteAlert(userId: string, alertId: string): Promise<void> {
    // Verify ownership
    const alert = await this.handleDatabaseOperation(
      () =>
        this.prisma.technicalAlert.findUnique({
          where: { id: alertId },
        }),
      "Failed to fetch technical alert"
    );

    this.assertExists(alert, "Technical alert not found");
    this.assertOwnership(alert.userId, userId);

    await this.handleDatabaseOperation(
      () =>
        this.prisma.technicalAlert.delete({
          where: { id: alertId },
        }),
      "Failed to delete technical alert"
    );
  }

  /**
   * Validate indicator-specific parameters
   */
  private validateIndicatorParameters(
    indicatorType: IndicatorType,
    parameters: IndicatorParameters
  ): void {
    switch (indicatorType) {
      case "rsi":
        this.validateRSIParameters(parameters as RSIParameters);
        break;
      case "macd":
        this.validateMACDParameters(parameters as MACDParameters);
        break;
      case "stochastic":
        this.validateStochasticParameters(parameters as StochasticParameters);
        break;
      case "ma_crossover":
        this.validateMACrossoverParameters(
          parameters as MACrossoverParameters
        );
        break;
      case "bollinger_bands":
        this.validateBollingerBandsParameters(
          parameters as BollingerBandsParameters
        );
        break;
      default:
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid indicator type: ${indicatorType}`,
          422
        );
    }
  }

  /**
   * Validate RSI parameters
   */
  private validateRSIParameters(params: RSIParameters): void {
    this.validateRequired(params.period, "RSI period");
    this.validateRange(params.period, 2, 100, "RSI period");

    if (params.overboughtLevel !== undefined) {
      this.validateRange(
        params.overboughtLevel,
        50,
        100,
        "RSI overbought level"
      );
    }

    if (params.oversoldLevel !== undefined) {
      this.validateRange(params.oversoldLevel, 0, 50, "RSI oversold level");
    }

    // Ensure overbought > oversold
    if (
      params.overboughtLevel !== undefined &&
      params.oversoldLevel !== undefined
    ) {
      if (params.overboughtLevel <= params.oversoldLevel) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "RSI overbought level must be greater than oversold level",
          422
        );
      }
    }
  }

  /**
   * Validate MACD parameters
   */
  private validateMACDParameters(params: MACDParameters): void {
    if (params.fastPeriod !== undefined) {
      this.validateRange(params.fastPeriod, 2, 50, "MACD fast period");
    }

    if (params.slowPeriod !== undefined) {
      this.validateRange(params.slowPeriod, 2, 100, "MACD slow period");
    }

    if (params.signalPeriod !== undefined) {
      this.validateRange(params.signalPeriod, 2, 50, "MACD signal period");
    }

    // Ensure fastPeriod < slowPeriod
    if (params.fastPeriod !== undefined && params.slowPeriod !== undefined) {
      if (params.fastPeriod >= params.slowPeriod) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "MACD fast period must be less than slow period",
          422
        );
      }
    }
  }

  /**
   * Validate Stochastic parameters
   */
  private validateStochasticParameters(params: StochasticParameters): void {
    if (params.kPeriod !== undefined) {
      this.validateRange(params.kPeriod, 2, 50, "Stochastic K period");
    }

    if (params.dPeriod !== undefined) {
      this.validateRange(params.dPeriod, 2, 20, "Stochastic D period");
    }

    if (params.overboughtLevel !== undefined) {
      this.validateRange(
        params.overboughtLevel,
        50,
        100,
        "Stochastic overbought level"
      );
    }

    if (params.oversoldLevel !== undefined) {
      this.validateRange(
        params.oversoldLevel,
        0,
        50,
        "Stochastic oversold level"
      );
    }
  }

  /**
   * Validate MA Crossover parameters
   */
  private validateMACrossoverParameters(params: MACrossoverParameters): void {
    this.validateRequired(params.fastPeriod, "MA fast period");
    this.validateRequired(params.slowPeriod, "MA slow period");
    this.validateRequired(params.type, "MA type");

    this.validateRange(params.fastPeriod, 2, 200, "MA fast period");
    this.validateRange(params.slowPeriod, 2, 500, "MA slow period");

    if (params.fastPeriod >= params.slowPeriod) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "MA fast period must be less than slow period",
        422
      );
    }

    if (!["sma", "ema"].includes(params.type)) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'MA type must be either "sma" or "ema"',
        422
      );
    }
  }

  /**
   * Validate Bollinger Bands parameters
   */
  private validateBollingerBandsParameters(
    params: BollingerBandsParameters
  ): void {
    this.validateRequired(params.condition, "Bollinger Bands condition");

    if (params.period !== undefined) {
      this.validateRange(params.period, 2, 100, "Bollinger Bands period");
    }

    if (params.stdDev !== undefined) {
      this.validateRange(
        params.stdDev,
        0.5,
        5,
        "Bollinger Bands standard deviation"
      );
    }

    if (
      !["price_above_upper", "price_below_lower"].includes(params.condition)
    ) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Bollinger Bands condition must be "price_above_upper" or "price_below_lower"',
        422
      );
    }
  }

  /**
   * Validate that the condition is appropriate for the indicator type
   */
  private validateConditionForIndicator(
    indicatorType: IndicatorType,
    condition: AlertCondition
  ): void {
    const validConditions: Record<IndicatorType, AlertCondition[]> = {
      rsi: ["overbought", "oversold", "crosses_above", "crosses_below"],
      macd: ["bullish_crossover", "bearish_crossover", "crosses_above", "crosses_below"],
      stochastic: ["overbought", "oversold", "bullish_crossover", "bearish_crossover"],
      ma_crossover: ["bullish_crossover", "bearish_crossover"],
      bollinger_bands: ["price_above_upper", "price_below_lower"],
    };

    const allowedConditions = validConditions[indicatorType];
    if (!allowedConditions.includes(condition)) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        `Condition "${condition}" is not valid for indicator "${indicatorType}". Valid conditions: ${allowedConditions.join(", ")}`,
        422
      );
    }
  }

  /**
   * Map database alert to response format
   */
  private mapAlertToResponse(alert: any): TechnicalAlertResponse {
    return {
      id: alert.id,
      userId: alert.userId,
      symbol: alert.symbol,
      companyName: alert.companyName || undefined,
      indicatorType: alert.indicatorType as IndicatorType,
      condition: alert.condition as AlertCondition,
      parameters: this.parseJsonFieldTypeSafe<IndicatorParameters>(
        alert.parameters,
        {} as IndicatorParameters,
        "parameters"
      ),
      threshold: alert.threshold || undefined,
      lastValue: alert.lastValue || undefined,
      message: alert.message || undefined,
      notifyEmail: alert.notifyEmail,
      notifyPush: alert.notifyPush,
      notifyInApp: alert.notifyInApp,
      isActive: alert.isActive,
      triggeredAt: alert.triggeredAt?.toISOString(),
      lastChecked: alert.lastChecked?.toISOString(),
      triggerCount: alert.triggerCount,
      repeatAlert: alert.repeatAlert,
      cooldownMinutes: alert.cooldownMinutes,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    };
  }
}

// Export singleton instance
export const technicalAlertService = new TechnicalAlertService();
