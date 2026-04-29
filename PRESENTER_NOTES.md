# Presenter notes — Smart Recipe Organizer

A plain-English script for each of the 12 slides. Each block is roughly 30–40 seconds of speech. Read it like you're explaining the project to a friend, not a professor. Total runtime when read at a calm pace: about 7–8 minutes, comfortably above the 5-minute minimum.

---

## The 5 sentences to memorize cold

If your mind goes blank, these five lines carry the whole presentation. Everything else is detail you can glance at the screen for.

1. "Smart Recipe Organizer is a full-stack web app — a React frontend, a serverless backend on Vercel, and Anthropic's Claude doing the AI work."
2. "The problem I'm solving is that recipes are stuck in messy Instagram captions, or invented on the fly when you open the fridge — neither has a good home."
3. "The most important backend decision is that the API key lives on my server, not in the browser, so nobody can steal it from Developer Tools."
4. "I have one endpoint with a `mode` field instead of two endpoints — that way adding a new feature is a small change, not a new file."
5. "I cut authentication and a real database on purpose to keep scope tight. The state layer is shaped so I can swap them in later."

---

## Slide 1 — Title

Hi everyone. My project is called **Smart Recipe Organizer**. It's a full-stack web app — meaning it has both a frontend that runs in your browser and a backend that runs on a server. The frontend is built with React, the backend is a small function hosted on Vercel, and both of them talk to Anthropic's Claude to do the actual recipe work. I'll walk you through what it does, how it's built, and then show you a live demo at the end.

---

## Slide 2 — The problem and the solution

The problem I wanted to solve is that recipes today live in messy places. They're stuck inside Instagram or TikTok captions full of hashtags and emojis, or they get invented on the fly when you open the fridge and figure out what to cook. Neither of those flows has a clean home.

So this app does two things in one place. It can generate a brand-new recipe from ingredients you already have. Or it can take a messy social-media caption and pull out a clean recipe from it. Then it lets you save, tag, and organize all of them in your own personal library.

---

## Slide 3 — The three flows you'll see in the demo

In the demo at the end I'll show three flows. **Generate** — you type in a few ingredients, the app sends them to my server, and the server asks Claude to come up with a complete recipe. **Extract** — you paste in a real Instagram or TikTok caption and the server cleans it up and returns a structured recipe. **Organize** — once you have recipes saved, you can tag them, search them, mark favorites, filter by cook time or dietary needs, and even export your whole library to a file. All three work as live network calls — nothing is faked for the demo.

---

## Slide 4 — Tech stack

The frontend is React 19, built with Vite. Routing uses React Router. For state management I used React's built-in tools — `useReducer` and Context — instead of a bigger library like Redux, because the app's state is simple and Redux would be overkill. The backend is a Vercel serverless function that talks to Claude through Anthropic's official SDK. And saved recipes live in `localStorage` in the browser. Each of these was a deliberate choice for this project's size, not just a default.

---

## Slide 5 — Architecture

This is the big picture. Three boxes. On the left, the **browser** — that's the React app the user sees. When the user does something, it sends a request to the middle box — my **serverless function on Vercel**. That function holds the secret API key, validates the request, calls Anthropic, and sends a clean response back. On the right is the **Anthropic API**.

The reason this design matters is that the API key never reaches the browser. If I had called Anthropic directly from the frontend, anyone could open Developer Tools, copy the key, and use it themselves. The serverless function is what keeps the secret on the server side.

---

## Slide 6 — One endpoint, two modes

For the API design, I made a deliberate choice. I have one endpoint — `/api/generate-recipe` — that handles both flows. The request body has a `mode` field that says either "generate" or "extract," and based on that the server picks a different prompt to send to Claude.

I went with one endpoint instead of two because everything around the call is the same — same API key check, same error handling, same client setup. If I want to add a third feature later — like scaling a recipe to a different number of servings — I just add one more branch to the switch, instead of writing a whole new file.

---

## Slide 7 — Validation and error mapping

Every way the request can fail has its own HTTP status code. If the request body is missing a field, you get a **400**. If the user uses the wrong HTTP method, **405**. If they paste something that isn't actually a recipe, the server figures that out and returns **422** with a friendly message. If the API key is missing on my server, that's a **500**. And if Anthropic itself fails, that's a **502**.

Every error response uses the same JSON shape, with an `error` field, so the frontend can handle all of them in one place. Before I added this layer, every failure looked the same in the browser — now the user actually sees a useful message about what went wrong.

---

## Slide 8 — Frontend integration

On the frontend side, there's one wrapper file called `ai.js` that the rest of the app talks to. It has two paths inside it. In **production**, it does a fetch call to my serverless function. In **development** on my laptop, it can call Anthropic directly using a local key, which makes the dev loop faster.

Both paths return exactly the same data shape, so the rest of the app doesn't know — and doesn't care — which one ran. That means I can develop without spinning up the full serverless runtime locally.

---

## Slide 9 — State management

For state — when the user clicks "Save" on a recipe, that triggers a **dispatch**. The dispatch goes through what's called a **reducer**, which is just a pure function — the only place in the app that's allowed to change the recipe library. The result gets saved into **Context**, which makes the data available everywhere in the app, and it's also written to `localStorage` so it survives a page refresh.

The reason this design matters: every action in the reducer is shaped like a future API call. So when I want to swap `localStorage` for a real database later, I replace each case with a `fetch` — the rest of the app doesn't have to change.

---

## Slide 10 — Production polish

I spent the last day or two on the kind of polish that distinguishes a demo from something you'd actually ship.

**Accessibility** — there's a skip-to-content link, focus moves correctly when the page changes, and screen readers can navigate the app properly. **An error boundary** — if something crashes while rendering, the user sees a recovery panel instead of a blank white page. **Keyboard shortcuts** — press N to go to the generator, L for the library, slash to focus search, question mark for the full help overlay. And **data export** — you can download your whole library as a JSON file and import it back, even on another device.

---

## Slide 11 — Trade-offs and future work

A few things I cut on purpose. I didn't build **authentication** — no sign-up, no login. `localStorage` means each browser is its own "user." I didn't use a **real database** for the same reason — adding it would have roughly doubled the project. And I capped image uploads at one megabyte so I don't fill up the browser's storage.

The obvious next steps if I keep building this: add real auth and a Postgres database, which is now a small change because the reducer is already shaped for it. Add a third mode that scales recipes up or down. And shareable read-only links so you can send a recipe to a friend.

---

## Slide 12 — Thank you / hand off to the demo

That's the project. One serverless function, two modes, five HTTP status codes, and a state layer that's ready for a real database when I'm ready to add one. I'm going to switch over to the live app now and walk you through it. I'll take questions after the demo.

---

## Delivery tips

A few things that will help on the day:

**Pause after every slide change.** Give the audience two beats to read the title before you start talking. It feels long to you and natural to them.

**Speak slower than feels normal.** Nerves speed everyone up. If you feel like you're going too slow, you're probably going at a normal pace.

**The slide title is your safety net.** If you blank out, just read the title out loud — the rest of the sentence usually comes back.

**It's fine to glance at these notes.** Have this file open on your phone or a second monitor. Professional presenters do this. Just don't read every word — pick up the next sentence and look up at the audience.

**For the live demo:** the script in `DEMO_SCRIPT.md` covers the flow. Practice it once end-to-end before recording or presenting. The hardest part is keeping the cursor steady — go slower than you think you need to.

**If a question stumps you:** "That's a good question — I didn't go that deep, but my instinct is…" is a perfectly professional answer. You don't have to know everything.

You've got this.
