#

Alright, let's sketch out an ASCII diagram to illustrate the flow of this deep research process.

```
+-------------------+     +-----------------------+     +---------------------+
| Next.js Frontend  | --> | `/api/research` (POST) | --> | `route.ts`          |
+-------------------+     +-----------------------+     +---------------------+
        |                       |                           |
        | User Input (Topic,     | Receives JSON payload     | Parses topic &      |
        | Clarifications)       |                         | clarifications      |
        |                       |                           |                     |
        v                       v                           v
+-------------------+     +-----------------------+     +---------------------+
| (Browser)         | <-- | Data Stream Response  | <-- | `createDataStreamResponse`|
+-------------------+     +-----------------------+     +---------------------+
                                      |                           |
                                      | `execute` function runs   |
                                      v                           v
                        +-------------------------------------------------------+
                        | `deepResearch(researchState, dataStream)` in `main.ts` |
                        +-------------------------------------------------------+
                                      |
                                      | Initializes `activityTracker`
                                      v
                        +-------------------------------------------------------+
                        | `generateSearchQueries` in `research-utils.ts`        |
                        | (Calls PLANNING model via `callModel` in `model-caller.ts`) |
                        +-------------------------------------------------------+
                                      | (Initial Search Queries)
                                      v
                        +-------------------------------------------------------+
                        | `while` loop (up to MAX_ITERATIONS)                   |
                        +-------------------------------------------------------+
                                      |
                                      | --> `search` in `research-utils.ts` (Exa Search)
                                      |
                                      v
                        +-------------------------------------------------------+
                        | `processSearchResults` in `research-utils.ts`         |
                        | --> `extractContent` (Calls EXTRACTION model via `callModel`) |
                        +-------------------------------------------------------+
                                      | (Extracted Findings)
                                      v
                        +-------------------------------------------------------+
                        | `analyzeFindings` in `research-utils.ts`             |
                        | (Calls ANALYSIS model via `callModel`)                |
                        +-------------------------------------------------------+
                                      | (Analysis Result: Sufficient? New Queries?)
                                      |
                        +-------------------------------------------------------+
                        | If not sufficient & within iterations: loop continues |
                        | If sufficient or max iterations reached: loop ends    |
                        +-------------------------------------------------------+
                                      |
                                      v
                        +-------------------------------------------------------+
                        | `generateReport` in `research-utils.ts`              |
                        | (Calls REPORT model via `callModel`)                  |
                        +-------------------------------------------------------+
                                      | (Final Report Content)
                                      v
                        +-------------------------------------------------------+
                        | `dataStream.writeData(...)` (Activities & Report)     |
                        +-------------------------------------------------------+
                                      |
                                      v
+-------------------+     +-----------------------+
| Next.js Frontend  | <-- | Data Stream (Progress, |
+-------------------+     | Report)               |
                                      +-----------------------+
```

**Explanation of the Flow:**

1. **User Interaction:** The user interacts with a Next.js frontend, providing a research topic and any clarifications.
2. **API Request:** The frontend sends a POST request to the `/api/research` endpoint. The request body includes the topic and clarifications (likely stringified in the last message of a chat-like interface).
3. **Route Handling (`route.ts`):**
    * The `POST` handler in `route.ts` receives the request.
    * It parses the topic and clarifications from the request body.
    * It initializes a streaming response using `createDataStreamResponse`.
    * The `execute` function within the stream is where the main research logic begins.
4. **Deep Research Orchestration (`main.ts`):**
    * `deepResearch` is called with the initial `researchState` and the `dataStream`.
    * An `activityTracker` is created to log the steps.
    * **Planning:** `generateSearchQueries` uses the PLANNING language model to create initial search queries.
    * **Iterative Research:** A `while` loop manages the research iterations.
        * **Searching:** `search` uses the Exa API to perform web searches based on the current queries.
        * **Extraction:** `processSearchResults` calls `extractContent` for each search result, using the EXTRACTION language model to summarize the content.
        * **Analysis:** `analyzeFindings` uses the ANALYSIS language model to assess the gathered information and determine if more research is needed, potentially generating new search queries.
        * The loop continues until the analysis indicates sufficient information or the maximum number of iterations is reached.
    * **Report Generation:** Once the loop finishes, `generateReport` uses the REPORT language model to synthesize the collected findings into a final report.
5. **Model Interactions (`model-caller.ts`):** Throughout the process, whenever a language model needs to be called (for planning, extraction, analysis, or reporting), the `callModel` function is used. This function handles the communication with the language model (via OpenRouter), manages retries, and tracks token usage.
6. **Data Streaming:** The `activityTracker` and the final report content are written to the `dataStream` using `dataStream.writeData()`. This allows the frontend to receive and display updates on the research progress in near real-time.
7. **Frontend Display:** The Next.js frontend receives the data stream and updates the user interface with the activity logs and the final research report.

This diagram provides a high-level overview of the key components and the flow of data and control within the application. Let me know if you'd like a more detailed breakdown of any specific part!
