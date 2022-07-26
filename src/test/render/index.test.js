import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { configureTestcase } from './configured';

describe('injectable-react/render', () => {
  test('should commit mounted container with latest data', async () => {
    const { InjectableHooksHolder, store, MainContainerResolved, assertUpdates } =
      configureTestcase(false);

    const App = () => (
      <>
        <MainContainerResolved />
        <InjectableHooksHolder />
      </>
    );

    render(<App />);

    await waitFor(() => assertUpdates([{ count: 0 }], []));

    act(() => store.data.mainViewModel.curr.setCount(1));

    await waitFor(() => assertUpdates([{ count: 0 }, { count: 1 }], []));

    act(() => store.data.mainViewModel.curr.setMountedInnerContainer(true));

    await waitFor(() => assertUpdates([{ count: 0 }, { count: 1 }, { count: 1 }], [{ count: 1 }]));
  });

  test('should recommit mounted container with latest data', async () => {
    const { InjectableHooksHolder, store, MainContainerResolved, assertUpdates } =
      configureTestcase(true);

    const App = () => (
      <>
        <MainContainerResolved />
        <InjectableHooksHolder />
      </>
    );

    render(<App />);

    await waitFor(() => assertUpdates([{ count: 0 }], [{ count: 0 }]));

    act(() => store.data.mainViewModel.curr.setCount(1));

    await waitFor(() => assertUpdates([{ count: 0 }, { count: 1 }], [{ count: 0 }, { count: 1 }]));

    act(() => store.data.mainViewModel.curr.setMountedInnerContainer(false));

    await waitFor(() =>
      assertUpdates([{ count: 0 }, { count: 1 }, { count: 1 }], [{ count: 0 }, { count: 1 }]),
    );

    act(() => {
      store.data.mainViewModel.curr.setCount(2);
      store.data.mainViewModel.curr.setMountedInnerContainer(true);
    });

    await waitFor(() =>
      assertUpdates(
        [{ count: 0 }, { count: 1 }, { count: 1 }, { count: 2 }],
        [{ count: 0 }, { count: 1 }, { count: 2 }],
      ),
    );

    act(() => store.data.mainViewModel.curr.setMountedInnerContainer(false));

    await waitFor(() =>
      assertUpdates(
        [{ count: 0 }, { count: 1 }, { count: 1 }, { count: 2 }, { count: 2 }],
        [{ count: 0 }, { count: 1 }, { count: 2 }],
      ),
    );
  });
});
