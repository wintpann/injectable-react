# Injectable entities for your React application

## Installation

```
yarn add injectable-react
```

## Goals

- Extracting domain and application logic from components
- Dependency injection. Easy to mock, test and use;

## Not a goal
- Totally replacing some of {you-name-it} React state manager

## The reason why

Have you ever felt sad about this situation?
* You need to test or somehow reuse a component tied to a store, and neither you nor typescript knows what data is required by this component.

```typescript jsx
// Outer -> connect(Inner) -> connect(Inner1) -> connect(SomethingInner2)
const App = () => (
    <>
        <Outer/> -> doesn't work outside. Typescript doesn't know why
        <StoreProvider store={store}>
            <Outer/> -> works fine placed inside a store provider
        </StoreProvider>
    </>
)
```

> With injectable-react typescript always knows what data is required by your component.
```typescript jsx
// const Bootstrap = injectable.component(
//     injectable.inject.hook<SomeViewModel>()('someViewModel'),
//     injectable.inject.constant<SomeService>()('someService'),
//     () => ...
// )
// const Outer = Bootstrap({someService, someViewModel})
const App = () => (
    <>
        <InjectableHooksHolder/>
        <Outer/> -> works everywhere because everything is injected
    </>
)
// Only restriction - InjectableHooksHolder is the place where all hooks running, so you should render it at the top of your app, or anywhere you want to run your container (e.g. tests).
```


## Quick example [from this repo](https://github.com/wintpann/injectable-react-examples)

```typescript jsx
import React, { useCallback, useState } from 'react';
import { injectable } from '../configured';

enum Environment {
  PROD = 'PROD',
  DEV = 'DEV',
  QA = 'QA',
}

type Config = {
  environment: Environment;
};

const createConfig = injectable.constant(
  (): Config => ({
    environment: Environment.QA,
  }),
);

type AppViewModel = {
  loading: boolean;
  toggleLoading: () => void;
};

const createAppViewModel = injectable.hook((): AppViewModel => {
  const [loading, setLoading] = useState(false);

  const toggleLoading = useCallback(() => setLoading((prev) => !prev), []);

  return { loading, toggleLoading };
});

type BannerViewModel = {
  showBanner: boolean;
};

const createBannerViewModel = injectable.hook(
  injectable.inject.hook<AppViewModel>()('appViewModel'),
  injectable.inject.constant<Config>()('config'),
  (useAppViewModel, config): BannerViewModel => {
    const { loading } = useAppViewModel();

    const showBanner = !loading && config.environment === Environment.QA;

    return { showBanner };
  },
);

const App = injectable.component(
  injectable.inject.hook<AppViewModel>()('appViewModel'),
  injectable.inject.hook<BannerViewModel>()('bannerViewModel'),
  (useAppViewModel, useBannerViewModel) => () => {
    const { loading, toggleLoading } = useAppViewModel();
    const { showBanner } = useBannerViewModel();

    return (
      <div onClick={toggleLoading}>
        {loading ? 'loading...' : 'loaded :)'} <br /> {showBanner && <div>banner!</div>}
      </div>
    );
  },
);

const config = createConfig();
const appViewModel = createAppViewModel();
const bannerViewModel = createBannerViewModel({ appViewModel, config });

const AppResolved = App({ appViewModel, bannerViewModel });
```

## Examples
* [Simple examples](https://github.com/wintpann/injectable-react-examples)
* [Todolist example](https://github.com/wintpann/injectable-react-demo-todolist)
* [More real-world like example](https://github.com/wintpann/injectable-react-demo)

## Ideology

No context anymore! Everything your component needs is injectable.
First, let's distinguish our composites into 4 groups.

* Component - renders small pieces of UI (aka presentation components, dumb components);
* InjectableHook - in terms of MVVM represents a view-model (data + handlers)
* InjectableConstant - some static constant of any type. in terms of clean architecture can represent a service (driven adapter)
* InjectableComponent - combines injected data with presentational components (and some layout).

InjectableComponents need to be resolved to use. InjectableHooks can also be resolved with other InjectableHooks and be independent.
* * *
InjectableHook body is just a plain React hook, so you can use anything with HookAPI inside it. (GraphQL, UseQuery, Formik, ...)
* * *
You can create an independent InjectableHook, and to resolve it you need to call returned function
* * *
You can create a dependent InjectableHook and require other InjectableHook of type `SomeType` be injected by key `someKey` to use it
* * *
Last parameter is always a "project" which takes all dependencies and returns resolved entity
* * *
InjectableComponent API is almost same, but it can require at least one Service, or other InjectableComponent to resolve;
* * *
Last parameter "project" also takes all dependencies, but now it should return a function of type `FunctionComponent` with props you want to pass
* * *
When InjectableComponent A, depending on {t: T}, runs through itself another InjectableComponent B, depending on {r: R}, the result deps will be {t: T} & {r: R}
* * *
In order to resolve InjectableHook or InjectableComponent, just call returned function with all needed dependencies


## API

### watch(injectables, options)
> Watch injectables changing in the console.
>
> `[options.prefix='injectable']`. You can pass a custom prefix to log to console
> `[options.showCurrent=true]`. If enabled - logs current entity data
> `[options.showPrevious=false]`. If enabled - logs previous entity data
> `[options.showDiff=false]`. If enabled - logs diff between previous and current entity data
> `[options.storeInWindow=true]`. If enabled - stores entities inside of window object in key passed by option.prefix. (By default window.injectable)

### useAction
> It's used for handlers memoization like a useCallback hook, but the reference to a resulting function gets never updated;

## CHANGELOG

### 0.0.1 `26.07.2022`
* Basic functionality
* Dev page
* Typings
* Watcher

### 0.0.2 `27.07.2022`
* Fix multiple component instances render
* Fix typings

### 0.0.3 `30.07.2022`
* Fix component don't get latest data on mount

### 0.0.4 `08.08.2022`
* Update readme
