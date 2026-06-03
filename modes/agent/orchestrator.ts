import { isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import { defaultAgentConfig } from "./types";
import { ActionTracker } from "./action-tracer";
import { ToolExecuter } from "./tool-executer";

export async function runAgentMode() {
    console.log(chalk.bold('\n Agent Mode \n'));

    const goal = await text({
        message: "What would you like to do?",
        placeholder: "create a new todo..."
    });
    if (isCancel(goal) || !goal.trim) {
        return;
    }

    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    const executer = new ToolExecuter(tracker, config);
}