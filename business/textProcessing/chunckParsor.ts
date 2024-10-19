export class chunckParsor {
  private maxChunkSize: number;
  private overlapSize: number;
  private maxSentenceLength: number;

  constructor(
    maxChunkSize: number,
    overlapSize: number,
    maxSentenceLength: number
  ) {
    this.maxChunkSize = maxChunkSize;
    this.overlapSize = overlapSize;
    this.maxSentenceLength = maxSentenceLength;
  }

  // Function to split text into chunks
  splitTextIntoChunks(text: string) {
    const sentences = text.split(/(?<=[.!?])\s+/); // Split by sentence-ending punctuation
    const chunks: string[] = [];
    let currentChunk: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i].trim();

      // If the sentence is too long, break it down into smaller parts
      while (sentence.length > this.maxSentenceLength) {
        const part = sentence.slice(0, this.maxSentenceLength);
        chunks.push([...currentChunk, part].join(" ")); // Add current chunk + part
        sentence = sentence.slice(this.maxSentenceLength); // Remove the processed part
        currentChunk = []; // Reset current chunk for the next part
      }

      // Add the sentence to the current chunk
      currentChunk.push(sentence);

      // Check if the current chunk exceeds the maximum size
      // currentChunk.join(" ") make it so we check the number of characters not the number of element of the array
      if (currentChunk.join(" ").length >= this.maxChunkSize) {
        // Add the current chunk to the chunks array
        chunks.push(currentChunk.join(" "));

        //we keep the overlapSize last sentences
        currentChunk = currentChunk.slice(-this.overlapSize);
        currentChunk.unshift("<PREV_CHUNCK_OVERLAP>");
        currentChunk.push("</PREV_CHUNCK_OVERLAP>");
      }
    }

    // Add any remaining words as the last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }

    return chunks;
  }
}
