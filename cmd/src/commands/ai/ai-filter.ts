import { Anthropic } from "@anthropic-ai/sdk";
import { input } from "@inquirer/prompts";
import type { JSONLog } from "@al/ui/models/logData";
import { getSummaryResult, type SummaryFlags } from "../summary";
import fileHelper from "@al/cmd/utils/file-helper";
import normalizer from "@al/ui/services/normalizer";
import LogData from "@al/ui/models/logData";

const MAX_LOGS_TO_SEND = 100;

interface AIContext {
  logs: string; // JSON stringified logs
  question: string;
  filter?: string;
}

/**
 * Determines if a user's question can be used to generate a filter
 */
async function shouldGenerateFilter(question: string): Promise<boolean> {
  const apiKey = Bun.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set.");
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = `You are a log analysis expert who handles logs for the Mattermost company. Given the following user question, determine if it can be used to generate a filter expression based on these log fields:
- id, fullData, timestamp, msg, level, error, Error, plugin_id, missing_plugin_id, worker, workername, scheduler_name, status_code, status, http_code

User Question: "${question}"

Respond with ONLY "yes" or "no". 
- "yes" if the question contains information that could be used to filter logs. Remember, there is a high chance that many words can be filtered with the "fullData" field.
- "no" if the question is general or doesn't contain filterable information.

Examples: 
- "show errors"
  - This can be used to filter logs with level "error", so respond with "yes"
- "find logs with status 500"
  - This can be used to filter logs with status_code 500, so respond with "yes"
- "show plugin X logs"
  - This can be used to filter logs with plugin_id "X" or missing_plugin_id "X", so respond with "yes"
- "elasticsearch not working"
  - This can be used to filter logs with fullData containing words "elasticsearch", "search", "tsvector", or similar "search" related words, so respond with "yes"
- "I'm getting a weird error"
  - This is not specific to any log field, so respond with "no"
- "What are some outliers in the logs?"
  - This is not specific to any log field, so respond with "no"
`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.content[0].text.trim().toLowerCase();
    console.log("\nShould filter:", response);
    return response === "yes";
  } catch (err) {
    console.error("Error determining if filter should be generated:", err);
    return false;
  }
}

/**
 * Generates a filter expression from a natural language query using Claude
 */
async function generateFilterExpression(query: string): Promise<string> {
  const apiKey = Bun.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set.");
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = `You are a log analysis expert for the Mattermost company. Given the following user query, generate a JavaScript filter function that can be used to filter log entries. The logs are JSON objects with these fields:
- fullData, timestamp, status_code, status, http_code

User Query: "${query}"

Generate ONLY the filter function body.
Rules for generating the filter:
- Think from a log file perspective. User may enter a query like "why my server is not starting" or "my app database indexing is slow". But a log file will likely have following logs:
  - server not starting or server failed to start
  - slow query or slow indexing or failed to index
- ALWAYS break down the "useful" words in the query into individual words to have a high chance of matching when using them in the filter. like "database indexing" should be broken down into "database" and "index".
- Use the simpler form of the words like "index" instead of "indexing". Since, the "index" word covers both "indexing" and "indexes".
- Try to find synonyms or any related words for the words in the query to have a high chance of matching when using them in the filter. like "database" and "db" are synonyms. like "elasticsearch" and "search" are related words.
- Use the "fullData" field to filter logs that contain specific words or phrases.
  - Use regular expressions to search for the words in the query.
  - In the regular expression, use multiple combinations of the words to have a high chance of matching when using them in the filter.
  - However, do not use generic words alone. For example, /not.*working/i.test(log.fullData) will not work because "not.*working" are generic words and will match any log. Whereas when used with specifc words like, /file.*not.*working/i.test(log.fullData) is okay as the "not working" combination is now being used with something specific, in this case "file".
- Use the "timestamp" field when comparing greater than or less than operators.
- Use the "status_code", "status", and "http_code" fields to filter logs that contain specific status codes.

Special case:
- To identify if a log is an error log, ALWAYS return the following filter:
  - log[level] === "error" ||
      !!log[error] ||
      !!log[Error] ||
      log[msg].toLowerCase().includes("error") ||
      log[msg].toLowerCase().includes("fail") ||
      !!(log[status_code] && log[status_code] >= "500" && log[status_code] < "600") ||
      !!(log[status] && log[status] >= "500" && log[status] < "600") ||
      !!(log[http_code] && log[http_code] >= "500" && log[http_code] < "600")

Do not include the function declaration or return statement. The function will receive a log object as its only parameter.

Examples:
- Query: "show errors related to server not starting"
  - Response: /server|server.*start|start.*server|fail.*server|server.*fail/i.test(log.fullData)
- Query: "logs with status 500"
  - Response: log.status_code >= 500 || log.status >= 500 || log.http_code >= 500
- Query: "having trouble with plugin X"
  - Response: /plugin.*X/i.test(log.fullData) && (log[level] === "error" ||
      !!log[error] ||
      !!log[Error] ||
      log[msg].toLowerCase().includes("error") ||
      log[msg].toLowerCase().includes("fail") ||
      !!(log[status_code] && log[status_code] >= "500" && log[status_code] < "600") ||
      !!(log[status] && log[status] >= "500" && log[status] < "600") ||
      !!(log[http_code] && log[http_code] >= "500" && log[http_code] < "600"))
- Query: "elasticsearch is not working"
  - Response: /elasticsearch|search|tsvector/i.test(log.fullData) && (log[level] === "error" ||
      !!log[error] ||
      !!log[Error] ||
      log[msg].toLowerCase().includes("error") ||
      log[msg].toLowerCase().includes("fail") ||
      !!(log[status_code] && log[status_code] >= "500" && log[status_code] < "600") ||
      !!(log[status] && log[status] >= "500" && log[status] < "600") ||
      !!(log[http_code] && log[http_code] >= "500" && log[http_code] < "600"))
- Query: "database indexing is slow"
  - Response: /(database|db|postgres|pq|index).*slow|slow.*(database|db|postgres|pq|index)/i.test(log.fullData)

Your response should be just the filter function body. Do not include any explanation or additional text. The function will receive a log object as its only parameter.

`;
  try {
    // Create a dummy log object just to import the LogData class
    LogData.isErrorLog({
      msg: "This is a test log",
      error: "This is a test error",
    });

    const completion = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const filterBody = completion.content[0].text.trim();
    return filterBody;
  } catch (err) {
    console.error("Error generating filter expression:", err);
    throw err;
  }
}

