# Xbox Game Discovery Enhancement: AI-Powered Metadata Classification

## Executive Summary

### The Opportunity

Xbox hosts one of the world's largest game catalogs, yet players frequently struggle to discover games that match their interests. While our existing metadata system provides foundational tagging, the gaming landscape has evolved significantly—with new genres emerging, hybrid games blurring category lines, and player expectations shaped by competitors offering highly personalized discovery experiences.

Steam's robust tagging system and recommendation engine have set a new industry standard. Players increasingly expect to find their next favorite game through intelligent suggestions, not manual browsing. **When players can't find games they'd love, that's lost revenue—both in purchases and engagement.**

This proposal presents a proof-of-concept AI classification system that could enhance our existing metadata infrastructure, improving game discoverability for players while providing developers with intelligent tag suggestions during the upload process.

### The Solution

We developed a proof-of-concept using Claude AI (Anthropic) to automatically classify games using a standardized taxonomy of **44 primary genres** and **200+ descriptive tags** across 9 categories. The system analyzes game descriptions, screenshots, and available metadata to generate consistent, high-quality classifications.

**Key Capabilities:**
- **Catalog Enhancement**: Bulk classification of existing games with consistent methodology
- **Real-Time Tagging**: Near-instant classification of new games during developer upload
- **Developer Transparency**: Show developers our suggested tags based on their submitted materials, enabling validation and collaboration
- **Confidence Scoring**: Every classification includes a confidence level (high/medium/low), flagging uncertain cases for human review

### Proof-of-Concept Results

| Metric | Result |
|--------|--------|
| Games Classified | 953 |
| Primary Genres | 44 (consolidated from 55+ for consistency) |
| Tag Categories | 9 (Gameplay, Mechanics, Setting, Theme, Visual, Narrative, Engagement, Monetization, Protagonist) |
| Individual Tags | 200+ |
| Processing Speed | ~13 games/minute (bulk), <5 seconds (single game) |
| Cost per 1,000 Games | ~$0.50 (bulk), ~$6.00 (high-accuracy mode) |

The taxonomy was iteratively refined through real-world classification, identifying edge cases and consolidating redundant categories. For example, "Roguelike" and "Roguelite" were merged (the distinction is pedantic for discovery), while "Survival" was added as a distinct genre when we identified 10+ games that didn't fit existing categories.

### Addressing AI Risk and Accuracy

**This is metadata classification, not content generation.** The AI assigns structured labels from a predefined taxonomy—it does not create descriptions, marketing copy, or player-facing content. This significantly reduces hallucination and brand risk.

**Accuracy Safeguards:**
1. **Constrained Output**: AI selects from approved genre/tag lists only—no invented categories
2. **Confidence Scoring**: Low-confidence classifications are flagged for human review
3. **Consistency Checking**: New classifications are compared against similar games already in the database
4. **Developer Review**: Developers see suggested tags and can approve, modify, or reject
5. **Human Oversight**: The system augments human judgment, not replaces it

**Quality Validation:**
During the POC, we manually reviewed classifications for well-known titles:
- *Elden Ring* → Action RPG (correct)
- *Subnautica* → Survival (correct—previously inconsistently tagged)
- *Final Fantasy XIV* → MMORPG (correct)
- *Hollow Knight* → Metroidvania (correct)

Edge cases like *Zelda: Breath of the Wild* (Action Adventure vs. Open World) are flagged for human decision based on confidence scoring.

### Integration with Existing Systems

This solution is designed to **build upon our existing metadata infrastructure**, not replace it. The AI serves as an intelligent assistant that:

- Fills gaps where current metadata is incomplete
- Suggests updates where genre definitions have evolved
- Provides a second opinion for human curators to validate
- Accelerates the tagging process for the growing catalog

Existing tags and developer-provided metadata remain authoritative; AI suggestions are additive and subject to approval workflows.

### Why External AI (Exemption Request)

This proof-of-concept was developed using Claude (Anthropic) to evaluate the approach. Attempts to replicate equivalent results using Microsoft internal AI tools have not yet achieved the same classification quality.

**Requesting exemption for evaluation purposes to:**
1. Continue validating the approach with a larger subset of the catalog
2. Establish baseline accuracy metrics for comparison
3. Determine if internal tools can eventually match performance

