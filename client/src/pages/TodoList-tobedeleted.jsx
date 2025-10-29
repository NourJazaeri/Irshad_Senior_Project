// client/src/pages/TodoList.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../styles/todo.css";

/** --- Utilities --- */
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const uid = () => Math.random().toString(36).slice(2, 10);

/** Normalized shape we can later map to DB fields easily:
 * {
 *   byDay: { Sunday: [{id,title,createdAt}], ... },
 *   completed: [{id,title,completedAt}]
 * }
 */
const emptyWeek = () =>
  DAYS.reduce((acc, d) => {
    acc[d] = [];
    return acc;
  }, {});

const loadState = () => {
  try {
    const raw = localStorage.getItem("todo_v1");
    if (!raw) return { byDay: emptyWeek(), completed: [] };
    const parsed = JSON.parse(raw);
    // defensive fill for missing days
    return {
      byDay: { ...emptyWeek(), ...(parsed.byDay || {}) },
      completed: parsed.completed || [],
    };
  } catch {
    return { byDay: emptyWeek(), completed: [] };
  }
};

const saveState = (state) => {
  localStorage.setItem("todo_v1", JSON.stringify(state));
};

/** --- Page --- */
export default function TodoList() {
  // If you already store the logged-in userId, you may scope by userId here.
  // const traineeId = localStorage.getItem("userId");

  const [tab, setTab] = useState("todo"); // 'todo' | 'completed'
  const [state, setState] = useState(loadState());
  const [inputs, setInputs] = useState(() =>
    DAYS.reduce((acc, d) => ((acc[d] = ""), acc), {})
  );
  const [searchCompleted, setSearchCompleted] = useState("");

  // Persist to localStorage whenever state changes
  useEffect(() => saveState(state), [state]);

  /** Actions */
  const addTask = (day) => {
    const title = (inputs[day] || "").trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      byDay: {
        ...s.byDay,
        [day]: [...s.byDay[day], { id: uid(), title, createdAt: Date.now() }],
      },
    }));
    setInputs((inp) => ({ ...inp, [day]: "" }));
  };

  const completeTask = (day, taskId) => {
    setState((s) => {
      const remain = s.byDay[day].filter((t) => t.id !== taskId);
      const done = s.byDay[day].find((t) => t.id === taskId);
      if (!done) return s;
      return {
        ...s,
        byDay: { ...s.byDay, [day]: remain },
        completed: [{ ...done, completedAt: Date.now() }, ...s.completed],
      };
    });
  };

  const removeCompleted = (taskId) => {
    setState((s) => ({
      ...s,
      completed: s.completed.filter((t) => t.id !== taskId),
    }));
  };

  const clearCompleted = () => {
    if (!state.completed.length) return;
    if (!confirm("Delete all completed tasks?")) return;
    setState((s) => ({ ...s, completed: [] }));
  };

  /** Derived */
  const filteredCompleted = useMemo(() => {
    const q = searchCompleted.trim().toLowerCase();
    if (!q) return state.completed;
    return state.completed.filter((t) => t.title.toLowerCase().includes(q));
  }, [state.completed, searchCompleted]);

  return (
    <div className="todo-wrap">
      <div className="todo-header">
        <h1>My To-Do List</h1>

        <div className="tabs">
          <button
            className={`tab ${tab === "todo" ? "active" : ""}`}
            onClick={() => setTab("todo")}
          >
            To-Do
          </button>
          <button
            className={`tab ${tab === "completed" ? "active" : ""}`}
            onClick={() => setTab("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      {tab === "todo" ? (
        <section className="board">
          {DAYS.map((day) => (
            <div className="col" key={day}>
              <div className="col-head">{day}</div>

              <div className="add-row">
                <input
                  className="add-input"
                  placeholder={`Add a ${day} task…`}
                  value={inputs[day]}
                  onChange={(e) =>
                    setInputs((inp) => ({ ...inp, [day]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addTask(day)}
                />
                <button className="btn add" onClick={() => addTask(day)}>
                  Add
                </button>
              </div>

              <ul className="task-list">
                {state.byDay[day].length === 0 && (
                  <li className="muted">No tasks yet.</li>
                )}
                {state.byDay[day].map((t) => (
                  <li key={t.id} className="task">
                    <label className="check">
                      <input
                        type="checkbox"
                        onChange={() => completeTask(day, t.id)}
                      />
                      <span>{t.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <section className="completed">
          <div className="completed-top">
            <input
              className="search"
              placeholder="Search completed…"
              value={searchCompleted}
              onChange={(e) => setSearchCompleted(e.target.value)}
            />
            <button
              className="btn danger"
              onClick={clearCompleted}
              disabled={!state.completed.length}
              title="Delete all completed tasks"
            >
              Delete All
            </button>
          </div>

          <ul className="completed-list">
            {filteredCompleted.length === 0 ? (
              <li className="muted">Nothing here yet.</li>
            ) : (
              filteredCompleted.map((t) => (
                <li key={t.id} className="completed-item">
                  <span className="dot" aria-hidden />
                  <span className="title">{t.title}</span>
                  <button
                    className="btnghost"
                    onClick={() => removeCompleted(t.id)}
                    title="Delete"
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
