import { useState } from "react";

interface Props {
  initialValue?: string;
  onLoad: (agentId: string) => void;
}

/** Landing screen: paste an agent UUID and load its results. */
export function InputScreen({ initialValue = "", onLoad }: Props) {
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    const id = value.trim();
    if (id) onLoad(id);
  };

  return (
    <div className="input-screen">
      <h1>Virlo Results Viewer</h1>
      <p>
        Enter a Content Research Agent ID to browse videos, creator outliers,
        hashtags, and rising sounds.
      </p>
      <div className="input-wrap">
        <input
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Agent UUID (e.g. 6f42116d-...)"
          autoComplete="off"
          spellCheck={false}
        />
        <button onClick={submit} disabled={!value.trim()}>
          Load Results
        </button>
      </div>
    </div>
  );
}
