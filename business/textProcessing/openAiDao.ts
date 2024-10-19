import { createRequire } from "module";
import OpenAI from "openai";
import { openAiMessage } from "../../models/openAi.ts";
// Load the JSON file using require because import json file as module is still experimental
const require = createRequire(import.meta.url);
const { SECRET_OPENAI_KEY } = require("../../openaiSecret.json");

export class openAiDao {
  async makeAPICall(messages: openAiMessage[]) {
    const openai = new OpenAI({
      apiKey: SECRET_OPENAI_KEY,
    });

    // if we want to not make the api call (for dev)
    const allowAPICall = false;
    if (!allowAPICall) {
      return "";
    }

    // We make the API call
    const completion: OpenAI.Chat.Completions.ChatCompletion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error("Réponse KO");
    }

    return completion.choices[0].message.content;
  }
}
