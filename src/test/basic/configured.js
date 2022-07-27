import React, { useState } from 'react';
import { configure, useAction } from '../../core';

export const configureTestcase = () => {
  const { InjectableHooksHolder, hook, inject, component, constant } = configure();

  const store = {
    updatesCount: {
      staticViewModel: 0,
      mainViewModel: 0,
      firstCountViewModel: 0,
      secondCountViewModel: 0,
      thirdCountViewModel: 0,
    },
    data: {
      staticViewModel: { prev: null, curr: null },
      mainViewModel: { prev: null, curr: null },
      firstCountViewModel: { prev: null, curr: null },
      secondCountViewModel: { prev: null, curr: null },
      thirdCountViewModel: { prev: null, curr: null },
    },
  };

  const createFirstLevelConstant = constant(() => ({ first: 'first' }));
  const createSecondLevelConstant = constant(
    inject.constant()('firstLevelConstant'),
    (firstLevelConstant) => ({ second: 'second', ...firstLevelConstant }),
  );
  const createThirdLevelConstant = constant(
    inject.constant()('firstLevelConstant'),
    inject.constant()('secondLevelConstant'),
    (firstLevelConstant, secondLevelConstant) => ({
      third: 'third',
      ...firstLevelConstant,
      ...secondLevelConstant,
    }),
  );

  const createViewModel = hook(
    inject.constant()('firstLevelConstant'),
    (firstLevelConstant) => firstLevelConstant,
  );

  const InnerContainer = component(
    inject.hook()('viewModel'),
    inject.constant()('secondLevelConstant'),
    (useViewModel, secondLevelConstant) => (props) => {
      const { first } = useViewModel();
      const { second } = secondLevelConstant;
      return <div>{`inner ${first} ${second} ${props.text}`}</div>;
    },
  );

  const OuterContainer = component(
    InnerContainer,
    inject.constant()('thirdLevelConstant'),
    (InnerContainer, thirdLevelConstant) => () => {
      const { third } = thirdLevelConstant;
      return (
        <div>
          <div>{`outer ${third}`}</div>
          <InnerContainer text={'text'} />
        </div>
      );
    },
  );

  const firstLevelConstant = createFirstLevelConstant();
  const secondLevelConstant = createSecondLevelConstant({ firstLevelConstant });
  const thirdLevelConstant = createThirdLevelConstant({ firstLevelConstant, secondLevelConstant });

  const viewModel = createViewModel({ firstLevelConstant });

  const OuterContainerResolved = OuterContainer({
    viewModel,
    thirdLevelConstant,
    secondLevelConstant,
  });

  const createStaticViewModel = hook(() => {
    const url = 'localhost';
    const env = 'dev';

    store.updatesCount.staticViewModel++;

    return {
      url,
      env,
    };
  });

  const createMainViewModel = hook(inject.hook()('staticViewModel'), (useStaticViewModel) => {
    const { env, url } = useStaticViewModel();
    const [firstCount, setFirstCount] = useState(0);
    const [secondCount, setSecondCount] = useState(0);
    const [thirdCount, setThirdCount] = useState(0);

    const updateFirstCount = useAction(() => setFirstCount((prev) => prev + 1));
    const updateSecondCount = useAction(() => setSecondCount((prev) => prev + 1));
    const updateThirdCount = useAction(() => setThirdCount((prev) => prev + 1));

    store.updatesCount.mainViewModel++;

    return {
      firstCount,
      secondCount,
      thirdCount,
      updateFirstCount,
      updateSecondCount,
      updateThirdCount,
      env,
      url,
    };
  });

  const createFirstCountDependentViewModel = hook(
    inject.hook()('staticViewModel'),
    inject.hook()('mainViewModel'),
    (useStaticViewModel, useMainViewModel) => {
      const { env, url } = useStaticViewModel();
      const { firstCount } = useMainViewModel();

      store.updatesCount.firstCountViewModel++;

      return { firstCount, env, url };
    },
  );

  const createSecondCountDependentViewModel = hook(
    inject.hook()('staticViewModel'),
    inject.hook()('mainViewModel'),
    (useStaticViewModel, useMainViewModel) => {
      const { env, url } = useStaticViewModel();
      const { secondCount } = useMainViewModel();

      store.updatesCount.secondCountViewModel++;

      return { secondCount, env, url };
    },
  );

  const createThirdCountDependentViewModel = hook(
    inject.hook()('staticViewModel'),
    inject.hook()('mainViewModel'),
    (useStaticViewModel, useMainViewModel) => {
      const { env, url } = useStaticViewModel();
      const { thirdCount } = useMainViewModel();

      store.updatesCount.thirdCountViewModel++;

      return { thirdCount, env, url };
    },
  );

  const FirstCountInner2LevelContainer = component(
    inject.hook()('firstCountViewModel'),
    (useFirstCountViewModel) => (props) => {
      const { firstCount } = useFirstCountViewModel();
      return (
        <div>
          <span>{props.text}</span>
          <span>{firstCount}</span>
        </div>
      );
    },
  );

  const FirstCountInner1LevelContainer = component(
    inject.hook()('firstCountViewModel'),
    FirstCountInner2LevelContainer,
    (useFirstCountViewModel, FirstCountInner2LevelContainer) => (props) => {
      const { firstCount } = useFirstCountViewModel();
      return (
        <div>
          <span>{props.text}</span>
          <span>{firstCount}</span>
          <FirstCountInner2LevelContainer text={`${props.text}-inner`} />
        </div>
      );
    },
  );

  const FirstCountMainContainer = component(
    inject.hook()('firstCountViewModel'),
    FirstCountInner1LevelContainer,
    (useFirstCountViewModel, FirstCountInner1LevelContainer) => (props) => {
      const { firstCount } = useFirstCountViewModel();
      return (
        <div>
          <span>{props.text}</span>
          <span>{firstCount}</span>
          <FirstCountInner1LevelContainer text={`${props.text}-inner`} />
        </div>
      );
    },
  );

  const SingleInstance = component(
    inject.hook()('mainViewModel'),
    (useMainViewModel) => (props) => {
      const { firstCount } = useMainViewModel();
      return <div>{`${firstCount}-${props.text}`}</div>;
    },
  );

  const MultipleInstance = component(
    inject.hook()('mainViewModel'),
    SingleInstance,
    (useMainViewModel, SingleInstance) => () => {
      const { firstCount } = useMainViewModel();

      return (
        <div>
          {firstCount % 2 === 0 ? <SingleInstance text={'first'} /> : <div>nocontent</div>}
          <SingleInstance text={'second'} />
          <div>pupa</div>
        </div>
      );
    },
  );

  const staticViewModel = createStaticViewModel();
  const mainViewModel = createMainViewModel({ staticViewModel });
  const firstCountViewModel = createFirstCountDependentViewModel({
    mainViewModel,
    staticViewModel,
  });
  const secondCountViewModel = createSecondCountDependentViewModel({
    mainViewModel,
    staticViewModel,
  });
  const thirdCountViewModel = createThirdCountDependentViewModel({
    mainViewModel,
    staticViewModel,
  });

  const FirstCountMainContainerResolved = FirstCountMainContainer({ firstCountViewModel });

  const MultipleInstanceResolved = MultipleInstance({ mainViewModel });

  staticViewModel.subscribe((updated) => {
    store.data.staticViewModel.prev = store.data.staticViewModel.curr;
    store.data.staticViewModel.curr = updated;
  });

  mainViewModel.subscribe((updated) => {
    store.data.mainViewModel.prev = store.data.mainViewModel.curr;
    store.data.mainViewModel.curr = updated;
  });

  firstCountViewModel.subscribe((updated) => {
    store.data.firstCountViewModel.prev = store.data.firstCountViewModel.curr;
    store.data.firstCountViewModel.curr = updated;
  });

  secondCountViewModel.subscribe((updated) => {
    store.data.secondCountViewModel.prev = store.data.secondCountViewModel.curr;
    store.data.secondCountViewModel.curr = updated;
  });

  thirdCountViewModel.subscribe((updated) => {
    store.data.thirdCountViewModel.prev = store.data.thirdCountViewModel.curr;
    store.data.thirdCountViewModel.curr = updated;
  });

  const assertUpdatesCount = (
    staticViewModel,
    mainViewModel,
    firstCountViewModel,
    secondCountViewModel,
    thirdCountViewModel,
  ) => {
    expect(store.updatesCount.staticViewModel).toBe(staticViewModel);
    expect(store.updatesCount.mainViewModel).toBe(mainViewModel);
    expect(store.updatesCount.firstCountViewModel).toBe(firstCountViewModel);
    expect(store.updatesCount.secondCountViewModel).toBe(secondCountViewModel);
    expect(store.updatesCount.thirdCountViewModel).toBe(thirdCountViewModel);
  };

  return {
    mainViewModel,
    firstCountViewModel,
    secondCountViewModel,
    thirdCountViewModel,
    store,
    assertUpdatesCount,
    InjectableHooksHolder,
    FirstCountMainContainerResolved,
    firstLevelConstant,
    secondLevelConstant,
    thirdLevelConstant,
    OuterContainerResolved,
    MultipleInstanceResolved,
  };
};
