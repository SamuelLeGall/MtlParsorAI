// ===== DOMAIN-SPECIFIC ERROR CATEGORIES =====
export type TLayer =
  | "Service"
  | "Mapper"
  | "Entity"
  | "Repository"
  | "LocalDatabase"
  | "Collection"
  | "Document"
  | "ErrorSystem";

export enum ErrorCategory {
  DOMAIN = "DOMAIN", // Business rule violations
  INFRASTRUCTURE = "INFRASTRUCTURE", // Database, network, external services
  VALIDATION = "VALIDATION", // Input validation failures
  SYSTEM = "SYSTEM", // Unexpected system errors
}

export enum AppErrorCodes {
  // Infrastructure
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  STORAGE_UNAVAILABLE = "STORAGE_UNAVAILABLE",

  // Domain/Business
  ACTION_NOT_ALLOWED = "ACTION_NOT_ALLOWED",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Validation
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_DATA = "MISSING_REQUIRED_DATA",

  // System
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

// ===== ERROR SEVERITY LEVELS =====
export enum ErrorSeverity {
  LOW = "LOW", // Expected errors (user input, not found)
  MEDIUM = "MEDIUM", // Recoverable infrastructure issues
  HIGH = "HIGH", // System errors, data corruption
  CRITICAL = "CRITICAL", // Security, data loss potential
}

export interface ErrorContext {
  layer: TLayer;
  method: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  correlationId?: string; // For request tracing
}

// ==========================================
// SUPPORTING TYPES
// ==========================================

interface ErrorHistoryEntry {
  depth: number;
  message: string;
  code: AppErrorCodes;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  userMessage?: string;
  isRecoverable: boolean;
  timestamp: Date;
}

// ===== ERROR FACTORY PATTERN =====
// This centralizes error creation and ensures consistency
export class ErrorFactory {
  static createContext(
    layer: TLayer,
    method: string,
    metadata?: Record<string, unknown>,
  ): ErrorContext {
    return {
      layer,
      method,
      timestamp: new Date(),
      metadata,
    };
  }

  // Domain errors
  /*
      static questDifficultyNotAvailable(
          questId: string,
          difficulty: QuestDifficulty,
      ): AppError {
          return new AppError(
              `No configuration found for difficulty ${difficulty} in quest ${questId}`,
              AppErrorCodes.MISSING_REQUIRED_DATA,
              ErrorCategory.DOMAIN,
              ErrorSeverity.LOW,
              ErrorFactory.createContext("Entity", "getQuestConfiguration", {
                  questId: questId,
                  difficulty: difficulty,
              }),
              {
                  userMessage: "The selected difficulty is not available for this quest.",
                  isRecoverable: true,
              },
          );
      }
      */

  static resourceNotFound(
    context: ErrorContext,
    resourceType: string,
    resourceId: string,
    message?: string,
  ): AppError {
    return new AppError(
      message ?? `${resourceType} with id ${resourceId} not found`,
      AppErrorCodes.RESOURCE_NOT_FOUND,
      ErrorCategory.INFRASTRUCTURE,
      ErrorSeverity.LOW,
      context,
      {
        userMessage: `The requested ${resourceType} could not be found.`,
        isRecoverable: false,
      },
    );
  }

  // System errors (for unexpected exceptions)
  static unexpectedError(
    context: ErrorContext,
    originalError: unknown,
    cause?: AppError,
  ): AppError {
    const errorMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);
    return new AppError(
      `Unexpected error: ${errorMessage}`,
      AppErrorCodes.UNEXPECTED_ERROR,
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      context,
      {
        cause,
        isRecoverable: false,
        userMessage: "An unexpected error occurred.",
      },
    );
  }

  // Chain an existing error to a new context
  static chainError(
    originalError: AppError,
    context: ErrorContext,
    overwriteMessages?: { message?: string; userMessage?: string },
  ): AppError {
    return new AppError(
      overwriteMessages?.message ??
        `Error propagated because of ${originalError.context.layer}.${originalError.context.method}`,
      originalError.code,
      originalError.category,
      originalError.severity,
      context,
      {
        cause: originalError,
        isRecoverable: originalError.isRecoverable,
        userMessage:
          overwriteMessages?.userMessage ?? originalError.userMessage,
      },
    );
  }
}

export class AppError extends Error {
  public readonly code: AppErrorCodes;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly cause?: AppError;
  public readonly errorChain: ErrorContext[];
  public readonly isRecoverable: boolean;
  public readonly userMessage?: string;

