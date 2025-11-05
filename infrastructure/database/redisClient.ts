import { createClient, RedisClientType } from "redis";
import { UserDB } from "../../models/users";

export class RedisClient {
  private static instance: RedisClient;
  private redis!: RedisClientType;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (this.redis) return;

    this.redis = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.redis.on("error", (err) => console.error("❌ Redis error:", err));
    this.redis.on("connect", () => console.log("✅ Redis connected"));
    await this.redis.connect();
  }

  // Generic getter (for debugging etc.)
  public getRaw(): RedisClientType {
    if (!this.redis) throw new Error("Redis not initialized.");
    return this.redis;
  }

  // ---------------------------------------------------------
  //  USERS SCOPE
  // ---------------------------------------------------------
  public getUsersStore(): RedisUsersStore {
    if (!this.redis) throw new Error("Redis not initialized.");
    return new RedisUsersStore(this.redis);
  }
}

// =========================================================
// USERS STORE
// =========================================================
class RedisUsersStore {
  private userKeyPrefix = "user:";
  private usernameIndexPrefix = "username:";

  constructor(private redis: RedisClientType) {}

  public async saveUser(user: UserDB): Promise<void> {
    await this.redis
      .multi()
      .set(this.userKeyPrefix + user.id, JSON.stringify(user))
      .set(this.usernameIndexPrefix + user.username, user.id)
      .exec();
  }

  public async getUserByID(id: string): Promise<UserDB | null> {
    const data = await this.redis.get(this.userKeyPrefix + id);
    return data ? JSON.parse(data) : null;
  }

  public async getUserByUsername(username: string): Promise<UserDB | null> {
    const id = await this.redis.get(
      this.usernameIndexPrefix + username.trim().toLowerCase(),
    );
    if (!id) return null;
    return this.getUserByID(id);
  }

  public async deleteUser(id: string, username: string): Promise<void> {
    await this.redis
      .multi()
      .del(this.userKeyPrefix + id)
      .del(this.usernameIndexPrefix + username)
      .exec();
  }
}
