import { BookDB, BookmarkDB } from "./bookmark";
import { z } from "zod";

export interface ChapterDB {
  id: string;
  title: string;
  body: string;
}

export interface ChapterContextDB {
  id: string;
  summary: string;
  globalStory: string;
  glossary: CharacterGlossaryDB[];
}

export interface CharacterGlossaryDB {
  id: string;
  canonical_name: string;
  aliases: string[];
  gender: "male" | "female" | "nonbinary" | null;
  pronouns: string[]; // e.g., ["he","him","his"] or ["they","them","their"]
  role: string | null; // e.g., "merchant", "soldier"
  status: string | null; // alive, dead, unknown
  notes: string[];
  relevance: number; // 0 = irrelevant, 1 = critical
  last_seen_chapter: number;
  extra: Record<string, string | number | boolean | null>; // may contains any other property like rank
}

const CharacterGlossaryZod = z.object({
  id: z.string(),
  canonical_name: z.string(),
  aliases: z.array(z.string()),
  gender: z.enum(["male", "female", "nonbinary"]).nullable(),
  pronouns: z.array(z.string()),
  role: z.string().nullable(),
  status: z.string().nullable(),
  notes: z.array(z.string()),
  relevance: z.number().min(0).max(1),
  last_seen_chapter: z.number(),
  extra: z
    .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .nullable(),
});

export const GlossaryResponseZod = z.object({
  glossary: z.array(CharacterGlossaryZod),
});

export interface ChapterNavigation {
  currentChapter: number;
  isNotFirstChapter: boolean;
}
export interface ChapterViewResponse {
  bookmarkID: BookmarkDB["id"];
  book: {
    id: BookDB["id"];
    name: BookDB["name"];
    author: BookDB["author"];
  };
  navigation: ChapterNavigation;
  chapter: ChapterDB;
}
