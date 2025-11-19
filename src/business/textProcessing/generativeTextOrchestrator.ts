import { computeChapterResponse } from "../../models/contexte";
import { sourceWebsiteManager } from "../sourcesWebsites/sourceWebsiteManager";
import { chunckParsor } from "./chunckParsor";
import { requestManager } from "./requestManager";
import { sharedContextManager } from "./sharedContextManager";
import { HydratedBookmark } from "../../models/bookmark";
import { ChaptersRepository } from "../chapters/ChaptersRepository";
import { CharacterGlossaryDB } from "../../models/chapter";

export class generativeTextOrchestrator {
  private tokenToCharacters(token: number): number {
    return 4 * token;
  }
  /**
   * Chunking and token budgeting for chapter translation
   * ----------------------------------------------------
   * Goal: Split chapters into chunks for translation while keeping context coherent.
   * Each chunk will include:
   *   - Previous translated chunk (will be in an assistant context)
   *   - Last chapter summary
   *   - Global summary
   *   - Character glossary
   *   - Current chunk text
   *
   * Models:
   *   gpt-4o-mini:
   *     - Context limit: 128,000 tokens
   *     - Max output: 16,384 tokens
   *   gpt-5-mini:
   *     - Context limit: 400,000 tokens
   *     - Max output: 128,000 tokens
   *
   * Guidelines for chunk sizing:
   *   1. Input + expected output must stay within model context.
   *   2. Include a buffer for safety (~10-15% of context limit).
   *   3. Overlap between chunks ensures continuity in translations.
   *   4. Average English word: ~1.3 tokens. (1 token ≈ 4 characters)
   *
   * Example calculation for gpt-4o-mini:
   *   Max context: 128,000 tokens
   *   Max output: 16,384 tokens
   *   Reserved for context (previous translation + chapter & global summaries + glossary):
   *     - Previous chunk: ~16,000 tokens
   *     - Last chapter summary: ~800 tokens
   *     - Global summary: ~2,500 tokens
   *     - Glossary: ~1,000 tokens
   *   Remaining budget for current chunk text: 128,000 - (16,000 + 800 + 2,500 + 1,000) = ~107,700 tokens
   *   But ~107,700 tokens >  Max output so we use (max output - buffer)
   *   → This is extremely generous, so typical chunks can be several thousand tokens each.
   */

  private maxChunkSize = this.tokenToCharacters(15_000);
  private overlapSize = 4; // Number of overlapping sentences
  private currentChapterSummaryMaxSize = 800; // Number of tokens for chapter summary
  private globalContextSummaryMaxSize = 2500; // Number of tokens for summary of the whole story
  private maxSentenceLength = 250; // 250 characters max per sentence
  private instanceRequestManager: requestManager;
  private instanceChaptersRepo: ChaptersRepository;
  private instanceSourceWebsite: sourceWebsiteManager;
  private instanceParsor: chunckParsor;

  constructor(
    instanceSourceWebsite: sourceWebsiteManager,
    instanceChaptersRepo = new ChaptersRepository(),
  ) {
    this.instanceSourceWebsite = instanceSourceWebsite;
    this.instanceRequestManager = new requestManager(
      this.currentChapterSummaryMaxSize,
      this.globalContextSummaryMaxSize,
    );
    this.instanceParsor = new chunckParsor(
      this.maxChunkSize,
      this.overlapSize,
      this.maxSentenceLength,
    );
    this.instanceChaptersRepo = instanceChaptersRepo;
  }

