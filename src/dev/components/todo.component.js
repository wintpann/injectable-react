import cx from 'classnames';
import { ReactComponent as CrossSvg } from '../assets/icon_cross.svg';

export const Todo = ({ text, checked, id, removeTodo, toggleTodo }) => {
  const onToggle = () => toggleTodo(id);
  const onDelete = () => removeTodo(id);

  return (
    <div className="todo">
      <input
        type="checkbox"
        id={`todo-${id}`}
        className="visually_hidden"
        checked={checked}
        onChange={onToggle}
      />
      <label
        title={text}
        htmlFor={`todo-${id}`}
        className={cx('todo-text', { 'todo-text_checked': checked })}
      >
        <span className="hidden-scroll">{text}</span>
      </label>
      <span className="todo_cross" onClick={onDelete}>
        <CrossSvg />
      </span>
    </div>
  );
};
