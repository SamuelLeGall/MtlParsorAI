import { sourceWebsiteCode } from "./sourceWebsite.ts";

export interface sharedContext {
  lastChapterSummary: string | null;
  currentChapterSummary: string | null;
  globalContext: string | null;
  currentChapterText: string | null;
  destination: sharedContextDestination | null;
}

export interface sharedContextDestination {
  sourceSiteCode: sourceWebsiteCode;
  serieCode: number;
  serieBaseUrl: string;
  chapterFragment: string;
  chapterNumber: number;
}

export type computeChapterResponse = Promise<
  | {
      success: true;
      data: { title: string; chapter: string; lastChapterSummary: string };
    }
  | { success: false; message: string; detail?: any }
>;
