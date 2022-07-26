import React, { useState } from 'react';
import { configure } from '../../core';

export const configureTestcase = (initialInnerMounted) => {
  const { InjectableHooksHolder, hook, inject, component } = configure();

  const store = {
    updatesCount: {
      mainViewModel: 0,
      dependentViewModel: 0,
    },
    updates: {
      mainContainer: [],
      innerContainer: [],
    },
    data: {
      dependentViewModel: { prev: null, curr: null },
      mainViewModel: { prev: null, curr: null },
    },
  };

  const createMainViewModel = hook(() => {
    const [count, setCount] = useState(0);
    const [mountedInnerContainer, setMountedInnerContainer] = useState(initialInnerMounted);

    store.updatesCount.mainViewModel++;

    return { count, setCount, mountedInnerContainer, setMountedInnerContainer };
  });

  const createDependentViewModel = hook(inject.hook()('mainViewModel'), (useMainViewModel) => {
    const { count, setCount } = useMainViewModel();

    store.updatesCount.dependentViewModel++;

    return { count, setCount };
  });

  const mainViewModel = createMainViewModel();
  const dependentViewModel = createDependentViewModel({ mainViewModel });

  dependentViewModel.subscribe((updated) => {
    store.data.dependentViewModel.prev = store.data.dependentViewModel.curr;
    store.data.dependentViewModel.curr = updated;
  });

  mainViewModel.subscribe((updated) => {
    store.data.mainViewModel.prev = store.data.mainViewModel.curr;
    store.data.mainViewModel.curr = updated;
  });

  const assertUpdatesCount = (mainViewModel, dependentViewModel) => {
    expect(store.updatesCount.mainViewModel).toBe(mainViewModel);
    expect(store.updatesCount.dependentViewModel).toBe(dependentViewModel);
  };

  const assertUpdates = (mainContainer, innerContainer) => {
    expect(store.updates.mainContainer).toEqual(mainContainer);
    expect(store.updates.innerContainer).toEqual(innerContainer);
  };

  const InnerContainer = component(inject.hook()('mainViewModel'), (useMainViewModel) => () => {
    const { count } = useMainViewModel();

    store.updates.innerContainer.push({ count });

    return <div>{count}</div>;
  });

  const MainContainer = component(
    inject.hook()('mainViewModel'),
    InnerContainer,
    (useMainViewModel, InnerContainer) => () => {
      const { count, mountedInnerContainer } = useMainViewModel();

      store.updates.mainContainer.push({ count });

      return <div>{mountedInnerContainer && <InnerContainer />}</div>;
    },
  );

  const MainContainerResolved = MainContainer({ mainViewModel });

  return {
    mainViewModel,
    dependentViewModel,
    store,
    assertUpdatesCount,
    assertUpdates,
    InjectableHooksHolder,
    MainContainerResolved,
  };
};