If exemption is granted, we recommend a time-boxed evaluation (90 days) with defined success criteria, after which we can assess whether to pursue internal tool alternatives or continue with the external solution.

### Recommendation

**Approve a pilot program** to:
1. Classify 5,000 games from the Xbox catalog using this system
2. Measure accuracy against human curator review (target: 90%+ agreement)
3. Test developer-facing tag suggestions with 50 partner studios
4. Evaluate player discovery metrics on a test cohort

**Investment Required:**
- AI API costs: ~$250-500 for pilot classification
- Engineering: Integration with existing metadata systems
- Curation: Human review of flagged low-confidence items

**Potential Impact:**
- Improved game discoverability → increased engagement and purchases
- Faster developer onboarding with intelligent tag suggestions
- Consistent metadata enabling better recommendations
- Foundation for personalized discovery features

---

## Appendix: Technical Details

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Game Metadata  │────▶│  Classification  │────▶│    Database     │
│  (Description,  │     │     Service      │     │   (PostgreSQL)  │
│   Screenshots)  │     │   (Claude API)   │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │  Confidence  │         │   Frontend   │
                        │   Scoring    │         │   (React)    │
                        └──────────────┘         └──────────────┘
```

### Taxonomy Structure (v3.1)

**44 Primary Genres** organized into families:
- **Action-based**: Action, Action RPG, Action Adventure, FPS, TPS, Bullet Hell
- **RPG**: JRPG, Turn-Based RPG, Tactical RPG, MMORPG, Roguelike
- **Platformer**: 2D Platformer, 3D Platformer, Metroidvania
- **Strategy**: RTS, Turn-Based Strategy, Tower Defense, 4X, Grand Strategy
- **Simulation**: Life Sim, Farm Sim, Management Sim, Racing Sim, Flight Sim, City Builder
- **Puzzle**: Puzzle, Puzzle Platformer, Match-3, Physics Puzzle
- **Adventure**: Adventure, Narrative Adventure, Visual Novel
- **Fighting**: 2D Fighting, 3D Fighting
- **Racing**: Arcade Racing, Kart Racing, Rally Racing
- **Horror**: Horror
- **Card/Board**: Card Game, Deck Builder, Board Game, Digital TCG
- **Other**: Arcade, Rhythm, Party, Battle Royale, Sandbox, Survival, Idle, Souls-like, Immersive Sim, Educational, Sports

**9 Tag Categories** with prefixed naming:
- `gameplay_` - Core mechanics (action, rpg, survival, etc.)
- `mechanic_` - Specific systems (crafting, skill_trees, permadeath, etc.)
- `setting_` - Time/place (medieval, sci_fi, underwater, etc.)
- `theme_` - Narrative themes (revenge, exploration, horror, etc.)
- `visual_` - Art style (pixel_art, realistic, anime, etc.)
- `narrative_` - Story genre (mystery, comedy, drama, etc.)
- `engagement_` - Multiplayer/social (pvp, co_op, competitive, etc.)
- `monetization_` - Business model (free_to_play, premium, etc.)
- `protagonist_` - Player character (customizable, silent, ensemble, etc.)

### Classification Prompt Engineering

The system uses structured prompts that:
1. Provide the full approved taxonomy
2. Include examples of similar already-classified games for consistency
3. Request JSON output with confidence scoring
4. Constrain output to approved values only

### Cost Model

| Model | Use Case | Cost/1K Games | Speed |
|-------|----------|---------------|-------|
| Claude Haiku | Bulk classification | ~$0.50 | 13/min |
| Claude Sonnet | High-accuracy, edge cases | ~$6.00 | 8/min |

**Recommended Hybrid Approach:**
- Haiku for initial bulk pass
- Sonnet for low-confidence items requiring nuance
- Human review for persistent edge cases

### Evolution Process

The taxonomy is versioned and evolves based on:
1. **Usage Analysis**: Genres with <5 games are candidates for consolidation
2. **Edge Case Discovery**: New genres added when 10+ games don't fit existing categories
3. **Industry Trends**: New genres emerging (e.g., "Extraction Shooter" may warrant addition)
4. **Consistency Audits**: Periodic review of classification distribution

---

*Document prepared for internal review.*
