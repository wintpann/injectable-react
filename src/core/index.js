import { memo, useCallback, useEffect, useRef, useState, createElement } from 'react';
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
const createRef = (current) => ({ current });

const array = {
  last: (arr) => arr[arr.length - 1],
  exceptLast: (arr) => arr.slice(0, arr.length - 1),
  create: (count) => new Array(count),
};

const emptyObject = () => Object.create(null);

const useUpdate = (dispatcher) => {
  const [_, dispatch] = useState(emptyObject);

  if (dispatcher) {
    dispatcher.current = dispatch;
  }

  return useCallback(() => dispatch(emptyObject()), []);
};

const useUpdates = (dispatchers) => {
  const [shouldUpdate, dispatch] = useState(emptyObject);

  useEffect(() => {
    const dispatcher = { dispatch, active: true };
    dispatchers.current.push(dispatcher);
    return () => {
      dispatcher.active = false;
    };
  }, []);

  return shouldUpdate;
};

const updateDispatcher = (dispatcher) => dispatcher.current?.(emptyObject());

const updateDispatchers = (dispatchers) => {
  const dispatchersLength = dispatchers.current.length;
  const deleteCandidates = [];

  for (let i = 0; i < dispatchersLength; i++) {
    const dispatcher = dispatchers.current[i];

    if (!dispatcher.active) {
      deleteCandidates.push(dispatcher);
      continue;
    }

    dispatcher.dispatch(emptyObject());
  }

  deleteCandidates.forEach((dispatcher) =>
    dispatchers.current.splice(dispatchers.current.indexOf(dispatcher), 1),
  );
};

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

  return hook;
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

  return hook;
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

      const dependentHooks = hookDependencyKeys.map((key, index) =>
        getWatcher(record[key].subscribe, hookDependenciesState[index]),
      );

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
  const dependentComponents = componentDependencies.map((component) => component(record));
  const dependentConstants = constantDependencies.map(({ key }) => record[key]);
  const hookDependenciesLength = hookDependencies.length;

  const componentStore = {
    hookDependenciesState: array.create(hookDependenciesLength),
    isReady: hookDependenciesLength === 0,
    dispatchers: createRef([]),
    update: () => updateDispatchers(componentStore.dispatchers),
  };

  const updateOnReady = () => {
    if (componentStore.isReady) return;

    const storeIsReady =
      componentStore.hookDependenciesState.filter(isNotEmpty).length === hookDependenciesLength;
    componentStore.isReady = storeIsReady;
    if (storeIsReady) componentStore.update();
  };

  hookDependencies.forEach(({ key }, index) =>
    record[key].subscribe((data) => {
      componentStore.hookDependenciesState[index] = data;
      updateOnReady();
    }),
  );

  const localStoreFactory = () => ({ Component: IdleComponent });

  const Component = (props) => {
    const [store, setStore] = useState(localStoreFactory);
    const shouldUpdate = useUpdates(componentStore.dispatchers);

    useEffect(() => {
      if (!componentStore.isReady) return;

      const hooks = hookDependencies.map(({ key }, index) =>
        getWatcher(record[key].subscribe, componentStore.hookDependenciesState[index]),
      );

      const ResolvedComponent = project(
        ...combineDependencies(dependencies, hooks, dependentConstants, dependentComponents),
      );

      setStore({ Component: ResolvedComponent });
    }, [shouldUpdate]);

    return createElement(store.Component, props);
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
