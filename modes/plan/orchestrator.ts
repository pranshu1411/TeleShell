import chalk from "chalk";
import { confirm, isCancel, text } from "@clack/prompts";
import { ToolLoopAgent, stepCountIs } from "ai";
import { getAgentModel } from "../../ai/ai.config.ts";
import { ActionTracker } from "../agent/action-tracer.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { createAgentTools } from "../agent/agent-tools.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import { runApprovalFlow } from "../agent/approval.ts";
import { renderTerminalMarkdown } from "../../tui/terminal-md.ts";
import { generatePlan } from "./planner.ts";
import { printPlan, selectSteps } from "./selection.ts";
import type { PlanStep, Plan } from "./types.ts";
import { createWebTools } from "./web-tools.ts";

function planAsMd(plan: Plan): string {
    let md = `# Plan: ${plan.goal}\n\n`;
    if (plan.researchSummary) {
        md += `## Research Summary\n\n${plan.researchSummary}\n\n`;
    }
    md += `## Steps\n\n`;
    for (const step of plan.steps) {
        md += `### ${step.title}\n\n${step.description}\n\n`;
        if (step.hints && step.hints.length > 0) {
            md += `**Hints:**\n${step.hints.map(h => `- ${h}`).join('\n')}\n\n`;
        }
    }
    return md;
}

function stepPrompt(goal: string, step: PlanStep): string {
    return [`Goal: ${goal}`, `Step: ${step.title}`, step.description].join('\n');
}

export async function runPlanMode(): Promise<void> {
    console.log(chalk.bold("\n Plan Mode\n"));

    const goal = await text({
        message: "What is your plan/goal?",
    });

    if (isCancel(goal) || !goal.trim()) return;

    const plan = await generatePlan(goal);

    printPlan(plan);

    const wantsToSave = await confirm({
        message: "Save this plan to a .md file in the working directory?",
        initialValue: false,
    });

    if (!isCancel(wantsToSave) && wantsToSave) {
        const fileName = await text({
            message: "Filename",
            initialValue: "plan.md",
            validate: (v) => {
                const s = (v ?? '').trim();
                if (!s) return 'Required';
                if (s.includes('..') || s.includes('/') || s.includes('\\')) return 'No paths';
                if (!s.toLowerCase().endsWith('.md')) return 'Must end with .md';
            },
        });

        if (!isCancel(fileName)) {
            const planConfig = defaultAgentConfig();
            planConfig.tools.allowFileCreation = true;
            planConfig.tools.allowFolderCreation = false;
            planConfig.tools.allowFileModification = false;
            planConfig.tools.allowShellExecution = false;

            const planTracker = new ActionTracker();
            const planExecutor = new ToolExecutor(planTracker, planConfig);

            planExecutor.createFile(fileName as string, planAsMd(plan));
            const ok = await runApprovalFlow(planTracker);
            if (ok) planExecutor.applyApprovedFromTracker();
            planExecutor.clearStaging();
        }
    }

    const selected = await selectSteps(plan);

    if (selected.length === 0) {
        console.log(chalk.green("No steps selected."));
        return;
    }

    const proceed = await confirm({
        message: `Execute ${selected.length} steps`,
        initialValue: true,
    });

    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    const executor = new ToolExecutor(tracker, config);
    const tools = {
        ...createAgentTools(executor),
        ...createWebTools(tracker),
    }

    for (const step of selected) {
        console.log(`\n${chalk.bold(step.title)}`);
        const agent = new ToolLoopAgent({
            model: getAgentModel(),
            tools,
            stopWhen: stepCountIs(30),
        });

        const res = await agent.generate({ prompt: stepPrompt(plan.goal, step) });

        if (res.text) console.log(renderTerminalMarkdown(res.text));
    }

    const ok = await runApprovalFlow(tracker);

    if (!ok) return executor.clearStaging();

    const { errors } = executor.applyApprovedFromTracker();
    if (errors.length) {
        console.log(chalk.red('\nSome operations reported errors:\n'));
        for (const e of errors) console.log(chalk.red(`  • ${e}`));
    } else {
        console.log(chalk.green('\n✓ Applied.\n'));
    }
    executor.clearStaging();
}