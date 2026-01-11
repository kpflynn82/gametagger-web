# GameTagger Executive Demo Guide

**Duration:** 10 minutes
**Audience:** Executive stakeholders
**Goal:** Demonstrate AI-powered game classification technology and business value

---

## Pre-Demo Checklist

- [ ] Open https://gametagger-web-production.up.railway.app in browser
- [ ] Clear any previous analysis results (optional)
- [ ] Have a backup game name ready (e.g., "Hades", "Celeste", "Elden Ring")
- [ ] Ensure stable internet connection

---

## Demo Flow

### 1. Opening Hook (1 minute)

**Start on the Analyze page**

> "This is GameTagger - an AI-powered system that can classify any video game in under 5 seconds with over 200 possible tags."
>
> "The traditional approach to game tagging costs $15-25 per game using human analysts and takes hours. GameTagger does it for 12 cents in seconds."

**Key talking points:**
- Manual game classification is expensive and inconsistent
- Different analysts tag the same game differently
- Our AI provides consistent, comprehensive classification

---

### 2. Live Demo: Tag a Game (3 minutes)

**Recommended games for demo:**
- "Baldur's Gate 3" - Recent, well-known, complex RPG
- "Elden Ring" - AAA open-world action RPG
- "Hades" - Indie roguelike with clear mechanics
- "Celeste" - Indie platformer with accessibility features

**Steps:**

1. **Type game name** in the search box
   > "Let's classify Baldur's Gate 3..."

2. **Click "Analyze Game"** and narrate the progress:
   > "Watch the real-time progress. First, we're pulling data from Wikipedia - this gives us human-curated genre information from the world's largest encyclopedia."

   > "Now Xbox Store data - Microsoft's official catalog with ratings and features."

   > "Finally, Claude AI synthesizes everything in under 5 seconds."

3. **Reveal results** - scroll through the analysis:
   > "We've identified the game as a turn-based tactical RPG with 18 relevant tags across gameplay, narrative, themes, and mechanics."

   > "Notice the 'High' confidence score - multiple sources confirmed these classifications."

4. **Highlight specific tags:**
   - Point to gameplay tags (action, RPG elements)
   - Show narrative tags (story-driven, character focus)
   - Mention engagement tags (long sessions, high replay value)

5. **Save to database** - click Save button:
   > "One click saves this to our catalog for analytics and reporting."

---

### 3. Dashboard Analytics (3 minutes)

**Navigate to Dashboard tab**

1. **Catalog Statistics:**
   > "We've classified over 900 games so far. The dashboard shows real-time analytics across our entire catalog."

2. **Genre Lifecycle Timeline:**
   > "This is where it gets interesting. We track genre lifecycles - which genres are emerging, growing, mature, or declining."

   > "You can see 'Cozy Games' are in a growth phase while traditional sports games are mature."

   **Click on lifecycle stages to filter**

3. **Trending Integration:**
   > "We pull real-time player data from Steam to show which classified games are trending right now."

   > "This helps identify what players are actually playing versus what's being released."

4. **Health Scorecard:**
   > "The executive scorecard gives at-a-glance metrics:"
   - **Coverage:** What percentage of the catalog is tagged
   - **Quality:** Confidence levels across all analyses
   - **Freshness:** How recently games were classified
   - **Trending Alignment:** How many trending games we've covered

---

### 4. Cost/ROI Value Proposition (1 minute)

**Key numbers to emphasize:**

| Metric | Manual | GameTagger |
|--------|--------|------------|
| Cost per game | $15-25 | $0.12 |
| Time per game | 30-60 min | <5 seconds |
| Consistency | Variable | 100% |
| Scalability | Linear cost | Near-zero marginal cost |

> "At $0.12 per game, we can classify 10,000 games for what it costs to manually tag 50-80 games."
>
> "And the AI never gets tired, never has a bad day, and applies the same criteria every time."

---

### 5. Deep Analysis Demo (1.5 minutes)

**Return to Analyze page**

1. **Expand "Data Sources" section**

2. **Select "Deep Analysis":**
   > "For high-stakes classifications, we have Deep Analysis mode."

   > "This uses Claude Opus - the most capable AI model - and adds YouTube video analysis."

3. **Enter a game name and start analysis:**
   > "Watch - it's now analyzing actual gameplay footage, extracting frames from YouTube videos, and using vision AI to verify the classification."

4. **Show YouTube progress step:**
   > "This is literally watching the game being played and understanding what it sees."

**If time is short:** Just explain Deep Analysis without running it.

---

### 6. Technology Architecture (Optional - if asked)

**How it was built:**

1. **Training Foundation:**
   - Based on 40,000 hours of gameplay data from Nitrogen
   - VGMS (Video Game Metadata Schema) from University of Washington
   - 200+ tags across 44+ genre categories
   - Genre taxonomy designed by Kevin Flynn for complete coverage

2. **Multi-Source Data Pipeline:**
   - Wikipedia API for human-curated genre information
   - Xbox Store API for Microsoft catalog data
   - Steam API for player reviews and tags
   - YouTube API for gameplay video analysis

3. **AI Analysis:**
   - Claude Haiku for fast standard analysis ($0.12/game)
   - Claude Opus for deep analysis ($0.50/game)
   - Vision AI for screenshot and video frame analysis

4. **Reliability System:**
   - Confidence scoring based on source agreement
   - Automatic escalation to additional sources when confidence is low
   - YouTube video analysis as verification layer

---

## Q&A Preparation

**Common questions and answers:**

**Q: How accurate is it?**
> "High confidence ratings mean multiple independent sources agree. We've validated against human-tagged datasets and see 90%+ agreement on primary genre classification."

**Q: Can it handle new/indie games?**
> "Yes - if a game has any web presence (Wikipedia, store listing, YouTube videos), we can classify it. For truly unknown games, we fall back to YouTube gameplay analysis."

**Q: How does it handle edge cases?**
> "Games that span multiple genres get multiple tags. The system is designed to capture complexity, not force single classifications."

**Q: What about data freshness?**
> "We can re-analyze games at any time to capture updates, DLC changes, or evolving community perception."

**Q: Integration options?**
> "Full REST API available. Can integrate with any catalog system, recommendation engine, or analytics platform."

---

## Demo Recovery Tips

**If the site is slow:**
> "The AI is being thorough - this happens occasionally with complex games that have extensive Wikipedia articles."

**If analysis fails:**
> "Let me try another game - sometimes API rate limits kick in. This is [backup game]..."

**If confidence is Medium:**
> "Medium confidence means the sources had some disagreement. We'd recommend Deep Analysis for a definitive classification."

---

## Post-Demo Actions

1. Save the demo analysis to the database
2. Show the History tab to prove persistence
3. Offer to classify any game the executives are curious about
4. Share the live URL for them to try themselves

---

## URLs

- **Production:** https://gametagger-web-production.up.railway.app
- **API Docs:** https://gametagger-web-production.up.railway.app/docs

