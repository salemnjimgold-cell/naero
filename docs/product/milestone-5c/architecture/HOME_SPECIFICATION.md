# Home Specification

## Purpose

Answer: **Where am I operating, what can Naero help with now, and what real action can I continue?** Home is finite: no infinite feed and no more than six modules.

## Exact hierarchy

1. **Context Header** — municipality/city and country; location mode (`Device`, `Manual city`, `Location off`); tap opens Context Picker. Never show weather until a reliable provider exists.
2. **Immediate Assistance** — compact “Help now” row leading to verified emergency/safety information. Visually restrained; danger color appears only inside an urgent path.
3. **Next Useful Step** — one source-backed suggestion. Fallback choices: Choose what you need; Set a city; Start Settlement Basics; Find something nearby.
4. **Ask Naero** — compact contextual composer showing the context it will use.
5. **Useful Around You** — maximum three real records with distance/source; omitted or replaced by city essentials when location is unavailable.
6. **Continue** — one user-started Plan or recent saved action; absent when no legitimate history exists.

## Layout and interaction

- 20 dp horizontal compact margin, 24 dp section rhythm, 12 dp intra-module gaps.
- Context and Help now remain visible in the first viewport; Next Useful Step is the dominant surface.
- Pull-to-refresh refreshes eligible modules without changing user context.
- Module reasons are inspectable: “Because you selected Vienna” or “From your Settlement Basics plan.”
- Horizontal carousels are avoided for critical content; nearby may use a short vertical stack or explicit “See all.”

## State behavior

| State | Home response |
|---|---|
| First/guest | Honest setup choices; local saves remain available; sign-in appears only for sync benefit |
| Returning authenticated | Resume only real saved/started state and relevant verified updates |
| Loading | Stable Context Header; content-shaped skeletons; Help now remains usable |
| Empty | Replace missing modules with a meaningful setup action; never blank containers |
| Error | Preserve cached/saved content, classify failure and provide retry/change context |
| Offline | Offline banner; saved/recent and cached sourced content with age; no false live status |
| Location enabled | Show precise-location mode and bounded nearby results |
| Manual city | Show city-mode label; distances omitted unless coordinates are intentionally attached to selected city |
| Location off | City-independent guidance and manual-city CTA; no permission nagging |
| Unsupported jurisdiction | Global utilities, external provider results where available, and transparent “reviewed guidance not available here” |

## Accessibility/RTL

Reading order follows hierarchy; Context Header exposes city and location state in one accessible label. All actions have text labels, 44×44 minimum targets and 200% text reflow. Directional chevrons mirror; location, safety and trust icons do not. Arabic layouts use logical spacing and right-aligned paragraph text.

## Data dependencies

Context state, auth mode, foreground/manual location, nearby results, trust metadata, user-started Plan state, saved/recent actions, network/cache status. No module may invent missing fields.
