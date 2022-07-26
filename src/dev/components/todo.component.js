import cx from 'classnames';
import { ReactComponent as CrossSvg } from '../assets/icon_cross.svg';

export const Todo = ({ text, checked, id, removeTodo, toggleTodo }) => {
  const onToggle = () => toggleTodo(id);
  const onDelete = () => removeTodo(id);

  return (
    <div className="todo">
      <input
        type="checkbox"
        id={id}
        className="todo_checkbox visually_hidden"
        checked={checked}
        onChange={onToggle}
      />
      <label htmlFor={id} className={cx('todo-text', { 'todo-text_checked': checked })}>
        {text}
      </label>
      <span className="todo_cross" onClick={onDelete}>
        <CrossSvg />
      </span>
    </div>
  );
};
