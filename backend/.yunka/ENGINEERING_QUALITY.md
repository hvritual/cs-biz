# Yunka Engineering Quality Baseline

Policy version: yunka.engineering-quality/v1
Provenance: yunka:docs/ENGINEERING_QUALITY_RULES.md

This is the self-contained consumer rule baseline installed by Yunka. Framework
release status, issue history, delivery waves and task identifiers are not policy
sources for this project.

## Normative rules

1. Production package, file, symbol and durable test identities describe domain or technical responsibility, not delivery history.
2. Core packages document responsibility, important invariants and intentional exclusions. Comments explain constraints, side effects and non-obvious decisions instead of restating syntax.
3. Generated and developer-owned semantics remain separate. Generated output is repaired through its canonical generator, never by hiding handwritten behavior in generator scope.
4. New abstractions require a real boundary, domain meaning, dependency-isolation purpose, independent lifecycle/policy, or multiple implementations.
5. Non-trivial AI changes expose Problem, current responsibility, desired ownership, behavior/API/persistence/generated deltas, verification, and WHY / WHAT / BOUNDARY / PROOF before human approval.
6. Deterministic checks own objectively provable facts. Semantic AI review is advisory and cannot grant mutation, merge, deployment or business-correctness authority.
7. Engineering-quality findings are compared against an immutable baseline. Historical debt stays visible; only explicitly blocking new deterministic debt may fail conformance, subject only to an exact, owned, expiring waiver.
8. Source ownership, project configuration, canonical contracts and generated ownership remain the enforcement inputs. This baseline does not create a parallel business or architecture source of truth.

## Local enforcement

- .yunka/engineering-quality.json configures accepted deterministic blocking rules and optional review budgets.
- yunka audit --base <immutable-ref> reports deterministic existing/new/fixed debt.
- yunka change review projects exact-candidate WHY / WHAT / BOUNDARY / PROOF and quality debt.
- yunka advisor semantic validates evidence-bound semantic findings as advisory-only.

## Ownership and upgrades

Files created by yunka init are never silently replaced on a later init. After
creation, project-specific enforcement configuration is developer-owned. A newer
Yunka policy version requires explicit review/reconciliation; it must not silently
overwrite project instructions, rule text, or enforcement policy.
