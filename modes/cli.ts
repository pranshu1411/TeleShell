import chalk from "chalk";
import { select, isCancel } from "@clack/prompts";
import { runAgentMode } from "./agent/orchestrator";
import { runAskMode } from "./ask/orchestrator";

export async function runCliMode() {
    while (true) {
        const mode = await select({
            message: "Choose CLI's mode: ",
            options: [
                { value: "agent", label: "Agent mode" },
                { value: "plan", label: "Planner mode" },
                { value: "ask", label: "Ask mode" },
                { value: "back", label: "Back to Main Menu" }
            ],
        });

        if (isCancel(mode) || mode === "back") {
            console.log(chalk.dim("Returning to main menu..."));
            break;
        }

        if (mode === "agent") {
            await runAgentMode();
        }
        if (mode === "plan") {
            console.log(chalk.hex("#8b5cf6").bold("Switching to Planner mode..."));
        }
        if (mode === "ask") {
            await runAskMode();
        }
    }
}
