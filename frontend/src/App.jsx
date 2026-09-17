import { useEffect, useState } from "react";

const STORAGE_KEY = "forge-workspace-v1";
const modes = {
  chat: { label: "General chat", eyebrow: "Conversation", title: "A clear place to think out loud.", description: "Ask for an explanation, a calculation, a plan, or a second pair of eyes.", placeholder: "Ask anything..." },
  agent: { label: "Website agent", eyebrow: "Build workspace", title: "Turn a direction into a working site.", description: "Describe the experience you want. The agent will create the files and make them available to preview.", placeholder: "Describe the website you want to build..." },
};

function makeThread(mode) {
  const now = Date.now();
  return { id: `${mode}-${now}-${Math.random().toString(36).slice(2, 7)}`, title: mode === "chat" ? "New conversation" : "New website brief", messages: [], project: null, createdAt: now, updatedAt: now };
}

function createInitialHistory() {
  const chat = makeThread("chat");
  const agent = makeThread("agent");
  return { chat: [chat], agent: [agent], active: { chat: chat.id, agent: agent.id } };
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.chat?.length && saved?.agent?.length && saved.active) return saved;
  } catch {
    // Ignore malformed browser storage and start with a clean workspace.
  }
  return createInitialHistory();
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
}

function titleFromMessage(message, mode) {
  const title = message.replace(/\s+/g, " ").trim();
  if (!title) return mode === "chat" ? "New conversation" : "New website brief";
  return title.length > 35 ? `${title.slice(0, 35).trim()}...` : title;
}

