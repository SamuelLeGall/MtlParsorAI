var express = require("express");
var router = express.Router();
var OpenAI = require("openai");
const axios = require("axios");
const cheerio = require("cheerio");
const { SECRET_OPENAI_KEY } = require("../openaiSecret.json");
const currentGlobalContext = `In a harsh, post-apocalyptic world, Gu Hang rises to power as the new governor of a planet ravaged by monsters and energy storms. The previous governors faced grim fates, executed for their inability to meet the council’s tax demands within two years. Despite the council’s political maneuvering, Gu Hang takes bold steps to establish control, moving his camp outside the city, which is largely disregarded by the council.

With the support of a cruiser in orbit acting as a nuclear deterrent, he strategically eliminates multiple bandit groups and faces cultist threats as he pressures the council to act against them. Recently, Gu Hang successfully regained control of the city from a rogue general, initiating a purge of corrupt officials to replace them with loyal allies. He receives assistance from the Sisters of Battle, dedicated to eradicating cultist influence, and commands a squad of seven space marines from a nearly extinct chapter, recently freed from a century-long punishment for heresy.`;

// Function to split text into chunks
function splitTextIntoChunks(
  text,
  maxChunkSize,
  overlapSize,
  maxSentenceLength
) {
  const sentences = text.split(/(?<=[.!?])\s+/); // Split by sentence-ending punctuation
  const chunks = [];
  let currentChunk = [];

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim();

    // If the sentence is too long, break it down into smaller parts
    while (sentence.length > maxSentenceLength) {
      const part = sentence.slice(0, maxSentenceLength);
      chunks.push([...currentChunk, part].join(" ")); // Add current chunk + part
      sentence = sentence.slice(maxSentenceLength); // Remove the processed part
      currentChunk = []; // Reset current chunk for the next part
    }

    // Add the sentence to the current chunk
    currentChunk.push(sentence);

    // Check if the current chunk exceeds the maximum size
    // currentChunk.join(" ") make it so we check the number of characters not the number of element of the array
    if (currentChunk.join(" ").length >= maxChunkSize) {
      // Add the current chunk to the chunks array
      chunks.push(currentChunk.join(" "));

      //we keep the overlapSize last sentences
      currentChunk = currentChunk.slice(-overlapSize);
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

async function makeAPICall(messages) {
  const openai = new OpenAI({
    apiKey: SECRET_OPENAI_KEY,
  });

  // if we want to not make the api call (for dev)
  const allowAPICall = true;
  if (!allowAPICall) {
    return "";
  }

  // We make the API call
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });

  if (!completion?.choices?.[0]?.message?.content) {
    throw new Error("Réponse KO");
  }

  return completion.choices[0].message.content;
}

async function processChunk(chunk, context) {
  const { combinedResponse, previousChapterSummary, globalContext } = context;

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    {
      role: "user",
      content:
        "Your task is to review the following chapter and rewrite the sentences where necessary to improve readability and clarity",
    },
  ];
  if (globalContext) {
    messages.push({
      role: "user",
      content: "Here is the recap of main event for context: " + globalContext,
    });
  }
  if (previousChapterSummary) {
    messages.push({
      role: "user",
      content:
        "Here is the recap of last chapter for context: " +
        previousChapterSummary,
    });
  }

  // Include the combined response from previous chunks for context
  if (combinedResponse !== "") {
    messages.push({
      role: "user",
      content:
        "Here is the previous part of the current chapter chunk that you already reworked (for context again)." +
        combinedResponse,
    });
  }
  // Include the current chunk
  messages.push({
    role: "user",
    content: `Please review the following chapter chunk and rewrite the sentences where necessary to improve readability and clarity. Focus on fixing grammatical errors, awkward phrasing, or sentence structure issues while preserving the author's original style and tone. 

  **Instructions:**
  - Provide only the revised version of the chapter, formatted as valid HTML with each paragraph enclosed in <p> tags.
  - For spoken dialogue, enclose the quoted parts inside <span> tags.
  - Do not add any explanations, introductions, or conclusions before or after the text.
  - Ignore any text within <PREV_CHUNCK_OVERLAP> tags.
  - Do not rewrite or include the last incomplete sentence of the chunk if it exists. 
  - If the content inside <PREV_CHUNCK_OVERLAP> is not included in the previous chunk, you may use it for context only. 

  The chapter chunk: ${chunk}`,
  });

  let content = await makeAPICall(messages);
  const cleanedContent = content.replace(/```html|```/g, "");
  return cleanedContent;
}

const summaries = {
  lastChapterSummary: null,
  currentChapterSummary: null,
  globalContext: currentGlobalContext,
};
function updateSummaries() {
  if (!summaries.currentChapterSummary) {
    return;
  }

  summaries.lastChapterSummary = summaries.currentChapterSummary;
  summaries.currentChapterSummary = null;
}

