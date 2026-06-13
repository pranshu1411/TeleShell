import type { Telegraf } from "telegraf";
import { isOwner } from "./auth";
import { WELCOME } from "./constants";
import { clip, commandArg } from "./text";
import { runAgent, runAsk, runPlanSteps } from "./agent-run";
import { generatePlan } from "../plan/planner";
import { planKeyboard, planMessage, planSessions, refreshPlanUi, type PlanSession } from "./plan-session";
import { approvalDiff, approvalSessions } from "./approval-session";

export function registerHandlers(bots: Telegraf) {
    bots.command("start", async (ctx) => {
        if (!isOwner(ctx.chat.id)) {
            await ctx.reply("You are not authorized to use this bot");
            return;
        }
        await ctx.reply(WELCOME, { parse_mode: "Markdown" });
    });

    bots.command("ask", async (ctx) => {
        if (!isOwner(ctx.chat.id)) {
            await ctx.reply("You are not authorized to use this bot");
            return;
        }
        const q = commandArg(ctx.message.text, "ask");
        if (!q) {
            return ctx.reply("Usage: `/ask <your question>`", { parse_mode: "Markdown" });
        }
        await ctx.reply("Researching your query...\n");
        void runAsk(ctx, q).catch(console.error);
    });

    bots.command("agent", async (ctx) => {
        if (!isOwner(ctx.chat.id)) {
            await ctx.reply("You are not authorized to use this bot");
            return;
        }
        const goal = commandArg(ctx.message.text, "agent");
        if (!goal) {
            return ctx.reply("Usage: `/agent <your goal>`", { parse_mode: "Markdown" });
        }
        await ctx.reply("Agent is working on your task...\n");
        void runAgent(ctx, ctx.chat.id, goal).catch(console.error);
    });

    bots.command("plan", async (ctx) => {
        if (!isOwner(ctx.chat.id)) {
            await ctx.reply("You are not authorized to use this bot");
            return;
        }
        const goal = commandArg(ctx.message.text, "plan");
        if (!goal) {
            return ctx.reply("Usage: `/plan <your goal>`", { parse_mode: "Markdown" });
        }
        await ctx.reply("Agent is working on your plan...\n");
        void (async () => {
            const plan = await generatePlan(goal);
            const session: PlanSession = { plan, selected: new Set(plan.steps.map((s) => s.id)) }
            await ctx.reply(planMessage(session), { parse_mode: "Markdown", ...planKeyboard(session) });
            planSessions.set(ctx.chat.id, session);
        })().catch(console.error);
    });

    bots.action(/^plan_toggle:(.+)$/, async (ctx) => {
        if (!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = planSessions.get(ctx.chat!.id);
        if (!s) return ctx.answerCbQuery();

        const id = ctx.match[1]!;
        if (s.selected.has(id)) s.selected.delete(id);
        else s.selected.add(id);

        await refreshPlanUi(ctx, s);
        await ctx.answerCbQuery();
    });

    bots.action('plan_all', async (ctx) => {
        if (!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = planSessions.get(ctx.chat!.id);
        if (!s) return ctx.answerCbQuery();
        for (const step of s.plan.steps) s.selected.add(step.id);
        await refreshPlanUi(ctx, s);
        await ctx.answerCbQuery();
    });

    bots.action('plan_none', async (ctx) => {
        if (!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = planSessions.get(ctx.chat!.id);
        if (!s) return ctx.answerCbQuery();
        s.selected.clear();
        await refreshPlanUi(ctx, s);
        await ctx.answerCbQuery();
    });

    bots.action('plan_proceed', async (ctx) => {
        if (!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = planSessions.get(ctx.chat!.id);
        if (!s) return ctx.answerCbQuery();

        const steps = s.plan.steps.filter((step) => s.selected.has(step.id));
        if (steps.length === 0) return ctx.answerCbQuery();

        const { plan } = s;
        planSessions.delete(ctx.chat!.id);
        const list = steps.map((step, i) => `${i + 1}. ${step.title}`).join('\n');
        await ctx.editMessageText(`Executing ${steps.length} step(s)…\n\n${list}`);
        await ctx.answerCbQuery();

        void runPlanSteps(ctx, ctx.chat!.id, plan, steps).catch(console.error);
    });

    bots.action('approval_diff', async (ctx) => {
        if (!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = approvalSessions.get(ctx.chat!.id);
        if (!s) return ctx.answerCbQuery();
        await ctx.answerCbQuery();
        await ctx.reply(clip(approvalDiff(s.pending)));
    });

    bots.action('approval_accept', async (ctx) => {
        if (!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = approvalSessions.get(ctx.chat!.id);
        if (!s) return ctx.answerCbQuery();

        approvalSessions.delete(ctx.chat!.id);
        for (const a of s.pending) s.tracker.updateStatus(a.id, 'approved', true);
        const { errors } = s.executor.applyApprovedFromTracker();
        s.executor.clearStaging();

        await ctx.editMessageText('All changes applied.');
        await ctx.answerCbQuery('Applied!');
        if (errors.length) console.error(errors);
    });

    bots.action('approval_reject', async (ctx) => {
        if (!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = approvalSessions.get(ctx.chat!.id);
        if (!s) return ctx.answerCbQuery();

        approvalSessions.delete(ctx.chat!.id);
        for (const a of s.pending) s.tracker.updateStatus(a.id, 'rejected', false);
        s.executor.clearStaging();

        await ctx.editMessageText('All changes rejected. Nothing was applied.');
        await ctx.answerCbQuery('Rejected');
    });
}