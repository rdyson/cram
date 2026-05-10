'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';

type Deck = { id: string; title: string };
type StudyItem = {
  id: string;
  type: 'flashcard' | 'scenario_question';
  prompt: string;
  answer?: string | null;
  answer_choices?: { key: string; text: string }[] | null;
  correct_answer_key?: string | null;
  explanation: string;
  why_wrong_answers_are_wrong?: Record<string, string> | null;
  difficulty: string;
  exam_topics?: { name: string; exam_domains?: { name: string } };
};
type DashboardRow = { topic: string; domain: string; coverageScore: number; masteryScore: number; attempts: number; correct: number; diagnosis: string };

type AppState = {
  decks: Deck[];
  activeDeck: Deck | null;
  assets: { id: string; filename: string; status: string }[];
  items: StudyItem[];
  attempts: { study_item_id: string }[];
  feedback: unknown[];
  jobs: { id: string; status: string; stage: string; error_message?: string }[];
  dashboard: DashboardRow[];
};

const emptyState: AppState = { decks: [], activeDeck: null, assets: [], items: [], attempts: [], feedback: [], jobs: [], dashboard: [] };

export default function Home() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<AppState>(emptyState);
  const [deckTitle, setDeckTitle] = useState('SAA-C03 Cram Deck');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean; explanation: string; why?: Record<string, string> | null }>>({});
  const [startedAt, setStartedAt] = useState(Date.now());

  async function token() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function api(path: string, init: RequestInit = {}) {
    const accessToken = await token();
    const response = await fetch(path, {
      ...init,
      headers: { ...(init.headers ?? {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Request failed');
    return {
      ...emptyState,
      ...data,
      decks: data.decks ?? [],
      assets: data.assets ?? [],
      items: data.items ?? [],
      attempts: data.attempts ?? [],
      feedback: data.feedback ?? [],
      jobs: data.jobs ?? [],
      dashboard: data.dashboard ?? []
    };
  }

  async function refresh(deckId?: string) {
    if (!user) return;
    const data = await api('/api/state', { method: 'POST', body: JSON.stringify({ deckId }) });
    setState(data);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      refresh().catch((e) => {
        const text = e instanceof Error ? e.message : 'Access failed';
        setMessage(text === 'Email not allowed' ? 'This app is private. Your email is not on the allowlist.' : text);
        if (text === 'Email not allowed') supabase.auth.signOut();
      });
    }
  }, [user]);

  async function checkAllowedEmail(candidate: string) {
    const response = await fetch('/api/auth/allowlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candidate.trim().toLowerCase() })
    });
    const data = await response.json();
    return Boolean(data.allowed);
  }

  async function signIn(up: boolean) {
    setBusy(true); setMessage('');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const allowed = await checkAllowedEmail(normalizedEmail);
      if (!allowed) {
        setMessage('This app is private. Your email is not on the allowlist.');
        setBusy(false);
        return;
      }
      const result = up
        ? await supabase.auth.signUp({ email: normalizedEmail, password })
        : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (result.error) throw result.error;
      const signedInEmail = result.data.user?.email?.toLowerCase();
      if (signedInEmail) {
        try {
          await api('/api/bootstrap', { method: 'POST' });
        } catch (accessError) {
          const text = accessError instanceof Error ? accessError.message : 'Access failed';
          if (text === 'Email not allowed') {
            await supabase.auth.signOut();
            setMessage('This app is private. Your email is not on the allowlist.');
            setBusy(false);
            return;
          }
          throw accessError;
        }
      }
      setMessage(up ? 'Account created. If email confirmation is enabled, check your inbox.' : 'Signed in.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Auth failed'); }
    setBusy(false);
  }

  async function createDeck() {
    setBusy(true); setMessage('');
    try {
      const data = await api('/api/decks', { method: 'POST', body: JSON.stringify({ title: deckTitle }) });
      await refresh(data.deck.id);
      setMessage('Deck created. Upload your Markdown notes next.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Create deck failed'); }
    setBusy(false);
  }

  async function upload(files: FileList | null) {
    if (!files?.length || !state.activeDeck) return;
    setBusy(true); setMessage(`Uploading 0/${files.length} files...`);
    let succeeded = 0;
    const failures: string[] = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      try {
        setMessage(`Uploading ${index + 1}/${files.length}: ${file.name}`);
        const form = new FormData();
        form.set('deckId', state.activeDeck.id);
        form.set('file', file);
        await api('/api/upload', { method: 'POST', body: form });
        succeeded += 1;
      } catch (e) {
        failures.push(`${file.name}: ${e instanceof Error ? e.message : 'Upload failed'}`);
      }
    }
    await refresh(state.activeDeck.id);
    setMessage(failures.length ? `Uploaded ${succeeded}/${files.length}. Failed: ${failures.join('; ')}` : `Uploaded ${succeeded}/${files.length} files. Generate study items next.`);
    setBusy(false);
  }

  async function generate() {
    if (!state.activeDeck) return;
    setBusy(true); setMessage('');
    try {
      await api('/api/generate', { method: 'POST', body: JSON.stringify({ deckId: state.activeDeck.id }) });
      await refresh(state.activeDeck.id);
      setMessage('Generated study items. Start practicing.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Generation failed'); }
    setBusy(false);
  }

  async function submit(item: StudyItem) {
    if (!state.activeDeck) return;
    setBusy(true); setMessage('');
    try {
      const data = await api('/api/attempt', {
        method: 'POST',
        body: JSON.stringify({
          deckId: state.activeDeck.id,
          studyItemId: item.id,
          selectedAnswerKey: selected[item.id],
          confidenceBefore: confidence[item.id] ?? 3,
          timeToAnswerMs: Date.now() - startedAt
        })
      });
      setResults((prev) => ({ ...prev, [item.id]: { isCorrect: data.isCorrect, explanation: data.item.explanation, why: data.item.why_wrong_answers_are_wrong } }));
      setStartedAt(Date.now());
      await refresh(state.activeDeck.id);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Attempt failed'); }
    setBusy(false);
  }

  async function flag(item: StudyItem) {
    if (!state.activeDeck) return;
    setBusy(true); setMessage('');
    try {
      await api('/api/flag', { method: 'POST', body: JSON.stringify({ deckId: state.activeDeck.id, studyItemId: item.id, reason: 'unclear_wording' }) });
      await refresh(state.activeDeck.id);
      setMessage('Item flagged and hidden from future practice.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Flag failed'); }
    setBusy(false);
  }

  if (!user) {
    return <main className="container hero">
      <section>
        <div className="kicker">cram</div>
        <h1>Know what you saw. Prove what you know.</h1>
        <p className="muted">A blueprint-first SAA-C03 study coach. Upload Markdown notes, generate exam-style drills, track confidence, and find false familiarity before the exam does.</p>
      </section>
      <section className="card">
        <h2>Sign in</h2>
        <p className="muted">Use email/password for the prototype.</p>
        <div className="grid">
          <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button disabled={busy} onClick={() => signIn(false)}>Sign in</button>
          <button disabled={busy} className="secondary" onClick={() => signIn(true)}>Create account</button>
        </div>
        {message && <p className="muted">{message}</p>}
      </section>
    </main>;
  }

  return <main className="container">
    <nav className="nav">
      <div><div className="kicker">cram</div><strong>{user.email}</strong></div>
      <button className="secondary" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </nav>
    {message && <div className="item muted">{message}</div>}

    <section className="grid">
      <div className="card">
        <h2>1. Deck</h2>
        <p className="muted">Single-user first. Sharing comes later.</p>
        <input value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} />
        <button style={{ marginTop: 12 }} disabled={busy} onClick={createDeck}>Create deck</button>
        <div style={{ marginTop: 12 }}>
          {state.decks.map((deck) => <button key={deck.id} className="secondary" style={{ marginRight: 8, marginBottom: 8 }} onClick={() => refresh(deck.id)}>{deck.title}</button>)}
        </div>
      </div>

      <div className="card">
        <h2>2. Upload notes or screenshots</h2>
        <p className="muted">Your notes tell cram what you have seen. Your answers tell it what you know. Select multiple PNG/JPG screenshots to batch OCR them with OpenAI vision.</p>
        <input type="file" multiple accept=".md,.markdown,.png,.jpg,.jpeg,image/png,image/jpeg" disabled={!state.activeDeck || busy} onChange={(e) => upload(e.target.files)} />
        <div style={{ marginTop: 12 }}>{state.assets.map((asset) => <span className="pill" key={asset.id}>{asset.filename} · {asset.status}</span>)}</div>
      </div>

      <div className="card">
        <h2>3. Generate</h2>
        <p className="muted">Creates 5 flashcards and 5 scenario questions with validation and repair.</p>
        <button disabled={!state.activeDeck || !state.assets.length || busy} onClick={generate}>Generate study items</button>
        <div style={{ marginTop: 12 }}>{state.jobs.map((job) => <div className="pill" key={job.id}>{job.status} · {job.stage}{job.error_message ? ` · ${job.error_message}` : ''}</div>)}</div>
      </div>
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <h2>Dashboard</h2>
      {!state.dashboard.length && <p className="muted">Upload notes and answer questions to build coverage and mastery.</p>}
      {!!state.dashboard.length && <table className="table"><thead><tr><th>Topic</th><th>Domain</th><th>Coverage</th><th>Mastery</th><th>Attempts</th><th>Diagnosis</th></tr></thead><tbody>{state.dashboard.map((row) => <tr key={row.topic}><td>{row.topic}</td><td>{row.domain}</td><td>{row.coverageScore}/5</td><td>{row.masteryScore}/5</td><td>{row.correct}/{row.attempts}</td><td>{row.diagnosis}</td></tr>)}</tbody></table>}
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <h2>Practice</h2>
      {!state.items.length && <p className="muted">No study items yet.</p>}
      {state.items.map((item) => <div className="item" key={item.id}>
        <div className="row"><span className="pill">{item.type}</span><span className="pill">{item.exam_topics?.exam_domains?.name}</span><span className="pill">{item.exam_topics?.name}</span><span className="pill">{item.difficulty}</span></div>
        <h3>{item.prompt}</h3>
        {item.type === 'flashcard' ? <details><summary>Reveal answer</summary><p>{item.answer}</p><p className="muted">{item.explanation}</p></details> : <div>{item.answer_choices?.map((choice) => <button key={choice.key} className={`choice ${selected[item.id] === choice.key ? 'selected' : ''}`} onClick={() => setSelected((prev) => ({ ...prev, [item.id]: choice.key }))}>{choice.key}. {choice.text}</button>)}</div>}
        <div className="row" style={{ marginTop: 12 }}>
          <span className="muted">Confidence</span>
          {[1,2,3,4,5].map((n) => <button key={n} className={confidence[item.id] === n ? '' : 'secondary'} onClick={() => setConfidence((prev) => ({ ...prev, [item.id]: n }))}>{n}</button>)}
          <button disabled={busy || (item.type !== 'flashcard' && !selected[item.id])} onClick={() => submit(item)}>Submit</button>
          <button className="danger" disabled={busy} onClick={() => flag(item)}>Flag bad item</button>
        </div>
        {results[item.id] && <div className="item"><strong className={results[item.id].isCorrect ? 'ok' : 'bad'}>{results[item.id].isCorrect ? 'Correct' : 'Incorrect'}</strong><p>{results[item.id].explanation}</p>{results[item.id].why && <ul>{Object.entries(results[item.id].why ?? {}).map(([key, why]) => <li key={key}><strong>{key}:</strong> {why}</li>)}</ul>}</div>}
      </div>)}
    </section>
  </main>;
}
