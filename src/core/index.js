import { memo, useCallback, useEffect, useRef, useState, createRef, createElement } from 'react';
import { watch } from './watch';

const UNIT = {
  COMPONENT: 'COMPONENT',
  HOOK: 'HOOK',
  CONSTANT: 'CONSTANT',
  HOOK_INJECTOR: 'HOOK_INJECTOR',
  CONSTANT_INJECTOR: 'CONSTANT_INJECTOR',
};

const uid = (() => {
  let id = 0;
  return () => String(id++);
})();
const isNotEmpty = (value) => value !== undefined;
const IdleComponent = () => null;

const array = {
  last: (arr) => arr[arr.length - 1],
  exceptLast: (arr) => arr.slice(0, arr.length - 1),
  create: (count) => new Array(count),
  reset: (arr) => {
    const len = arr.length;
    arr.length = 0;
    arr.length = len;
  },
};

const emptyObject = () => Object.create(null);

const useUpdate = (dispatcher) => {
  const [, dispatch] = useState(emptyObject);

  if (dispatcher) {
    dispatcher.current = dispatch;
  }

  return useCallback(() => dispatch(emptyObject()), []);
};

const updateDispatcher = (dispatcher) => dispatcher.current?.(emptyObject());

const getStateProxy = (store) =>
  new Proxy(emptyObject(), {
    get(_, prop) {
      store.propsCollection.add(prop);
      return store.state[prop];
    },
  });

const getIsChangedWatchedKeys = (propsCollectionValues, current, updated) => {
  for (let i = 0; i < propsCollectionValues.length; i++) {
    const key = propsCollectionValues[i];
    if (current[key] !== updated[key]) return true;
  }

  return false;
};

const combineDependencies = (dependencies, hooks = [], constants = [], components = []) => {
  let hooksCounter = 0;
  let componentsCounter = 0;
  let constantsCounter = 0;

  return dependencies.map((composite) => {
    if (composite.unit === UNIT.HOOK_INJECTOR) return hooks[hooksCounter++];
    if (composite.unit === UNIT.CONSTANT_INJECTOR) return constants[constantsCounter++];
    if (composite.unit === UNIT.COMPONENT) return components[componentsCounter++];
  });
};

const getPureWatcher = (subscribe, initial) => {
  const store = {
    state: initial,
    isImmediateUpdate: true,
  };

  const hook = () => {
    const update = useUpdate();

    useEffect(
      () =>
        subscribe((updated) => {
          if (store.isImmediateUpdate) {
            store.isImmediateUpdate = false;
            return;
          }

          store.state = updated;
          update();
        }),
      [],
    );

    return store.state;
  };

  return [hook, store];
};

const getProxyWatcher = (subscribe, initial) => {
  const store = {
    state: initial,
    propsCollection: new Set(),
    propsCollectionValues: [],
    arePropsCollected: false,
    isImmediateUpdate: true,
  };

  const stateProxy = getStateProxy(store);

  const hook = () => {
    const update = useUpdate();

    useEffect(() => {
      const unsubscribe = subscribe((updated) => {
        if (store.isImmediateUpdate) {
          store.isImmediateUpdate = false;
          return;
        }

        const isChanged = getIsChangedWatchedKeys(
          store.propsCollectionValues,
          store.state,
          updated,
        );

        if (!isChanged) return;

        store.state = updated;

        update();
      });

      store.arePropsCollected = true;
      store.propsCollectionValues = Array.from(store.propsCollection);

      return unsubscribe;
    }, []);

    return store.arePropsCollected ? store.state : stateProxy;
  };

  return [hook, store];
};

const getWatcher = (subscribe, initial) =>
  window.Proxy ? getProxyWatcher(subscribe, initial) : getPureWatcher(subscribe, initial);

