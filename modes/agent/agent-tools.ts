import { tool } from "ai";
import { z } from "zod";
import type { ToolExecutor } from "./tool-executor";

export function createAgentTools(executor: ToolExecutor) {
    return {
        read_file: tool({
            description:
                "Read the content of a file from the workspace. Use a relative path to the project root.",
            inputSchema: z.object({
                path: z.string().describe("Relative file path.")
            }),
            execute: async ({ path: p }) => executor.readFile(p)
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

        modify_file: tool({
            description:
                "Stage a full-file replacement for an existing file (pending approval).",
            inputSchema: z.object({
                path: z.string(),
                content: z.string().describe("Complete new file contents"),
            }),
            execute: async ({ path: p, content }) => executor.modifyFile(p, content),
        }),

        delete_file: tool({
            description: "Stage deletion of a file (pending approval).",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async ({ path: p }) => executor.deleteFile(p),
        }),
    };
}
