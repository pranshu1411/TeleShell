import { select, isCancel } from "@clack/prompts";
import chalk from "chalk";
import figlet from "figlet";
import { runCliMode } from "../modes/cli";
import { runTelegramMode } from "../modes/telegram";

const BANNER_FONT = 'ANSI Shadow';
const SHADOW = chalk.hex('#b00ce77b');
const FACE = chalk.hex('#efadf8c0').bold;

function printBannerWithShadow(ascii: string) {

    const bannerLines = ascii.replace(/\s+$/, '').split('\n');
    const maxLen = Math.max(...bannerLines.map((l) => l.length), 0);
    const rowWidth = maxLen + 2;

    for (const line of bannerLines) {
        console.log(SHADOW(('  ' + line).padEnd(rowWidth)));
    }
    process.stdout.write(`\x1b[${bannerLines.length}A`);
    for (const line of bannerLines) {
        console.log(FACE(line.padEnd(rowWidth)));
    }
    console.log();
}

export async function runWakeup() {
    let ascii: string;
    try {
        ascii = figlet.textSync("TeleShell", { font: BANNER_FONT });
    }
    catch (error) {
        ascii = figlet.textSync("TeleShell", { font: "Standard" });
    }

    printBannerWithShadow(ascii);

    while (true) {
        const mode = await select({
            message: "Welcome to TeleShell! Select the mode you want to use.",
            options: [
                { value: "cli", label: "CLI" },
                { value: "telegram", label: "Telegram" },
                { value: "exit", label: "Exit" }
            ]
        });

        if (isCancel(mode) || mode === "exit") {
            console.log(chalk.dim("\n Exiting..."));
            return;
        }

        if (mode === "cli") {
            await runCliMode();
        }
        else if (mode === "telegram") {
            await runTelegramMode();
        }
    }
}