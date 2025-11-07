import { UserDB } from "../../models/users";
import * as crypto from "node:crypto";
import { RedisClient } from "../../infrastructure/database/redisClient";
export class UsersRepository {
  private db;

  constructor(redisUsers = RedisClient.getInstance().getUsersStore()) {
    this.db = redisUsers;
  }

  public async create(
    username: string,
    passwordHash: string,
    adminRoleEnabled: boolean,
  ): Promise<string> {
    const id = crypto.randomUUID();
    const normalizedUsername = username.trim().toLowerCase();

    // check if username already exists
    const existingID = await this.db.getUserByUsername(normalizedUsername);
    if (existingID) {
      throw new Error(`Username already exists: ${normalizedUsername}`);
    }

    const user: UserDB = {
      id,
      username: normalizedUsername,
      passwordHash,
      active: true,
      created: new Date(),
      roles: [],
    };

    if (adminRoleEnabled) {
      user.roles.push("ADMINISTRATOR");
    } else {
      user.roles.push("GUEST");
    }

    // store user and username index
    await this.db.saveUser(user);

    return id;
  }

  public async fetchByUsername(username: string): Promise<UserDB | null> {
    return this.db.getUserByUsername(username);
  }

  public async fetchByID(id: string): Promise<UserDB | null> {
    return this.db.getUserByID(id);
  }

  public async deleteByID(id: string, username: string): Promise<void> {
    await this.db.deleteUser(id, username);
  }
}
