---
title: Q1 Code Review Audit — Payment Service
theme: paper-light
surface: review-report
---

# Q1 Code Review Audit — Payment Service

:::summary{id="audit-summary" title="Audit Summary"}
Reviewed 47 PRs merged to `services/payment` between 2026-01-01 and 2026-03-31. Found 3 critical, 5 medium, and 8 low-severity issues. Top patterns: missing error handling on downstream calls, insufficient input validation on webhook payloads, and hardcoded retry counts.
:::

:::callout{id="finding-1" tone="danger" title="CRITICAL: Unhandled Stripe webhook signature errors"}
Payment webhook handler does not verify Stripe signature on the error path. If signature verification throws (network timeout, malformed header), the handler returns 200 and the event is silently dropped.
:::

:::code{id="finding-1-code" language="js" title="Current (vulnerable)"}
```js
app.post('/webhooks/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body, req.headers['stripe-signature'], SECRET
  );
  // If constructEvent throws, Express error handler returns 500
  // but Stripe interprets 500 as "retry later" — event is not dropped
  // BUT our error handler logs and returns 200 in production!
  await processEvent(event);
  res.json({ received: true });
});
```
:::

:::callout{id="finding-2" tone="danger" title="CRITICAL: Race condition on concurrent refunds"}
Two simultaneous refund requests for the same payment can both pass the idempotency check and issue duplicate refunds. The database UNIQUE constraint on `refund_idempotency_key` prevents double-write, but the second request returns 500 instead of 409.
:::

:::callout{id="finding-3" tone="danger" title="CRITICAL: PII in application logs"}
Full cardholder names and email addresses are logged at `info` level in the charge confirmation handler. Violates PCI-DSS requirement 3.2 and our internal data classification policy.
:::

:::callout{id="finding-medium-1" tone="warning" title="MEDIUM: Hardcoded retry count"}
Retry count for downstream payment gateway calls is hardcoded to 3. Should be configurable via environment variable to allow tuning without deployment.
:::

:::code{id="finding-medium-1-fix" language="js" title="Recommended fix"}
```js
const MAX_RETRIES = Number(process.env.PAYMENT_MAX_RETRIES || 3);
// ... use MAX_RETRIES in retry loop
```
:::

:::callout{id="finding-summary" tone="info" title="Low-Severity Summary"}
8 low-severity findings: inconsistent error message formatting (3), missing JSDoc on public methods (3), console.log left in production code (1), test using real API keys (1 — now rotated).
:::
