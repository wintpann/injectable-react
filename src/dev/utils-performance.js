import { Simulate } from 'react-dom/test-utils';

const setInputValue = (input, value) => {
  input.value = value;
  Simulate.change(input);
};

const text = (input, value, delay = 10) =>
  new Promise((resolve) => {
    const values = value.split('').map((item, index) => value.slice(0, index + 1));
    values.forEach((v, index) =>
      setTimeout(() => {
        setInputValue(input, v);
        if (index + 1 === value.length) {
          resolve();
        }
      }, index * delay),
    );
  });

const click = (element, delay = 100) =>
  new Promise((resolve) =>
    setTimeout(() => {
      element.click();
      resolve();
    }, delay),
  );

const enter = (element) =>
  new Promise((resolve) =>
    setTimeout(() => {
      Simulate.keyPress(element, { key: 'Enter', keyCode: 13, which: 13 });
      resolve();
    }),
  );

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const simulate = {
  text,
  click,
  enter,
  delay,
};
