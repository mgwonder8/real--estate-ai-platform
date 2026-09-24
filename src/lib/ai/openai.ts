import OpenAI from "openai";

let client: OpenAI | null = null;

export function isAiEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const MODEL = "gpt-4o-mini";

export interface ParsedTaskDraft {
  title: string;
  brief: string;
  siteId: string | null;
  assigneeIds: string[];
  priority: "low" | "normal" | "urgent";
  deadline: string | null;
  proofRequired: boolean;
  confidence: "high" | "medium" | "low";
  notes: string;
}

/** Parses a free-text instruction from the owner into a structured task draft. */
export async function parseTaskFromChat(input: {
  message: string;
  sites: { id: string; name: string }[];
  staff: { id: string; name: string; role: string; siteId: string }[];
}): Promise<ParsedTaskDraft> {
  const openai = getClient();

  const schema = {
    type: "object",
    properties: {
      title: { type: "string", description: "Short task title, max 10 words" },
      brief: { type: "string", description: "Fuller instructions/details for whoever does the work" },
      siteId: { type: ["string", "null"], description: "Best-matching site id from the provided list, or null if unclear" },
      assigneeIds: {
        type: "array",
        items: { type: "string" },
        description: "Ids of every staff member this task should be assigned to, matched from the provided list. Empty array if unclear.",
      },
      priority: { type: "string", enum: ["low", "normal", "urgent"] },
      deadline: { type: ["string", "null"], description: "ISO date YYYY-MM-DD if a deadline is implied, else null" },
      proofRequired: { type: "boolean", description: "Whether photo/video proof of completion should be required" },
      confidence: { type: "string", enum: ["high", "medium", "low"], description: "Your confidence in the site/assignee match" },
      notes: { type: "string", description: "Anything the owner should double-check before this task is created, empty string if none" },
    },
    required: ["title", "brief", "siteId", "assigneeIds", "priority", "deadline", "proofRequired", "confidence", "notes"],
    additionalProperties: false,
  };

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You turn a real estate site owner's short instruction into a structured task assignment. " +
          "Match the site and assignee(s) to the closest entries in the provided lists by name — be forgiving of typos, " +
          "abbreviations, and partial names. A task can be assigned to more than one staff member if the instruction " +
          "implies it (e.g. names multiple people, or says 'the team' at a site — in that case include everyone tied to that site). " +
          "If a staff member is tied to a specific site, prefer them for tasks at that site. " +
          "Default priority is 'normal' and proofRequired is true unless the instruction clearly implies otherwise. " +
          "If today's date matters, assume it is " + new Date().toISOString().slice(0, 10) + ".",
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction: input.message,
          sites: input.sites,
          staff: input.staff,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "task_draft", schema, strict: true },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI did not return a task draft");
  return JSON.parse(content) as ParsedTaskDraft;
}

/** Generates a narrative performance summary for one staff member from their task/proof history. */
export async function generateStaffPerformanceSummary(input: {
  staffName: string;
  role: string;
  taskSummaries: { title: string; status: string; priority: string; deadline: string; onTime: boolean | null }[];
}): Promise<string> {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an operations analyst for a real estate construction company. Write a short (3-5 sentence), " +
          "specific, plain-language performance summary for a staff member based on their task history. " +
          "Mention completion rate, timeliness, and any pattern worth flagging (e.g. recurring delays, high urgent-task load). " +
          "Be factual and neutral, not generic praise. No markdown headers, just prose.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

/** Generates a portfolio-wide risk/insights summary across all sites and tasks. */
export async function generatePortfolioInsights(input: {
  siteSummaries: { name: string; pending: number; inProgress: number; completed: number; approved: number; overdue: number }[];
  overdueTasks: { title: string; site: string; assignee: string; deadline: string; priority: string }[];
}): Promise<string> {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an operations analyst for a real estate construction company managing multiple active sites. " +
          "Given per-site task counts and a list of overdue tasks, write a short briefing (4-6 sentences or a tight " +
          "bulleted list) for the owner: which sites are at risk, which overdue tasks need attention first, and one " +
          "concrete recommendation. Be specific with names and numbers from the data given. No markdown headers.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}
