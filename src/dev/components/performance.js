import React, { useEffect, useRef, useState } from 'react';
import Stats from 'stats.js';
import { v4 as guid } from 'uuid';
import { simulate } from '../utils-performance';

const initialize = (target) => {
  let stats = new Stats();

  // show fps and memory
  stats.dom.children[0].style.cssText = 'block';
  stats.dom.children[2].style.cssText = 'block';

  stats.dom.style.cssText = 'pointer-events: none';

  const animate = () => {
    if (!stats) return;
    stats.begin();
    stats.end();
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  target.appendChild(stats.dom);

  return () => {
    stats.dom.remove();
    stats = null;
  };
};

const containerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
};

const Performance = ({ children, test, disabled }) => {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;
    return initialize(ref.current);
  }, []);

  return (
    <div ref={ref} style={{ ...containerStyle, pointerEvents: disabled ? 'none' : 'all' }}>
      <button onClick={test} disabled={disabled}>
        {children}
      </button>
    </div>
  );
};

const count = 50;

export const PerformanceComponent = () => {
  const [disabled, setDisabled] = useState(false);
  const [todosLeft, setTodosLeft] = useState(count);

  const test = async () => {
    setDisabled(true);
    const elements = {
      input: document.querySelector('.top-bar_input'),
      checkedRadio: document.querySelector('label[for="label-checked"]'),
      uncheckedRadio: document.querySelector('label[for="label-unchecked"]'),
      allRadio: document.querySelector('label[for="label-all"]'),
    };

    const todos = new Array(count).fill(null).map(() => guid());
    for await (const todo of todos) {
      await simulate.text(elements.input, todo);
      await simulate.enter(elements.input);
      await simulate.click(elements.checkedRadio);
      await simulate.click(elements.uncheckedRadio);
      await simulate.click(elements.allRadio);
      setTodosLeft((prev) => prev - 1);
    }

    setTodosLeft(count);
    setDisabled(false);
  };

  return (
    <Performance test={test} disabled={disabled}>
      {disabled ? `${todosLeft} todos left` : `test ${count} todos`}
    </Performance>
  );
};
