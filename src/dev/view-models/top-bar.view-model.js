import { v4 as guid } from 'uuid';
import { injectable } from '../injectable';
import { injectTodosViewModel } from './todos.view-model';
import { useState } from 'react';
import { useAction } from '../../core';
import { injectNotificationService } from '../services/notification.service';

export const createTopBarViewModel = injectable.hook(
  injectTodosViewModel(),
  injectNotificationService(),
  (useTodosViewModel, notificationService) => {
    const [text, setText] = useState('');

    const { create, todos } = useTodosViewModel();

    const handleCreateTodo = useAction(() => {
      const textTrimmed = text.trim();
      const suchTodo = todos.find((todo) => todo.text.toLowerCase() === textTrimmed.toLowerCase());

      if (suchTodo) {
        notificationService.warn('You already have such a todo');
        return;
      }

      create({ id: guid(), text, checked: false });
      setText('');
    });

    return {
      text,
      setText,
      handleCreateTodo,
    };
  },
);

export const injectTopBarViewModel = () => injectable.inject.hook()('topBarViewModel');