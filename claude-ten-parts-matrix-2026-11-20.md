# The Ten Parts of the Ship: How Claude Works, Explained with The Matrix

**Purpose of this document:** A source document for NotebookLM. It explains the ten parts of an AI assistant setup such as Claude Code: model, harness, context, tools, memory, skills, MCP, agents, hooks, and plugins. It also explains where prompts and GitHub fit. Each part has a plain explanation and a match from the movie *The Matrix* (1999).

**Date:** 2026-11-20

---

## 1. The Starting Question

In *The Matrix*, Tank loads a combat training program into Neo's head. A few seconds later, Neo opens his eyes and says, "I know kung fu." Later, Trinity needs to fly a helicopter. She asks Tank for a pilot program, and it loads into her head in seconds.

Which part of a modern AI system is most like this upload?

**Answer: the skill.** A skill is a training program that loads into the AI's working memory when a task needs it.

But a skill alone does nothing. Trinity also needs a real helicopter on the roof. A full AI system has ten parts, and each part has one job.

The short version:

- **Skill** = Trinity knows how to fly the helicopter.
- **MCP** = There is a real helicopter on the roof.
- She needs both.

---

## 2. The Ten Parts in Build Order

The parts are listed in **build order**. Each part depends on the parts before it.

| # | Part | Movie match | What it is | What Claude gets | When it loads |
|---|---|---|---|---|---|
| 1 | Model | Neo's own mind | The trained brain | The thinking | Always there. Trained once. |
| 2 | Harness | The ship, the chair, and the operator | The app around the model | A way to act | Always running |
| 3 | Context | One session in the chair | Working memory with limited space | Room to work | Fills during the conversation |
| 4 | Tools | What Neo can physically do | Built-in actions | Hands | When the model asks for one |
| 5 | Memory | The crew's standing orders | A file that loads at each start | Standing instructions | At the start of every session |
| 6 | Skill | The training program | A folder of instructions and scripts | Know-how | Title always. Full text only when a task needs it. |
| 7 | MCP | The hardline, and the helicopter | A standard plug to outside apps and data | Reach | Connected once, called when necessary |
| 8 | Agent | A crew member on a mission | A second Claude with its own memory and one job | Extra hands | Starts for one task, reports, stops |
| 9 | Hooks | The ship's proximity alarm | Automatic rules that run on an event | Reliability | On its event, every time |
| 10 | Plugin | The full gear loadout | A package that delivers skills, agents, MCP links, and hooks | One-step setup | Installed once |

The parts fall into two groups:

- **The core (parts 1 to 4):** Model, Harness, Context, Tools. Every AI assistant has these.
- **What you add (parts 5 to 10):** Memory, Skill, MCP, Agent, Hooks, Plugin. These customize the assistant.

---

## 3. Each Part Explained

### Part 1: Model

**In the movie:** Neo's own mind. The programs go into it, but the mind is his. It was there before the first upload.

**In plain words:** The model is the brain. The company that makes it trains it once, before you use it. Text goes in and text comes out. The model cannot act by itself, and it does not learn from your conversations. Add-ons do not change it.

**Key point:** The model only reads text and writes text. Everything else in this list exists to give the model more to read or more ways to act.

### Part 2: Harness

**In the movie:** The ship, the chair, and the operator. Neo's mind does nothing alone. The rig connects him to the Matrix, and Tank loads the programs and finds the exits.

**In plain words:** The harness is the app around the model. The model only reads and writes text. The harness does everything else: it sends your message to the model, runs the tools the model asks for, asks you for permission, loads skills, runs hooks, and manages memory. Claude Code is a harness. The Claude app on a phone is a different harness. The same model in a different harness can do different things.

**The harness loop:**
1. The model writes which tool it wants.
2. The harness runs the tool.
3. The harness puts the result into working memory.
4. The model reads the result, and the loop repeats until the task is done.

### Part 3: Context (the context window)

**In the movie:** What Neo holds in his head during one session in the chair. When he unplugs, that session is over.

**In plain words:** The context window is all that the model can see at one time: your messages, files, tool results, and loaded skills. The space is limited. When it fills, the harness summarizes the oldest parts to make room.

**Key point:** The model reads only the context. If something is not in the context, the model does not know it. This is why skills load only when necessary, and why helper agents keep big jobs out of the main context.

### Part 4: Tools

**In the movie:** What Neo can physically do: run, jump, fight, pick up a phone. Knowledge alone moves nothing.

**In plain words:** A tool is one action that the model can ask for, such as read a file, run a command, or search the web. These tools come with the harness. MCP adds more tools from outside. A skill tells the model how to use tools well.

