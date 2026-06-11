import {
    Output,
    extractJsonMiddleware,
    generateText,
    stepCountIs,
    tool,
    wrapLanguageModel,
} from "ai";
import { z } from "zod";
import chalk from "chalk";
import { getAgentModel } from "../../ai/ai.config.ts";
import { ActionTracker } from "../agent/action-tracer.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import type { Plan, PlanStep } from "./types.ts";
import { createWebTools } from "./web-tools.ts";

const planSchema = z.object({
    researchSummary: z.string().optional(),
    steps: z
        .array(
            z.object({
                title: z.string(),
                description: z.string(),
                hints: z.array(z.string()).optional(),
                complexity: z.enum(["low", "medium", "high"]).optional(),
            }),
        )
        .min(1)
        .max(15),
});

function readOnlyTools(executor: ToolExecutor) {
    return {
        read_file: tool({
            description:
                "Read the content of a file from the workspace. Use a relative path to the project root.",
            inputSchema: z.object({
                path: z.string().describe("Relative file path.")
            }),
            execute: async ({ path: p }) => executor.readFile(p)
        }),

        list_files: tool({
            description: "List files and directories under a path.",
            inputSchema: z.object({
                path: z.string(),
                recursive: z.boolean().optional().default(false),
            }),
            execute: async ({ path: p, recursive }) =>
                executor.listFiles(p, recursive),
        }),

        search_files: tool({
            description:
                'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
            inputSchema: z.object({
                root: z.string().describe("Directory to search, relative to root"),
                pattern: z
                    .string()
                    .describe("Glob-like pattern using * and ** (forward slashes)"),
                content_contains: z.string().optional(),
            }),
            execute: async ({ root, pattern, content_contains }) =>
                executor.searchFiles(root, pattern, content_contains),
        }),

        analyze_codebase: tool({
            description:
                "Summarize structure: file counts, size, extensions. Read-only.",
            inputSchema: z.object({
                path: z.string().default("."),
            }),
            execute: async ({ path: p }) => executor.analyzeCodebase(p),
        }),

        list_skills: tool({
            description:
                "List absolute paths to SKILL.md files under configured skill directories (Cursor / Claude).",
            inputSchema: z.object({}),
            execute: async () => executor.listSkills(),
        }),

        read_skill: tool({
            description:
                "Read a SKILL.md file. Path must be absolute and under skill roots, or use a path returned by list_skills.",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async ({ path: p }) => executor.readSkill(p),
        }),

        create_file: tool({
            description:
                "Stage creation of a new file (not written until the user approves).",
            inputSchema: z.object({
                path: z.string(),
                content: z.string(),
            }),
            execute: async ({ path: p, content }) => executor.createFile(p, content),
        }),
    }
}

const PLAN_INSTRUCTIONS = (codebase: string, hasWeb: boolean) =>
    [
        "You are an expert technical architect designing precise, actionable implementation plans.",
        `Target Workspace: ${codebase}`,
        "",
        "CRITICAL DIRECTIVES:",
        "1. VERIFY BEFORE PLANNING: Do not hallucinate file paths, function names, or dependencies. Use your codebase tools to investigate the workspace and validate all assumptions before finalizing your plan.",
        "2. STEP ACTIONABILITY: Break the solution into 1-15 strictly sequential steps. Every step MUST be highly specific—state the exact file to modify and the precise logic to implement. Vague steps are unacceptable.",
        hasWeb
            ? "3. EXTERNAL KNOWLEDGE: Web tools are available. Use them EXCLUSIVELY to look up external library documentation, API references, or unknown dependencies. Do not use them for general coding knowledge."
            : "3. EXTERNAL KNOWLEDGE: Web tools are offline. Rely strictly on internal knowledge and codebase context.",
    ].join("\n");

export async function generatePlan(goal: string) {
    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    const executor = new ToolExecutor(tracker, config);

    const hasWeb = !!process.env.FIRECRAWL_API_KEY;
    const model = wrapLanguageModel({
        model: getAgentModel(),
        middleware: extractJsonMiddleware(),
    })

    const tools = {
        ...readOnlyTools(executor),
        ...(hasWeb ? createWebTools(tracker) : {}),
    }

    console.log(chalk.cyan("\n Researching and drafting a plan...\n"));

    const result = await generateText({
        model,
        tools,
        stopWhen: stepCountIs(20),
        system: PLAN_INSTRUCTIONS(config.codebasePath, hasWeb),
        prompt: `User goal: \n${goal}`,
        output: Output.object({ schema: planSchema }),
    });

    const validated = planSchema.parse(result.output);

    const steps: PlanStep[] = validated.steps.map((s, i) => ({
        id: `step-${i + 1}`,
        title: s.title,
        description: s.description,
        hints: s.hints,
        complexity: s.complexity,
    }));

    return { goal, researchSummary: validated.researchSummary, steps };
}