import { BookmarkDB, HydratedBookmark } from "../../models/bookmark";
import { RedisClient } from "../../infrastructure/database/redisClient";

export class BookmarksRepository {
  private bookmarksDB: ReturnType<RedisClient["getBookmarksStore"]>;
  private booksDB: ReturnType<RedisClient["getBooksStore"]>;

  constructor(
    redisBookmarks = RedisClient.getInstance().getBookmarksStore(),
    redisBooks = RedisClient.getInstance().getBooksStore(),
  ) {
    this.bookmarksDB = redisBookmarks;
    this.booksDB = redisBooks;
  }

  /**
   * Fetch all bookmarks for a user (hydrated with Book info)
   */
  public async fetchAllByUserID(userID: string): Promise<HydratedBookmark[]> {
    // Get all bookmark objects
    const bookmarks = await this.bookmarksDB.getUserBookmarks(userID);

    // Collect all unique bookIDs for those bookmarks
    const bookIDs = [
      ...new Set(bookmarks.map((bm) => bm.bookID).filter(Boolean)),
    ];

    // Fetch book data in bulk
    const booksMap = await this.booksDB.getBooks(bookIDs);

    // Merge and hydrate
    return bookmarks.map((bookmark) => ({
      bookmark,
      book: booksMap[bookmark.bookID] ?? null,
    }));
  }

  /**
   * Fetch a single bookmark for a user, hydrated
   */
  public async fetchByID(
    userID: string,
    bookmarkID: string,
  ): Promise<HydratedBookmark | null> {
    const bookmark = await this.bookmarksDB.getBookmark(userID, bookmarkID);
    if (!bookmark) return null;

    const book = await this.booksDB.getBook(bookmark.bookID);
    return { bookmark, book };
  }

  /**
   * Add a new bookmark for a user
   */
  public async add(userID: string, bookmark: BookmarkDB): Promise<void> {
    await this.bookmarksDB.addBookmark(userID, bookmark);
  }

  /**
   * Update an existing bookmark for a user
   */
  public async update(
    userID: string,
    bookmarkID: string,
    updated: BookmarkDB,
  ): Promise<void> {
    const existing = await this.bookmarksDB.getBookmark(userID, bookmarkID);
    if (!existing) return;
    await this.bookmarksDB.updateBookmark(userID, updated);
  }

  /**
   * Delete a bookmark
   */
  public async delete(userID: string, bookmarkID: string): Promise<void> {
    await this.bookmarksDB.deleteBookmark(userID, bookmarkID);
  }

  /**
   * Delete all bookmarks for a user
   */
  public async clearAllForUser(userID: string): Promise<void> {
    await this.bookmarksDB.clearUserBookmarks(userID);
  }
}
