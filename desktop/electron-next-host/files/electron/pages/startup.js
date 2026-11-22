// Startup page: shows each boot step with its state. The main process sends boot events (see
// electron/host/boot.ts); a step event means that step has begun, so earlier steps are done.
(() => {
  const LABELS = {
    docker: 'Starting Docker services',
    port: 'Checking the port',
    web: 'Starting the web app',
    cors: 'Checking the API allows this app',
  };
  const MARKS = { running: '…', done: '✓', failed: '✗', warning: '!' };

  const stepsEl = document.getElementById('steps');
  const titleEl = document.getElementById('title');
  const problemEl = document.getElementById('problem');
  const problemTextEl = document.getElementById('problem-text');
  const problemTailEl = document.getElementById('problem-tail');
  const retryEl = document.getElementById('retry');

  const rows = new Map();

  function row(step) {
    let el = rows.get(step);
    if (el) return el;
    el = document.createElement('li');
    el.className = 'step';
    const mark = document.createElement('span');
    mark.className = 'mark';
    const label = document.createElement('span');
    label.textContent = LABELS[step] || step;
    el.append(mark, label);
    stepsEl.append(el);
    rows.set(step, el);
    return el;
  }

  function setState(step, state, note) {
    const el = row(step);
    el.dataset.state = state;
    el.querySelector('.mark').textContent = MARKS[state];
    let noteEl = el.querySelector('.note');
    if (note) {
      if (!noteEl) {
        noteEl = document.createElement('span');
        noteEl.className = 'note';
        el.append(noteEl);
      }
      noteEl.textContent = note;
    } else if (noteEl) {
      noteEl.remove();
    }
  }

  function finishRunning() {
    for (const [step, el] of rows) {
      if (el.dataset.state === 'running') setState(step, 'done');
    }
  }

  function showProblem(message, tail) {
    problemTextEl.textContent = message;
    const hasTail = Array.isArray(tail) && tail.length > 0;
    problemTailEl.hidden = !hasTail;
    problemTailEl.textContent = hasTail ? tail.join('\n') : '';
    problemEl.hidden = false;
  }

  function reset() {
    rows.clear();
    stepsEl.textContent = '';
    problemEl.hidden = true;
    titleEl.textContent = 'Starting…';
  }

  function onEvent(event) {
    if (event.step === 'ready') {
      finishRunning();
      titleEl.textContent = 'Opening…';
      return;
    }
    if (event.error && event.step === 'cors') {
      // A warning only: the app still opens
      setState('cors', 'warning', event.error);
      return;
    }
    if (event.error) {
      finishRunning();
      setState(event.step, 'failed');
      titleEl.textContent = "Couldn't start";
      showProblem(event.error, event.tail);
      return;
    }
    finishRunning();
    setState(event.step, 'running');
  }

  retryEl.addEventListener('click', () => {
    reset();
    window.electronAPI.host.retry();
  });

  if (window.electronAPI && window.electronAPI.host) {
    window.electronAPI.host.onStartup(onEvent);
  }
})();
