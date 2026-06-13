# TeleShell

A lightweight, terminal-centric shell that lets you interact with an AI-powered assistant. The project demonstrates how to use the `ai` library together with `@clack/prompts` to build a functional command-line assistant, along with a Telegram bot integration for remote usage.

## Features

* **Wake-up Banner** – A welcoming interactive screen generated with `figlet` and `chalk`.
* **Multi-Mode Entry** – `teleshell wakeup` starts the interactive session where you can choose between **CLI** and **Telegram** modes.
* **CLI Sub-Modes**:
  * **Agent Mode**: A language model receives the user's intent, writes a shell command, and executes it. Displays diffs in the terminal using `marked-terminal`.
  * **Planner Mode**: Plan tasks and orchestrate more complex workflows.
  * **Ask Mode**: Ask general questions to the AI assistant.
* **Telegram Mode**: Run TeleShell as a Telegram bot using `telegraf`, allowing you to control and interact with the AI assistant remotely.
* **Modular Architecture** – Organized folders for `ai`, `modes` (like `agent`, `ask`, `plan`, `telegram`), and `tui`. New modes can be added with minimal friction.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed.
- (Optional) [Docker](https://www.docker.com/) and Docker Compose.
- (Optional) For Telegram mode: A Telegram bot token and your Telegram User ID.

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/teleshell.git
cd teleshell

# Install dependencies using Bun
bun install
```

### Environment Variables

For Telegram mode to work, create a `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_OWNER_ID=your_telegram_user_id
```
Make sure to configure the AI SDK environment variables depending on your chosen provider in `ai.config.ts` (e.g. `OPENAI_API_KEY`).

### Running TeleShell

```bash
# Run the interactive shell
bun run index.ts wakeup   # or
npx teleshell wakeup
```

### Running Globally (Standalone Executable)

Bun allows you to compile the entire project into a single, standalone executable. This is the cleanest way to make `teleshell` available anywhere on your system without relying on global package managers.

```bash
# Compile into an executable
bun build ./index.ts --compile --outfile teleshell
```

**Setup for Windows:**
1. Create a dedicated folder for custom scripts (e.g., `C:\Users\YourUser\bin`).
2. Move the newly generated `teleshell.exe` into this folder.
3. Add this folder to your system's `PATH` environment variable:
   - Press the Windows key, type `env`, and select **Edit the system environment variables**.
   - Click **Environment Variables...**.
   - Under *User variables*, edit **Path**, click **New**, and add the path to your new folder.
   - Click **OK** to save on all windows.
4. Restart your terminal. You can now type `teleshell wakeup` from any directory.

**Setup for macOS/Linux:**
Move the binary to a directory in your `PATH`, such as `/usr/local/bin`:
```bash
sudo mv teleshell /usr/local/bin/teleshell
```
You can now run `teleshell wakeup` globally.

### Running with Docker

Docker is a great way to run TeleShell in an isolated environment (safe for Agent operations) or to host the Telegram bot 24/7 in the background.

```bash
# Run the Telegram bot in the background
docker-compose up -d telegram

# Run the interactive CLI sandbox
docker-compose run cli
```

## Usage

After launching, you'll see a banner and a main menu.

### CLI Mode
Select **CLI** to run the local terminal UI. You'll be prompted to choose a sub-mode:
- **Agent mode**: Describe what you want to do in natural language, and the agent will generate and run the appropriate shell command.
- **Planner mode**: Useful for complex queries requiring multiple steps.
- **Ask mode**: Direct Q&A with the LLM.

### Telegram Mode
Select **Telegram** to start the Telegram bot. It will send a welcome message to the `TELEGRAM_OWNER_ID` specified in your `.env` file. You can then interact with the bot from the Telegram app.

## Project Structure

```
├─ ai            # AI configuration & core SDK integration
├─ modes         # Feature implementations: agent, ask, plan, telegram
├─ tui           # Terminal UI helpers (banner, interactive prompts)
├─ index.ts      # CLI bootstrap and entry point
└─ package.json  # Dependencies and scripts
```

## Contributing

Pull requests are welcome! If you want to add a new mode:
1. Create a new folder under `modes/` (e.g., `modes/my-mode`).
2. Expose an orchestrator function.
3. Add the command option in `tui/wakeup.ts` or `modes/cli.ts`.

## License

MIT