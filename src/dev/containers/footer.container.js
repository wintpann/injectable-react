import { injectTodosViewModel } from '../view-models/todos.view-model';
import { Footer } from '../components/footer.component';
import { injectable } from '../injectable';

export const FooterContainer = injectable.component(
  injectTodosViewModel(),
  (useTodosViewModel) => () => {
    const { filter, setFilter } = useTodosViewModel();

    return <Footer filter={filter} setFilter={setFilter} />;
  },
);
