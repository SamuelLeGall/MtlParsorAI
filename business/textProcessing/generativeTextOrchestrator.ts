import { computeChapterResponse } from "../../models/contexte.ts";
import { sourceWebsiteCode } from "../../models/sourceWebsite.ts";
import { sourceWebsiteManager } from "../sourcesWebsites/sourceWebsiteManager.ts";
import { chunckParsor } from "./chunckParsor.ts";
import { requestManager } from "./requestManager.ts";
import { sharedContextManager } from "./sharedContextManager.ts";

export class generativeTextOrchestrator {
  /*
    maxChunkSize (1200 tokens) is based on :
      - Average Word Length: English words typically average about 4 tokens per word (including spaces and punctuation).
        Expected Chapter Size: An average chapter might contain around 10,000 words, which translates to roughly 40,000 tokens. 
      - Given the model's context limit of 128,000 tokens, it’s crucial to break down the input to fit the manageable size.
      - Buffer for Responses: The model can output a maximum of 16,384 tokens. To ensure there's enough space for the model's response, 
        the input is kept well below the maximum context limit to avoid cutting off responses or running out of context.

    overlapSize = The purpose of the overlap is to ensure that context is preserved across chunks. 
    This way, when you process the second chunk, it can reference the end of the first chunk, minimizing potential 
    information loss and helping the model maintain a coherent understanding of the narrative.

    We currently stop the process for chapter bigger that 22000 characters (around 225/250 sentences). We can with a param in the body allow to go way higher (600 to 700 sentences).
  */
  private maxChunkSize = 1200 * 4; // Maximum size for each chunk (*4 because we work with characters not token)
  private overlapSize = 4; // Number of overlapping sentences
  private currentChapterSummaryMaxSize = 500; // Number of tokens for chapter summary
  private globalContextSummaryMaxSize = 1500; // Number of tokens for summary of the whole story
  private maxSentenceLength = 250; // 250 characters max per sentence
  private instanceRequestManager: requestManager;
  private instanceSharedContext: sharedContextManager;
  private instanceSourceWebsite: sourceWebsiteManager;
  private instanceParsor: chunckParsor;

  constructor(sourceCode: sourceWebsiteCode) {
    this.instanceRequestManager = new requestManager(
      this.currentChapterSummaryMaxSize,
      this.globalContextSummaryMaxSize
    );
    this.instanceSharedContext = new sharedContextManager();
    this.instanceSourceWebsite = new sourceWebsiteManager(sourceCode);
    this.instanceParsor = new chunckParsor(
      this.maxChunkSize,
      this.overlapSize,
      this.maxSentenceLength
    );
  }

  async computeChapter(
    url: string,
    allowBiggerLimit?: boolean
  ): computeChapterResponse {
    // first we fetch the actual mth text from a specified website
    const sourceObject = await this.instanceSourceWebsite.fetchChapterText(url);
    if (!sourceObject?.data?.body) {
      return {
        success: false,
        message: `Error While fetching the chapter - Does the chapter exist ? - ${url}`,
      };
    }

    if (sourceObject.data.body.length > 25000 && !allowBiggerLimit) {
      return {
        success: false,
        message:
          `Error will require too many chunks to process - source chapter length is around :` +
          sourceObject.data.body.length,
        detail: {
          chunks: "here is the url used to eventually do it anyway" + url,
          allowBiggerLimit: true,
        },
      };
    }

    // we update the summaries
    this.instanceSharedContext.updateSummaries();

    // Split the text into chunks
    const chunks = this.instanceParsor.splitTextIntoChunks(
      sourceObject.data.body
    );

    // we expect a chapter to be around 8000 words (but i've seen some at 40K...) and generate around 2 to 3 chuncks so if more that 5 there is an issue we dont do the api calls
    if ((chunks.length > 5 && !allowBiggerLimit) || chunks.length > 15) {
      return {
        success: false,
        message: `Error too many chunks to process. (count:${chunks.length}) -  source chapter length is around ${sourceObject.data.body.length}`,
        detail: {
          chunks,
        },
      };
    }

    console.log("processing " + chunks.length + " chuncks");

    // Process each chunk
    for (const chunk of chunks) {
      try {
        const content = await this.instanceRequestManager.processChunk(
          chunk,
          this.instanceSharedContext
        );

        this.instanceSharedContext.addToCurrentChapterText(content);
      } catch (e: any) {
        console.error("processChunk en erreur - ", e.message);
        return {
          success: false,
          message: "Error processing chunk.",
        };
      }
    }

    try {
      // recap the current chapter to be used as context in the next chapter
      const currentChapterSummary =
        await this.instanceRequestManager.summarizeCurrentChapter(
          this.instanceSharedContext
        );
      this.instanceSharedContext.setCurrentChapterSummary(
        currentChapterSummary
      );
    } catch (e: any) {
      console.error("processChunk en erreur - ", e.message);
      return {
        success: false,
        message: "Error summarizing chapter.",
      };
    }

    // update the global context and integrate the currentChapterSummary
    const globalContextUpdated =
      await this.instanceRequestManager.manageGlobalContext(
        this.instanceSharedContext
      );
    this.instanceSharedContext.updateGlobalContext(globalContextUpdated);

    console.log("done");
    // return the processed chapter
    return {
      success: true,
      data: {
        title: sourceObject.data.title || "",
        chapter: this.instanceSharedContext.getCurrentChapterText() || "",
        lastChapterSummary:
          this.instanceSharedContext.getLastChapterSummary() || "",
      },
    };
  }
}
