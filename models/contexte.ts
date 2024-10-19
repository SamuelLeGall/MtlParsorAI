export interface sharedContext {
  lastChapterSummary: string | null;
  currentChapterSummary: string | null;
  globalContext: string | null;
  currentChapterText: string | null;
}

export type computeChapterResponse = Promise<
  | {
      success: true;
      data: { title: string; chapter: string; lastChapterSummary: string };
    }
  | { success: false; message: string }
>;
