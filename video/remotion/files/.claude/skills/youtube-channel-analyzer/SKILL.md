# youtube-channel-analyzer

Analyze any YouTube channel's top-performing videos to reverse-engineer their content formula and produce a reusable SOP.

## Trigger

When the user says `/youtube-channel-analyzer <channel_url>` — e.g.:
```
/youtube-channel-analyzer https://www.youtube.com/@genuinedata
```

## Setup

The skill uses a Python venv at `.claude/skills/youtube-channel-analyzer/.venv/`. All Python commands must use this venv:
```bash
.claude/skills/youtube-channel-analyzer/.venv/bin/python3
```

If the venv doesn't exist or deps are missing, recreate it:
```bash
python3 -m venv .claude/skills/youtube-channel-analyzer/.venv
.claude/skills/youtube-channel-analyzer/.venv/bin/pip install -r .claude/skills/youtube-channel-analyzer/requirements.txt
```

## Step 1: Gather input

After receiving the channel URL, ask the user:
- **Shorts or Long-form?** (default: long)
- **How many top videos?** (default: 5)

## Step 2: Fetch data

Run the fetch script:
```bash
.claude/skills/youtube-channel-analyzer/.venv/bin/python3 .claude/skills/youtube-channel-analyzer/fetch_channel.py "<channel_url>" --top <N> --type <long|short> --cookies-from-browser <browser> --output .claude/skills/youtube-channel-analyzer/channel_data.json
```

Ask the user which browser they're logged into YouTube on (chrome, safari, firefox, etc.) for the `--cookies-from-browser` flag. This is needed because YouTube blocks unauthenticated requests.

## Step 3: Analyze

Read the output JSON file. For each video, analyze the transcript and metadata to identify:

### Per-video breakdown
- **Hook** (first 30 seconds): What technique is used to grab attention? Open loop, bold claim, question, statistic?
- **Structure**: How is the video organized? Numbered list, narrative arc, problem-solution, chronological?
- **Pacing**: How long is each section? Where are transitions?
- **Retention mechanics**: Pattern interrupts, teasers for upcoming content, curiosity gaps
- **Storytelling**: Emotional escalation, reframes, analogies, specific examples vs generalizations
- **CTA placement**: Where in the video, what type (subscribe, comment, link), how is it framed?
- **Opening pattern**: First 3 sentences — what formula do they follow?
- **Closing pattern**: Last 30 seconds — how do they end?

### Cross-video patterns (the real value)
- What formula repeats across ALL videos? (structure, hook type, CTA placement)
- What's the signature move? (a technique unique to this channel)
- What title patterns repeat? (format, power words, length)
- What's the average video length and does it vary?
- How do descriptions and tags compare?
- What topics perform best vs worst?

## Step 4: Produce deliverables

Create two files in the project root:

### 1. `channel-analysis-report.md`
A detailed breakdown including:
- Channel overview (name, subscriber context, niche, posting frequency)
- Per-video analysis table (title, views, duration, hook type, structure, key insight)
- Cross-video pattern analysis
- Key findings summary (what makes this channel work)

### 2. `channel-sop.md`
A scripting SOP extracted from the analysis. This should be written as a **reusable reference document** — someone (or an AI) should be able to read this SOP and write a new script in this channel's style. Include:

- **Channel Overview**: One paragraph summarizing the channel's formula
- **Hook Playbook**: The hook formulas used, with templates and examples from the videos
- **Script Structure Blueprint**: Step-by-step structure with timing/percentage guidelines
- **Storytelling Framework**: How claims are supported, emotional arc, signature techniques
- **Retention Mechanics**: Pattern interrupts, open loops, curiosity gaps — with examples
- **Opening & Closing Patterns**: Exact formulas with fill-in-the-blank templates
- **Title & Thumbnail Patterns**: What works, with templates
- **CTA Strategy**: Placement, framing, frequency
- **Quick Reference Card**: A one-page cheat sheet version of the entire SOP

## Important notes

- The analysis must be **niche-agnostic** — extract the formula, not the topic
- Be specific — cite exact quotes and timestamps from transcripts, not vague generalizations
- If a video has no transcript, note it and analyze based on metadata only
- The SOP should be immediately usable as a system prompt or reference for writing new scripts
