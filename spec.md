**Spec Sheet: AI-Powered Company Info Benchmarking Tool**

**Purpose**
Evaluate OpenAI API's ability (with web search) to extract structured company data by comparing output to a predefined ground truth.

**Functional Requirements**

1. **Ground Truth Specification**

* Input: `company_name`
* Define `ground_truth_object`: key-value pairs (e.g., industry, HQ location, etc.)
* Each key includes:

  * Expected value
  * Enum of possible values

2. **Prompt & Query Engine**

* For each key:

  * Combine `company_name` + key-specific prompt
  * Query OpenAI API (web search enabled)
* API Response Format:

  * `value`: predicted enum value
  * `certainty_score`: float (0–1)
  * `explanation`: short reason
  * `sources`: list of URLs

3. **Benchmarking Logic**

* For each response:

  * Compare `value` to ground truth
  * Compute match/mismatch
  * Log `certainty_score`, `explanation`, and `sources`

**Constraints**

* CLI-only
* MVP-level, super simple script
* No persistent storage required
