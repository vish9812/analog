import { select, input } from "@inquirer/prompts";
import { getSummaryResult, type SummaryFlags } from "../summary";
import { Anthropic } from "@anthropic-ai/sdk";

function help(): void {
  console.log(`
AI Insights Command

Usage:

  ./analog --ai

This command provides AI-powered insights on your log summaries.
Currently, only summary-insights is supported.
`);
}

async function run() {
  // 1. Ask what to do (only summary-insights for now)
  const aiAction = await select({
    message: "What do you want to do?",
    choices: [{ name: "Get summary insights", value: "summary-insights" }],
  });

  if (aiAction !== "summary-insights") {
    console.log("Only summary-insights is supported in this version.");
    return;
  }

  // 2. Prompt for summary flags
  const path = await input({
    message: "Path to log file or folder:",
    default: ".",
  });
  const top = await input({
    message: "Max number of top logs to show:",
    default: "30",
  });
  const prefix = await input({
    message: "Prefix for log files:",
    default: "mattermost",
  });
  const suffix = await input({
    message: "Suffix for log files:",
    default: "log",
  });

  // Set summary flags before calling getSummaryData
  const summaryFlags: SummaryFlags = {
    path,
    topLogsCount: Number(top),
    prefix,
    suffix,
  };

  // 3. Run summary logic and get summary result using the shared function
  const summaryResult = await getSummaryResult(summaryFlags);

  // 4. Format and log the data sent to LLM
  const summaryForAI = JSON.stringify(summaryResult, null, 2);
  console.log("\n[DEBUG] Data sent to AI:\n", summaryForAI);

  // 5. Call Anthropic API with claude-3-7-sonnet-20250219
  const apiKey = Bun.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable not set.");
    return;
  }

  const anthropic = new Anthropic({ apiKey });
  const promptText = `You are an expert log analyst. Here is a summary of log data:\n\n${summaryForAI}\n\nPlease provide:\n- A plain-language summary of key findings\n- Any anomalies or unusual patterns\n- Suggestions for further investigation`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 5000,
      messages: [{ role: "user", content: promptText }],
    });
    console.log("\nAI Insights:\n");
    console.log(completion.content);
  } catch (err) {
    console.error("Error calling Anthropic API:", err);
  }
}

const aiCmd = { help, run };
export default aiCmd;
