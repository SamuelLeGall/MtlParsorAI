import { UsersRepository } from "../users/UsersRepository";
import bcrypt from "bcrypt";
import { Result, ResultFactory } from "../../models/response";
import {
  AppError,
  AppErrorCodes,
  ErrorCategory,
  ErrorFactory,
  ErrorSeverity,
} from "../../models/appError";
import jwt from "jsonwebtoken";
import { UserDB } from "../../models/users";
import validator from "validator";

export class Authentification {
  private privateKey = ":fr6UoOO4b7nrlC07KAlh6y6Na-qawxsVMr8tRHHL";

  private validateAndNormalizeUsername(username: string): Result<string> {
    try {
      if (!validator.isAlphanumeric(username, "fr-FR")) {
        return [
          null,
          new AppError(
            `Username does not respect model`,
            AppErrorCodes.INVALID_INPUT,
            ErrorCategory.DOMAIN,
            ErrorSeverity.LOW,
            ErrorFactory.createContext(
              "Service",
              "validateAndNormalizeUsername",
              {},
            ),
            {
              userMessage: `Username is not valid`,
              isRecoverable: true,
            },
          ),
        ];
      }
      const normalizedUsername = validator.escape(
        username.trim().toLowerCase(),
      );

      return [normalizedUsername, null];
    } catch (e) {
      return [
        null,
        ErrorFactory.unexpectedError(
          ErrorFactory.createContext(
            "Service",
            "validateAndNormalizeUsername",
            {},
          ),
          e,
        ),
      ];
    }
  }
  private validateAndNormalizePassword(password: string): Result<string> {
    try {
      if (!validator.isStrongPassword(password)) {
        return [
          null,
          new AppError(
            `Password does not respect strength requirement`,
            AppErrorCodes.INVALID_INPUT,
            ErrorCategory.DOMAIN,
            ErrorSeverity.LOW,
            ErrorFactory.createContext(
              "Service",
              "validateAndNormalizePassword",
              {},
            ),
            {
              userMessage: `Password does not respect strength requirement`,
              isRecoverable: true,
            },
          ),
        ];
      }

      if (!validator.isLength(password, { min: 8, max: 50 })) {
        return [
          null,
          new AppError(
            `Password is too long`,
            AppErrorCodes.INVALID_INPUT,
            ErrorCategory.DOMAIN,
            ErrorSeverity.LOW,
            ErrorFactory.createContext(
              "Service",
              "validateAndNormalizePassword",
              {},
            ),
            {
              userMessage: `Password does not respect strength requirement`,
              isRecoverable: true,
            },
          ),
        ];
      }

      const normalizedPassword = validator.escape(password.trim());
      if (normalizedPassword !== password.trim()) {
        return [
          null,
          new AppError(
            `Password contains characters that require to be escaped`,
            AppErrorCodes.INVALID_INPUT,
            ErrorCategory.DOMAIN,
            ErrorSeverity.MEDIUM,
            ErrorFactory.createContext(
              "Service",
              "validateAndNormalizePassword",
              {},
            ),
            {
              userMessage: `Password is not valid`,
              isRecoverable: true,
            },
          ),
        ];
      }

      return [normalizedPassword, null];
    } catch (e) {
      return [
        null,
        ErrorFactory.unexpectedError(
          ErrorFactory.createContext(
            "Service",
            "validateAndNormalizePassword",
            {},
          ),
          e,
        ),
      ];
    }
  }

  private async checkUser(
    username: string,
    password: string,
  ): Promise<Result<UserDB>> {
    // check if we found an account for this username
    const usersRepo = new UsersRepository();
    const user = usersRepo.fetchByUsername(username);
    if (!user) {
      return [
        null,
        new AppError(
          `No Account Found for this username (${username})`,
          AppErrorCodes.RESOURCE_NOT_FOUND,
          ErrorCategory.DOMAIN,
          ErrorSeverity.MEDIUM,
          ErrorFactory.createContext("Service", "checkUser", {}),
          {
            userMessage: "No Account Found for this username and password.",
            isRecoverable: true,
          },
        ),
      ];
    }

    // fetch the userSession data of the username and check the pwd
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return [
        null,
        new AppError(
          `Passwords do not match for this account (${user.id})`,
          AppErrorCodes.ACTION_NOT_ALLOWED,
          ErrorCategory.DOMAIN,
          ErrorSeverity.MEDIUM,
          ErrorFactory.createContext("Service", "checkUser", {
            userID: user.id,
            username: user.username,
          }),
          {
            userMessage: "No Account Found for this username and password.",
            isRecoverable: true,
          },
        ),
      ];
    }

