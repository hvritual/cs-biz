# Closure record

Use these fields inside the project's existing canonical record. Keep facts separate from assumptions. Scale the record to the task; use concise chat tables if no durable artifact was requested. Use stable IDs and links instead of duplicating authoritative prose.

## Outcome contract

| Field | Content |
| --- | --- |
| Goal | Actor, problem, observable desired change |
| Authority | Requested mode; allowed mutations, systems, environments, budgets; excluded operations |
| Source of truth | Current project rules, semantic document, issue, approved decisions; links and versions |
| Baseline | Observed current state, version/configuration, environment, observation time |
| Boundary | Exact deliverable or operational level to be accepted; not an implied stronger level |
| Scope | Required capability, affected actors and surfaces; non-goals |
| Open decisions | Material unknown, recommended route, alternatives, decision owner; no silent approval |

## Criteria and evidence

| Criterion ID / source | Preconditions → action → observable result | Threshold / falsifier | Required observation / human gate | Evidence reference, version, environment, time | State |
| --- | --- | --- | --- | --- | --- |
| C1 | Specify accepted behavior | Define measurable result without inventing policy | Name the verifying source and required approver | Link actual result; mark unavailable proof explicitly | PROVEN / UNPROVEN / FAILED / BLOCKED / OUTSIDE_AUTHORITY |

Record failure/recovery and side-effect checks as separate criteria when independently necessary. For a business metric, include measurement window and comparable baseline. Keep approval evidence separate from technical evidence. Redact secrets and unnecessary personal data.

## Completion graph

| Node | Explicit / derived required / optional | Criterion IDs and necessity evidence | Dependencies | Deliverable and allowed surface | Executor / Skill | Check / proof | Permission / approval | Work state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W1 | Select one category | Link obligation; explain why a derived node is necessary | Node IDs or external prerequisites | Small bounded unit | Capability, not assumed authority | Exact proof obligation | Granted / required / denied; source | Pending / active / delivered / verified / blocked |

Do not classify a feature enhancement as required without an acceptance dependency. Do not mark a delivered node verified merely because it produced a file, PR, or agent summary.

## Evidence entry

- Criterion and claim proved:
- Source artifact or authoritative state:
- Exact version / configuration / environment / identity:
- Command or observation procedure:
- Observation time and actual result:
- Limits, contrary observations, and invalidation conditions:
- Required independent review or human acceptance and its evidence:

## Handoff

State the actual outcome first, then provide:

1. Proven criteria / total required criteria, with evidence links.
2. Unproven, failed, blocked, and outside-authority criteria, kept distinct.
3. Delivered artifacts and their exact acceptance boundary.
4. Residual risks, exclusions, and pending human decisions.
5. One next action, responsible authority, and minimal recovery input.

Never use a coverage count alone to claim completion; evidence adequacy, freshness, contradictions, approvals, and the contract still decide.