const commitHook = (project, store, hookStore) => {
  const Hook = () => {
    hookStore.state = project();
    hookStore.mounted = true;

    useEffect(() => {
      Promise.resolve().then(() => {
        const listenersLength = hookStore.listeners.length;
        const deleteCandidates = [];

        for (let i = 0; i < listenersLength; i++) {
          const listener = hookStore.listeners[i];

          if (listener.deleteBeforeExecution) {
            deleteCandidates.push(listener);
            continue;
          }

          listener.callback(hookStore.state);

          if (listener.deleteAfterExecution) {
            deleteCandidates.push(listener);
          }
        }

        deleteCandidates.forEach((listener) =>
          hookStore.listeners.splice(hookStore.listeners.indexOf(listener), 1),
        );
      });
    });

    return null;
  };

  const MemoizedHook = memo(Hook);
  store.renderHook(MemoizedHook);
};

class InjectableHook {
  static unit = UNIT.HOOK;

  constructor(subscribe, once) {
    this.subscribe = subscribe;
    this.once = once;
  }
}

const createHook = (store, project, dependencies, record = {}) => {
  const hookDependencyKeys = dependencies
    .filter(({ unit }) => unit === UNIT.HOOK_INJECTOR)
    .map(({ key }) => key);
  const constantDependencyKeys = dependencies
    .filter(({ unit }) => unit === UNIT.CONSTANT_INJECTOR)
    .map(({ key }) => key);

  const hookStore = {
    listeners: [],
    state: undefined,
    mounted: false,
  };

  const hookDependenciesLength = hookDependencyKeys.length;
  const canCommitImmediate = hookDependenciesLength === 0;

  const dependentConstants = constantDependencyKeys.map((key) => record[key]);

  if (canCommitImmediate) {
    const resolvedHook = () => project(...dependentConstants);
    commitHook(resolvedHook, store, hookStore);
  } else {
    const hookDependenciesState = array.create(hookDependenciesLength);

    const commitOnReady = () => {
      const dependenciesAreReady =
        hookDependenciesState.filter(isNotEmpty).length === hookDependenciesLength;
      if (!dependenciesAreReady) return;

      const dependentHooks = hookDependencyKeys.map((key, index) => {
        const [hook] = getWatcher(record[key].subscribe, hookDependenciesState[index]);
        return hook;
      });

      const resolvedHook = () =>
        project(...combineDependencies(dependencies, dependentHooks, dependentConstants));
      commitHook(resolvedHook, store, hookStore);
    };

    hookDependencyKeys.forEach((key, index) =>
      record[key].once((data) => {
        hookDependenciesState[index] = data;
        commitOnReady();
      }),
    );
  }

  const subscribe = (callback) => {
    const listener = { callback, deleteBeforeExecution: false, deleteAfterExecution: false };
    if (hookStore.mounted) callback(hookStore.state);
    hookStore.listeners.push(listener);
    const unsubscribe = () => {
      listener.deleteBeforeExecution = true;
    };
    return unsubscribe;
  };

  const once = (callback) => {
    if (hookStore.mounted) return callback(hookStore.state);
    hookStore.listeners.push({
      callback,
      deleteAfterExecution: true,
      deleteBeforeExecution: false,
    });
  };

  return new InjectableHook(subscribe, once);
};

