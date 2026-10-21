import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "./api";
import "./App.css";

const STATE_LABELS = {
  "New": "Новая",
  "In Progress": "В работе",
  "Done": "Выполнена",
};

const STATE_CLASS = {
  "New": "new",
  "In Progress": "in-progress",
  "Done": "done",
};

const FILTER_OPTIONS = [
  { value: "All", label: "Все" },
  { value: "New", label: "Новые" },
  { value: "In Progress", label: "В работе" },
  { value: "Done", label: "Выполненные" },
];

function getInitials(name) {
  return (
    name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() ||
    "?"
  );
}

function formatDate(date) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketCard({ ticket, onStateChange, onDelete }) {
  return (
    <article className="ticket-card">
      <div className="ticket-card__header">
        <span className={`status-badge ${STATE_CLASS[ticket.state]}`}>
          {STATE_LABELS[ticket.state] || ticket.state}
        </span>
        <span className="ticket-date">{formatDate(ticket.date)}</span>
      </div>
      <h3 className="ticket-card__title">{ticket.problem}</h3>
      <p className="ticket-card__author">
        <span className="avatar">{getInitials(ticket.author)}</span>
        {ticket.author}
      </p>
      <div className="ticket-card__actions">
        <select
          className="state-select"
          value={ticket.state}
          onChange={(e) => onStateChange(ticket.id, e.target.value)}
          aria-label="Изменить статус"
        >
          <option value="New">Новая</option>
          <option value="In Progress">В работе</option>
          <option value="Done">Выполнена</option>
        </select>
        <button className="delete-btn" onClick={() => onDelete(ticket.id)}>
          Удалить
        </button>
      </div>
    </article>
  );
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const [author, setAuthor] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      setError("");
      const data = await api.getAll();
      setTickets(data);
    } catch {
      setError("Не удалось загрузить заявки. Проверьте, запущен ли бэкенд.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!problem.trim() || !author.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.create(problem.trim(), author.trim());
      setProblem("");
      setAuthor("");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Не удалось создать заявку");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStateChange = async (id, newState) => {
    const prev = tickets;
    setTickets((ts) =>
      ts.map((t) => (t.id === id ? { ...t, state: newState } : t))
    );
    try {
      await api.updateState(id, newState);
    } catch (err) {
      setTickets(prev);
      setError(err.message || "Не удалось изменить статус");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Точно удалить эту заявку?")) return;
    const prev = tickets;
    setTickets((ts) => ts.filter((t) => t.id !== id));
    try {
      await api.delete(id);
    } catch (err) {
      setTickets(prev);
      setError(err.message || "Не удалось удалить заявку");
    }
  };

  const stats = useMemo(
    () => ({
      total: tickets.length,
      new: tickets.filter((t) => t.state === "New").length,
      inProgress: tickets.filter((t) => t.state === "In Progress").length,
      done: tickets.filter((t) => t.state === "Done").length,
    }),
    [tickets]
  );

  const visibleTickets = useMemo(() => {
    let result = tickets;
    if (filter !== "All") result = result.filter((t) => t.state === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.problem.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickets, filter, search]);

  const countByFilter = (value) => {
    if (value === "All") return stats.total;
    if (value === "New") return stats.new;
    if (value === "In Progress") return stats.inProgress;
    if (value === "Done") return stats.done;
    return 0;
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>Система заявок</h1>
      </header>

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Закрыть">
            ×
          </button>
        </div>
      )}

      <section className="stats">
        <div className="stat">
          <div className="stat-label">Всего</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat new">
          <div className="stat-label">Новые</div>
          <div className="stat-value">{stats.new}</div>
        </div>
        <div className="stat in-progress">
          <div className="stat-label">В работе</div>
          <div className="stat-value">{stats.inProgress}</div>
        </div>
        <div className="stat done">
          <div className="stat-label">Выполнены</div>
          <div className="stat-value">{stats.done}</div>
        </div>
      </section>

      <section className="create-card">
        <h2 className="create-card__title">Новая заявка</h2>
        <form className="create-form" onSubmit={handleCreate}>
          <input
            className="input"
            type="text"
            placeholder="Что случилось?"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            required
          />
          <input
            className="input"
            type="text"
            placeholder="Ваше имя"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Создание…" : "Создать"}
          </button>
        </form>
      </section>

      <div className="toolbar">
        <div className="filter-pills" role="tablist" aria-label="Фильтр по статусу">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`pill ${filter === opt.value ? "active" : ""}`}
              onClick={() => setFilter(opt.value)}
              role="tab"
              aria-selected={filter === opt.value}
            >
              {opt.label}
              <span className="pill-count">{countByFilter(opt.value)}</span>
            </button>
          ))}
        </div>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="input"
            type="search"
            placeholder="Поиск по теме или автору…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск заявок"
          />
        </div>
      </div>

      <div className="ticket-list">
        {loading ? (
          <>
            <div className="skeleton">
              <div className="skeleton__line short" />
              <div className="skeleton__line medium" />
              <div className="skeleton__line short" />
            </div>
            <div className="skeleton">
              <div className="skeleton__line short" />
              <div className="skeleton__line medium" />
            </div>
          </>
        ) : visibleTickets.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p className="empty-title">
              {tickets.length === 0 ? "Заявок пока нет" : "Ничего не найдено"}
            </p>
            <p className="empty-subtitle">
              {tickets.length === 0
                ? "Создайте первую заявку в форме выше"
                : "Попробуйте изменить фильтр или поисковый запрос"}
            </p>
          </div>
        ) : (
          visibleTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onStateChange={handleStateChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;