### Part 5: Memory

**In the movie:** The crew's standing orders. Each time someone jacks in, the same rules apply, and nobody has to say them again.

**In plain words:** The model forgets everything between conversations. Memory is a file that the harness reads at the start of each session. In Claude Code, this file is called `CLAUDE.md`. Put rules there that must always apply, such as "no filler" or "use tables".

**Memory compared to a skill:** A skill loads only when a task needs it. Memory loads every time.

### Part 6: Skill

**In the movie:** Tank loads a combat program into Neo. Seconds later, Neo knows kung fu. Trinity asks for the helicopter program only when she needs to fly.

**In plain words:** A skill is a folder of instructions, and sometimes scripts. It tells the model how to do one type of job well. The model keeps only the skill's title and a one-line description in memory. When a task needs the skill, the model reads the full instructions.

**Example:** The motion-design skill has one main file and 16 reference files about animation timing, easing, and choreography. When a task involves animation, Claude loads it.

### Part 7: MCP (Model Context Protocol)

**In the movie:** The hardline that the crew use to go between the ship and the Matrix. Without the line, there is no way in or out. Also, a pilot program is of no use without a real helicopter.

**In plain words:** MCP is a standard plug. It connects the model to apps and data outside the conversation, such as email, a calendar, a brokerage account, or GitHub. It gives the model tools. It does not teach the model how to use them well. That is the job of a skill.

### Part 8: Agent

**In the movie:** Morpheus does not do each job himself. He sends crew members on missions. Each one thinks alone and reports back.

**In plain words:** An agent is a model with a job, tools, and the freedom to do many steps. A subagent is a second copy of the model that the main one starts for a side task. It has its own context. It does the work, then sends back a short report. The main context stays clean.

### Part 9: Hooks

**In the movie:** The ship's proximity alarm. When Sentinels come near, it goes off. Nobody decides.

**In plain words:** A hook is a rule that the harness runs when an event occurs. Example: after each file edit, run the tests. The model does not choose to run a hook, and the model cannot skip it. Use a hook when something must happen every time.

### Part 10: Plugin

**In the movie:** Neo asks for guns, and full racks of gear arrive in the white loading room. One request delivers a complete loadout.

**In plain words:** A plugin is a package. One install can add skills, agents, MCP connections, hooks, and slash commands together. A plugin is not a new type of ability. It is the box that the other parts come in.

---

## 4. How the Parts Connect

Each part builds on the parts before it.

| Part | Builds on | How |
|---|---|---|
| Harness | Model | The harness sends text to the model and reads what the model writes. |
| Context | Model, Harness | The harness builds the working memory. The model reads only the working memory. |
| Tools | Harness, Context | The model asks for a tool. The harness runs it. Each result goes into the context and uses space. |
| Memory | Harness, Context | The harness reads the memory file at each start and puts it into the context. |
| Skill | Model, Harness, Context, Tools | The harness shows skill titles to the model and loads a full skill on request. A skill does not change the model; it adds text for the model to read. A skill tells the model how to use tools well. |
| MCP | Harness, Tools, Skill | The harness connects to each MCP server. MCP adds tools from outside, which work the same as built-in tools. A skill is the know-how; MCP is the access. |
| Agent | Model, Harness, Context, Tools | The harness starts each helper. A helper is a second copy of the model with its own context and its own tools. It returns a short report, which saves space. |
| Hooks | Harness, Tools | The harness runs each hook when its event occurs, for example before or after a tool runs. |
| Plugin | Harness, Skill, MCP, Agent, Hooks | The harness installs what a plugin delivers: skills, MCP connections, agents, and hooks. |

**The simplest summary:** The model only ever sees one long block of text. The other nine parts decide what goes into that text and what happens with the answer.

---

## 5. One Task, Every Part

You say: "Make a page that shows my week from my calendar."

1. The **harness** starts the session and loads your **memory** file.
2. Your message goes into the **context**. The **model** reads it.
3. The model sees the title of a dashboard **skill** and loads it. Now it knows how to build the page well.
4. It gets your events through **MCP**.
5. It sends a helper **agent** to read the events and return a summary.
6. It uses a **tool** to write the page file.
7. A **hook** checks the file automatically.

A **plugin** that you installed earlier delivered the skill, the MCP link, and the hook.

---

## 6. Where Prompts and GitHub Fit

Neither one is an eleventh part.

