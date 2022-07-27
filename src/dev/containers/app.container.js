import { injectable } from '../injectable';
import { TopBarContainer } from './top-bar.container';
import { ListContainer } from './list.container';
import { FooterContainer } from './footer.container';
import { Bootstrap } from '../components/bootstrap.component';
import { PerformanceComponent } from '../components/performance';

export const AppContainer = injectable.component(
  TopBarContainer,
  ListContainer,
  FooterContainer,
  (TopBarContainer, ListContainer, FooterContainer) => () =>
    (
      <>
        <Bootstrap>
          <TopBarContainer />
          <ListContainer />
          <FooterContainer />
        </Bootstrap>
        <PerformanceComponent />
      </>
    ),
);
