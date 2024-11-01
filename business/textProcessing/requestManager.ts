import { openAiMessage, openAiRole } from "../../models/openAi";
import { openAiDao } from "./openAiDao";
import { sharedContextManager } from "./sharedContextManager";

export class requestManager {
  private startingMessage: openAiMessage = {
    role: "system",
    content: "You are a helpful assistant.",
  };
  private currentChapterSummaryMaxSize: number;
  private globalContextSummaryMaxSize: number;
  private instanceOpenAi: openAiDao;

  constructor(
    currentChapterSummaryMaxSize: number,
    globalContextSummaryMaxSize: number
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
    instanceSharedContext: sharedContextManager
  ) {
    let currentChunk = chunk;
    const messages = [
      this.startingMessage,
      this.createMessage(
        "user",
        "Your task is to review the following chapter and rewrite the sentences where necessary to improve readability and clarity"
      ),
    ];
    if (instanceSharedContext.getGlobalContext()) {
      messages.push(
        this.createMessage(
          "user",
          "Here is the recap of main event for context: " +
            instanceSharedContext.getGlobalContext()
        )
      );
    }

    if (instanceSharedContext.getLastChapterSummary()) {
      messages.push(
        this.createMessage(
          "user",
          "Here is the recap of last chapter for context: " +
            instanceSharedContext.getLastChapterSummary()
        )
      );
    }

    // Include the combined response from previous chunks for context
    if (instanceSharedContext.getCurrentChapterText()) {
      messages.push(
        this.createMessage(
          "user",
          "Here is the previous part of the current chapter chunk that you already reworked (for context again)." +
            instanceSharedContext.getCurrentChapterText()
        )
      );
    }

    if (chunk.includes("<END_PREV_CHUNCK_OVERLAP>")) {
      const [overlap, current] = chunk.split("<END_PREV_CHUNCK_OVERLAP>");
      currentChunk = current;
      messages.push(
        this.createMessage(
          "user",
          "Here is the last few sentences of the last chunk you already reworked. Use it if you think the first sentences of your new chunk are missing parts." +
            overlap
        )
      );
    }
    // Include the current chunk
    messages.push(
      this.createMessage(
        "user",
        `Please review the following chapter chunk and rewrite sentences where necessary to improve readability and clarity. Focus on fixing grammatical errors, awkward phrasing, and sentence structure while preserving the author's original style and tone. 
        **Instructions:**
        - Provide only the revised version of the chapter, formatted as valid HTML with each paragraph enclosed in <p> tags. Most paragraphs should contain 1-2 sentences.
        - For spoken dialogue, enclose the quoted parts inside <span> tags, with each <span> tag on a new line within a separate <p> tag. Include only the spoken dialogue and any accompanying dialogue tags or descriptions. Example: <p><span>"Hello, son"</span> mom said to me while watching me work in the garden.</p>.
        - Ensure strict consistency with character pronouns (e.g., he/she/him/her) as designated in previous parts of the text. Verify each character’s pronoun usage for accuracy and do not switch pronouns for the same character.
        - Preserve any specified ranks or titles consistently throughout the text. For example, if a character is introduced as "General," retain this title without variation (except if he is promoted during the chunk obviously).
        - Do not add explanations, introductions, or conclusions before or after the text.
        - If the last sentence of the chunk is incomplete, do not rewrite or include it.
        - For any stats or data sections (e.g., items in [brackets]), place each item on a separate line for a clear, game-like display.

        The chapter chunk: ${currentChunk}`
      )
    );

    let content = await this.instanceOpenAi.makeAPICall(messages);
    const cleanedContent = content.replace(/```html|```/g, "");
    return cleanedContent;
  }

  async summarizeCurrentChapter(instanceSharedContext: sharedContextManager) {
    const messages: openAiMessage[] = [
      this.startingMessage,
      this.createMessage(
        "user",
        `Summarize the following text in under ${
          this.currentChapterSummaryMaxSize
        } tokens, Provide only the revised version, without any additional commentary. Remove any trace of html that may be present: ${instanceSharedContext.getCurrentChapterText()}`
      ),
    ];

    return await this.instanceOpenAi.makeAPICall(messages);
  }

  // Function to manage the global context size
  async manageGlobalContext(instanceSharedContext: sharedContextManager) {
    const messages: openAiMessage[] = [
      this.startingMessage,
      this.createMessage(
        "user",
        "You will be asked to summarized some content, here is the recap of the last chapter that will be useful for context: " +
          instanceSharedContext.getLastChapterSummary()
      ),
      this.createMessage(
        "user",
        `Please summarize the following context in under ${
          this.globalContextSummaryMaxSize
        } tokens. Focus on preserving key actions and the main characters' personalities and motivations. Recent events should take precedence, while earlier actions can be summarized or omitted if they are less significant to the current narrative. Ensure essential character traits and motivations are retained. There is no need to reach the token limit if all important actions are already accounted for. Remove any trace of html that may be present. ${instanceSharedContext.getGlobalContext()}`
      ),
    ];

    return await this.instanceOpenAi.makeAPICall(messages); // Update global context with a summary
  }
}
