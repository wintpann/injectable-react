import { createNotificationService } from './services/notification.service';
import { createTopBarViewModel } from './view-models/top-bar.view-model';
import { createTodosViewModel } from './view-models/todos.view-model';
import { AppContainer } from './containers/app.container';

const notificationService = createNotificationService();
const todosViewModel = createTodosViewModel();
const topBarViewModel = createTopBarViewModel({ todosViewModel, notificationService });

export const AppContainerResolved = AppContainer({
  notificationService,
  todosViewModel,
  topBarViewModel,
});
