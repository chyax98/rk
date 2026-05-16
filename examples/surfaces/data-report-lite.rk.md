---
title: Weekly Active Users — 2026-W20
theme: paper-light
surface: data-report-lite
---

# Weekly Active Users — 2026-W20

:::summary{id="key-metrics" title="Key Takeaways"}
WAU increased 12.3% week-over-week to 1.42M. Primary driver: onboarding funnel optimization deployed 2026-05-12. Mobile web share rose from 38% to 44%. No anomalies detected in session duration or error rates.
:::

:::code{id="wau-snapshot" language="sql" title="WAU Query Result"}
```
week       | wau       | wow_change | mobile_share
-----------+-----------+------------+-------------
2026-W18   | 1,182,000 | +2.1%      | 36%
2026-W19   | 1,264,000 | +6.9%      | 38%
2026-W20   | 1,420,000 | +12.3%     | 44%
```
:::

:::code{id="funnel-data" language="sql" title="Onboarding Funnel Conversion"}
```
step              | W19 conversion | W20 conversion | delta
------------------+----------------+----------------+-------
landing → signup  | 22.4%          | 28.1%          | +5.7pp
signup → activate | 41.2%          | 43.8%          | +2.6pp
activate → d7     | 18.6%          | 19.1%          | +0.5pp
```
:::

:::summary{id="methodology" title="Methodology"}
WAU defined as unique users with >= 1 session (session_start event) in the 7-day window ending Sunday 23:59 UTC. Mobile share = mobile web sessions / total sessions. Data source: `analytics.events` table, Materialize refresh.
:::
