---
title: Database Engine Selection — Auth Service
theme: paper-light
surface: decision-brief
---

# Database Engine Selection — Auth Service

:::summary{id="context" title="Decision Context"}
The auth service currently uses PostgreSQL 14 for session and token storage. We are evaluating whether to remain on PostgreSQL, migrate to CockroachDB for multi-region resilience, or adopt DynamoDB for managed scalability. Decision deadline: 2026-06-01.
:::

:::decision-card{id="db-choice"}
question: Which database engine for auth service?
chosen: CockroachDB
status: proposed

rationale:
  - Multi-region active-active with serializable isolation
  - PostgreSQL wire compatibility minimizes migration effort
  - Managed CockroachCloud reduces ops burden

alternatives:
  - name: PostgreSQL 16
    reason: Staying put avoids migration risk but does not solve multi-region writes
  - name: DynamoDB
    reason: Excellent scalability but requires query pattern rewrite; no SQL compatibility
  - name: TiDB
    reason: MySQL-compatible, good HA, but less mature ecosystem than CockroachDB
:::

:::callout{id="blocker-cost" tone="danger" title="Cost Blocker"}
CockroachCloud pricing for 3 regions is 2.4x current RDS spend. Need finance approval before proceeding. Escalate to VP Eng if not resolved by 2026-05-25.
:::

:::decision-card{id="migration-strategy"}
question: Migration strategy if CockroachDB is approved?
chosen: Dual-write with cut-over
status: proposed

rationale:
  - Zero-downtime migration path
  - Compare results between PG and CRDB during dual-write phase
  - Cut-over after 7 days of data consistency verification

alternatives:
  - name: Big-bang migration
    reason: Faster but 30-minute downtime window required
  - name: Read-only replica first
    reason: Lower risk but extends migration to 4+ weeks
:::

:::callout{id="next-step" tone="info" title="Next Steps"}
1. Get cost approval from finance.
2. Run dual-write POC on staging (1 week).
3. Present results to architecture review board.
:::
