export type computeChapterResponse = Promise<
  | {
      success: true;
      data: { title: string; chapter: string };
    }
  | { success: false; message: string; detail?: any }
>;