  constructor(
    message: string,
    code: AppErrorCodes,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: ErrorContext,
    options: {
      cause?: AppError;
      isRecoverable?: boolean;
      userMessage?: string;
    } = {},
  ) {
    super(message);
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.cause = options.cause;
    this.isRecoverable = options.isRecoverable ?? true;
    this.userMessage = options.userMessage;
    this.errorChain = options.cause
      ? [...options.cause.errorChain, context]
      : [context];
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get the complete error history with all messages and contexts
   * This traverses the full cause chain and provides detailed information
   * BULLETPROOF: Protected against infinite loops and corrupted error chains
   */
  getCompleteErrorHistory(): ErrorHistoryEntry[] {
    try {
      const history: ErrorHistoryEntry[] = [];
      const visited = new Set<AppError>(); // Prevent infinite loops
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentError: AppError | undefined = this;
      let depth = 0;
      const maxDepth = 100; // Safety limit

      while (currentError && depth < maxDepth) {
        // Check for circular references
        if (visited.has(currentError)) {
          history.push({
            depth,
            message: "[CIRCULAR REFERENCE DETECTED]",
            code: AppErrorCodes.UNEXPECTED_ERROR,
            category: ErrorCategory.SYSTEM,
            severity: ErrorSeverity.HIGH,
            context: {
              layer: "ErrorSystem",
              method: "getCompleteErrorHistory",
              timestamp: new Date(),
              metadata: { circularRef: true, detectedAt: depth },
            },
            isRecoverable: false,
            timestamp: new Date(),
          });
          break;
        }

        visited.add(currentError);

        try {
          history.push({
            depth,
            message: this._safeStringify(currentError.message, "[No Message]"),
            code: currentError.code || AppErrorCodes.UNEXPECTED_ERROR,
            category: currentError.category || ErrorCategory.SYSTEM,
            severity: currentError.severity || ErrorSeverity.MEDIUM,
            context: currentError.context || {
              layer: "Unknown",
              method: "unknown",
              timestamp: new Date(),
            },
            userMessage: currentError.userMessage,
            isRecoverable: currentError.isRecoverable ?? false,
            timestamp: currentError.context?.timestamp || new Date(),
          });
        } catch (entryError) {
          // If we can't process this error entry, add a placeholder
          history.push({
            depth,
            message: `[ERROR ENTRY CORRUPTED: ${this._safeStringify(entryError, "Unknown")}]`,
            code: AppErrorCodes.UNEXPECTED_ERROR,
            category: ErrorCategory.SYSTEM,
            severity: ErrorSeverity.HIGH,
            context: {
              layer: "ErrorSystem",
              method: "getCompleteErrorHistory",
              timestamp: new Date(),
              metadata: {
                corruptedEntry: true,
                originalError: String(currentError),
              },
            },
            isRecoverable: false,
            timestamp: new Date(),
          });
        }

        currentError = currentError.cause;
        depth++;
      }

      if (depth >= maxDepth) {
        history.push({
          depth,
          message: `[MAX DEPTH REACHED: ${maxDepth}+ errors in chain]`,
          code: AppErrorCodes.UNEXPECTED_ERROR,
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.HIGH,
          context: {
            layer: "ErrorSystem",
            method: "getCompleteErrorHistory",
            timestamp: new Date(),
            metadata: { maxDepthReached: true, maxDepth },
          },
          isRecoverable: false,
          timestamp: new Date(),
        });
      }

      return history;
    } catch (criticalError) {
      // Last resort: return minimal history entry
      return [
        {
          depth: 0,
          message: `[CRITICAL ERROR IN HISTORY EXTRACTION: ${this._safeStringify(criticalError, "Unknown")}]`,
          code: AppErrorCodes.UNEXPECTED_ERROR,
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.CRITICAL,
          context: {
            layer: "ErrorSystem",
            method: "getCompleteErrorHistory",
            timestamp: new Date(),
            metadata: { criticalFailure: true },
          },
          isRecoverable: false,
          timestamp: new Date(),
        },
      ];
    }
  }

  /**
   * Log the complete error to console with proper formatting
   * BULLETPROOF: Will always log something, even if formatting fails
   */
  logToConsole(): void {
    try {
      console.group(
        `🔴 ${this.severity || "UNKNOWN"} ${this.category || "UNKNOWN"} Error`,
      );
      console.error(this.getFormattedErrorHistory());
      console.groupEnd();
    } catch (consoleError) {
      // Fallback: Basic console logging
      try {
        console.error("🚨 ERROR LOGGING FAILED:");
        console.error("Original Error:", String(this.message || "No message"));
        console.error("Code:", String(this.code || "NO_CODE"));
        console.error("Logging Error:", String(consoleError));
        console.error("Raw Error Object:", this);
      } catch {
        // Ultimate fallback: Most basic logging possible
        console.error("🚨 CRITICAL: Error logging completely failed");
        console.error(String(this));
      }
    }
  }

  /**
   * Get a formatted string representation of the complete error history
   * Perfect for logging and debugging
   * BULLETPROOF: Multiple fallback layers to ensure this never crashes
   */
  getFormattedErrorHistory(): string {
    try {
      return this._getFormattedErrorHistoryUnsafe();
    } catch (formattingError) {
      // Fallback 1: Try minimal formatting
      try {
        return this._getMinimalFormattedHistory(formattingError);
      } catch (minimalError) {
        // Fallback 2: Basic string representation
        try {
          return this._getBasicErrorString(formattingError, minimalError);
        } catch (basicError) {
          // Fallback 3: Absolute minimum (this should never fail)
          return this._getEmergencyErrorString(
            formattingError,
            minimalError,
            basicError,
          );
        }
      }
    }
  }

  /**
   * The original formatting logic (now marked as unsafe)
   */
  private _getFormattedErrorHistoryUnsafe(): string {
    const history = this.getCompleteErrorHistory();
    const lines: string[] = [];

    lines.push(`🔴 ERROR TRACE (${history.length} levels deep)`);
    lines.push(`═══════════════════════════════════════════════════════════`);

    history.forEach((entry, index) => {
      const indent = "  ".repeat(Math.max(0, Math.min(entry.depth, 10))); // Limit depth
      const isRoot = entry.depth === history.length - 1;
      const prefix = isRoot ? "🟡 ROOT CAUSE" : `🔸 LEVEL ${entry.depth + 1}`;

      lines.push(`${indent}${prefix}`);
      lines.push(
        `${indent}├─ Message: ${this._safeStringify(entry.message, "Unknown message")}`,
      );
      lines.push(
        `${indent}├─ Code: ${this._safeStringify(entry.code, "UNKNOWN_CODE")}`,
      );
      lines.push(
        `${indent}├─ Category: ${this._safeStringify(entry.category, "UNKNOWN")} (${this._safeStringify(entry.severity, "UNKNOWN")})`,
      );
      lines.push(
        `${indent}├─ Layer: ${this._safeStringify(entry.context?.layer, "Unknown")}.${this._safeStringify(entry.context?.method, "unknown")}`,
      );

      try {
        const timeStr = entry.timestamp.toISOString();
        lines.push(`${indent}├─ Time: ${timeStr}`);
      } catch {
        lines.push(`${indent}├─ Time: [Invalid Date]`);
      }

      if (
        entry.context?.metadata &&
        typeof entry.context.metadata === "object"
      ) {
        try {
          const metadataStr = JSON.stringify(entry.context.metadata, null, 2);
          if (metadataStr && metadataStr !== "{}") {
            lines.push(
              `${indent}├─ Metadata: ${metadataStr.replace(/\n/g, `\n${indent}│    `)}`,
            );
          }
        } catch {
          lines.push(`${indent}├─ Metadata: [Serialization Failed]`);
        }
      }

      if (entry.context?.correlationId) {
        lines.push(
          `${indent}├─ Correlation ID: ${this._safeStringify(entry.context.correlationId, "Unknown")}`,
        );
      }

      if (entry.userMessage) {
        lines.push(
          `${indent}├─ User Message: "${this._safeStringify(entry.userMessage, "Unknown message")}"`,
        );
      }

      const recoverable = entry.isRecoverable
        ? "✅"
        : !entry.isRecoverable
          ? "❌"
          : "❓";
      lines.push(`${indent}└─ Recoverable: ${recoverable}`);

      if (index < history.length - 1) {
        lines.push(`${indent}   ↓`);
      }
    });

    lines.push(`═══════════════════════════════════════════════════════════`);
    return lines.join("\n");
  }

  /**
   * Fallback 1: Minimal formatting when full formatting fails
   */
  private _getMinimalFormattedHistory(formattingError: unknown): string {
    const lines: string[] = [];
    lines.push("🔴 ERROR TRACE (Minimal Format - Full Format Failed)");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push(
      `⚠️  Format Error: ${this._safeStringify(formattingError, "Unknown formatting error")}`,
    );
    lines.push("───────────────────────────────────────────────────────────");

    try {
      const history = this.getCompleteErrorHistory();
      history.forEach((entry, index) => {
        const level = `[${index}] ${entry.context?.layer || "Unknown"}.${entry.context?.method || "unknown"}`;
        const message = this._safeStringify(entry.message, "No message");
        const code = this._safeStringify(entry.code, "NO_CODE");
        lines.push(`${level}: ${code} - ${message}`);
      });
    } catch {
      // If we can't even get the history, try to extract basic info
      lines.push(
        `Current Error: ${this._safeStringify(this.message, "No message")}`,
      );
      lines.push(`Current Code: ${this._safeStringify(this.code, "NO_CODE")}`);
      lines.push(
        `Current Layer: ${this._safeStringify(this.context?.layer, "Unknown")}.${this._safeStringify(this.context?.method, "unknown")}`,
      );
    }

    lines.push("═══════════════════════════════════════════════════════════");
    return lines.join("\n");
  }

  /**
   * Fallback 2: Basic string when minimal formatting fails
   */
  private _getBasicErrorString(
    formattingError: unknown,
    minimalError: unknown,
  ): string {
    const parts: string[] = [
      "🔴 ERROR (Basic Format - Advanced Formatting Failed)",
      `Format Error 1: ${this._safeStringify(formattingError, "Unknown")}`,
      `Format Error 2: ${this._safeStringify(minimalError, "Unknown")}`,
      "───────────────────────────────────────────────────────────",
      `Message: ${this._safeStringify(this.message, "No message")}`,
      `Code: ${this._safeStringify(this.code, "NO_CODE")}`,
      `Category: ${this._safeStringify(this.category, "UNKNOWN")}`,
      `Severity: ${this._safeStringify(this.severity, "UNKNOWN")}`,
    ];

    // Try to get basic context info
    try {
      if (this.context) {
        parts.push(
          `Layer: ${this._safeStringify(this.context.layer, "Unknown")}`,
        );
        parts.push(
          `Method: ${this._safeStringify(this.context.method, "unknown")}`,
        );
      }
    } catch {
      parts.push("Context: [Extraction Failed]");
    }

    // Try to show if there are causes
    try {
      if (this.cause) {
        parts.push(
          `Has Cause: Yes (${this._safeStringify(this.cause.message, "Unknown cause")})`,
        );
      } else {
        parts.push("Has Cause: No");
      }
    } catch {
      parts.push("Has Cause: [Check Failed]");
    }

    return parts.join("\n");
  }

  /**
   * Fallback 3: Emergency format - this should never fail
   */
  private _getEmergencyErrorString(
    formattingError: unknown,
    minimalError: unknown,
    basicError: unknown,
  ): string {
    // Use only the most basic operations that are extremely unlikely to fail
    const timestamp = new Date().toISOString();

    return [
      "🚨 EMERGENCY ERROR LOG (All Formatting Failed)",
      `Time: ${timestamp}`,
      `Original Error: ${String(this.message || "No message")}`,
      `Error Code: ${String(this.code || "NO_CODE")}`,
      `Format Error 1: ${String(formattingError)}`,
      `Format Error 2: ${String(minimalError)}`,
      `Format Error 3: ${String(basicError)}`,
      "This indicates a critical issue with error logging system.",
      "Raw Error Object:",
      String(this),
    ].join("\n");
  }

  /**
   * Safe stringify helper that never throws
   */
  private _safeStringify(
    value: unknown,
    fallback: string = "undefined",
  ): string {
    if (value === null) return "null";
    if (value === undefined) return fallback;

    try {
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean")
        return String(value);
      return JSON.stringify(value);
    } catch {
      try {
        return String(value);
      } catch {
        return fallback;
      }
    }
  }

  getPublicMessage(): string {
    return this.userMessage ?? this.getDefaultUserMessage();
  }
  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.DOMAIN:
        return "The requested action cannot be completed due to business rules.";
      case ErrorCategory.VALIDATION:
        return "The provided information is invalid.";
      case ErrorCategory.INFRASTRUCTURE:
        return "The requested resource is temporarily unavailable.";
      case ErrorCategory.SYSTEM:
        return "An unexpected error occurred. Please try again.";
      default:
        return "An error occurred while processing your request.";
    }
  }
}
