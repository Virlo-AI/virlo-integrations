import { useEffect, useState } from "react";
import type { ResultsData } from "./types";
import { fetchResults, ApiKeyRequiredError } from "./lib/api";
import { AgentList } from "./components/AgentList";
import { Loading } from "./components/Loading";
import { ErrorScreen } from "./components/ErrorScreen";
import { ApiKeyScreen } from "./components/ApiKeyScreen";
import { ResultsView } from "./components/ResultsView";

type View =
  | { kind: "picker" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "apikey"; message: string; agentId: string }
  | { kind: "results"; data: ResultsData };

const AGENT_ID_FROM_URL = new URLSearchParams(window.location.search).get(
  "agent_id",
);

export function App() {
  const [view, setView] = useState<View>({ kind: "picker" });

  const load = async (agentId: string) => {
    setView({ kind: "loading" });
    try {
      const data = await fetchResults(agentId);
      setView({ kind: "results", data });
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        setView({ kind: "apikey", message: err.message, agentId });
        return;
      }
      setView({
        kind: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Could not fetch results. Check that the agent ID is valid and the Virlo API key is configured.",
      });
    }
  };

  // Auto-load if the app was opened with ?agent_id=<uuid>.
  useEffect(() => {
    if (AGENT_ID_FROM_URL) load(AGENT_ID_FROM_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (view.kind) {
    case "loading":
      return <Loading />;
    case "error":
      return (
        <ErrorScreen
          message={view.message}
          onRetry={() => setView({ kind: "picker" })}
        />
      );
    case "apikey":
      return (
        <ApiKeyScreen
          message={view.message}
          onRetry={() => load(view.agentId)}
        />
      );
    case "results":
      return <ResultsView data={view.data} />;
    case "picker":
    default:
      return <AgentList onSelect={load} />;
  }
}
