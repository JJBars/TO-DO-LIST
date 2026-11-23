import { FormEvent, useEffect, useMemo, useState } from "react";
import "./App.css";

type Priority = "high" | "medium" | "low";
type Filter = "all" | "today" | "upcoming" | "completed";
type Subtask = { id: number; title: string; completed: boolean };
type Task = { id: number; title: string; category: string; priority: Priority; dueDate: string; completed: boolean; subtasks: Subtask[] };

const seedTasks: Task[] = [
  { id: 1, title: "Revisar propuesta del proyecto", category: "Trabajo", priority: "high", dueDate: "2026-11-23", completed: false, subtasks: [] },
  { id: 2, title: "Comprar víveres", category: "Personal", priority: "medium", dueDate: "2026-11-23", completed: false, subtasks: [] },
  { id: 3, title: "Actualizar documentación", category: "Trabajo", priority: "low", dueDate: "2026-11-24", completed: true, subtasks: [] },
  { id: 4, title: "Sesión de entrenamiento", category: "Salud", priority: "medium", dueDate: "2026-11-25", completed: false, subtasks: [] },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    today: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m8 15 2.2 2.2L16 12"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    trash: <><path d="M3 6h18M8 6V3h8v3M19 6l-1 15H6L5 6"/><path d="M10 10v7M14 10v7"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("todo-tasks");
    return saved ? (JSON.parse(saved) as Task[]).map((task) => ({ ...task, subtasks: task.subtasks ?? [] })) : seedTasks;
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("2026-11-23");
  const [newSubtasks, setNewSubtasks] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<number, string>>({});

  useEffect(() => localStorage.setItem("todo-tasks", JSON.stringify(tasks)), [tasks]);
  const today = "2026-11-23";

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (filter === "today" && task.dueDate !== today) return false;
    if (filter === "upcoming" && (task.dueDate <= today || task.completed)) return false;
    if (filter === "completed" && !task.completed) return false;
    if (filter === "all" && search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "completed" && filter !== "all" && task.completed) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, filter, search]);

  const allItems = tasks.flatMap((task) => [task, ...task.subtasks]);
  const pendingCount = allItems.filter((task) => !task.completed).length;
  const completedCount = allItems.filter((task) => task.completed).length;
  const progress = allItems.length ? Math.round((completedCount / allItems.length) * 100) : 0;

  function addTask(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const subtasks = newSubtasks.split("\n").map((item) => item.trim()).filter(Boolean)
      .map((subtask, index) => ({ id: Date.now() + index, title: subtask, completed: false }));
    setTasks((current) => [...current, { id: Date.now(), title: cleanTitle, category, priority, dueDate, completed: false, subtasks }]);
    setTitle("");
    setNewSubtasks("");
  }

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, completed: !task.completed, subtasks: task.subtasks.map((subtask) => ({ ...subtask, completed: !task.completed })) }
      : task));
  }

  function toggleSubtask(taskId: number, subtaskId: number) {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task;
      const subtasks = task.subtasks.map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask);
      return { ...task, subtasks, completed: subtasks.length > 0 && subtasks.every((subtask) => subtask.completed) };
    }));
  }

  function addSubtask(taskId: number) {
    const cleanTitle = (subtaskDrafts[taskId] ?? "").trim();
    if (!cleanTitle) return;
    setTasks((current) => current.map((task) => task.id === taskId
      ? { ...task, completed: false, subtasks: [...task.subtasks, { id: Date.now(), title: cleanTitle, completed: false }] }
      : task));
    setSubtaskDrafts((current) => ({ ...current, [taskId]: "" }));
  }

  function removeSubtask(taskId: number, subtaskId: number) {
    setTasks((current) => current.map((task) => task.id === taskId
      ? { ...task, completed: false, subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId) }
      : task));
  }

  function toggleExpanded(taskId: number) {
    setExpandedTasks((current) => current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);
  }

  function removeTask(id: number) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function formatDate(date: string) {
    if (date === today) return "Hoy";
    return new Date(`${date}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  const navItems: { id: Filter; label: string; icon: string; count?: number }[] = [
    { id: "all", label: "Todas", icon: "grid", count: pendingCount },
    { id: "today", label: "Hoy", icon: "today" },
    { id: "upcoming", label: "Próximas", icon: "calendar" },
    { id: "completed", label: "Completadas", icon: "check", count: completedCount },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><span/><span/></div><span>Dayly</span></div>
        <nav className="main-nav" aria-label="Filtros">
          {navItems.map((item) => (
            <button key={item.id} className={filter === item.id ? "nav-item active" : "nav-item"} onClick={() => setFilter(item.id)}>
              <Icon name={item.icon}/><span>{item.label}</span>{item.count !== undefined && <b>{item.count}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-progress">
          <div className="progress-heading"><span>Progreso semanal</span><strong>{progress}%</strong></div>
          <div className="progress-track"><div style={{ width: `${progress}%` }}/></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-box"><Icon name="search" size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tareas..."/></div>
          <div className="date-chip"><span>Lunes</span><strong>23 noviembre</strong></div>
          <button className="avatar" aria-label="Perfil">B</button>
        </header>

        <section className="content">
          <div className="page-heading">
            <div><p>Organiza tu día</p><h1>{navItems.find((item) => item.id === filter)?.label}</h1></div>
            <span className="task-total">{visibleTasks.length} tareas</span>
          </div>
          <form className="add-task" onSubmit={addTask}>
            <div className="task-form-row">
              <button className="add-button" type="submit" aria-label="Añadir tarea"><Icon name="plus" size={20}/></button>
              <input className="task-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Añadir una nueva tarea..."/>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Categoría"><option>Personal</option><option>Trabajo</option><option>Salud</option></select>
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} aria-label="Prioridad"><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select>
              <input className="date-input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Fecha"/>
            </div>
            <label className="subtask-entry">
              <span>Subtareas opcionales <small>(una por línea)</small></span>
              <textarea value={newSubtasks} onChange={(event) => setNewSubtasks(event.target.value)} placeholder={"Ejemplo:\nPreparar materiales\nRevisar detalles"} rows={2}/>
            </label>
          </form>

          <div className="task-list">
            {visibleTasks.map((task) => (
              <article className={task.completed ? "task-card completed" : "task-card"} key={task.id}>
                <button className="check-button" onClick={() => toggleTask(task.id)} aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completada"}>{task.completed && <Icon name="check" size={16}/>}</button>
                <div className="task-info">
                  <h2>{task.title}</h2>
                  <div className="task-meta">
                    <span className={`category-dot ${task.category.toLowerCase()}`}>{task.category}</span>
                    <span className={`priority ${task.priority}`}>{task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}</span>
                    <button className="subtask-action" onClick={() => toggleExpanded(task.id)} aria-expanded={expandedTasks.includes(task.id)}>
                      <Icon name="plus" size={13}/>{task.subtasks.length ? `${task.subtasks.length} subtareas` : "Subtarea"}
                    </button>
                  </div>
                </div>
                <time>{formatDate(task.dueDate)}</time>
                <button className="delete-button" onClick={() => removeTask(task.id)} aria-label="Eliminar tarea"><Icon name="trash" size={17}/></button>
                {expandedTasks.includes(task.id) && (
                  <div className="subtask-panel">
                    {task.subtasks.map((subtask) => (
                      <div className={subtask.completed ? "subtask-row completed" : "subtask-row"} key={subtask.id}>
                        <button className="check-button" onClick={() => toggleSubtask(task.id, subtask.id)} aria-label={subtask.completed ? "Marcar subtarea como pendiente" : "Completar subtarea"}>{subtask.completed && <Icon name="check" size={14}/>}</button>
                        <span>{subtask.title}</span>
                        <button className="subtask-delete" onClick={() => removeSubtask(task.id, subtask.id)} aria-label="Eliminar subtarea"><Icon name="trash" size={14}/></button>
                      </div>
                    ))}
                    <form className="subtask-add" onSubmit={(event) => { event.preventDefault(); addSubtask(task.id); }}>
                      <input value={subtaskDrafts[task.id] ?? ""} onChange={(event) => setSubtaskDrafts((current) => ({ ...current, [task.id]: event.target.value }))} placeholder="Escribe una subtarea..."/>
                      <button type="submit" aria-label="Guardar subtarea"><Icon name="plus" size={16}/></button>
                    </form>
                  </div>
                )}
              </article>
            ))}
            {visibleTasks.length === 0 && <div className="empty-state"><div><Icon name="check" size={28}/></div><h2>No hay tareas aquí</h2><p>Todo está tranquilo por el momento.</p></div>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
