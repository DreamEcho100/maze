# Upgrade Plan.md

1. [ ] Pass to `generateSearchQueries`
    - Passed by user input.
      - search query format fallback
    - Passed on user plan.
      - MAX_SEARCH_RESULTS
      - startPublishedDate
      - endPublishedDate
      - startCrawlDate
      - endCrawlDate
      - excludeDomains
      - MAX_CONTENT_CHARS
2. [ ] Build a custom crawling service to replace the use of the `exa` service.
3. [ ] Pass the used models passed on the user plan and input.
   - PLANNING_MODEL
   - EXTRACTION_MODEL
   - ANALYSIS_MODEL
   - REPORT_MODEL
4. [x] Use a better way ensure the uniqueness of the `currentQueries` instead of the filtering on each loop.
