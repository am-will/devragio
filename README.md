# devragio

> A fork of [gricha/devrage](https://github.com/gricha/devrage) that also tracks the polite stuff — and assigns you a tier.

`devragio` scans your coding-agent transcripts for swears **and** politeness signals ("please", "thanks", "thank you", "appreciate", "pls", "plz", "ty"), then computes your **Ragio** (swears ÷ polite words) and slots you into a tier label, from "Touched By An Angel" to "Seek Professional Help".

## Usage

```sh
npx devragio
```

Same flags as the original:

```sh
devragio scan
devragio scan --agent claude
devragio scan --since 2025-01-01
```

## Supported agents

claude · codex · opencode · amp · cline · pi · zed

## Ragio tiers

| Ratio | Tier |
|---|---|
| < 0.15 | Angelic |
| < 0.25 | Mostly polite |
| < 0.35 | Passive-aggressive |
| < 0.50 | Fraying |
| < 0.67 | Concerning |
| ≥ 0.67 | Unhinged |

Each tier ships with 5 randomly-rotated labels, so successive runs of the same data won't tell you the same thing twice.

## Credit

Built on top of [gricha/devrage](https://github.com/gricha/devrage). MIT.
