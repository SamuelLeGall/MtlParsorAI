import { RedisClient } from "../infrastructure/database/redisClient";
import { defaultBooks } from "./defaultBooks";

export async function seedRedis(redisClient: RedisClient) {
  const booksStore = redisClient.getBooksStore();

  for (const book of defaultBooks) {
    const bookAlreadyInDB = await booksStore.exists(book.id);
    if (!bookAlreadyInDB) {
      await booksStore.saveBook(book);
    }
  }

  console.log("✅ Redis seeded successfully.");
}
