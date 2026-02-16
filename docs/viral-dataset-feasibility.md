# Viral Content Dataset — Feasibility Assessment

## Goal
Build a dataset of viral vs. non-viral content to power data-backed analysis (e.g., "posts with this structure go viral 3x more often").

## Data Sources

### 1. X/Twitter API ($100/mo Basic tier)
- **What:** Pull tweets by engagement metrics (likes, retweets, impressions)
- **Cost:** $100/mo — over budget alone
- **Verdict:** ❌ Too expensive for our <$50/mo budget

### 2. Substack (No public API)
- **What:** Scrape top Substack posts by likes/comments
- **Cost:** Free (scraping), but fragile + ToS risk
- **Verdict:** ⚠️ Possible but unreliable

### 3. Reddit API (Free tier)
- **What:** Top posts by subreddit, engagement data available
- **Cost:** Free for <100 requests/min
- **Verdict:** ✅ Best free option for text content

### 4. User-submitted data (our own users)
- **What:** Anonymized analyses from ContentLens users over time
- **Cost:** $0
- **Verdict:** ✅ Best long-term play, but needs volume first

### 5. Public datasets (Kaggle, HuggingFace)
- **What:** Pre-existing viral tweet datasets
- **Cost:** Free
- **Verdict:** ✅ Good bootstrap. Several datasets exist:
  - "Viral Tweets" on Kaggle (~50k tweets with engagement metrics)
  - Various Twitter sentiment datasets on HuggingFace

## Recommendation

**Phase 1 (Now — $0):** Use public Kaggle/HuggingFace datasets to build initial analysis patterns. Extract structural features (hook type, length, emotional words, question usage) and correlate with engagement.

**Phase 2 (When we have users):** Collect anonymized content + scores from our own users. This is our proprietary moat.

**Phase 3 (If revenue supports it):** Reddit API for fresh data. Skip X API until MRR covers cost.

## Cost Estimate
- Phase 1: $0
- Phase 2: $0 (storage on Supabase free tier)
- Phase 3: $0 (Reddit free tier) or $5/mo (upgraded)

## Timeline
- Phase 1: 2-3 sprints to download, process, and extract patterns
- Phase 2: Passive collection, starts when auth + analytics are live
- Phase 3: Future consideration

## Technical Approach
1. Download public dataset → process into structured features
2. Build pattern library: "hooks with questions score 15% higher", etc.
3. Integrate patterns into analysis engine as data-backed insights
4. Surface as Pro feature: "Based on analysis of 50,000+ viral posts..."
