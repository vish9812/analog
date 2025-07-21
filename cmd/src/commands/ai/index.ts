import { select, input } from "@inquirer/prompts";
import { getSummaryResult, type SummaryFlags } from "../summary";
import { Anthropic } from "@anthropic-ai/sdk";
import { analyzeLogsWithAI } from "./ai-filter";

function help(): void {
  console.log(`
AI Insights Command

Usage:

  ./analog --ai

This command provides AI-powered insights on your log summaries.
Currently supported features:
- Get summary insights
- Ask custom questions about logs
- Filter and analyze logs using natural language
`);
}

async function run() {
  // 1. Ask what to do
  const aiAction = await select({
    message: "What do you want to do?",
    choices: [
      { name: "Get summary insights", value: "summary-insights" },
      { name: "Ask questions about logs", value: "ask-questions" },
    ],
  });

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

  // Set summary flags
  const summaryFlags: SummaryFlags = {
    path,
    topLogsCount: Number(top),
    prefix,
    suffix,
  };

  if (aiAction === "summary-insights") {
    // 3. Run summary logic and get summary result
    const summaryResult = await getSummaryResult(summaryFlags);

    // 4. Format and log the data sent to LLM
    const summaryForAI = JSON.stringify(summaryResult, null, 2);
    console.log("\n[DEBUG] Data sent to AI:\n", summaryForAI);

    // 5. Call Anthropic API
    const apiKey = Bun.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("Error: ANTHROPIC_API_KEY environment variable not set.");
      return;
    }

    const anthropic = new Anthropic({ apiKey });
    const promptText = `You are an expert log analyst. Here is a summary of log data:

${summaryForAI}

Please provide:
- A plain-language summary of key findings
- Highlight any anomalies, spikes, or outliers in the data (such as sudden increases in errors, rare events, or unexpected patterns). If you detect anomalies, list them clearly under an 'Anomalies Detected:' section.
- Suggestions for further investigation
`;

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
  } else if (aiAction === "ask-questions") {
    // Use the new AI filtering and analysis functionality
    await analyzeLogsWithAI(summaryFlags);
  }
}

const aiCmd = { help, run };
export default aiCmd;
