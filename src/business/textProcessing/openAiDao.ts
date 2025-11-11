import OpenAI from "openai";
import { openAiMessage } from "../../models/openAi";

export class openAiDao {
  async makeAPICall(messages: openAiMessage[]) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!.trim(),
    });

    // if we want to not make the api call (for dev)
    const allowAPICall = true;
    if (!allowAPICall) {
      return "";
    }

    /*
     * Note: Prices per 1M tokens. (up to date 11/2025)
     *
     * Model         | Input   | Output
     * ------------- | ------- | -------
     * gpt-4o-mini   | $0.15   | $0.60
     * gpt-5-mini    | $0.25   | $2.00
     */
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
