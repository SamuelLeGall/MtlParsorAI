import OpenAI from "openai";
import { openAiMessage } from "../../models/openAi";
import { zodTextFormat } from "openai/helpers/zod";
import { ParsedResponse } from "openai/resources/responses/responses";
import { CharacterGlossaryDB, GlossaryResponseZod } from "../../models/chapter";

export class openAiDao {
  async makeAPICall(instructions: string, messages: openAiMessage[]) {
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
    const response: OpenAI.Responses.Response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions,
      input: messages,
    });

    if (!response?.output_text) {
      throw new Error("Réponse KO");
    }

    return response.output_text;
  }

  async makeJSONAPICall(
    instructions: string,
    messages: openAiMessage[],
  ): Promise<{ glossary: CharacterGlossaryDB[] }> {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!.trim(),
    });

    // if we want to not make the api call (for dev)
    const allowAPICall = true;
    if (!allowAPICall) {
      return { glossary: [] };
    }

    const response: ParsedResponse<any> = await openai.responses.parse({
      model: "gpt-4o-mini",
      instructions,
      input: messages,
      text: {
        format: zodTextFormat(GlossaryResponseZod, "glossary"),
      },
    });

    if (!response?.output_parsed) {
      throw new Error("Réponse KO");
    }

    return response.output_parsed;
  }
}
