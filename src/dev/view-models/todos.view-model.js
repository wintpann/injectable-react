import { injectable } from '../injectable';
import { useMemo, useState } from 'react';
import { useAction } from '../../core';
import { FILTER } from '../const';

export const createTodosViewModel = injectable.hook(() => {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState(FILTER.ALL);

  const shownTodos = useMemo(() => {
    if (filter === FILTER.CHECKED) return todos.filter((todo) => todo.checked);
    if (filter === FILTER.UNCHECKED) return todos.filter((todo) => !todo.checked);

    return todos;
  }, [filter, todos]);

  const create = useAction((todo) => {
    setTodos((prev) => [todo, ...prev]);
  });

  const toggle = useAction((id) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, checked: !todo.checked } : todo)),
    );
  });

  const remove = useAction((id) => setTodos((prev) => prev.filter((todo) => todo.id !== id)));

  return {
    todos,
    filter,
    shownTodos,
    setFilter,
    create,
    toggle,
    remove,
  };
});

export const injectTodosViewModel = () => injectable.inject.hook()('todosViewModel');
