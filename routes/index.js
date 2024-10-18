var express = require("express");
var router = express.Router();
var OpenAI = require("openai");
const { SECRET_OPENAI_KEY } = require("../openaiSecret.json");
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
function splitTextIntoChunks(text, maxChunkSize, overlapSize) {
  const words = text.split(" ");
  const chunks = [];
  let currentChunk = [];

  for (let i = 0; i < words.length; i++) {
    currentChunk.push(words[i]);

    // Check if the current chunk exceeds the maximum size
    if (currentChunk.join(" ").length >= maxChunkSize) {
      chunks.push(currentChunk.join(" "));
      // Prepare the next chunk with overlap
      currentChunk = currentChunk.slice(-overlapSize);
    }
  }

  // Add any remaining words as the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}
/* GET home page. */
router.get("/", async function (req, res, next) {
  const openai = new OpenAI({
    apiKey: SECRET_OPENAI_KEY,
  });

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
  const maxChunkSize = 1200; // Maximum size for each chunk
  const overlapSize = 200; // Number of overlapping tokens

  // Split the text into chunks
  const chunks = splitTextIntoChunks(text, maxChunkSize, overlapSize);
  let combinedResponse = "";

  try {
    // Process each chunk and maintain context
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const messages = [
        { role: "system", content: "You are a helpful assistant." },
      ];

      // Include the combined response from previous chunks
      if (i > 0) {
        messages.push({ role: "user", content: combinedResponse });
      }

      // Include the current chunk
      messages.push({ role: "user", content: chunk });

      //we make the api call
      const allowAPICall = false;
      if (allowAPICall) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages,
        });
        const responseContent = completion.choices[0].message.content;
        combinedResponse += responseContent + " "; // Combine responses with space for readability
      }
    }

    console.log("Final Response:", combinedResponse);
    res.render("index", {
      title: "Express",
      dataAI: combinedResponse.trim(),
      data: "this is a test",
    });
  } catch (e) {
    res.render("index", {
      title: "Express",
      errorAI: e.message,
      data: "this is a test",
    });
  }
});

module.exports = router;
