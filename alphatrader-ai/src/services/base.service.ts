import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ApiError, ErrorCode } from "@/lib/api-response";

/**
 * Base service class with common database and error handling utilities
 */
export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Wraps database operations with error handling
   */
  protected async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string = "Database operation failed"
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`[Database Error] ${errorMessage}:`, error);
      throw new ApiError(
        ErrorCode.DATABASE_ERROR,
        errorMessage,
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Wraps external API calls with error handling
   */
  protected async handleExternalApiCall<T>(
    operation: () => Promise<T>,
    errorMessage: string = "External API call failed"
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`[External API Error] ${errorMessage}:`, error);
      throw new ApiError(
        ErrorCode.EXTERNAL_API_ERROR,
        errorMessage,
        502,
        { originalError: error.message }
      );
    }
  }

  /**
   * Validates that a record exists
   */
  protected assertExists<T>(
    record: T | null | undefined,
    errorMessage: string = "Record not found"
  ): asserts record is T {
    if (!record) {
      throw new ApiError(ErrorCode.NOT_FOUND, errorMessage, 404);
    }
  }

  /**
   * Validates user ownership of a record
   */
  protected assertOwnership(
    recordUserId: string,
    currentUserId: string,
    errorMessage: string = "You do not have permission to access this resource"
  ): void {
    if (recordUserId !== currentUserId) {
      throw new ApiError(ErrorCode.FORBIDDEN, errorMessage, 403);
    }
  }

  /**
   * Parses JSON field with type safety (handles both Prisma Json type and string)
   */
  protected parseJsonField<T>(
    jsonData: any,
    defaultValue: T,
    fieldName: string = "field"
  ): T {
    if (!jsonData) return defaultValue;

    // If it's already an object (Prisma Json type), return it
    if (typeof jsonData === "object") {
      return jsonData as T;
    }

    // Otherwise parse the string (backwards compatibility)
    try {
      return JSON.parse(jsonData as string) as T;
    } catch (error) {
      console.error(`[JSON Parse Error] Failed to parse ${fieldName}:`, error);
      return defaultValue;
    }
  }

  /**
   * Prepares data for JSON field storage (Prisma Json type accepts objects directly)
   */
  protected prepareJsonField(data: any): any {
    // Prisma's Json type accepts objects directly, no need to stringify
    return data;
  }

  /**
   * Validates required fields
   */
  protected validateRequired<T>(
    value: T | null | undefined,
    fieldName: string
  ): asserts value is T {
    if (value === null || value === undefined) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} is required`,
        422
      );
    }
  }

  /**
   * Validates numeric range
   */
  protected validateRange(
    value: number,
    min: number,
    max: number,
    fieldName: string
  ): void {
    if (value < min || value > max) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be between ${min} and ${max}`,
        422
      );
    }
  }

  /**
   * Validates positive number
   */
  protected validatePositive(value: number, fieldName: string): void {
    if (value <= 0) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be positive`,
        422
      );
    }
  }
}
