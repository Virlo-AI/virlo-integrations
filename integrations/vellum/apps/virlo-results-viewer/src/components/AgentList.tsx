import { useEffect, useState } from "react";
import type { AgentSummary } from "../types";
import { agentId } from "../types";
import { fetchAgents } from "../lib/api";
import { InputScreen } from "./InputScreen";

interface Props {
  onSelect: (agentId: string) => void;
}

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "list"; agents: AgentSummary[] };

function agentTitle(a: AgentSummary): string {
  if (a.keywords && a.keywords.length) return a.keywords.slice(0, 3).join(", ");
  if (a.name) return a.name;
  if (a.intent) return a.intent;
  return "Untitled agent";
}

function AgentCard({
  agent,
  onSelect,
}: {
  agent: AgentSummary;
  onSelect: (id: string) => void;
}) {
  const id = agentId(agent);
  const meta: string[] = [];
  if (agent.platforms && agent.platforms.length)
    meta.push(agent.platforms.join(" · "));
  meta.push(agent.is_recurring ? "Recurring" : "One-shot");
  if (agent.created_at) meta.push(agent.created_at.slice(0, 10));

  return (
    <button
      className="agent-card"
      onClick={() => id && onSelect(id)}
      disabled={!id}
    >
      <div className="agent-card-main">
        <div className="agent-card-title">{agentTitle(agent)}</div>
        <div className="agent-card-meta">{meta.join(" • ")}</div>
      </div>
      <span className="agent-card-go" aria-hidden="true">
        →
      </span>
    </button>
  );
}

export function AgentList({ onSelect }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [manual, setManual] = useState(false);

  const load = () => {
    setState({ kind: "loading" });
    fetchAgents()
      .then((agents) => setState({ kind: "list", agents }))
      .catch((err) =>
        setState({
          kind: "error",
          message:
            err instanceof Error && err.message
              ? err.message
              : "Could not load your agents.",
        }),
      );
  };

  useEffect(load, []);

  if (manual)
    return (
      <div className="agent-picker">
        <InputScreen onLoad={onSelect} />
        <div className="agent-manual-toggle">
          <button onClick={() => setManual(false)}>← Back to your agents</button>
        </div>
      </div>
    );

  return (
    <div className="agent-picker">
      <div className="agent-picker-head">
        <h1>Your Virlo Agents</h1>
        <p>Pick an agent to browse its videos, creator outliers, hashtags, and rising sounds.</p>
      </div>

      {state.kind === "loading" && (
        <div className="loading">
          <div className="spinner" />
          <p>Loading your agents...</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="error-screen">
          <h3>Couldn't load your agents</h3>
          <p>{state.message}</p>
          <button onClick={load}>Try Again</button>
        </div>
      )}

      {state.kind === "list" && state.agents.length === 0 && (
        <div className="empty">
          <h3>No agents yet</h3>
          <p>Start a research run and it'll show up here.</p>
        </div>
      )}

      {state.kind === "list" && state.agents.length > 0 && (
        <div className="agent-list">
          {state.agents.map((a, i) => (
            <AgentCard agent={a} onSelect={onSelect} key={agentId(a) || i} />
          ))}
        </div>
      )}

      <div className="agent-manual-toggle">
        <button onClick={() => setManual(true)}>Enter an agent ID manually</button>
      </div>
    </div>
  );
}