function App() {
  const [mode, setMode] = useState("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(history)), [history]);

  const activeMode = modes[mode];
  const activeThread = history[mode].find((thread) => thread.id === history.active[mode]) || history[mode][0];
  const messages = activeThread?.messages || [];

  function updateThread(threadMode, threadId, update) {
    setHistory((current) => ({ ...current, [threadMode]: current[threadMode].map((thread) => thread.id === threadId ? { ...thread, ...update, updatedAt: Date.now() } : thread) }));
  }

  function selectThread(nextMode, threadId) {
    setMode(nextMode);
    setHistory((current) => ({ ...current, active: { ...current.active, [nextMode]: threadId } }));
    setInput("");
    setError("");
  }

  function createThread(nextMode) {
    const thread = makeThread(nextMode);
    setHistory((current) => ({ ...current, [nextMode]: [thread, ...current[nextMode]], active: { ...current.active, [nextMode]: thread.id } }));
    setMode(nextMode);
    setInput("");
    setError("");
  }

  function deleteThread(threadMode, threadId) {
    setHistory((current) => {
      const remaining = current[threadMode].filter((thread) => thread.id !== threadId);
      const threads = remaining.length ? remaining : [makeThread(threadMode)];
      const activeId = current.active[threadMode] === threadId ? threads[0].id : current.active[threadMode];
      return { ...current, [threadMode]: threads, active: { ...current.active, [threadMode]: activeId } };
    });
    if (threadMode === mode && history.active[threadMode] === threadId) {
      setInput("");
      setError("");
    }
  }

  function clearHistory(threadMode) {
    if (!window.confirm(`Clear all ${threadMode} history?`)) return;
    const thread = makeThread(threadMode);
    setHistory((current) => ({ ...current, [threadMode]: [thread], active: { ...current.active, [threadMode]: thread.id } }));
    if (threadMode === mode) {
      setInput("");
      setError("");
    }
  }

  async function submit(event) {
    event?.preventDefault();
    const message = input.trim();
    if (!message || pending || !activeThread) return;
    const requestMode = mode;
    const threadId = activeThread.id;
    const nextMessages = [...activeThread.messages, { role: "user", text: message }];
    updateThread(requestMode, threadId, { messages: nextMessages, title: activeThread.messages.length ? activeThread.title : titleFromMessage(message, requestMode) });
    setInput("");
    setPending(true);
    setError("");

    try {
      const endpoint = requestMode === "chat" ? "/api/chat" : "/api/websites";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || payload.error || "The request could not be completed.");
      const update = { messages: [...nextMessages, { role: "assistant", text: requestMode === "chat" ? payload.message : payload.response }] };
      if (requestMode === "agent") update.project = { id: payload.projectId, files: payload.files || [], previewUrl: payload.previewUrl };
      updateThread(requestMode, threadId, update);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  return <main className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="sidebar">
      <div className="brand-mark" aria-label="Forge home"><span>F</span></div>
      <div className="sidebar-title"><span className="overline">FDE / AI</span><strong>Forge workspace</strong></div>
      <button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed(true)} aria-label="Hide sidebar" title="Hide sidebar">&lt;</button>
      <div className="sidebar-rule" />
      <span className="side-label">Workspace</span>
      <nav className="mode-list" aria-label="Workspace modes">{Object.entries(modes).map(([key, item]) => <button className={`mode-button ${mode === key ? "selected" : ""}`} key={key} onClick={() => selectThread(key, history.active[key])}><span className={`mode-icon ${key}`} aria-hidden="true">{key === "chat" ? "C" : "A"}</span><span>{item.label}</span>{mode === key && <span className="active-dot" />}</button>)}</nav>
      <HistorySection mode="chat" threads={history.chat} activeId={history.active.chat} onSelect={selectThread} onNew={() => createThread("chat")} onDelete={deleteThread} onClear={clearHistory} />
      <HistorySection mode="agent" threads={history.agent} activeId={history.active.agent} onSelect={selectThread} onNew={() => createThread("agent")} onDelete={deleteThread} onClear={clearHistory} />
      <div className="sidebar-bottom"><div className="status-line"><span className="status-dot" /> API online</div><span className="version">v0.1 / local workspace</span></div>
    </aside>

    <section className={`workspace ${mode === "agent" ? "agent-workspace" : ""}`}>
      <header className="topbar"><div className="topbar-title"><button type="button" className="sidebar-reopen" onClick={() => setSidebarCollapsed(false)} aria-label="Show sidebar" title="Show sidebar">&gt;</button><div><span className="crumb">Workspace / {activeMode.label}</span><h1>{activeThread?.title || activeMode.eyebrow}</h1></div></div><div className="topbar-meta"><span className="pulse" /> Ready to work</div></header>
      <div className={`content-grid ${mode}-content-grid`}>
        <section className="conversation-panel">
          {mode === "agent" && messages.length === 0 && <div className="intro-block"><span className="section-kicker">01 / Brief</span><h2>{activeMode.title}</h2><p>{activeMode.description}</p></div>}
          <div className="message-stream" aria-live="polite" aria-label="Forge conversation">{mode === "chat" && messages.length === 0 && <ChatEmptyState onSelect={setInput} />}{mode === "agent" && messages.length === 0 && <div className="empty-note"><span className="empty-line" /> Your conversation will appear here.</div>}{messages.map((message, index) => <article className={`message ${message.role}`} key={`${message.role}-${index}`}><div className="message-label">{message.role === "user" ? "You / prompt" : "Forge / response"}</div><p>{message.text}</p></article>)}{pending && <div className="message assistant pending-message"><div className="message-label">Forge / response</div><p><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></p></div>}</div>
          {error && <div className="error-banner" role="alert">{error}</div>}
          <form className="composer" onSubmit={submit}><label htmlFor="prompt-input">Your prompt</label><textarea id="prompt-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event); } }} placeholder={activeMode.placeholder} rows="3" disabled={pending} /><div className="composer-footer"><span>Enter to send / Shift + Enter for a new line</span><button type="submit" disabled={!input.trim() || pending}>{pending ? "Working..." : "Send"}<span aria-hidden="true">-&gt;</span></button></div></form>
        </section>
        {mode === "agent" ? <PreviewPanel project={activeThread?.project} pending={pending} /> : <ChatAside />}
      </div>
    </section>
  </main>;
}

function HistorySection({ mode, threads, activeId, onSelect, onNew, onDelete, onClear }) {
  const label = mode === "chat" ? "Chat history" : "Agent history";
  return <section className="history-section"><div className="history-heading"><span>{label}</span><div className="history-actions"><button type="button" onClick={onClear} aria-label={`Clear ${mode} history`} title="Clear history">Clear</button><button type="button" onClick={onNew} aria-label={`Start new ${mode}`} title={`New ${mode}`}>+</button></div></div><div className="history-list">{threads.slice(0, 8).map((thread) => <div className={`history-item ${activeId === thread.id ? "selected" : ""}`} key={thread.id}><button type="button" className="history-select" onClick={() => onSelect(mode, thread.id)}><span className="history-title">{thread.title}</span><span className="history-meta">{thread.messages.length ? `${thread.messages.length} messages` : "Empty"} / {formatTime(thread.updatedAt)}</span></button><button type="button" className="history-delete" onClick={() => onDelete(mode, thread.id)} aria-label={`Delete ${thread.title}`} title="Delete conversation">x</button></div>)}</div></section>;
}

function ChatEmptyState({ onSelect }) {
  const suggestions = [
    ["Think with me", "Help me turn a rough idea into a clear plan."],
    ["Explain something", "Explain a difficult topic in simple terms."],
    ["Run the numbers", "Calculate the result of 248 * 37."],
    ["Check something live", "What is the weather in London today?"],
  ];
  return <div className="chat-empty-state"><div className="chat-empty-mark">F</div><span className="section-kicker">Open context</span><h2>What can I help with today?</h2><p>Ask Forge to reason, calculate, plan, or look up useful live information.</p><div className="suggestion-grid">{suggestions.map(([label, prompt]) => <button type="button" className="suggestion-card" key={label} onClick={() => onSelect(prompt)}><strong>{label}</strong><span>{prompt}</span></button>)}</div></div>;
}

function PreviewPanel({ project, pending }) {
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    if (!fullscreen) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setFullscreen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [fullscreen]);
  const preview = project?.previewUrl ? <iframe title="Generated website preview" src={project.previewUrl} /> : <div className="preview-placeholder"><div className="preview-cross">+</div><strong>{pending ? "Assembling your site" : "Your preview will land here"}</strong><span>{pending ? "The agent is creating files and checking the result." : "Start with a brief on the left to generate a working page."}</span></div>;
  return <aside className="preview-panel"><div className="preview-heading"><div><span className="section-kicker">02 / Output</span><h2>Site preview</h2></div><div className="preview-actions"><span className="live-tag">{pending ? "Building" : "Live"}</span><button type="button" className="preview-action" onClick={() => setFullscreen(true)} disabled={!project?.previewUrl} aria-label="Open preview fullscreen" title="Open fullscreen">[ ]</button><button type="button" className="preview-action" onClick={() => window.open(project?.previewUrl, "_blank", "noopener,noreferrer")} disabled={!project?.previewUrl} aria-label="Open preview in a new tab" title="Open in new tab">-&gt;</button></div></div><div className="preview-frame-wrap">{preview}</div><div className="file-panel"><div className="file-heading"><span>Project files</span><span>{project?.files?.length || 0}</span></div>{project?.files?.length ? project.files.map((file) => <div className="file-row" key={file}><span className="file-glyph">/</span>{file}</div>) : <div className="file-empty">No project generated yet.</div>}</div>{fullscreen && <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="Fullscreen site preview"><div className="overlay-bar"><strong>Site preview</strong><div><button type="button" onClick={() => window.open(project.previewUrl, "_blank", "noopener,noreferrer")}>Open in new tab -&gt;</button><button type="button" onClick={() => setFullscreen(false)} aria-label="Close fullscreen preview">Close <span aria-hidden="true">x</span></button></div></div><div className="overlay-frame">{preview}</div></div>}</aside>;
}

function ChatAside() {
  return <aside className="context-panel"><div className="context-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core">F</div></div><span className="section-kicker">Open context</span><h2>Bring the messy question.</h2><p>Forge can reason across everyday questions, calculations, weather, and exchange rates in one calm thread.</p><div className="context-list"><div><span>01</span> Ask a question</div><div><span>02</span> Add the missing detail</div><div><span>03</span> Leave with a next step</div></div></aside>;
}

export default App;