| | What it is | Movie match | Where it fits |
|---|---|---|---|
| Prompt | The text that the model reads | The mission order: "Tank, I need a pilot program" | Inside the context. It is the content, not a container. |
| GitHub | A website that stores files and their history | The operator's rack of program disks | Outside the ship. The add-on parts are stored there. |

### Prompts

- A prompt is any text that goes into the context for the model to read.
- The **system prompt** comes from the harness and sets the rules of the app.
- The **user prompt** is your message.
- Memory and skills are also prompts. The difference is who loads them and when: the harness loads memory every session, and a skill loads when a task needs it.

### GitHub

GitHub connects to the ten parts in three ways:

1. **Storage for the add-ons.** Skills, plugins, hooks, and `CLAUDE.md` files are plain files, so people keep them in GitHub repositories. Installing a skill often copies its files from GitHub.
2. **An outside system reached through MCP.** A GitHub MCP connection lets the model read code, open pull requests, and answer comments.
3. **The workplace.** In Claude Code, the harness copies a repository from GitHub, and the tools edit the files in that copy.

---

## 7. Where the Movie Comparison Breaks

- **The upload is not permanent.** A skill does not change the model's brain. It is a manual on the desk for one conversation. When the conversation ends, it is gone until it loads again.
- **The model does not load everything.** It reads only the titles on the shelf and opens the one program that the task needs. Loading every skill would fill the context.
- **Neo still had to practice.** A skill gives good instructions. The quality of the result still depends on the task and the model.

---

## 8. Recommended Plugins to Start With

The Claude plugin marketplace (claude.com/marketplace/plugins) listed 534 plugins on 2026-11-19. It has no "recommended" or "popular" section and shows no install counts. The picks below are a personal selection for someone who builds single-file HTML dashboards, keeps projects on GitHub, and uses standing preference files. All five carry the "Anthropic verified" badge.

### Start with these five

| Plugin | What it does | Why start with it |
|---|---|---|
| Claude Code Setup | Looks at a project and recommends hooks, skills, MCP servers, and agents | A good first install. It tells you what else is worth adding. |
| CLAUDE.md Management | Checks and updates memory files | Keeps standing rules current. |
| Frontend Design | A skill for building good-looking interfaces | Useful for HTML dashboards and tools. |
| GitHub | Connects the model to repositories through MCP | For projects and skills kept on GitHub. |
| Commit Commands | Short commands to commit, push, and open a pull request | Removes manual git steps. |

### Add later, if needed

| Plugin | Add it when |
|---|---|
| Playwright | You want the model to open pages in a browser and test them |
| Context7 | You want current library documentation looked up automatically |
| Code Review | You start to review pull requests before you merge them |

### Three cautions

1. **Install few.** Each plugin puts skill titles and tool lists into the context. More plugins means less room for the task.
2. **Keep protected data out.** Plugins such as GitHub send data to an outside service. Do not use them with protected health information or other sensitive data.
3. **A badge is not a guarantee.** Read what a plugin installs before you accept it, especially its hooks, because hooks run automatically.

### How to install

- **Desktop app:** select "+", then "Add plugins", then pick the plugin and a scope.
- **Terminal:** `claude plugin install <name>@claude-plugins-official`
- **Check:** type `/` and look for the plugin's commands, or run `claude plugin list`.

---

## 9. Glossary

| Term | Definition |
|---|---|
| Agent | A model with a job, tools, and the freedom to do many steps |
| `CLAUDE.md` | The memory file that Claude Code reads at the start of each session |
| Context window | All the text that the model can see at one time |
| Harness | The app that runs the model, its tools, and its add-ons |
| Hook | An automatic rule that the harness runs when an event occurs |
| MCP | Model Context Protocol, a standard plug that connects the model to outside systems |
| Model | The trained brain that reads and writes text |
| Plugin | A package that installs skills, agents, MCP connections, and hooks together |
| Prompt | Any text that the model reads |
| Skill | A folder of instructions that loads when a task needs it |
| Subagent | A helper agent with its own context, started by the main agent |
| System prompt | The rules that the harness gives the model at the start |
| Tool | One action that the model can ask the harness to run |

---

## 10. Questions for Review

1. Which part is most like the "I know kung fu" upload, and why?
2. Why does a skill need MCP to be useful for some tasks? Use the helicopter example.
3. What is the difference between memory and a skill?
4. Why does the model only "know" what is in the context?
5. How does a helper agent save space in the main context?
6. Why can't the model skip a hook?
7. Is a plugin a new type of ability? Explain.
8. Where do prompts fit among the ten parts?
9. Name three ways GitHub connects to the ten parts.
10. Name two ways the movie comparison is not accurate.