    return [user, null];
  }

  public async login(
    username: string,
    password: string,
  ): Promise<Result<{ accessToken: string; userID: string }>> {
    try {
      // validate and normalize the username
      const resultNormalizeUsername =
        this.validateAndNormalizeUsername(username);
      if (ResultFactory.isError(resultNormalizeUsername)) {
        const [, errorNormalizeUsername] = resultNormalizeUsername;
        return [
          null,
          ErrorFactory.chainError(
            errorNormalizeUsername,
            ErrorFactory.createContext("Service", "login", {}),
            { userMessage: "No Account Found for this username and password." },
          ),
        ];
      }

      // only trimming the password
      const resultNormalizePassword =
        this.validateAndNormalizePassword(password);
      if (ResultFactory.isError(resultNormalizePassword)) {
        const [, errorNormalizePassword] = resultNormalizePassword;
        return [
          null,
          ErrorFactory.chainError(
            errorNormalizePassword,
            ErrorFactory.createContext("Service", "login", {}),
            { userMessage: "No Account Found for this username and password." },
          ),
        ];
      }

      const [normalizedUsername] = resultNormalizeUsername;
      const [normalizedPassword] = resultNormalizePassword;

      // fetch user
      const responseCheckUser = await this.checkUser(
        normalizedUsername,
        normalizedPassword,
      );
      if (ResultFactory.isError(responseCheckUser)) {
        const [, errorCheckUser] = responseCheckUser;
        return [
          null,
          ErrorFactory.chainError(
            errorCheckUser,
            ErrorFactory.createContext("Service", "login", {}),
          ),
        ];
      }
      const [user] = responseCheckUser;

      // generate access token
      const accessToken = jwt.sign(
        {
          userID: user.id,
        },
        this.privateKey,
        { expiresIn: "24h" },
      );

      return [{ accessToken, userID: user.id }, null];
    } catch (e) {
      return [
        null,
        ErrorFactory.unexpectedError(
          ErrorFactory.createContext("Service", "login", {}),
          e,
        ),
      ];
    }
  }

  public async create(
    username: string,
    password: string,
  ): Promise<Result<true>> {
    try {
      // validate and normalize the username
      const resultNormalizeUsername =
        this.validateAndNormalizeUsername(username);
      if (ResultFactory.isError(resultNormalizeUsername)) {
        const [, errorNormalizeUsername] = resultNormalizeUsername;
        return [
          null,
          ErrorFactory.chainError(
            errorNormalizeUsername,
            ErrorFactory.createContext("Service", "create", {}),
          ),
        ];
      }

      const resultNormalizePassword =
        this.validateAndNormalizePassword(password);
      if (ResultFactory.isError(resultNormalizePassword)) {
        const [, errorNormalizePassword] = resultNormalizePassword;
        return [
          null,
          ErrorFactory.chainError(
            errorNormalizePassword,
            ErrorFactory.createContext("Service", "create", {}),
          ),
        ];
      }

      const [normalizedUsername] = resultNormalizeUsername;
      const [normalizedPassword] = resultNormalizePassword;

      // check that no user exist for this username
      const usersRepo = new UsersRepository();
      const user = usersRepo.fetchByUsername(normalizedUsername);
      if (user) {
        return [
          null,
          new AppError(
            `Existing account found for this username (${user.id})`,
            AppErrorCodes.RESOURCE_CONFLICT,
            ErrorCategory.INFRASTRUCTURE,
            ErrorSeverity.MEDIUM,
            ErrorFactory.createContext("Service", "create", {
              userID: user.id,
            }),
            {
              userMessage: `This username is already taken`,
              isRecoverable: true,
            },
          ),
        ];
      }

      const passwordHash = await bcrypt.hash(normalizedPassword, 12);

      usersRepo.create(normalizedUsername, passwordHash);

      return [true, null];
    } catch (e) {
      return [
        null,
        ErrorFactory.unexpectedError(
          ErrorFactory.createContext("Service", "create", {}),
          e,
        ),
      ];
    }
  }

  public verifyAccessToken(
    accessToken: string,
    expectedUserIDParam: string,
  ): Result<{ userID: string }> {
    let payload;
    try {
      payload = jwt.verify(accessToken, this.privateKey) as {
        userID: string;
      };
      const userIDSanitized = validator.escape(payload.userID);

      // Check that userID in params matches token userID
      if (
        !expectedUserIDParam ||
        (expectedUserIDParam && expectedUserIDParam !== userIDSanitized)
      ) {
        return [
          null,
          new AppError(
            "UserID mismatch",
            AppErrorCodes.ACTION_NOT_ALLOWED,
            ErrorCategory.DOMAIN,
            ErrorSeverity.HIGH,
            ErrorFactory.createContext("Service", "verifyAccessToken", {
              userIDToken: userIDSanitized,
              usernameParam: expectedUserIDParam,
            }),
            {
              userMessage: "An Error occured",
              isRecoverable: false,
            },
          ),
        ];
      }
      return [{ userID: userIDSanitized }, null];
    } catch (e) {
      return [
        null,
        ErrorFactory.unexpectedError(
          ErrorFactory.createContext("Service", "verifyAccessToken", {}),
          e,
        ),
      ];
    }
  }
}
