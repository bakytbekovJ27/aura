import { useEffect, useState } from 'react';

import { api } from '../api/client';
import { useToast } from '../hooks/useToast';

const EXAMPLES = [
  'Я сегодня иду на встречу с HR, подбери мне образ.',
  'Мне нужен спокойный образ для офиса и прохладной погоды.',
  'Собери мне casual look на выходные с тем, что уже есть в гардеробе.',
];

export default function TipsPage() {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;

  const loadSessions = async (preferredId = null) => {
    setLoadingSessions(true);
    try {
      const response = await api.get('/chat-sessions/');
      const list = response.results ?? response;
      setSessions(list);
      const nextId = preferredId || activeSessionId || list[0]?.id || null;
      setActiveSessionId(nextId);
      if (!nextId) setMessages([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async sessionId => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await api.get(`/chat-sessions/${sessionId}/messages/`);
      setMessages(response.results ?? response);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  const createSession = async (firstPrompt = '') => {
    const created = await api.post('/chat-sessions/', {
      title: firstPrompt ? firstPrompt.slice(0, 70) : 'Новый диалог',
    });
    const nextSession = { ...created, last_message: null, messages_count: 0 };
    setSessions(prev => [nextSession, ...prev]);
    setActiveSessionId(created.id);
    setMessages([]);
    return created;
  };

  const sendMessage = async customPrompt => {
    const content = (customPrompt ?? prompt).trim();
    if (!content) return;

    setSending(true);
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createSession(content);
        sessionId = session.id;
      }

      const response = await api.post(`/chat-sessions/${sessionId}/messages/`, { content });
      const newMessages = response.messages || [];
      setMessages(prev => [...prev, ...newMessages]);
      setSessions(prev => {
        const updated = response.session;
        const rest = prev.filter(session => session.id !== updated.id);
        return [updated, ...rest];
      });
      setActiveSessionId(response.session.id);
      setPrompt('');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const startFreshChat = async () => {
    try {
      await createSession('');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const onSubmit = async event => {
    event.preventDefault();
    await sendMessage();
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-tag">AI Чат</div>
        <h1 className="page-title">Стильный <em>ассистент</em></h1>
        <p className="page-subtitle">Опиши событие или задачу, а ассистент подберёт образ на основе твоего гардероба и аксессуаров.</p>
      </div>

      <div className="chat-layout">
        <aside className="chat-sidebar card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: 18 }}>Диалоги</div>
            <button className="btn btn-ghost btn-sm" onClick={startFreshChat}>+ Новый</button>
          </div>

          {loadingSessions ? (
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>Загружаем историю...</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
              Здесь появятся твои чаты с ассистентом.
            </div>
          ) : (
            <div className="chat-session-list">
              {sessions.map(session => (
                <button
                  key={session.id}
                  className={`chat-session-item ${session.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className="chat-session-title">{session.title || 'Новый диалог'}</div>
                  <div className="chat-session-preview">
                    {session.last_message?.content || 'Диалог пока пуст'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="chat-panel card">
          {loadingMessages ? (
            <div className="loading-overlay">
              <span className="spinner spinner-dark" /> Загружаем чат...
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-state">
              <div style={{ fontSize: 56, marginBottom: 14 }}>🤖</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, marginBottom: 8 }}>
                Спроси о своём образе
              </div>
              <p style={{ color: 'var(--muted)', maxWidth: 560, margin: '0 auto 22px', lineHeight: 1.7 }}>
                Ассистент посмотрит на вещи в твоём гардеробе и предложит готовый комплект без лишней анкеты и сложных настроек.
              </p>
              <div className="chat-example-list">
                {EXAMPLES.map(example => (
                  <button key={example} className="chat-example" onClick={() => sendMessage(example)}>
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map(message => (
                <div key={message.id} className={`chat-message ${message.role}`}>
                  <div className="chat-bubble">
                    <div className="chat-role">{message.role === 'assistant' ? 'AURA' : 'Ты'}</div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{message.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="chat-composer">
            <textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              className="form-control"
              placeholder="Например: Я иду на встречу с HR, хочу выглядеть уверенно и спокойно. Подбери образ из моего гардероба."
              rows={3}
            />
            <div className="flex-between" style={{ alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {activeSession ? `Диалог: ${activeSession.title || 'Новый чат'}` : 'Начни новый диалог одним сообщением'}
              </div>
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending ? <><span className="spinner" /> Отправляю...</> : 'Отправить'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
