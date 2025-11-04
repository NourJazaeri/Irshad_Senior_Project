// client/src/pages/TodoList.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle2, Star, Sparkles, Trash2 } from 'lucide-react';
import {
  fetchTodos,
  addTodo,
  updateTodo,
  completeTodo,
  deleteTodo,
  deleteAllCompletedTodos,
} from "../services/api.js";
import "../styles/todo.css";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const CELEBRATION_MESSAGES = [
  { title: "Excellent!", subtitle: "You're on fire!" },
  { title: "Bravo!", subtitle: "Keep up the momentum!" },
  { title: "Wonderful!", subtitle: "You're making progress!" },
  { title: "Fantastic!", subtitle: "Keep going!" },
  { title: "Outstanding!", subtitle: "You're crushing it!" },
  { title: "Brilliant!", subtitle: "Way to go!" },
  { title: "Superb!", subtitle: "You've got this!" },
  { title: "Incredible!", subtitle: "You're unstoppable!" },
];

export default function TodoList() {
  const traineeId = localStorage.getItem("userId");
  const [tab, setTab] = useState("todo");
  const [todos, setTodos] = useState([]); // all from DB
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState({ title: "", subtitle: "" });
  const inputRefs = useRef({});
  const newInputRefs = useRef({});

  // Fetch tasks from DB
  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await fetchTodos(traineeId);
      setTodos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [traineeId]);

  // Derived
  const active = todos.filter((t) => !t.isCompleted);
  const completed = todos.filter((t) => t.isCompleted);

  const todosByDay = useMemo(() => {
    const byDay = {};
    DAYS.forEach((d) => (byDay[d] = []));
    active.forEach((t) => {
      if (!byDay[t.day]) byDay[t.day] = [];
      byDay[t.day].push(t);
    });
    return byDay;
  }, [active]);

  // --- Actions --- //
  const handleAddFromTaskInput = async (day, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const newTodo = await addTodo({ traineeId, day, title: trimmed });
      setTodos((prev) => [...prev, newTodo]);
      // Clear the new input field
      if (newInputRefs.current[day]) {
        newInputRefs.current[day].value = "";
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id) => {
    try {
      // Update state immediately for instant UI feedback
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, isCompleted: true } : t))
      );
      // Show celebration with random message
      const randomMessage = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebrationMessage(randomMessage);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
      // Update on the server
      await completeTodo(id);
      // Refetch to ensure everything is in sync with the server
      const data = await fetchTodos(traineeId);
      setTodos(data);
    } catch (err) {
      console.error("Error completing todo:", err);
      // Reload from server on error to get the correct state back
      loadTodos();
    }
  };

  const handleUpdate = async (id, newTitle) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      // If empty, don't save but also reload from server to get original value
      loadTodos();
      return;
    }
    try {
      await updateTodo(id, trimmed);
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, title: trimmed } : t))
      );
    } catch (err) {
      console.error("Error updating todo:", err);
      // Reload from server on error to get the correct state back
      loadTodos();
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Handler for deleting all completed todos
  const handleDeleteAllCompleted = async () => {
    try {
      await deleteAllCompletedTodos(traineeId);
      setTodos((prev) => prev.filter((t) => !t.isCompleted));
    } catch (err) {
      console.error(err);
      // Reload from server on error to get the correct state back
      loadTodos();
    }
  };

  if (loading) return <div className="loading">Loading tasks…</div>;

  return (
    <div className="todo-wrap">
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-message">
            <CheckCircle2 className="celebration-icon-large" />
            <div className="celebration-icons">
              <Star className="celebration-icon" style={{ animationDelay: '0s' }} />
              <Sparkles className="celebration-icon" style={{ animationDelay: '0.15s' }} />
              <Star className="celebration-icon" style={{ animationDelay: '0.3s' }} />
            </div>
            <h2>{celebrationMessage.title}</h2>
            <p>{celebrationMessage.subtitle}</p>
          </div>
        </div>
      )}
      <div className="todo-header">
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

            <ul className="task-list">
              {todosByDay[day].map((t, idx) => (
                <li key={t._id} className="task saved">
                  <label>
                    <input
                      type="checkbox"
                      onChange={() => handleComplete(t._id)}
                    />
                    <input
                      ref={(el) => (inputRefs.current[`${day}-${idx}`] = el)}
                      type="text"
                      className="task-title-input"
                      value={t.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setTodos((prev) =>
                          prev.map((todo) =>
                            todo._id === t._id ? { ...todo, title: newTitle } : todo
                          )
                        );
                      }}
                      onBlur={(e) => handleUpdate(t._id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.target.blur();
                          // Focus next input
                          const nextIdx = idx + 1;
                          if (nextIdx < todosByDay[day].length) {
                            inputRefs.current[`${day}-${nextIdx}`]?.focus();
                          } else {
                            newInputRefs.current[day]?.focus();
                          }
                        }
                      }}
                    />
                  </label>
                  <button
                    className="trash-btn"
                    onClick={() => handleDelete(t._id)}
                  >
                    <Trash2 className="trash-icon" />
                  </button>
                </li>
              ))}
              <li className="task task-new">
                <input
                  ref={(el) => (newInputRefs.current[day] = el)}
                  type="text"
                  className="task-new-input"
                  placeholder={`Add a ${day} task...`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFromTaskInput(day, e.target.value);
                    }
                  }}
                />
                <button
                  className="trash-btn"
                  style={{ visibility: 'hidden' }}
                  disabled
                >
                  <Trash2 className="trash-icon" />
                </button>
              </li>
            </ul>
          </div>
        ))}
      </section>
      ) : (
        <section className="completed">
          <div className="completed-top">
            <h3>Completed Tasks ({completed.length})</h3>
            {completed.length > 0 && (
              <button className="btn-delete-all" onClick={handleDeleteAllCompleted}>
                Delete All
              </button>
            )}
          </div>
          <ul className="completed-list">
            {completed.length === 0 ? (
              <li className="muted">No completed tasks yet.</li>
            ) : (
              completed.map((t) => (
                <li key={t._id} className="completed-item">
                  <span className="title">{t.title}</span>
                  <button
                    className="trash-btn"
                    onClick={() => handleDelete(t._id)}
                  >
                    <Trash2 className="trash-icon" />
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
