export class chunckParsor {
  /** Max size for each chapter chunk in characters */
  private readonly maxChunkSize: number;

  /** Number of characters from the previous input text to include in the following chunk */
  private readonly overlapSize: number;

  /** Max size for each sentence in characters */
  private readonly maxSentenceLength: number;

  constructor(
    maxChunkSize: number,
    overlapSize: number,
    maxSentenceLength: number,
  ) {
    this.maxChunkSize = maxChunkSize;
    this.overlapSize = overlapSize;
    this.maxSentenceLength = maxSentenceLength;
  }

  /**
   * Convert characters to token on the basis that 1 token ≈ 4 characters
   */
  private charactersToTokens(characters: number): number {
    return 0.25 * characters;
  }

  private isSentenceTooLong(sentence: string): boolean {
    return sentence.length > this.maxSentenceLength;
  }

  /**
   * Receive an array of string of various length.
   * Fuse them into an array where each string respect the required length (except the last element).
   * @returns An array of nicely split string.
   */
  private convertToChunks(
    inputs: string[],
    targetLength: number,
    chunkSuffix = "",
  ): string[] {
    const chunks: string[] = [];
    let current: string[] = [];
    let currentLength = 0;

    for (const string of inputs) {
      const newLength = currentLength + string.length;

      if (current.length > 0 && newLength > targetLength) {
        // Adding this string overshoots the target,
        // we complete the current chunk and start a new one with the string of the current iteration
        chunks.push(`${current.join(" ")}${chunkSuffix}`);
        current = [string];
        currentLength = string.length;
      } else {
        // we add the string to the current chunk
        current.push(string);
        currentLength = newLength;
      }
    }

    if (current.length > 0) {
      chunks.push(`${current.join(" ")}${chunkSuffix}`);
    }

    return chunks;
  }

  /**
   * Splits a long sentence into smaller chunks without breaking words.
   * @returns An array of nicely split sub-sentences.
   */
  private splitSentence(sentence: string): string[] {
    const totalLength = sentence.trim().length;
    const words = sentence.trim().split(/\s+/);

    // How many chunks should we aim for?
    const chunkCount = Math.ceil(totalLength / this.maxSentenceLength);

    // Target length per chunk (balanced)
    const targetLength = totalLength / chunkCount;

    return this.convertToChunks(words, targetLength, ".");
  }

  /**
   * Splits a long text into smaller sentences that respect our required length.
   * @returns An array of nicely split sub-sentences.
   */
  private getSentencesToSpecs(text: string): string[] {
    const result: string[] = [];

    // Split by sentence-ending punctuation
    // (?=[A-ZÀ-ÖØ-Ý]) → next chunk must start with an uppercase letter, to reduce noises Dr. Mr. ...
    const sentencesRaw = text.split(
      /(?<=[.!?])(?:["')\]]+)?\s+(?=[A-ZÀ-ÖØ-Ý])/u,
    );

    // processing the sentences to respect our specs
    sentencesRaw.forEach((sentence) => {
      if (this.isSentenceTooLong(sentence)) {
        const chunks = this.splitSentence(sentence);
        result.push(...chunks);
      } else {
        result.push(sentence);
      }
    });

    return result;
  }

  private addOverlapCharactersToChunks(
    chunks: string[],
    overlapSize: number,
  ): string[] {
    const result: string[] = [];
    let overlap = "";
    chunks.forEach((chunk) => {
      if (result.length === 0) {
        result.push(chunk);
      } else {
        result.push(`${overlap}<END_PREV_CHUNCK_OVERLAP>${chunk}`);
      }

      // for each chunk, we add the XX last characters of the previous chunk
      overlap = chunk.slice(-overlapSize);
    });

    return result;
  }

  splitTextIntoChunks(text: string): string[] {
    const sentences = this.getSentencesToSpecs(text);
    console.log(
      `Spliting text... - Found ${sentences.length} sentences, which equals around ${text.length} characters. Equivalent tokens: ${this.charactersToTokens(text.length)}`,
    );

    // we create the chunks, this time to max allowed size, not balanced.
    const finalChunkSize = this.maxChunkSize - this.overlapSize;

    const chunks = this.convertToChunks(sentences, finalChunkSize);
    if (!chunks || chunks.length === 0) {
      console.error(`Parsing the text failed - ${JSON.stringify(chunks)}`);
      return [];
    } else if (chunks.length === 1) {
      return chunks;
    }

    return this.addOverlapCharactersToChunks(chunks, this.overlapSize);
  }
}
