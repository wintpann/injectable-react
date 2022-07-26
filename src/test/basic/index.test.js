import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { configureTestcase } from './configured';

const originalProxy = window.Proxy;

const enableProxy = () => (window.Proxy = originalProxy);
const disableProxy = () => (window.Proxy = undefined);

describe('injectable-react/basic', () => {
  test('should resolve constants correctly', () => {
    const { firstLevelConstant, secondLevelConstant, thirdLevelConstant } = configureTestcase();

    expect(firstLevelConstant).toStrictEqual({ first: 'first' });
    expect(secondLevelConstant).toStrictEqual({ first: 'first', second: 'second' });
    expect(thirdLevelConstant).toStrictEqual({ first: 'first', second: 'second', third: 'third' });
  });

  test('should use constants within hooks and components correctly', async () => {
    const { InjectableHooksHolder, OuterContainerResolved } = configureTestcase();

    const App = () => (
      <>
        <InjectableHooksHolder />
        <OuterContainerResolved />
      </>
    );

    const { findByText } = render(<App />);
    await waitFor(() => findByText('inner first second text'));
    await waitFor(() => findByText('outer third'));
  });

  test('should run hooks correctly with with proxy enabled', async () => {
    enableProxy();
    const { InjectableHooksHolder, store, assertUpdatesCount } = configureTestcase();

    render(<InjectableHooksHolder />);
    await waitFor(() => assertUpdatesCount(1, 1, 1, 1, 1));

    act(() => store.data.mainViewModel.curr.updateFirstCount());
    await waitFor(() => assertUpdatesCount(1, 2, 2, 1, 1));

    act(() => store.data.mainViewModel.curr.updateSecondCount());
    await waitFor(() => assertUpdatesCount(1, 3, 2, 2, 1));

    act(() => store.data.mainViewModel.curr.updateThirdCount());
    await waitFor(() => assertUpdatesCount(1, 4, 2, 2, 2));
  });

  test('should run hooks correctly with with proxy disabled', async () => {
    disableProxy();
    const { InjectableHooksHolder, store, assertUpdatesCount } = configureTestcase();

    render(<InjectableHooksHolder />);
    await waitFor(() => assertUpdatesCount(1, 1, 1, 1, 1));

    act(() => store.data.mainViewModel.curr.updateFirstCount());
    await waitFor(() => assertUpdatesCount(1, 2, 2, 2, 2));

    act(() => store.data.mainViewModel.curr.updateSecondCount());
    await waitFor(() => assertUpdatesCount(1, 3, 3, 3, 3));

    act(() => store.data.mainViewModel.curr.updateThirdCount());
    await waitFor(() => assertUpdatesCount(1, 4, 4, 4, 4));
  });

  test('should render container and nested ones correctly', async () => {
    enableProxy();
    const { InjectableHooksHolder, FirstCountMainContainerResolved } = configureTestcase();

    const App = () => (
      <>
        <InjectableHooksHolder />
        <FirstCountMainContainerResolved text="main" />
      </>
    );

    const { findByText } = render(<App />);
    await waitFor(() => findByText('main'));
    await waitFor(() => findByText('main-inner'));
    await waitFor(() => findByText('main-inner-inner'));
  });
});
