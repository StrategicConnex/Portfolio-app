# Routing Policy
1. Try highest-ranked FREE candidate.
2. Retry transient failures within budget.
3. Move through FREE candidates.
4. Use PAID fallback only after FREE failure or quality threshold failure.
5. Record model, latency, success and fallback reason.
