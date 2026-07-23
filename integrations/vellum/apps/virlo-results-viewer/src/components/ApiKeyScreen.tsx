interface Props {
  /** Re-run the request the user was making (they've just added a key). */
  onRetry: () => void;
  /** Optional detail from the route (e.g. "key rejected" vs "no key"). */
  message?: string;
}

/**
 * Shown when a route reports no usable Virlo API key (HTTP 401). The app can't
 * write credentials itself — only the assistant can — so this guides the user
 * to add one, then retry.
 */
export function ApiKeyScreen({ onRetry, message }: Props) {
  return (
    <div className="apikey-screen">
      <div className="apikey-icon">🔑</div>
      <h1>Add your Virlo API key</h1>
      <p>
        {message ||
          "This viewer needs a Virlo API key to load your data. It's stored securely in your assistant's credential store."}
      </p>
      <ol className="apikey-steps">
        <li>
          Get a key at{" "}
          <a href="https://dev.virlo.ai/dashboard" target="_blank" rel="noopener">
            dev.virlo.ai/dashboard
          </a>{" "}
          (it starts with <code>virlo_tkn_</code>; add a prepaid balance, min $10).
        </li>
        <li>
          Ask your assistant to save it — for example:
          <span className="apikey-quote">"Save my Virlo API key: virlo_tkn_…"</span>
        </li>
      </ol>
      <button className="apikey-retry" onClick={onRetry}>
        I've added it — retry
      </button>
    </div>
  );
}
