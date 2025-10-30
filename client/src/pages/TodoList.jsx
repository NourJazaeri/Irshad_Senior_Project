// client/src/pages/TodoList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchTodos,
  addTodo,
  completeTodo,
  deleteTodo,
  deleteAllCompletedTodos, // <-- add this import
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

export default function TodoList() {
  const traineeId = localStorage.getItem("userId");
  const [tab, setTab] = useState("todo");
  const [todos, setTodos] = useState([]); // all from DB
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState(() =>
    DAYS.reduce((acc, d) => ((acc[d] = ""), acc), {})
  );

  // Fetch tasks from DB
  useEffect(() => {
    const load = async () => {
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
    load();
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
  const handleAdd = async (day) => {
    const title = inputs[day].trim();
    if (!title) return;
    try {
      const newTodo = await addTodo({ traineeId, day, title });
      setTodos((prev) => [...prev, newTodo]);
      setInputs((inp) => ({ ...inp, [day]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeTodo(id);
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, isCompleted: true } : t))
      );
    } catch (err) {
      console.error(err);
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
      alert("Failed to delete all completed tasks");
    }
  };

  if (loading) return <div className="loading">Loading tasks…</div>;

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
                  placeholder={`Add a ${day} task...`}
                  value={inputs[day]}
                  onChange={(e) =>
                    setInputs((inp) => ({ ...inp, [day]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAdd(day)}
                />
                <button className="btn add" onClick={() => handleAdd(day)}>
                  Add
                </button>
              </div>

              <ul className="task-list">
                {todosByDay[day].length === 0 && (
                  <li className="muted">No tasks yet.</li>
                )}
                {todosByDay[day].map((t) => (
                  <li key={t._id} className="task">
                    <label>
                      <input
                        type="checkbox"
                        onChange={() => handleComplete(t._id)}
                      />
                      <span>{t.title}</span>
                    </label>
                    <button
                      className="trash-btn"
                      onClick={() => handleDelete(t._id)}
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <section className="completed">
          <div className="completed-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Completed Tasks ({completed.length})</h3>
            {completed.length > 0 && (
              <button className="btn danger" onClick={handleDeleteAllCompleted} style={{ minWidth: '120px', marginLeft: 'auto' }}>
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
                    🗑️
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
