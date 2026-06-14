import { tool } from "ai";
import { z } from "zod";
import type { ToolExecutor } from "./tool-executor";

export function createAgentTools(executor: ToolExecutor) {
    return {
        read_file: tool({
            description:
                "Read the content of a file from the workspace. Use a relative path to the project root. Can optionally specify a line range.",
            inputSchema: z.object({
                path: z.string().describe("Relative file path."),
                start_line: z.number().optional().describe("1-indexed start line"),
                end_line: z.number().optional().describe("1-indexed end line"),
            }),
            execute: async ({ path: p, start_line, end_line }) => executor.readFile(p, start_line, end_line)
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
                "Stage a full-file replacement for an existing file (pending approval). WARNING: Do NOT use this for large files. Use patch_file instead to avoid context limits and truncation.",
            inputSchema: z.object({
                path: z.string(),
                content: z.string().describe("Complete new file contents"),
            }),
            execute: async ({ path: p, content }) => executor.modifyFile(p, content),
        }),

        patch_file: tool({
            description:
                "Stage a modification to an existing file by replacing a specific string. Always prefer this over modify_file for existing files to save tokens.",
            inputSchema: z.object({
                path: z.string(),
                search_string: z.string().describe("Exact string to search for and replace. Must match the file content exactly, including whitespace and indentation."),
                replace_string: z.string().describe("The string to replace the search_string with."),
            }),
            execute: async ({ path: p, search_string, replace_string }) => executor.patchFile(p, search_string, replace_string),
        }),

        replace_lines: tool({
            description:
                "Stage a modification to an existing file by replacing a specific line range. This is the safest way to modify code.",
            inputSchema: z.object({
                path: z.string(),
                start_line: z.number().describe("1-indexed start line of the range to replace"),
                end_line: z.number().describe("1-indexed end line of the range to replace (inclusive)"),
                replacement_content: z.string().describe("The new content to insert in place of the specified lines."),
            }),
            execute: async ({ path: p, start_line, end_line, replacement_content }) => executor.replaceLines(p, start_line, end_line, replacement_content),
        }),

        delete_file: tool({
            description: "Stage deletion of a file (pending approval).",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async ({ path: p }) => executor.deleteFile(p),
        }),
        create_folder: tool({
            description:
                "Stage creation of a directory tree (pending approval). Uses mkdir -p on apply.",
            inputSchema: z.object({
                path: z.string().describe("Relative directory path"),
            }),
            execute: async ({ path: p }) => executor.createFolder(p),
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

        semantic_search: tool({
            description: "Search for a symbol's definition (classes, functions, interfaces, variables) across the codebase. Returns the file path, precise line numbers, and the source code of the definition.",
            inputSchema: z.object({
                query: z.string().describe("The exact symbol name to search for (e.g. ToolExecutor, ActionTracker)."),
            }),
            execute: async ({ query }) => executor.semanticSearch(query),
        }),

        analyze_codebase: tool({
            description:
                "Summarize structure: file counts, size, extensions. Read-only.",
            inputSchema: z.object({
                path: z.string().default("."),
            }),
            execute: async ({ path: p }) => executor.analyzeCodebase(p),
        }),

        execute_shell: tool({
            description:
                "Queue a shell command to run in the workspace after user approval. Use with care.",
            inputSchema: z.object({
                command: z.string().describe("Single command; runs with shell: true"),
            }),
            execute: async ({ command }) => executor.queueShell(command),
        }),

        execute_shell_immediate: tool({
            description:
                "Execute a command immediately and return its output mid-thought. Bypasses the approval queue. EXCLUSIVELY for read-only checks like `ls`, `cat`, `tsc --noEmit`, or `git diff`. NEVER use this for commands that modify files or state.",
            inputSchema: z.object({
                command: z.string().describe("Single read-only command; runs with shell: true"),
            }),
            execute: async ({ command }) => executor.executeImmediate(command),
        }),

        get_git_status: tool({
            description: "Get the current git status to see modified, staged, and untracked files.",
            inputSchema: z.object({}),
            execute: async () => executor.executeImmediate("git status -s"),
        }),

        get_git_diff: tool({
            description: "Get the git diff of currently modified but unstaged files. Use this to understand what you or the user just changed.",
            inputSchema: z.object({}),
            execute: async () => executor.executeImmediate("git diff"),
        }),

        spawn_background_process: tool({
            description: "Spawn a long-running background process (like a dev server, npm run dev, etc). Returns a Process ID.",
            inputSchema: z.object({
                command: z.string(),
            }),
            execute: async ({ command }) => executor.spawnBackground(command),
        }),

        read_background_log: tool({
            description: "Read the latest output lines from a background process.",
            inputSchema: z.object({
                process_id: z.string(),
                lines: z.number().optional().describe("Number of tail lines to read (default 50)"),
            }),
            execute: async ({ process_id, lines }) => executor.readBackgroundLog(process_id, lines),
        }),

        kill_background_process: tool({
            description: "Kill a running background process using its Process ID.",
            inputSchema: z.object({
                process_id: z.string(),
            }),
            execute: async ({ process_id }) => executor.killBackground(process_id),
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
    };
}
