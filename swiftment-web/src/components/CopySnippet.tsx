import React from 'react';

export default function CopySnippet({ code }: { code: string }) {
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
  };
  return (
    <div className="copy-snippet" style={{ border: '1px solid #333', borderRadius: 12, padding: 12 }}>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{code}</pre>
      <button onClick={onCopy} style={{ marginTop: 8 }}>Copy</button>
    </div>
  );
}