/**
 * Applies a filter expression to logs using JavaScript
 */
function applyFilter(logs: JSONLog[], filterBody: string): JSONLog[] {
  try {
    // Create a filter function from the body
    const filterFn = new Function("log", `return ${filterBody}`);

    // Apply the filter
    return logs.filter(filterFn);
  } catch (err) {
    console.error("Error applying filter:", err);
    throw new Error(`Invalid filter expression: ${filterBody}`);
  }
}

/**
 * Reads and processes log files
 */
async function processLogFiles(
  path: string,
  prefix: string,
  suffix: string
): Promise<JSONLog[]> {
  const filePaths = await fileHelper.getFiles(path, prefix, suffix);
  console.log(
    `Found ${filePaths.length} files matching prefix "${prefix}" and suffix "${suffix}" in "${path}"`
  );

  const allLogs: JSONLog[] = [];

  for (const filePath of filePaths) {
    const text = await Bun.file(filePath).text();
    const logsGeneratorFn = normalizer.parse(
      text,
      normalizer.getParserOptions(text),
      () => false // No filtering at this stage
    );

    for (const jsonLog of logsGeneratorFn()) {
      if (!jsonLog) continue;
      jsonLog[LogData.logKeys.fullData] = JSON.stringify(jsonLog);
      allLogs.push(jsonLog);
    }
  }

  return allLogs;
}

/**
 * Analyzes logs and answers user's question using Claude
 */
async function analyzeLogs(context: AIContext): Promise<string> {
  const apiKey = Bun.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set.");
  }

  const anthropic = new Anthropic({ apiKey });

  // Prepare the prompt with context
  let prompt = `You are a log analysis expert for the Mattermost company. Here is the user's question:
"${context.question}"

`;

  if (context.filter) {
    prompt += `A filter was applied to the logs: "${context.filter}"
`;
  }

  // Add log data if available
  if (context.logs) {
    prompt += `\nHere are the relevant log entries:
${context.logs}

`;
  }

  prompt += `Please provide a clear and detailed answer to the user's question based on the log data and your knowledge of the Mattermost app. If the logs don't contain enough information to answer definitively, say so.`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 10000,
      messages: [{ role: "user", content: prompt }],
    });

    return completion.content[0].text;
  } catch (err) {
    console.error("Error analyzing logs:", err);
    throw err;
  }
}

/**
 * Main function to handle AI-powered log analysis
 */
export async function analyzeLogsWithAI(
  summaryFlags: SummaryFlags
): Promise<void> {
  try {
    // 1. Get user's question
    const question = await input({
      message: "What would you like to know about the logs?",
    });

    // 2. Determine if we should generate a filter
    const shouldFilter = await shouldGenerateFilter(question);
    console.log("\nShould filter:", shouldFilter);
    let logsToAnalyze: string = "";
    let filterExpression: string | undefined;

    if (shouldFilter) {
      // 3a. Process log files directly
      let logs = await processLogFiles(
        summaryFlags.path,
        summaryFlags.prefix,
        summaryFlags.suffix
      );

      // 3b. Generate and apply filter
      filterExpression = await generateFilterExpression(question);
      console.log("\nGenerated filter expression:", filterExpression);

      logs = applyFilter(logs, filterExpression);
      console.log(`\nFilter matched ${logs.length} log entries.`);

      if (logs.length > 0) {
        // Show sample of filtered logs
        console.log("\nSample of filtered logs:");
        console.log(JSON.stringify(logs.slice(0, 3), null, 2));

        logs = logs.slice(0, MAX_LOGS_TO_SEND);
        logsToAnalyze = JSON.stringify(logs, null, 2);
      }
    }

    if (!shouldFilter || logsToAnalyze === "") {
      // 4. Get summary result
      const summaryResult = await getSummaryResult(summaryFlags);
      logsToAnalyze = JSON.stringify(summaryResult, null, 2);
    }

    // 5. Analyze logs and get answer
    const answer = await analyzeLogs({
      logs: logsToAnalyze,
      question,
      filter: filterExpression,
    });

    // 6. Display answer
    console.log("\nAI Analysis:");
    console.log(answer);
  } catch (err) {
    console.error("Error during AI analysis:", err);
  }
}
