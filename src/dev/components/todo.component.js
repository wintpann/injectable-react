import cx from 'classnames';

export const Todo = ({ text, checked, id, removeTodo, toggleTodo }) => {
  const onToggle = () => toggleTodo(id);
  const onDelete = () => removeTodo(id);

  return (
    <div className="todo">
      <input type="checkbox" className="todo_checkbox" checked={checked} onChange={onToggle} />
      <p className={cx({ 'todo-text_checked': checked })}>{text}</p>
      <span className="todo_cross" onClick={onDelete}>
        ✘
      </span>
    </div>
  );
};
