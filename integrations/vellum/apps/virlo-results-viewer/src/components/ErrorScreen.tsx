interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: Props) {
  return (
    <div className="error-screen">
      <h3>Failed to load</h3>
      <p>{message}</p>
      <button onClick={onRetry}>Try Again</button>
    </div>
  );
}