  async computeChapter(
    hydratedBookmark: HydratedBookmark,
    chapterNumber: number,
    allowBiggerLimit?: boolean,
  ): computeChapterResponse {
    // first we fetch the actual mth text from a specified website
    const sourceObject = await this.instanceSourceWebsite.fetchChapterText();
    if (!sourceObject?.data?.body) {
      return {
        success: false,
        message: `Error While fetching the chapter - Does the chapter exist ? - Serie: ${hydratedBookmark.book.name} - chapter number: ${chapterNumber}`,
      };
    }

    if (sourceObject.data.body.length > 25000 && !allowBiggerLimit) {
      return {
        success: false,
        message:
          `Error will require too many chunks to process - source chapter length is around :` +
          sourceObject.data.body.length,
        detail: {
          chunks: `here is the source url used. If it seems okay, you can try again using the button below that allow bigger chapter <br/><a href="${sourceObject.url}" target="_blank">${sourceObject.url}</a>`,
          allowBiggerLimit: true,
        },
      };
    }

    // Split the text into chunks
    const chunks = this.instanceParsor.splitTextIntoChunks(
      sourceObject.data.body,
    );

    // we expect a chapter to be around 8000 words (but i've seen some at 40K...) and generate around 2 to 3 chuncks so if more that 5 there is an issue we dont do the api calls

    if (chunks.length > 15) {
      return {
        success: false,
        message: `Error too many chunks to process even with bigger limit. (count:${chunks.length}) -  source chapter length is around ${sourceObject.data.body.length}. Here is the url : ${sourceObject.url} . Here is the base text:`,
        detail: {
          chunks,
        },
      };
    }
    if (chunks.length > 5 && !allowBiggerLimit) {
      return {
        success: false,
        message: `Error too many chunks to process. (count:${chunks.length}) -  source chapter length is around ${sourceObject.data.body.length}`,
        detail: {
          chunks: `here is the source url used. If it seems okay, you can try again using the button below that allow bigger chapter <br/><a href="${sourceObject.url}" target="_blank">${sourceObject.url}</a>`,
          allowBiggerLimit: true,
        },
      };
    }

    console.log("processing " + chunks.length + " chuncks");
    const instanceSharedContext = new sharedContextManager(
      chapterNumber,
      hydratedBookmark.book.id,
      this.instanceChaptersRepo,
    );

    // Process each chunk
    for (const chunk of chunks) {
      try {
        const content = await this.instanceRequestManager.processChunk(
          chunk,
          instanceSharedContext,
        );

        instanceSharedContext.addToCurrentChapterText(content);
      } catch (e: any) {
        console.error("processChunk en erreur - ", e.message);
        return {
          success: false,
          message: "Error processing chunk.",
        };
      }
    }

    let currentChapterSummary;
    try {
      // recap the current chapter to be used as context in the next chapter
      currentChapterSummary =
        await this.instanceRequestManager.summarizeCurrentChapter(
          instanceSharedContext,
        );
    } catch (e: any) {
      console.error("processChunk en erreur - ", e.message);
      return {
        success: false,
        message: "Error summarizing chapter.",
      };
    }

    let globalContextUpdated;
    try {
      // update the global context and integrate the currentChapterSummary
      globalContextUpdated =
        await this.instanceRequestManager.manageGlobalContext(
          instanceSharedContext,
          currentChapterSummary,
        );
    } catch (e: any) {
      console.error("processChunk en erreur - ", e.message);
      return {
        success: false,
        message: "Error creating global story snapshot.",
      };
    }

    let glossaryContextUpdated: CharacterGlossaryDB[] = [];
    try {
      glossaryContextUpdated =
        await this.instanceRequestManager.updateCharactersGlossary(
          instanceSharedContext,
          currentChapterSummary,
        );
    } catch (e: any) {
      console.error("processChunk en erreur - ", e.message);
      return {
        success: false,
        message: "Error updating glossary.",
      };
    }
    console.log("glossary updated :");
    console.log(glossaryContextUpdated);

    await this.instanceChaptersRepo.saveChapterContext(
      hydratedBookmark.book.id,
      chapterNumber,
      currentChapterSummary,
      glossaryContextUpdated,
      globalContextUpdated,
    );

    console.log("done");
    // return the processed chapter
    return {
      success: true,
      data: {
        title: sourceObject.data.title || "",
        chapter: instanceSharedContext.getCurrentChapterText() || "",
      },
    };
  }
}
