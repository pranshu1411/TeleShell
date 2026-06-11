# TeleShell

A lightweight, terminal‑centric shell that lets you interact with an AI powered "shell agent". The project demonstrates how to use the `ai` library together with `@clack` prompts to build a simple but functional command‑line assistant.

## Features

* **Wake‑up banner** – a welcoming screen generated with Figlet and `chalk`.
* **CLI entry point** – `teleshell wakeup` starts the interactive session.
* **Agent mode** – The shell starts in *agent* mode. A tiny language model receives the user's intent, writes a shell command, and executes it.
* **Diff view** – When the agent modifies files the differences are rendered in the terminal using `marked-terminal`.
* **Modular architecture** – Separate folders for `ai`, `modes`, `tui`, and core logic. New modes can be added with minimal friction.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/teleshell.git
cd teleshell

# Install dependencies – this project uses Bun
bun install

# Run the interactive shell
bun run index.ts wakeup   # or
npx teleshell wakeup
```

If you prefer Node.js you can also use `npm install` and `npm run`.

## Usage

After launching you'll see a banner and a short menu. Choose **Agent** to enter the AI‑powered shell. Enter a natural‑language prompt and the agent will

1. Parse the intent.
2. Generate a shell command.
3. Execute it.
4. Show any file diffs or output.

If you want to experiment, you can modify `ai/ai.config.ts` to point the agent to another model or adjust the temperature.

## Project Structure

```
├─ ai            # AI configuration & helpers
├─ modes         # Mode implementations (currently only *agent*)
├─ tui           # Terminal UI helpers (banner, prompts, diff renderer)
├─ index.ts      # CLI bootstrap
└─ package.json
```

## Contributing

Pull requests are welcome! If you want to add a new mode, simply create a new folder under `modes/`, expose a function named `run<ModeName>()`, and add a command in `index.ts`.

## License

MIT