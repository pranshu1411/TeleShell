#!/usr/bin/env bun

import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";
import { runTelegramMode } from "./modes/telegram";

const program = new Command();

program
    .name("teleshell")
    .description("execute commands from cli.").version("0.0.0");

program
    .command("wakeup")
    .description("show banner and give options to select the mode")
    .action(
        async () => {
            await runWakeup();
        }
    );

program
    .command("telegram")
    .description("start the telegram bot directly")
    .option("--cwd <path>", "set the working directory")
    .action(
        async (options) => {
            if (options.cwd) {
                process.chdir(options.cwd);
            }
            await runTelegramMode();
        }
    );

await program.parseAsync(process.argv);
