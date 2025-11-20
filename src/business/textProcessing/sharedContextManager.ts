import { ChaptersRepository } from "../chapters/ChaptersRepository";
import { CharacterGlossaryDB } from "../../models/chapter";

/**
 * This class is used to store data that can be used everywhere for the chpater that is being processed. Warning, it is a new instance for each call.
 */
export class sharedContextManager {
  private readonly chapterNumber: number;
  private readonly bookID: string;
  private currentChapterText: string[] = [];
  private readonly instanceChaptersRepository: ChaptersRepository;

  constructor(
    chapterNumberParam: number,
    bookIDParam: string,
    chaptersRepo = new ChaptersRepository(),
  ) {
    this.chapterNumber = chapterNumberParam;
    this.bookID = bookIDParam;
    this.instanceChaptersRepository = chaptersRepo;
  }

  private async getChapterSummary(
    chapterNumberParam: number,
  ): Promise<string | null> {
    return this.instanceChaptersRepository.getChapterSummary(
      this.bookID,
      chapterNumberParam,
    );
  }
  private async getStorySnapshot(
    chapterNumberParam: number,
  ): Promise<string | null> {
    return this.instanceChaptersRepository.getChapterStorySnapshot(
      this.bookID,
      chapterNumberParam,
    );
  }

  public async getLastChapterSummary(): Promise<string | null> {
    if (this.chapterNumber <= 1) {
      return null;
    }
    return this.getChapterSummary(this.chapterNumber - 1);
  }

  public async getStorySnapshotBeforeChapter(): Promise<string | null> {
    if (this.chapterNumber <= 1) {
      return null;
    }
    return this.getStorySnapshot(this.chapterNumber - 1);
  }

  public async getLastChapterGlossary(
    relevanceRequirements = 0.25, // update getChapterGlossary from instanceChaptersRepository as well
  ): Promise<CharacterGlossaryDB[] | null> {
    if (this.chapterNumber <= 1) {
      return null;
    }
    return this.instanceChaptersRepository.getChapterGlossary(
      this.bookID,
      this.chapterNumber - 1,
      relevanceRequirements,
    );
  }

  public getCurrentChapterText(): string | null {
    const currentChapterText = this.currentChapterText;
    if (currentChapterText.length === 0) {
      return null;
    }
    return currentChapterText
      .reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, "")
      .trim();
  }

  public getCurrentChapterChunks(nbChunks: number): string | null {
    if (this.currentChapterText.length === 0) {
      return null;
    }

    const chaptersChunks = this.currentChapterText.slice(-nbChunks);
    return chaptersChunks
      .reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, "")
      .trim();
  }

  /** SETTERS */

  addToCurrentChapterText(newChunckText: string): void {
    this.currentChapterText.push(newChunckText);
  }
}
