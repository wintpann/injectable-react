import { injectable } from '../injectable';
import { injectTodosViewModel } from '../view-models/todos.view-model';
import { TodoContainer } from './todo.container';
import { List } from '../components/list.component';

export const ListContainer = injectable.component(
  injectTodosViewModel(),
  TodoContainer,
  (useTodosViewModel, TodoContainer) => () => {
    const { shownTodos } = useTodosViewModel();

    return <List shownTodos={shownTodos} TodoContainer={TodoContainer} />;
  },
);
