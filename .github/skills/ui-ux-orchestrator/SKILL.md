---
name: ui-ux-orchestrator
description: "Use when the task is to design, critique, refine, or implement UI/UX for dashboards, landing pages, product screens, forms, or Figma-driven handoffs. Triggers on design, taste, polish, discovery, audit, Figma, accessibility, and anti-slop UI work."
---

# UI/UX Orchestrator

Use this skill when the request is about interface quality rather than pure feature logic. It combines taste-first exploration, structured UX discovery, Figma/context readiness checks, implementation guidance, and final critique.

## Core Rule

Do not jump straight to implementation if the intent, audience, or visual direction is unclear.

If the request is vague, first discover the product goal and visual constraints. If the request is specific, preserve the existing design system and focus on the requested surface.

## Operating Sequence

1. Classify the request.
2. Read the project context that already exists.
3. Identify whether this is discovery, redesign, implementation, critique, or Figma handoff.
4. If the direction is unclear, ask the smallest useful set of high-leverage questions.
5. If the direction is clear, keep the workflow moving and avoid over-questioning.
6. Produce one or more design directions before building when the surface is new or high impact.
7. Implement using the existing stack, tokens, components, and content patterns.
8. Validate the result for hierarchy, consistency, accessibility, state coverage, and polish.

## Decision Tree

### If the user is exploring an idea

Run a discovery pass first.

Ask about:

- target user and primary job to be done;
- the main conversion or task goal;
- existing brand or design constraints;
- examples of interfaces they like or dislike;
- must-keep content, flows, or states.

After each answer, synthesize what changed before asking the next question.

### If the user wants a new surface

Prefer a taste-first workflow.

Compare 2 to 3 viable directions before settling on one if the aesthetic or structure is not already fixed. Route by intent, not by buzzwords.

### If the user wants a redesign

Audit what must remain intact before changing anything.

Preserve:

- core user journeys;
- SEO or discoverability constraints;
- existing component contracts;
- brand cues that are already working;
- any accessibility behavior that should not regress.

### If the user provides Figma or design-system context

Treat the design source as evidence, not inspiration.

Check:

- layer and component naming;
- descriptions and purpose clarity;
- token binding instead of raw values;
- states, variants, and responsive behavior;
- accessibility annotations and interaction affordances;
- whether the file is actually ready for agent consumption.

If key context is missing, name the missing pieces instead of guessing.

## Taste And Anti-Slop Rules

Avoid generic SaaS output and template reuse unless the user explicitly asks for it.

Reject patterns like:

- random purple or neon gradients as the main identity;
- glassmorphism used as decoration rather than structure;
- bounce-heavy motion with no functional purpose;
- identical card grids with no hierarchy;
- emoji-as-icon systems;
- all-caps headings everywhere;
- decorative blobs and glow effects that do not carry meaning;
- copy that sounds like placeholder marketing.

Prefer purposeful hierarchy, clear information scent, and restrained motion.

## Implementation Guidance

When writing or editing UI:

- use the project’s existing component system when one exists;
- extend tokens before hardcoding new values;
- keep typography, spacing, and color decisions consistent across the surface;
- include loading, empty, error, disabled, and partial states when relevant;
- make responsiveness intentional for mobile, tablet, and desktop;
- preserve keyboard navigation, focus visibility, and semantic structure.

If the design system does not exist yet, establish the brief and token spine before polishing details.

## Validation Checklist

Before finishing, check that the result answers these questions:

- Is the primary task obvious within a few seconds?
- Is the visual hierarchy stronger than before?
- Are the states complete enough to ship?
- Does the interface still fit the project’s tone and brand?
- Is the layout usable on mobile and desktop?
- Are accessibility basics intact?
- Does anything look generic, noisy, or overdesigned?

For Figma-based work, confirm that the implementation matches the available design evidence and call out anything that had to be inferred.

## Output Format

When responding, prefer this shape:

- what route was taken;
- what assumptions were made;
- what design direction was chosen, if any;
- what changed or should change;
- what remains risky or unverified.

Keep the answer concise unless the user asked for a full critique, a detailed redesign plan, or a multi-step discovery process.