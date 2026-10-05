import { useEffect, useState } from "react";
import { getTodos, createTodo, updateTodo, deleteTodo } from "./api";
import { FILTERS } from "./filters";
import Sidebar from "./components/Sidebar";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Runs an API action and shows its error in the banner if it fails
  const run = async (action) => {
    try {
      setError("");
      await action();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    run(async () => setTodos(await getTodos())).finally(() =>
      setLoading(false)
    );
  }, []);

  const handleAdd = (title) =>
    run(async () => {
      const newTodo = await createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
      setCurrentPage(1);
    });

  const handleUpdate = (id, data) =>
    run(async () => {
      const updated = await updateTodo(id, data);

      setTodos((prev) =>
        prev.map((todo) => (todo._id === id ? updated : todo))
      );
    });

  const handleDelete = (id) =>
    run(async () => {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    });

  const handleClearDone = () =>
    run(async () => {
      const done = todos.filter(FILTERS.done.test);
      await Promise.all(done.map((t) => deleteTodo(t._id)));
      setTodos((prev) => prev.filter((t) => !t.completed));
      setCurrentPage(1);
    });

  // Apply the selected filter
  const filteredTodos = todos.filter(FILTERS[filter].test);

  // Pagination
  const todosPerPage = 7;
  const totalPages = Math.ceil(filteredTodos.length / todosPerPage);

  const startIndex = (currentPage - 1) * todosPerPage;

  const currentTodos = filteredTodos.slice(
    startIndex,
    startIndex + todosPerPage
  );

  // Reset to page 1 when the filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className="layout">
      <Sidebar
        todos={todos}
        filter={filter}
        onFilter={handleFilterChange}
        onClearDone={handleClearDone}
      />

      <main className="panel content">
        <header className="content-header">
          <h2>{FILTERS[filter].label}</h2>

          <span className="content-count">
            {filteredTodos.length}{" "}
            {filteredTodos.length === 1 ? "task" : "tasks"}
          </span>
        </header>

        <TodoForm onAdd={handleAdd} />

        {error && (
          <div className="error" role="alert">
            <span>{error}</span>

            <button onClick={() => setError("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <p className="empty">Loading...</p>
        ) : filteredTodos.length === 0 ? (
          <div className="empty">
            <img src="/logo.png" alt="" />

            <p>
              {filter === "done"
                ? "Nothing completed yet"
                : "You're all caught up. Add a task above."}
            </p>
          </div>
        ) : (
          <>
            <ul className="todo-list">
              {currentTodos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "active" : ""}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(page + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;