import { injectable } from '../injectable';
import { injectTopBarViewModel } from '../view-models/top-bar.view-model';
import { TopBar } from '../components/top-bar.component';

export const TopBarContainer = injectable.component(
  injectTopBarViewModel(),
  (useTopBarViewModel) => () => {
    const { text, setText, handleCreateTodo } = useTopBarViewModel();

    return <TopBar text={text} setText={setText} onEnterClick={handleCreateTodo} />;
  },
);
