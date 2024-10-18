var express = require("express");
var router = express.Router();
var OpenAI = require("openai");
const { SECRET_OPENAI_KEY } = require("../openaiSecret.json");
const currentGlobalContext = `In a harsh, post-apocalyptic world, Gu Hang rises to power as the new governor of a planet ravaged by monsters and energy storms. The previous governors faced grim fates, executed for their inability to meet the council’s tax demands within two years. Despite the council’s political maneuvering, Gu Hang takes bold steps to establish control, moving his camp outside the city, which is largely disregarded by the council.

With the support of a cruiser in orbit acting as a nuclear deterrent, he strategically eliminates multiple bandit groups and faces cultist threats as he pressures the council to act against them. Recently, Gu Hang successfully regained control of the city from a rogue general, initiating a purge of corrupt officials to replace them with loyal allies. He receives assistance from the Sisters of Battle, dedicated to eradicating cultist influence, and commands a squad of seven space marines from a nearly extinct chapter, recently freed from a century-long punishment for heresy.`;
const basetext = `The reason why Ossina was asked to screen the whole city was not to ask the girl to investigate the case.

Not professional either.

In fact, Gu Hang hopes that she can do this while distributing food throughout the city and ensuring people's livelihood.

But Gu Hang didn't have any particularly high hopes for this city-wide siege, he just did it by the way.

The main reason is that there is no particularly useful screening method.

A cultist won't let you ask him if he is, so he will directly admit it.

He also told Ossina that this matter was done conveniently, and the main task was to ensure people's livelihood.

The army that followed Gu Hang into the city has already taken control of several grain warehouses.

But at this time, a bad news came first:

The city's food reserves are not enough.

According to the regular consumption of the city's million population, there is only about 15 days of stock.

This level of grain reserves is too dangerous for a city that mainly relies on foreign trade grain imports. It seems that the previous coalition government did not understand the importance of food security at all.

But looking at it from another angle, it seems to make sense.

After Ossina took over the granary, the poor in the outer city were also counted and consumed according to the per capita standard of the governor's camp and the abandoned cave society; but before that, the alliance authorities may have never calculated it that way. They may only regard the 100,000 people in the inner city as serious people, but the poor in the outer city? Figure it out for yourself.

Of course, in fact, the food supply for the residents of the outer city must come from these grain storages, otherwise how would the residents of the outer city live? If you really gnaw the bark, you won't be able to survive 800,000 or 900,000 people.

It's just that the residents of the outer city don't eat as much as the standard population consumption calculated by Ossina. With a population of 800,000 to 900,000, it may only consume 300,000 to 500,000 people/day/food consumption a day.

On average, you can only eat one-third to one-half of your food every day, and malnutrition is normal. And here is the average, which means that some people from outside the city can eat and drink enough, and some may not be able to eat for two days in a row.

This situation is also in line with the actual situation in the city outside Fuxing City. After several months of survival in the outer city, Ossina clearly understood that the life of the residents in the outer city was really like this.

According to this standard, 15 days of food can be turned into a reserve of 30 to 40 days.

But Ossena decided that wasn't the case.

She will provide standard portions of food to the population outside Fuxing City.

Otherwise, before the governor comes, we will not have enough to eat; when the governor comes, we will still not have enough to eat... Then the governor came in vain?

At the current stage, it is an important step to establish prestige for the Governor-General to ensure that the rations are fully rationed to ensure that everyone has enough to eat.

The inner city people are indifferent to the coming governor?

Then go indifferent, is it really the era of the previous alliance? Only inner city people count as people?

During the long communication between Gu Hang and Ossina, they both made it clear that the greatest wealth of Fuxing City lies in the hundreds of thousands of people in the outer city. As long as they support the governor wholeheartedly, everything else is a paper tiger.

The rich and powerful can be overthrown and all means of production confiscated. Gu Hang does not need their support to complete his rule;

Residents in the inner city who live relatively well, don’t care if you feel resentful or not, just do things honestly, and have your own way to manage things if you dare to mess around;

In the outer city, a large number of impoverished people will have improved living conditions. They will live a better life under the Governor's benevolence, and then quickly return to the factory and work to shine for the Governor's cause .

Of course, it’s not enough to just send out food. In other words, distributing food is the basis of solidifying the governor's rule, and it is the price paid; on top of the price, how to get the harvest stably is the more challenging part for Osena.

Ossina clearly knew that just opening a warehouse to release food was not considered her own ability.

It's like no one can do it.

While paying for the food, she had to make it clear to the residents that this was a favor from the governor. Only in this way can the value of releasing grain be brought into play.

At the same time, she had to anchor on a principle from the very beginning: she couldn't support people for nothing.

She didn't intend to define this batch of food as simple relief and welfare.

Whether Fuxing City is poor or rich depends on how one judges it. To say that they are rich is to only treat the inner city people as human beings, and they are indeed quite rich, at least by the standards of this wasteland. Their wealth is based on the exploitation of the hundreds of thousands of people in the outer city.

But now, Ossina wants to see all the 800,000 or 900,000 people in the outer city as human beings, which adds such a huge burden all at once.

Judging by such standards, it is impossible to be considered rich.

Fuxing City's current reserves cannot support high welfare.

Ossina will give the residents of the outer city a normal life, but all she can give is opportunities and platforms. If they really want to live a decent life, they still have to rely on the hard work of their own hands.

This is certainly not as beneficial as directly distributing food, but Ossina would rather lose a little of the benefits of being kind to others, but also ensure that the finances of the revival city are on a relatively healthy road.

Moreover, the residents of the outer city must not lack the willingness to work hard. Ossina, who had lived in the outer city, fully believed in this.

In this regard, Ossena roughly worked out a kind of temporary system.

She will distribute food to residents outside the city without distinction, but only for a few days, and only one-third of the rations, which can ensure that people will not starve to death.

Want more, need to buy.

The government grain sales window opened will sell grain at a fair price and buy in limited quantities according to the head ratio system. Severely crack down on the behavior of gangs buying and hoarding food through other people's quotas.

For a long time to come, the grain industry will become a government-run industry, and the governor's government will do its best to ensure the stability of grain prices. Private individuals are not allowed to intervene in this industry for the time being.

As long as they can get cheap and stable food purchase channels, the basic life of residents in the outer cities can be guaranteed.

Of course, there are also a considerable number of outer city residents who have no savings. Recently, because of the war, I couldn't get a job, and my hands stopped talking.

Ossina also has supporting means.

Next, all factories, handicraft factories, and shops that have been re-controlled will absorb the employed population after reopening. The "food stamps" will be settled every day, which can be directly exchanged for food.

Ossina thought about the work point system and decided not to promote it in Fuxing City for the time being.

The administrative team she has now, just a dozen or so clerks, really can't promote the implementation of work points and replace the existing currency system.

The turbulence will be great, and stronger administrative capabilities and grassroots control are needed to do this well.

In fact, she and the dozen or so people under her can't handle even the tasks of distributing food and promoting the resumption of work and production.

But fortunately, the army will come to help her.`;

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

/* GET home page. */
router.get("/", async function (req, res, next) {
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
    basetext,
    maxChunkSize,
    overlapSize,
    maxSentenceLength
  );

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

  // try {
  //   // recap the current chapter to be used as context in the next chapter
  //   summaries.currentChapterSummary = await summarizeCurrentChapter(
  //     context.combinedResponse,
  //     currentChapterSummaryMaxSize
  //   );
  // } catch (e) {
  //   return res.render("index", {
  //     title: "Express",
  //     errorAI: e.message,
  //     data: "Error summarizing chapter.",
  //   });
  // }

  // // update the global context and integrate the currentChapterSummary
  // summaries.globalContext = await manageGlobalContext(
  //   globalContextSummaryMaxSize,
  //   summaries
  // );

  // return the processed chapter
  res.render("index", {
    title: "Express",
    dataAI: context.combinedResponse.trim(),
    data: "this is a test",
    // lastChapterSummary: summaries.lastChapterSummary,
  });
});

module.exports = router;
