import { openAiMessage, openAiRole } from "../../models/openAi";
import { openAiDao } from "./openAiDao";
import { sharedContextManager } from "./sharedContextManager";
import {
  chapterSummaryInstructions,
  globalSummaryInstructions,
  glossaryUpdateInstructions,
  translationInstructions,
} from "./requestManagerPrompts";
import { CharacterGlossaryDB } from "../../models/chapter";

export class requestManager {
  private translationInstructions = translationInstructions;
  private chapterSummaryInstructions = chapterSummaryInstructions;
  private globalSummaryInstructions = globalSummaryInstructions;
  private glossaryUpdateInstructions = glossaryUpdateInstructions;
  private currentChapterSummaryMaxSize: number;
  private globalContextSummaryMaxSize: number;
  private instanceOpenAi: openAiDao;

  constructor(
    currentChapterSummaryMaxSize: number,
    globalContextSummaryMaxSize: number,
  ) {
    this.instanceOpenAi = new openAiDao();
    this.currentChapterSummaryMaxSize = currentChapterSummaryMaxSize;
    this.globalContextSummaryMaxSize = globalContextSummaryMaxSize;
  }

  private createMessage(role: openAiRole, content: string) {
    return {
      role,
      content,
    };
  }

  async processChunk(
    chunk: string,
    ctx: sharedContextManager,
  ): Promise<string> {
    const inputMessages: openAiMessage[] = [];

    // 1. Previous translated chunk → assistant message
    if (ctx.getCurrentChapterChunks(1)) {
      inputMessages.push(
        this.createMessage(
          "assistant",
          "Previous translated section:\n" + ctx.getCurrentChapterChunks(1),
        ),
      );
    }

    // 2. Chapter summary → assistant message
    const lastChapterSummary = await ctx.getLastChapterSummary();
    if (lastChapterSummary) {
      inputMessages.push(
        this.createMessage(
          "assistant",
          "Last chapter summary:\n" + lastChapterSummary,
        ),
      );
    }

    // 3. Global context summary → assistant message
    const globalContext = await ctx.getStorySnapshotBeforeChapter();
    if (globalContext) {
      inputMessages.push(
        this.createMessage(
          "assistant",
          "Global story context:\n" + globalContext,
        ),
      );
    }

    // 4. Overlap from previous chunk → assistant
    if (chunk.includes("<END_PREV_CHUNCK_OVERLAP>")) {
      const [overlap, rest] = chunk.split("<END_PREV_CHUNCK_OVERLAP>");
      inputMessages.push(
        this.createMessage(
          "assistant",
          "Fragment continuation (overlap):\n" + overlap,
        ),
      );
      chunk = rest;
    }

    // 5.  Glossary of characters → assistant message
    const glossary = await ctx.getLastChapterGlossary();
    if (glossary) {
      inputMessages.push(
        this.createMessage(
          "assistant",
          "Character glossary (source of truth):\n" + JSON.stringify(glossary),
        ),
      );
    }

    // 6. The ONLY user message → the chunk itself
    inputMessages.push(this.createMessage("user", chunk));

    console.log(JSON.stringify(inputMessages));
    const html = await this.instanceOpenAi.makeAPICall(
      this.translationInstructions,
      inputMessages,
    );

    return html.replace(/```html|```/g, "");
  }

  async summarizeCurrentChapter(ctx: sharedContextManager): Promise<string> {
    const inputMessages: openAiMessage[] = [];

    const storySoFar = await ctx.getStorySnapshotBeforeChapter();
    if (storySoFar) {
      inputMessages.push(
        this.createMessage("assistant", "GLOBAL STORY SO FAR:\n" + storySoFar),
      );
    }

    const currentChapterText = ctx.getCurrentChapterText();
    if (currentChapterText) {
      inputMessages.push(
        this.createMessage(
          "user",
          `Summarize under ${this.currentChapterSummaryMaxSize} tokens :\\n` +
            currentChapterText,
        ),
      );
    }

    return await this.instanceOpenAi.makeAPICall(
      this.chapterSummaryInstructions,
      inputMessages,
    );
  }

  // Function to manage the global context size
  async manageGlobalContext(
    ctx: sharedContextManager,
    currentChapterSummary: string,
  ): Promise<string> {
    const inputMessages: openAiMessage[] = [];

    const storySoFar = await ctx.getStorySnapshotBeforeChapter();
    if (storySoFar) {
      inputMessages.push(
        this.createMessage("assistant", "PRIOR GLOBAL SUMMARY:\n" + storySoFar),
      );
    }

    if (currentChapterSummary) {
      inputMessages.push(
        this.createMessage(
          "user",
          `Chapter summary to merge, result must stay under ${this.globalContextSummaryMaxSize} tokens:` +
            currentChapterSummary,
        ),
      );
    }

    return await this.instanceOpenAi.makeAPICall(
      this.globalSummaryInstructions,
      inputMessages,
    );
  }

  // Function to update the glossary
  async updateCharactersGlossary(
    ctx: sharedContextManager,
    currentChapterSummary: string,
  ): Promise<CharacterGlossaryDB[]> {
    const inputMessages: openAiMessage[] = [];

    // get whole glossary without filtering
    const glossarySoFar = await ctx.getLastChapterGlossary(0);
    if (glossarySoFar) {
      inputMessages.push(
        this.createMessage(
          "assistant",
          "PRIOR GLOBAL GLOSSARY:\n" + JSON.stringify(glossarySoFar),
        ),
      );
    }

    if (currentChapterSummary) {
      inputMessages.push(
        this.createMessage(
          "user",
          `NEW CHAPTER SUMMARY:\\n` + currentChapterSummary,
        ),
      );
    }

    console.log(JSON.stringify(inputMessages));
    const result = await this.instanceOpenAi.makeJSONAPICall(
      this.glossaryUpdateInstructions,
      inputMessages,
    );

    if (!Array.isArray(result.glossary)) {
      return [];
    }

    return result.glossary;
  }
}