async function summarizeCurrentChapter(
  combinedResponse,
  currentChapterSummaryMaxSize
) {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    {
      role: "user",
      content: `Summarize the following text in under ${currentChapterSummaryMaxSize} tokens, Provide only the revised version, without any additional commentary. Remove any trace of html that may be present: ${combinedResponse}`,
    },
  ];

  return await makeAPICall(messages);
}

// Function to manage the global context size
async function manageGlobalContext(
  globalContextSummaryMaxSize,
  summariesParam
) {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    {
      role: "user",
      content:
        "You will be asked to summarized some content, here is the recap of the last chapter that will be useful for context: " +
        summariesParam.lastChapterSummary,
    },
    {
      role: "user",
      content: `Please summarize the following context in under ${globalContextSummaryMaxSize} tokens. Focus on preserving key actions and the main characters' personalities and motivations. Recent events should take precedence, while earlier actions can be summarized or omitted if they are less significant to the current narrative. Ensure essential character traits and motivations are retained. There is no need to reach the token limit if all important actions are already accounted for. Remove any trace of html that may be present. ${summariesParam.globalContext}`,
    },
  ];

  return await makeAPICall(messages); // Update global context with a summary
}
async function fetchUrlHTML(url) {
  try {
    const response = await axios.get(url);
    return { sucess: true, data: response.data };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message || JSON.stringify(error) };
  }
}
async function fetchChapterText(url, codeWebsiteSource) {
  try {
    const response = await fetchUrlHTML(url);

    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    let chapterData = {
      title: null,
      body: null,
    };

    // mapping to get title and libelle depending on the source website
    switch (codeWebsiteSource) {
      case "WTR_LAB":
      default:
        console.log("source is wtr-lab");
        scriptContent = JSON.parse($("#__NEXT_DATA__").html()); // Use .html() to get inner HTML
        chapterData.title =
          scriptContent?.props?.pageProps?.serie?.chapter_data?.data?.title;
        chapterData.body =
          scriptContent?.props?.pageProps?.serie?.chapter_data?.data?.body.join(
            " "
          );
        break;
    }

    return { sucess: true, data: chapterData };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message || JSON.stringify(error) };
  }
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  // return the processed chapter
  res.render("index", {
    title: "MtlParsorAI",
  });
});
router.post("/load", async function (req, res, next) {
  const url =
    req.body.url ||
    "https://wtr-lab.com/en/serie-4635/start-with-planetary-governor/chapter-96";
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
  */
  const maxChunkSize = 1200 * 4; // Maximum size for each chunk (*4 because we work with characters not token)
  const overlapSize = 4; // Number of overlapping sentences
  const currentChapterSummaryMaxSize = 500; // Number of tokens for chapter summary
  const globalContextSummaryMaxSize = 1500; // Number of tokens for summary of the whole story
  const maxSentenceLength = 250; // 250 characters max per sentence

  const sourceObject = await fetchChapterText(url, "WTR_LAB");

  // we update the summaries
  updateSummaries();

  // we create the context for the current chapter
  const context = {
    combinedResponse: "",
    previousChapterSummary: summaries.lastChapterSummary,
    globalContext: summaries.globalContext,
  };

  // Split the text into chunks
  const chunks = splitTextIntoChunks(
    sourceObject.data.body,
    maxChunkSize,
    overlapSize,
    maxSentenceLength
  );

  // we expect a chapter to generate around 2 to 3 chuncks so if more that 4 there is an issue we dont do the api calls
  if (chunks.length >= 4) {
    return res.render("index", {
      title: "Express",
      errorAI: `Error too many chunks to process. (count:${chunks.length})`,
      data: `Error too many chunks to process. (count:${chunks.length})`,
    });
  }

  // Process each chunk
  for (const chunk of chunks) {
    try {
      const content = await processChunk(chunk, context);
      context.combinedResponse += content; // Accumulate the responses
    } catch (e) {
      return res.render("index", {
        title: "Express",
        errorAI: e.message,
        data: "Error processing chunk.",
      });
    }
  }

  try {
    // recap the current chapter to be used as context in the next chapter
    summaries.currentChapterSummary = await summarizeCurrentChapter(
      context.combinedResponse,
      currentChapterSummaryMaxSize
    );
  } catch (e) {
    return res.render("index", {
      title: "Express",
      errorAI: e.message,
      data: "Error summarizing chapter.",
    });
  }

  // update the global context and integrate the currentChapterSummary
  summaries.globalContext = await manageGlobalContext(
    globalContextSummaryMaxSize,
    summaries
  );

  console.log("done");
  // return the processed chapter
  res.render("chapter", {
    title: sourceObject.data.title,
    chapter: context.combinedResponse.trim(),
    lastChapterSummary: summaries.lastChapterSummary,
  });
});

module.exports = router;
