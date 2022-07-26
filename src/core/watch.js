const logger = (() => {
  const baseStyles = [
    'color: #fff',
    'background-color: #444',
    'padding: 2px 4px 2px 0',
    'border-radius: 2px',
  ];

  const colors = { black: baseStyles.join(';') };

  return { black: (message) => console.log(`%c${message}`, colors.black) };
})();

const formatTimeUnit = (unit) => unit.toString().padStart(2, '0');

export const formatDate = (date = new Date()) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  return `${formatTimeUnit(hours)}:${formatTimeUnit(minutes)}:${formatTimeUnit(
    seconds,
  )}.${formatTimeUnit(milliseconds)}`;
};

export const getDiff = (value, prevValue = {}) => {
  const hookKeys = Object.keys(value);
  const currentPropValues = hookKeys.reduce((acc, key) => ({ ...acc, [key]: value[key] }), {});
  const prevPropValues = hookKeys.reduce((acc, key) => ({ ...acc, [key]: prevValue[key] }), {});

  return Object.keys(currentPropValues).reduce(
    (acc, key) =>
      currentPropValues[key] !== prevPropValues[key]
        ? { ...acc, [key]: [prevPropValues[key], currentPropValues[key]] }
        : acc,
    {},
  );
};

const getOptions = (options) => ({
  prefix: options.prefix ?? 'injectable',
  showDiff: options.showDiff ?? false,
  showCurrent: options.showCurrent ?? true,
  showPrevious: options.showPrevious ?? false,
  storeInWindow: options.storeInWindow ?? true,
});

const printChangelog = (
  changedHookKey,
  previous,
  current,
  diff,
  { showCurrent, showPrevious, showDiff, prefix },
  longestHookKeyLength,
) => {
  const prefixed = `[${prefix}] ${changedHookKey}`.padEnd(prefix.length + longestHookKeyLength + 5);
  logger.black(`${prefixed}${formatDate()}`);

  if (showCurrent) console.log(`${prefixed}-> CURRENT`, current);
  if (showPrevious) console.log(`${prefixed}-> PREVIOUS`, previous);
  if (showDiff) console.log(`${prefixed}-> DIFF`, diff);
};

export const watch = (() => {
  const prevData = {};

  const update = (changedHookKey, current, options, longestHookKeyLength) => {
    if (window?.[options.prefix] && options.storeInWindow) {
      window[options.prefix][changedHookKey] = current;
    }

    const previous = prevData[changedHookKey];
    const diff = getDiff(current, previous);
    const hasDiff = Object.keys(diff).length > 0;
    // there might be cases when inner data changing doesn't affect returned data
    if (hasDiff) {
      printChangelog(changedHookKey, previous, current, diff, options, longestHookKeyLength);
    }
    prevData[changedHookKey] = current;
  };

  return (injectables, opt = {}) => {
    const options = getOptions(opt);

    const { hooks, constants } = Object.entries(injectables).reduce(
      (acc, [key, value]) => {
        const isInjectableHook = value?.constructor?.unit === 'HOOK';
        return isInjectableHook
          ? { ...acc, hooks: [...acc.hooks, [key, value]] }
          : {
              ...acc,
              constants: [...acc.constants, [key, value]],
            };
      },
      { constants: [], hooks: [] },
    );

    if (window && options.storeInWindow && !window[options.prefix]) {
      window[options.prefix] = {};
    }

    if (window && window[options.prefix] && options.storeInWindow) {
      constants.forEach(([key, value]) => {
        window[options.prefix][key] = value;
      });
    }

    const longestHookKeyLength = Math.max(...hooks.map(([key]) => key.length));

    hooks.forEach(([key, hook]) => {
      hook.subscribe((data) => update(key, data, options, longestHookKeyLength));
    });
  };
})();
