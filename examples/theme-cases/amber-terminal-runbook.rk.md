---
title: Amber Terminal Runbook Case
theme: amber-terminal
surface: runbook
---

# Amber Terminal Runbook Case

Amber Terminal is an operations theme for command-heavy runbooks and terminal-affinity users.

:::summary{id="amber-summary" title="Operational reading"}
The theme should emphasize command execution, warnings, and rollback steps without leaking into normal document defaults.
:::

:::callout{id="amber-warning" tone="warning" title="Before running"}
Confirm current primary node, active region, and rollback owner before executing commands.
:::

:::code{id="amber-command" language="bash" title="Health check"}
```bash
kubectl get pods -n payments
kubectl get deploy payment-api -o wide
```
:::

:::callout{id="amber-rollback" tone="danger" title="Rollback"}
If p95 latency increases for two consecutive windows, roll back the deployment and attach comments to this block.
:::

:::note{id="amber-appendix-note" title="Incident appendix"}
Keep regional appendix details as linked prose or separate artifacts; this runbook stays focused on the operator path.
:::
