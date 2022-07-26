import { injectable } from '../injectable';
import { injectTodosViewModel } from '../view-models/todos.view-model';
import { Todo } from '../components/todo.component';

export const TodoContainer = injectable.component(
  injectTodosViewModel(),
  (useTodosViewModel) =>
    ({ text, checked, id }) => {
      const { remove, toggle } = useTodosViewModel();

      return <Todo text={text} checked={checked} id={id} removeTodo={remove} toggleTodo={toggle} />;
    },
);