const createComponent = (store, project, dependencies, record) => {
  const componentDependencies = dependencies.filter(({ unit }) => unit === UNIT.COMPONENT);
  const constantDependencies = dependencies.filter(({ unit }) => unit === UNIT.CONSTANT_INJECTOR);
  const hookDependencies = dependencies.filter(({ unit }) => unit === UNIT.HOOK_INJECTOR);
  const hookDependenciesLength = hookDependencies.length;

  const componentStore = {
    Component: IdleComponent,
    ResolvedComponent: IdleComponent,
    shouldRecommit: false,
    dispatcher: createRef(),
    update: () => updateDispatcher(componentStore.dispatcher),
    hookDependenciesState: array.create(hookDependenciesLength),
    runningHookStore: array.create(hookDependenciesLength),
  };

  const dependentComponents = componentDependencies.map((composite) => composite(record));
  const dependentConstants = constantDependencies.map(({ key }) => record[key]);

  const commitOnReady = () => {
    const hookDependenciesAreReady =
      componentStore.hookDependenciesState.filter(isNotEmpty).length === hookDependenciesLength;

    if (hookDependenciesAreReady) {
      const hooks = hookDependencies.map(({ key }, index) => {
        const [hook, store] = getWatcher(
          record[key].subscribe,
          componentStore.hookDependenciesState[index],
        );
        componentStore.runningHookStore[index] = store;
        return hook;
      });

      componentStore.ResolvedComponent = project(
        ...combineDependencies(dependencies, hooks, dependentConstants, dependentComponents),
      );
      componentStore.Component = componentStore.ResolvedComponent;
      componentStore.update();
    }
  };

  const recommitOnReady = () => {
    const hookDependenciesAreReady =
      componentStore.hookDependenciesState.filter(isNotEmpty).length === hookDependenciesLength;

    if (hookDependenciesAreReady) {
      componentStore.runningHookStore.forEach((store, index) => {
        store.isImmediateUpdate = true;
        store.state = componentStore.hookDependenciesState[index];
      });
      componentStore.Component = componentStore.ResolvedComponent;
      componentStore.update();
    }
  };

  const recommit = () => {
    if (hookDependenciesLength === 0) {
      recommitOnReady();
    } else {
      hookDependencies.forEach(({ key }, index) =>
        record[key].once((data) => {
          componentStore.hookDependenciesState[index] = data;
          recommitOnReady();
        }),
      );
    }
  };

  const commit = () => {
    if (hookDependenciesLength === 0) {
      commitOnReady();
    } else {
      hookDependencies.forEach(({ key }, index) =>
        record[key].once((data) => {
          componentStore.hookDependenciesState[index] = data;
          commitOnReady();
        }),
      );
    }
  };

  const onUnmount = () => {
    componentStore.Component = IdleComponent;
    array.reset(componentStore.hookDependenciesState);
    componentStore.shouldRecommit = true;
  };

  const onMount = () => {
    componentStore.shouldRecommit ? recommit() : commit();
    return onUnmount;
  };

  const Component = (props) => {
    useUpdate(componentStore.dispatcher);
    const { Component } = componentStore;
    useEffect(onMount, []);
    return createElement(Component, props);
  };

  return memo(Component);
};

const configure = () => {
  const store = {
    Hooks: [],
    dispatcher: createRef(),
    update: () => updateDispatcher(store.dispatcher),
    renderHook: (Hook) => {
      store.Hooks.push({ key: uid(), Hook });
      store.update();
    },
  };

  const InjectableHooksHolder = () => {
    useUpdate(store.dispatcher);
    return store.Hooks.map(({ Hook, key }) => createElement(Hook, { key }));
  };

  const constant = (...composites) => {
    const dependencies = array
      .exceptLast(composites)
      .filter(({ unit }) => unit === UNIT.CONSTANT_INJECTOR);
    const project = array.last(composites);
    const resolve = (record) => project(...dependencies.map(({ key }) => record[key]));

    resolve.unit = UNIT.CONSTANT;
    return resolve;
  };

  const component = (...composites) => {
    const project = array.last(composites);
    const dependencies = array.exceptLast(composites);

    const resolve = (record) => createComponent(store, project, dependencies, record);

    resolve.unit = UNIT.COMPONENT;
    return resolve;
  };

  const hook = (...composites) => {
    const project = array.last(composites);
    const dependencies = array.exceptLast(composites);

    const resolve = (record) => createHook(store, project, dependencies, record);
    resolve.unit = UNIT.HOOK;
    return resolve;
  };

  const inject = {
    hook: () => (key) => ({ key, unit: UNIT.HOOK_INJECTOR }),
    constant: () => (key) => ({ key, unit: UNIT.CONSTANT_INJECTOR }),
  };

  return {
    constant,
    component,
    hook,
    inject,
    InjectableHooksHolder,
  };
};

const useAction = (actual) => {
  const actionRef = useRef({ actual, memoized: (...args) => actionRef.current.actual(...args) });
  actionRef.current.actual = actual;
  return actionRef.current.memoized;
};

export { configure, useAction, watch };
