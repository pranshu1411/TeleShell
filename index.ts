#!/usr/bin/env bun

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";

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

await program.parseAsync(process.argv);
