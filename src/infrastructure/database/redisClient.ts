import { createClient, RedisClientType } from "redis";
import { UserDB } from "../../models/users";
import { BookDB, BookmarkDB } from "../../models/bookmark";
import { ChapterContextDB, ChapterDB } from "../../models/chapter";

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

  // ---------------------------------------------------------
  //  BOOKS SCOPE
  // ---------------------------------------------------------
  public getBooksStore(): RedisBooksStore {
    if (!this.redis) throw new Error("Redis not initialized.");
    return new RedisBooksStore(this.redis);
  }

  // ---------------------------------------------------------
  //  BOOKMARKS SCOPE
  // ---------------------------------------------------------
  public getBookmarksStore(): RedisBookmarksStore {
    if (!this.redis) throw new Error("Redis not initialized.");
    return new RedisBookmarksStore(this.redis);
  }

  // ---------------------------------------------------------
  //  CHAPTER SCOPE
  // ---------------------------------------------------------
  public getChaptersStore(): RedisChaptersStore {
    if (!this.redis) throw new Error("Redis not initialized.");
    return new RedisChaptersStore(this.redis);
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

  public async updateUserByID(id: string, user: UserDB): Promise<boolean> {
    const key = this.userKeyPrefix + id;

    // Optional safety: check that user exists before updating
    const exists = await this.redis.exists(key);
    if (!exists) return false;

    await this.redis.set(key, JSON.stringify(user));
    return true;
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

// =========================================================
// BOOKMARKS STORE
// =========================================================
class RedisBookmarksStore {
  private readonly userKeyPrefix = "user:";
  private readonly bookmarkKeyPrefix = "bookmark:";

  constructor(private redis: RedisClientType) {}

  private userBookmarksKey(userID: string): string {
    return `${this.userKeyPrefix}${userID}:bookmarks`;
  }

  private bookmarkKey(userID: string, bookmarkID: string): string {
    return `${this.bookmarkKeyPrefix}${userID}:${bookmarkID}`;
  }

  /** Add a new bookmark ID to the user's set and store the bookmark data */
  public async addBookmark(
    userID: string,
    bookmark: BookmarkDB,
  ): Promise<void> {
    const userBookmarksKey = this.userBookmarksKey(userID);
    const bookmarkKey = this.bookmarkKey(userID, bookmark.id);

    await this.redis
      .multi()
      .sAdd(userBookmarksKey, bookmark.id)
      .set(bookmarkKey, JSON.stringify(bookmark))
      .exec();
  }

  /** Fetch all bookmark IDs for a user */
  public async getUserBookmarkIDs(userID: string): Promise<string[]> {
    return await this.redis.sMembers(this.userBookmarksKey(userID));
  }

  /** Fetch all bookmarks (objects) for a user */
  public async getUserBookmarks(userID: string): Promise<BookmarkDB[]> {
    const ids = await this.getUserBookmarkIDs(userID);
    if (ids.length === 0) return [];

    const keys = ids.map((id) => this.bookmarkKey(userID, id));
    const results = await this.redis.mGet(keys);

    return results
      .filter((r): r is string => !!r)
      .map((r) => JSON.parse(r) as BookmarkDB);
  }

  /** Fetch a single bookmark */
  public async getBookmark(
    userID: string,
    bookmarkID: string,
  ): Promise<BookmarkDB | null> {
    const data = await this.redis.get(this.bookmarkKey(userID, bookmarkID));
    return data ? JSON.parse(data) : null;
  }

  /** Update a bookmark object (completely overwrite it) */
  public async updateBookmark(
    userID: string,
    bookmark: BookmarkDB,
  ): Promise<void> {
    await this.redis.set(
      this.bookmarkKey(userID, bookmark.id),
      JSON.stringify(bookmark),
    );
  }

  /** Remove a bookmark from both the user's set and Redis */
  public async deleteBookmark(
    userID: string,
    bookmarkID: string,
  ): Promise<void> {
    await this.redis
      .multi()
      .sRem(this.userBookmarksKey(userID), bookmarkID)
      .del(this.bookmarkKey(userID, bookmarkID))
      .exec();
  }

  /** Clear all bookmarks for a user */
  public async clearUserBookmarks(userID: string): Promise<void> {
    const ids = await this.getUserBookmarkIDs(userID);
    if (ids.length > 0) {
      const keysToDelete = ids.map((id) => this.bookmarkKey(userID, id));
      await this.redis
        .multi()
        .del(keysToDelete)
        .del(this.userBookmarksKey(userID))
        .exec();
    }
  }
}

// =========================================================
// BOOKS STORE
// =========================================================
class RedisBooksStore {
  private readonly bookKeyPrefix = "book:";

  constructor(private redis: RedisClientType) {}

  private bookKey(id: string): string {
    return `${this.bookKeyPrefix}${id}`;
  }

  /** Create or update a book entry */
  public async saveBook(book: BookDB): Promise<void> {
    await this.redis.set(this.bookKey(book.id), JSON.stringify(book));
  }

  /** Fetch one book by ID */
  public async getBook(id: string): Promise<BookDB | null> {
    const data = await this.redis.get(this.bookKey(id));
    return data ? (JSON.parse(data) as BookDB) : null;
  }

  /** Delete one book */
  public async deleteBook(id: string): Promise<void> {
    await this.redis.del(this.bookKey(id));
  }

  /**
   * Bulk fetch several books at once.
   * Returns a map of { bookID: BookDB }
   */
  public async getBooks(ids: string[]): Promise<Record<string, BookDB>> {
    if (ids.length === 0) return {};
    const keys = ids.map((id) => this.bookKey(id));
    const results = await this.redis.mGet(keys);

    const books: Record<string, BookDB> = {};
    ids.forEach((id, idx) => {
      const raw = results[idx];
      if (raw) books[id] = JSON.parse(raw) as BookDB;
    });
    return books;
  }

  /** Check if a book exists */
  public async exists(id: string): Promise<boolean> {
    const exists = await this.redis.exists(this.bookKey(id));
    return exists === 1;
  }
}

// =========================================================
// CHAPTERS STORE
// =========================================================
class RedisChaptersStore {
  private readonly bookKeyPrefix = "book:";
  private readonly chapterKeyPrefix = "chapter:";

  constructor(private redis: RedisClientType) {}

  private bookKey(id: string): string {
    return `${this.bookKeyPrefix}${id}`;
  }

  private chapterKey(bookID: string, chapterNumber: number): string {
    return `${this.bookKey(bookID)}:${this.chapterKeyPrefix}${chapterNumber}`;
  }

  private chapterLockKey(bookID: string, chapterNumber: number): string {
    return `${this.chapterKey(bookID, chapterNumber)}:lock`;
  }

  private chapterContext(bookID: string, chapterNumber: number): string {
    return `${this.chapterKey(bookID, chapterNumber)}:context`;
  }

  /** Create or update a chapter entry */
  public async saveChapter(
    bookID: string,
    chapterNumber: number,
    chapter: ChapterDB,
    exp = 60 * 60 * 24 * 30, // 30 days
  ): Promise<void> {
    await this.redis.set(
      this.chapterKey(bookID, chapterNumber),
      JSON.stringify(chapter),
      {
        expiration: {
          type: "EX",
          value: exp,
        },
      },
    );
  }

  /** Create or update the context from a chapter entry */
  public async saveChapterContext(
    bookID: string,
    chapterNumber: number,
    ctx: ChapterContextDB,
    exp = 60 * 60 * 24 * 30, // 30 days
  ): Promise<void> {
    await this.redis.set(
      this.chapterContext(bookID, chapterNumber),
      JSON.stringify(ctx),
      {
        expiration: {
          type: "EX",
          value: exp,
        },
      },
    );
  }

  /**
   * Create a lock entry for a specific chapter. If one Already exists, we dont do anything.
   * Returns true if lock created, false if one exist
   */
  public async createChapterLock(
    bookID: string,
    chapterNumber: number,
    exp = 60 * 5, // 5 min
  ): Promise<boolean> {
    const success = await this.redis.set(
      this.chapterLockKey(bookID, chapterNumber),
      "locked",
      {
        expiration: {
          type: "EX",
          value: exp,
        },
        condition: "NX", // Only set the key if it does not already exist
      },
    );
    return success === "OK";
  }

  /** Fetch one chapter by bookID and chapter number */
  public async getChapter(
    bookID: string,
    chapterNumber: number,
  ): Promise<ChapterDB | null> {
    const data = await this.redis.get(this.chapterKey(bookID, chapterNumber));
    return data ? (JSON.parse(data) as ChapterDB) : null;
  }

  /** Fetch one chapter context by bookID and chapter number */
  public async getChapterContext(
    bookID: string,
    chapterNumber: number,
  ): Promise<ChapterContextDB | null> {
    const data = await this.redis.get(
      this.chapterContext(bookID, chapterNumber),
    );
    return data ? (JSON.parse(data) as ChapterContextDB) : null;
  }

  /** Delete one chapter by bookID and chapter number*/
  public async deleteChapter(
    bookID: string,
    chapterNumber: number,
  ): Promise<void> {
    await this.redis.del(this.chapterKey(bookID, chapterNumber));
  }

  /** Delete one chapter lock by bookID and chapter number*/
  public async deleteChapterLock(
    bookID: string,
    chapterNumber: number,
  ): Promise<void> {
    await this.redis.del(this.chapterLockKey(bookID, chapterNumber));
  }

  /**
   * Bulk fetch several chapters at once.
   * Returns a map of { chapterID: ChapterDB }
   */
  public async getChapters(
    bookID: string,
    chapterNumbers: number[],
  ): Promise<Record<number, ChapterDB>> {
    if (chapterNumbers.length === 0) return {};
    const keys = chapterNumbers.map((chapterNumber) =>
      this.chapterKey(bookID, chapterNumber),
    );
    const results = await this.redis.mGet(keys);

    const chapters: Record<number, ChapterDB> = {};
    chapterNumbers.forEach((chapterNumber, idx) => {
      const raw = results[idx];
      if (raw) {
        chapters[chapterNumber] = JSON.parse(raw) as ChapterDB;
      }
    });
    return chapters;
  }

  /** Check if a chapter exists */
  public async chapterExists(
    bookID: string,
    chapterNumber: number,
  ): Promise<boolean> {
    const exists = await this.redis.exists(
      this.chapterKey(bookID, chapterNumber),
    );
    return exists === 1;
  }

  /** Check if a chapter lock exists */
  public async lockExists(
    bookID: string,
    chapterNumber: number,
  ): Promise<boolean> {
    const exists = await this.redis.exists(
      this.chapterLockKey(bookID, chapterNumber),
    );
    return exists === 1;
  }
}
