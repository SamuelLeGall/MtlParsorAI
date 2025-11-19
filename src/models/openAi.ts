/**
 * assistant : use it to give context to the model, previous model outputs to maintain continuity
 * system : long-term instructions, better to not use it at all and your the top level instructions
 * user : use it for the actual question/conversation/source text
 */
export type openAiRole = "assistant" | "user";

export interface openAiMessage {
  role: openAiRole;
  content: string;
}
