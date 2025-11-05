import { AppError } from "./appError";

export type Result<T> = [T, null] | [null, AppError];
export type FrontendResult<T> = [T, null] | [null, string];
export class ResultFactory {
  static isSuccess<T>(result: Result<T>): result is [T, null] {
    return result[1] === null;
  }

  static isError<T>(result: Result<T>): result is [null, AppError] {
    return result[1] !== null;
  }

  static isErrorFrontend<T>(
    result: FrontendResult<T>,
  ): result is [null, string] {
    return result[1] !== null;
  }
}
