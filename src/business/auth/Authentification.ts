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
import jwt, { SignOptions } from "jsonwebtoken";
import { UserDB } from "../../models/users";
import validator from "validator";
import { BookmarksRepository } from "../users/BookmarksRepository";
import { defaultBookmarks } from "../../data/defaultBookmarks";

export class Authentification {
  private privateKey = process.env.JWT_PRIVATE_KEY!;

  private generateJWT = (
    userID: string,
    expiresIn: SignOptions["expiresIn"],
  ): string => {
    return jwt.sign(
      {
        userID,
      },
      this.privateKey,
      { expiresIn },
    );
  };

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
    const user = await usersRepo.fetchByUsername(username);
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

  private removeExpiredAccountAccessTokens(
    activeAccessTokensInDB: UserDB["activeAccessTokens"],
  ): UserDB["activeAccessTokens"] {
    const result: UserDB["activeAccessTokens"] = [];
    activeAccessTokensInDB.forEach((accessTokenDB) => {
      try {
        const payload = jwt.verify(accessTokenDB, this.privateKey) as {
          userID: string;
        };
        if (payload) {
          result.push(accessTokenDB);
        }
      } catch (_) {
        // token expired
      }
    });

    return result;
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
      const accessToken = this.generateJWT(user.id, "15min");

      user.activeAccessTokens = this.removeExpiredAccountAccessTokens(
        user.activeAccessTokens,
      );
      user.activeAccessTokens.push(accessToken);
      user.lastConnexion = new Date();

      const usersRepo = new UsersRepository();
      await usersRepo.updateByID(user.id, user);

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

  public async refreshToken(
    accessToken: string,
    userID: string,
  ): Promise<Result<{ accessToken: string; userID: string }>> {
    try {
      // generate refreshToken
      const newAccessToken = this.generateJWT(userID, "15min");

      // fetch the user
      const usersRepo = new UsersRepository();
      const user = await usersRepo.fetchByID(userID);
      if (!user) {
        return [
          null,
          new AppError(
            `Can't find the user for this id`,
            AppErrorCodes.INVALID_INPUT,
            ErrorCategory.DOMAIN,
            ErrorSeverity.LOW,
            ErrorFactory.createContext("Service", "refreshToken", {
              userID,
            }),
            {
              userMessage: `An error occured`,
              isRecoverable: false,
            },
          ),
        ];
      }

      // we remove expired tokens and invalidate the currently use one and add the new one
      user.activeAccessTokens = this.removeExpiredAccountAccessTokens(
        user.activeAccessTokens,
      );
      user.activeAccessTokens = user.activeAccessTokens.filter(
        (el) => el !== accessToken,
      );
      user.activeAccessTokens.push(newAccessToken);

      await usersRepo.updateByID(user.id, user);

      return [{ accessToken: newAccessToken, userID: user.id }, null];
    } catch (e) {
      return [
        null,
        ErrorFactory.unexpectedError(
          ErrorFactory.createContext("Service", "refreshToken", {}),
          e,
        ),
      ];
    }
  }

  public async create(
    username: string,
    password: string,
    authKey: string | undefined,
  ): Promise<Result<true>> {
    try {
      if (!process.env.ADMIN_CREATION_SECRET) {
        return [
          null,
          new AppError(
            `No ADMIN_CREATION_SECRET defined — blocking all account creation for safety reasons`,
            AppErrorCodes.CONFIGURATION_ERROR,
            ErrorCategory.DOMAIN,
            ErrorSeverity.HIGH,
            ErrorFactory.createContext("Service", "create", {}),
            {
              userMessage: `Account creation is temporarily closed. Sorry for the inconvenience.`,
              isRecoverable: false,
            },
          ),
        ];
      }

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

      // we check the authorization key to create an account :
      const normalizedAuthKey = validator.escape(authKey?.trim() ?? "");
      const normalizeEnvAuthKey = validator.escape(
        process.env.ADMIN_CREATION_SECRET.trim(),
      );
      const adminRoleEnabled = normalizedAuthKey === normalizeEnvAuthKey;

      // check that no user exist for this username
      const usersRepo = new UsersRepository();
      const user = await usersRepo.fetchByUsername(normalizedUsername);
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

      const userID = await usersRepo.create(
        normalizedUsername,
        passwordHash,
        adminRoleEnabled,
      );

      // we add the default bookmarks to the account
      const bookmarksRepo = new BookmarksRepository();
      for (const bookmark of defaultBookmarks) {
        bookmark.userID = userID;
        await bookmarksRepo.add(userID, bookmark);
      }

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

  public async verifyAccessToken(
    accessToken: string,
    expectedUserIDParam: string,
  ): Promise<Result<{ userID: string }>> {
    let payload;
    try {
      payload = jwt.verify(accessToken, this.privateKey) as {
        userID: string;
      };
      const userIDSanitized = validator.escape(payload.userID);
      const expectedUserIDSanitized = validator.escape(expectedUserIDParam);

      const usersRepo = new UsersRepository();
      const user = await usersRepo.fetchByID(userIDSanitized);

      // Check that userID in params matches token userID
      if (
        !expectedUserIDSanitized ||
        (expectedUserIDSanitized &&
          expectedUserIDSanitized !== userIDSanitized) ||
        !user ||
        !user.activeAccessTokens.includes(accessToken)
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
              userIDCookie: expectedUserIDSanitized,
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

  public async logout(accessToken: string, userID: UserDB["id"]) {
    try {
      const usersRepo = new UsersRepository();

      const user = await usersRepo.fetchByID(userID);
      if (!user) {
        return;
      }

      // we remove expired tokens and invalidate the currently use one
      user.activeAccessTokens = this.removeExpiredAccountAccessTokens(
        user.activeAccessTokens,
      );
      user.activeAccessTokens = user.activeAccessTokens.filter(
        (el) => el !== accessToken,
      );

      await usersRepo.updateByID(user.id, user);
    } catch (_) {
      // RAS
    }
  }
}
