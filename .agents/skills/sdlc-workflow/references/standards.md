# Definition sources (checked 2026-10-16)

- Agent Skills specification: https://agentskills.io/specification — a Skill is a named directory with SKILL.md, optional scripts/references/assets and progressive disclosure. Internal capability directories follow the same format; only the current capability is loaded.
- Official Agent definition reference: https://openai.github.io/openai-agents-python/agents/ — an Agent combines an LLM with instructions/tools and optional handoff/guardrail/output behavior. This repository uses that responsibility distinction without requiring the Agents SDK or an API key.
- Current Codex custom-Agent format: https://learn.chatgpt.com/docs/agent-configuration/subagents — standalone .codex/agents TOML defines name, description and developer_instructions; model/provider/permission inheritance is retained. Runtime activation requires a supporting host and is not proved by parsing TOML.

SKILL.md and native Agent TOML follow their documented formats. workflow.json, artifact envelopes and handoff contracts are repository-owned protocols, not an invented universal Agent standard. The generic validator implements the explicitly supported schema keywords and rejects unsupported ones; it does not claim to implement the entire JSON Schema standard. Script results never authenticate external approval, model execution, CI or deployment.
