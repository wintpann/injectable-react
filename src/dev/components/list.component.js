export const List = ({ shownTodos, TodoContainer }) => {
  return (
    <div className="todos-list">
      {shownTodos.map((todo) => (
        <TodoContainer key={todo.id} id={todo.id} text={todo.text} checked={todo.checked} />
      ))}
    </div>
  );
};
