import chalk from "chalk";
import { select, isCancel } from "@clack/prompts";

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
            console.log(chalk.hex("#3b82f6").bold("Switching to Agent mode..."));
        }
        if (mode === "plan") {
            console.log(chalk.hex("#8b5cf6").bold("Switching to Planner mode..."));
        }
        if (mode === "ask") {
            console.log(chalk.hex("#ec4899").bold("Switching to Ask mode..."));

        }
    }
}
