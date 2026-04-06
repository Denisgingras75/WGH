# Claude Expert Tips

How to get the most out of working with Claude Code on this project. Updated whenever patterns emerge that could save time.

---

## The #1 Rule

**State the complete desired behavior in your first message.** Before hitting send, ask yourself: "Am I describing the full scope, or just the piece I noticed first?" Discovering requirements incrementally is the single biggest time sink.

---

## Writing Better Prompts

### Describe the full scope upfront
Bad: "Fix the back button on the share prompt"
Better: "Browser back button should navigate through ALL vote flow steps (rating, review, share prompt) instead of leaving the dish page"

Why: Partial requests lead to partial solutions that need rework when the full scope emerges.

### Use the "When I / I expect / But instead" pattern
Bad: "The flow doesn't work still"
Better: "When I hit back on the rating step, I expect to go back to the yes/no step, but instead it goes to the seafood category page. The URL changes to /browse?category=seafood."

Why: This gives the trigger, expected outcome, and actual bug in one sentence. No extra rounds needed to diagnose.

### Mention relevant architecture constraints
Bad: "Add a way to block navigation during voting"
Better: "Add a way to block navigation during voting — we use BrowserRouter in App.jsx, not createBrowserRouter"

Why: Knowing constraints upfront prevents building solutions that won't work with the existing setup. You know the codebase — share what you know.

### Include diagnostic info when reporting bugs
Bad: "why can't I look at the pages anymore on localhost"
Better: "The dish page shows the error boundary crash screen. Here's the console error: [paste error]"

Why: Vague bug reports cause multiple rounds of "what do you see?" investigation.

## Working Efficiently

### Group related changes into one request
Instead of asking for one fix, testing, then asking for a related fix, batch them: "The back button should work for all vote steps AND the share prompt."

### Share error messages immediately
When something breaks, paste the exact error or describe what you see on screen. Screenshots or dev tools output save multiple rounds of "what happened?"

### Say "test it" when you want browser testing
Saying "test it on the app" or "let's test in the browser" is a clear signal to use browser automation. This works well.

### The expert prompt template
For feature requests, try to hit all of these in one message:
1. **What** — the complete behavior you want
2. **Where** — which pages/components are involved
3. **Constraints** — architecture limits you know about
4. **Edge cases** — what should happen in unusual scenarios

Example: "The browser back button should navigate backwards through vote flow steps instead of leaving the dish page. When on the rating slider, back goes to yes/no. When on the review prompt, back goes to rating. When on the share prompt, back dismisses it. Only on step 1 should back leave the page normally. We use BrowserRouter in App.jsx, not createBrowserRouter."

---

## Scorecard History

### Session: 2026-02-02 (Back button + share mechanic)
- **Grade: C+ (30/50)**
- **Biggest time sink:** Incremental scope reveal caused 3 full implementation cycles instead of 1
- **Best prompt:** Pasting the full `check_vote_rate_limit` 404 error trace — fixed in one cycle
- **Lesson learned:** Describe the full desired behavior upfront, not just the piece you noticed first
