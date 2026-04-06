# How to Build Anything — Lessons from Building What's Good Here

A universal framework for building things, derived from 477 commits over 24 days building a food discovery app from scratch. These principles apply to code, businesses, habits, and life.

---

## Phase 1: Know what you're building before you build it.

We skipped this. The first commit was the entire MVP. It worked — but it meant every decision after that was reactive. We were figuring out what the app was *while* building it.

In life, this is starting a business without writing down who it's for. Starting a renovation without measuring. Starting a diet without deciding what you're actually changing.

The fix is simple: write one paragraph describing what you're making, who it's for, and what "done" looks like. That's it. Not a business plan. Not a spec doc. One paragraph. If you can't write it, you don't know what you're building yet.

---

## Phase 2: Set your standards before you start.

The design system came in Week 2. That meant 20+ commits redesigning screens that didn't have a shared visual language yet. When color tokens and typography rules finally landed, everything before it had to be retrofitted.

In life, this is setting boundaries after the relationship is already messy. Writing house rules after the roommate situation is already tense. Defining your workout routine after three weeks of random gym sessions.

The fix: decide your constraints upfront. What are the rules? What's the quality bar? What's in scope and what's not? Constraints aren't limiting — they're freeing. Once you know the rules, every decision gets faster.

---

## Phase 3: Build the skeleton before the muscles.

We built the pizza slider animation before the navigation existed. Fun features before the core flow was stable. That's natural — the fun stuff is more exciting. But those animations ended up mostly unused.

In life, this is buying furniture before the house is framed. Writing the marketing copy before the product works. Planning the launch party before you have something to launch.

The fix: build in order of dependency. What does everything else depend on? Build that first. For the app, it was: schema, API, auth, core screen, core action. Everything else is decoration until that chain works.

---

## Phase 4: Measure before you optimize.

Analytics came in Phase 10 — after the app was mostly built. That means we were flying blind for the first week of real usage. Guessing what users did instead of knowing.

In life, this is trying to lose weight without a scale. Trying to save money without tracking spending. Trying to improve at anything without a baseline measurement.

The fix: instrument early. Whatever you're building, figure out how you'll know if it's working *before* you ship it. Not after.

---

## Phase 5: Do one thing at a time.

Phase 19 was 55 commits mixing three unrelated concerns: text reviews, rebranding, and a major refactor. When something broke after that, we couldn't tell which change caused it.

In life, this is changing your diet, sleep schedule, and exercise routine all in the same week. If you feel better, you don't know why. If you feel worse, you don't know what to fix.

The fix: one concern per session. Ship the feature. Then refactor. Then rebrand. Each one gets its own commit, its own test, its own verification. It feels slower. It's faster.

---

## Phase 6: Decide once, implement once.

This is the big one. 150+ of the 477 commits were visual identity work — themes, logos, plate styles, icons. Three different themes in one week. Eight logo iterations in one day. We were designing in code, which means every experiment cost a full implementation cycle.

In life, this is repainting a room three times because you picked the color at the hardware store instead of bringing home swatches. Rewriting your resume from scratch every time instead of editing one version. Rearranging your apartment every weekend instead of sketching a layout first.

The fix: separate deciding from doing. Decide with cheap tools (sketches, mockups, notes, conversations). Implement once with expensive tools (code, paint, moving furniture). The ratio should be 80% deciding, 20% doing. We did the inverse.

---

## Phase 7: Subtract before you add.

Removing the Categories tab (Phase 23) made the app better. One less thing to navigate. One less thing to maintain. One less thing for users to think about.

In life, this is the hardest one. We default to adding. More features. More commitments. More stuff. But the best products, routines, and lives are defined by what's been removed.

The fix: before adding anything, ask "can I remove something instead?" The answer is usually yes.

---

## The Pattern

```
1. Define what done looks like
2. Set your standards
3. Build the foundation
4. Measure
5. One thing at a time
6. Decide cheap, implement once
7. Subtract before you add
```

These seven phases were figured out in 24 days by doing it wrong and then doing it right. That's the most durable way to learn anything.

---

*Derived from the build retrospective of What's Good Here. January 2026.*
