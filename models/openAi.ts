export type openAiRole = "system" | "user";

export interface openAiMessage {
  role: openAiRole;
  content: string;
}
