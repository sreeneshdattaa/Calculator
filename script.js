/**
 * Scientific Calculator Logic
 * Handles all arithmetic + scientific operations, display updates,
 * keyboard input, and calculation history.
 */

(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────
  const state = {
    currentInput: '0',
    previousInput: '',
    operator: null,
    shouldResetDisplay: false,
    lastResult: null,
    lastOperator: null,
    lastOperand: null,
    hasDecimal: false,
    isSecondMode: false,
    sciMode: false,
    historyOpen: false,
    history: [],
  };

  // ─── DOM References ──────────────────────────────────────
  const currentValueEl = document.getElementById('current-value');
  const expressionEl = document.getElementById('expression');
  const allButtons = document.querySelectorAll('.btn');
  const operatorButtons = document.querySelectorAll('.btn-operator');
  const sciToggleBtn = document.getElementById('btn-sci-toggle');
  const historyToggleBtn = document.getElementById('btn-history-toggle');
  const sciPanel = document.getElementById('sci-panel');
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  const historyClearBtn = document.getElementById('btn-history-clear');
  const calcTitle = document.querySelector('.calc-title');
  const secondBtn = document.getElementById('btn-2nd');

  // Scientific function buttons that change in 2nd mode
  const sinBtn = document.getElementById('btn-sin');
  const cosBtn = document.getElementById('btn-cos');
  const tanBtn = document.getElementById('btn-tan');
  const sqrtBtn = document.getElementById('btn-sqrt');
  const cbrtBtn = document.getElementById('btn-cbrt');
  const logBtn = document.getElementById('btn-log');
  const lnBtn = document.getElementById('btn-ln');
  const pow2Btn = document.getElementById('btn-pow2');
  const pow3Btn = document.getElementById('btn-pow3');

  // ─── Formatting ──────────────────────────────────────────
  function formatNumber(numStr) {
    if (numStr === 'Error') return 'Error';
    if (numStr === '') return '0';

    const num = parseFloat(numStr);
    if (isNaN(num)) return '0';
    if (!isFinite(num)) return 'Error';

    // Keep the raw string if user is still typing (has trailing decimal or trailing zeros after decimal)
    if (numStr.includes('.') && (numStr.endsWith('.') || /\.\d*0+$/.test(numStr))) {
      const parts = numStr.split('.');
      const intPart = parseInt(parts[0], 10);
      const formatted = intPart.toLocaleString('en-US');
      return formatted + '.' + parts[1];
    }

    // For very large or very small numbers, use exponential
    if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
      return num.toExponential(6);
    }

    // Standard formatting
    const parts = numStr.split('.');
    const intPart = parseInt(parts[0], 10);
    const formatted = intPart.toLocaleString('en-US');

    if (parts.length === 2) {
      return formatted + '.' + parts[1];
    }

    return formatted;
  }

  function updateDisplay() {
    const formatted = formatNumber(state.currentInput);
    currentValueEl.textContent = formatted;

    // Adjust font size based on length
    const len = formatted.length;
    currentValueEl.classList.remove('shrink-1', 'shrink-2', 'shrink-3');
    if (len > 16) {
      currentValueEl.classList.add('shrink-3');
    } else if (len > 12) {
      currentValueEl.classList.add('shrink-2');
    } else if (len > 9) {
      currentValueEl.classList.add('shrink-1');
    }

    // Subtle animation
    currentValueEl.classList.remove('animate');
    void currentValueEl.offsetWidth;
    currentValueEl.classList.add('animate');
  }

  function updateExpression(text) {
    expressionEl.textContent = text || '\u00A0';
  }

  // ─── Highlight Active Operator ───────────────────────────
  function highlightOperator(op) {
    operatorButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === op);
    });
  }

  function clearOperatorHighlight() {
    operatorButtons.forEach(btn => btn.classList.remove('active'));
  }

  // ─── Core Operations ────────────────────────────────────
  function calculate(a, b, op) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    let result;

    switch (op) {
      case '+': result = numA + numB; break;
      case '−': result = numA - numB; break;
      case '×': result = numA * numB; break;
      case '÷':
        if (numB === 0) return 'Error';
        result = numA / numB;
        break;
      case '^':
        result = Math.pow(numA, numB);
        break;
      default: return b;
    }

    if (!isFinite(result)) return 'Error';
    return parseFloat(result.toPrecision(12)).toString();
  }

  // ─── Scientific Functions ───────────────────────────────
  function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    if (n !== Math.floor(n)) {
      return Math.exp(gammaLn(n + 1));
    }
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  function gammaLn(z) {
    const g = 7;
    const c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];
    if (z < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaLn(1 - z);
    }
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  function applyScientificFunc(funcName, value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Error';
    let result;

    switch (funcName) {
      case 'sin':    result = Math.sin(num); break;
      case 'cos':    result = Math.cos(num); break;
      case 'tan':    result = Math.tan(num); break;
      case 'asin':
        if (num < -1 || num > 1) return 'Error';
        result = Math.asin(num); break;
      case 'acos':
        if (num < -1 || num > 1) return 'Error';
        result = Math.acos(num); break;
      case 'atan':   result = Math.atan(num); break;
      case 'pow2':   result = num * num; break;
      case 'pow3':   result = num * num * num; break;
      case 'sqrt':
        if (num < 0) return 'Error';
        result = Math.sqrt(num); break;
      case 'cbrt':   result = Math.cbrt(num); break;
      case 'log':
        if (num <= 0) return 'Error';
        result = Math.log10(num); break;
      case 'ln':
        if (num <= 0) return 'Error';
        result = Math.log(num); break;
      case 'fact':
        if (num < 0 || num > 170) return 'Error';
        result = factorial(num); break;
      case '10x':    result = Math.pow(10, num); break;
      case 'ex':     result = Math.exp(num); break;
      case '1/x':
        if (num === 0) return 'Error';
        result = 1 / num; break;
      case 'log2':
        if (num <= 0) return 'Error';
        result = Math.log2(num); break;
      default: return value;
    }

    if (!isFinite(result)) return 'Error';
    return parseFloat(result.toPrecision(12)).toString();
  }

  // ─── History ────────────────────────────────────────────
  function addToHistory(expression, result) {
    if (result === 'Error') return;
    state.history.unshift({ expression, result, timestamp: Date.now() });
    if (state.history.length > 50) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (historyEmpty) {
      historyEmpty.style.display = state.history.length === 0 ? 'block' : 'none';
    }

    const oldItems = historyList.querySelectorAll('.history-item');
    oldItems.forEach(item => item.remove());

    state.history.forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.dataset.index = index;

      const expr = document.createElement('div');
      expr.className = 'history-expression';
      expr.textContent = entry.expression;

      const res = document.createElement('div');
      res.className = 'history-result';
      res.textContent = formatNumber(entry.result);

      item.appendChild(expr);
      item.appendChild(res);

      item.addEventListener('click', () => {
        state.currentInput = entry.result;
        state.shouldResetDisplay = true;
        updateDisplay();
      });

      historyList.appendChild(item);
    });
  }

  function clearHistory() {
    state.history = [];
    renderHistory();
  }

  // ─── Toggle Modes ──────────────────────────────────────
  function toggleSciMode() {
    state.sciMode = !state.sciMode;

    if (state.sciMode) {
      sciPanel.classList.add('visible');
      sciToggleBtn.classList.add('active');
      calcTitle.textContent = 'Scientific';
    } else {
      sciPanel.classList.remove('visible');
      sciToggleBtn.classList.remove('active');
      calcTitle.textContent = 'Calculator';
    }
  }

  function toggleHistory() {
    state.historyOpen = !state.historyOpen;

    if (state.historyOpen) {
      historyPanel.classList.add('visible');
      historyToggleBtn.classList.add('active');
    } else {
      historyPanel.classList.remove('visible');
      historyToggleBtn.classList.remove('active');
    }
  }

  function toggle2ndMode() {
    state.isSecondMode = !state.isSecondMode;

    if (state.isSecondMode) {
      secondBtn.classList.add('active-2nd');
      sinBtn.textContent = 'sin⁻¹'; sinBtn.dataset.value = 'asin';
      cosBtn.textContent = 'cos⁻¹'; cosBtn.dataset.value = 'acos';
      tanBtn.textContent = 'tan⁻¹'; tanBtn.dataset.value = 'atan';
      pow2Btn.textContent = '10ˣ';  pow2Btn.dataset.value = '10x';
      pow3Btn.textContent = 'eˣ';   pow3Btn.dataset.value = 'ex';
      sqrtBtn.textContent = '1/x';  sqrtBtn.dataset.value = '1/x';
      cbrtBtn.textContent = 'log₂'; cbrtBtn.dataset.value = 'log2';
      logBtn.textContent = '2ˣ';    logBtn.dataset.value = '2x';
      lnBtn.textContent = 'eˣ';     lnBtn.dataset.value = 'ex';
    } else {
      secondBtn.classList.remove('active-2nd');
      sinBtn.textContent = 'sin';  sinBtn.dataset.value = 'sin';
      cosBtn.textContent = 'cos';  cosBtn.dataset.value = 'cos';
      tanBtn.textContent = 'tan';  tanBtn.dataset.value = 'tan';
      pow2Btn.textContent = 'x²';  pow2Btn.dataset.value = 'pow2';
      pow3Btn.textContent = 'x³';  pow3Btn.dataset.value = 'pow3';
      sqrtBtn.textContent = '√x';  sqrtBtn.dataset.value = 'sqrt';
      cbrtBtn.textContent = '∛x';  cbrtBtn.dataset.value = 'cbrt';
      logBtn.textContent = 'log';  logBtn.dataset.value = 'log';
      lnBtn.textContent = 'ln';   lnBtn.dataset.value = 'ln';
    }
  }

  // ─── Actions ─────────────────────────────────────────────
  function inputNumber(num) {
    if (state.currentInput === 'Error') {
      state.currentInput = num;
      updateDisplay();
      return;
    }

    if (state.shouldResetDisplay) {
      state.currentInput = num;
      state.shouldResetDisplay = false;
      state.hasDecimal = false;
    } else {
      if (state.currentInput === '0' && num !== '0') {
        state.currentInput = num;
      } else if (state.currentInput === '0' && num === '0') {
        // do nothing
      } else {
        if (state.currentInput.replace(/[^0-9]/g, '').length >= 15) return;
        state.currentInput += num;
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (state.shouldResetDisplay) {
      state.currentInput = '0.';
      state.shouldResetDisplay = false;
      state.hasDecimal = true;
      updateDisplay();
      return;
    }

    if (state.currentInput === 'Error') {
      state.currentInput = '0.';
      state.hasDecimal = true;
      updateDisplay();
      return;
    }

    if (!state.currentInput.includes('.')) {
      state.currentInput += '.';
      state.hasDecimal = true;
      updateDisplay();
    }
  }

  function handleOperator(op) {
    if (state.currentInput === 'Error') return;

    state.lastOperator = null;
    state.lastOperand = null;

    if (state.operator && !state.shouldResetDisplay) {
      const result = calculate(state.previousInput, state.currentInput, state.operator);
      state.currentInput = result;
      updateDisplay();
      updateExpression(formatNumber(result) + ' ' + op);
      state.previousInput = result;
    } else {
      state.previousInput = state.currentInput;
      updateExpression(formatNumber(state.currentInput) + ' ' + op);
    }

    state.operator = op;
    state.shouldResetDisplay = true;
    highlightOperator(op);
  }

  function handleEquals() {
    clearOperatorHighlight();
    if (state.currentInput === 'Error') return;

    if (!state.operator && state.lastOperator) {
      const exprText = formatNumber(state.currentInput) + ' ' + state.lastOperator + ' ' + formatNumber(state.lastOperand) + ' =';
      const result = calculate(state.currentInput, state.lastOperand, state.lastOperator);
      updateExpression(exprText);
      addToHistory(exprText, result);
      state.currentInput = result;
      updateDisplay();
      return;
    }

    if (!state.operator) return;

    const operand = state.currentInput;
    const result = calculate(state.previousInput, operand, state.operator);
    const exprText = formatNumber(state.previousInput) + ' ' + state.operator + ' ' + formatNumber(operand) + ' =';

    updateExpression(exprText);
    addToHistory(exprText, result);

    state.lastOperator = state.operator;
    state.lastOperand = operand;

    state.currentInput = result;
    state.previousInput = '';
    state.operator = null;
    state.shouldResetDisplay = true;
    updateDisplay();
  }

  function handleClear() {
    state.currentInput = '0';
    state.previousInput = '';
    state.operator = null;
    state.shouldResetDisplay = false;
    state.lastResult = null;
    state.lastOperator = null;
    state.lastOperand = null;
    state.hasDecimal = false;
    clearOperatorHighlight();
    updateDisplay();
    updateExpression('');
  }

  function handleToggleSign() {
    if (state.currentInput === 'Error' || state.currentInput === '0') return;
    if (state.currentInput.startsWith('-')) {
      state.currentInput = state.currentInput.slice(1);
    } else {
      state.currentInput = '-' + state.currentInput;
    }
    updateDisplay();
  }

  function handlePercent() {
    if (state.currentInput === 'Error') return;
    const num = parseFloat(state.currentInput);
    state.currentInput = (num / 100).toString();
    updateDisplay();
  }

  function handleScientificFunc(funcName) {
    if (state.currentInput === 'Error') return;

    const original = state.currentInput;
    const funcLabel = getFuncLabel(funcName);
    const result = applyScientificFunc(funcName, original);

    updateExpression(funcLabel + '(' + formatNumber(original) + ') =');
    addToHistory(funcLabel + '(' + formatNumber(original) + ')', result);

    state.currentInput = result;
    state.shouldResetDisplay = true;
    updateDisplay();
  }

  function getFuncLabel(funcName) {
    const labels = {
      'sin': 'sin', 'cos': 'cos', 'tan': 'tan',
      'asin': 'sin⁻¹', 'acos': 'cos⁻¹', 'atan': 'tan⁻¹',
      'pow2': 'sqr', 'pow3': 'cube', 'sqrt': '√', 'cbrt': '∛',
      'log': 'log', 'ln': 'ln', 'fact': 'fact',
      '10x': '10^', 'ex': 'e^', '1/x': '1/', 'log2': 'log₂', '2x': '2^',
    };
    return labels[funcName] || funcName;
  }

  function handleConstant(value) {
    if (value === 'pi') {
      state.currentInput = Math.PI.toPrecision(12).toString();
    } else if (value === 'e') {
      state.currentInput = Math.E.toPrecision(12).toString();
    }
    state.shouldResetDisplay = true;
    updateDisplay();
  }

  // ─── Ripple Effect ───────────────────────────────────────
  function createRipple(button, e) {
    const circle = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    circle.style.width = circle.style.height = size + 'px';
    circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
    circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
    circle.classList.add('ripple');

    const oldRipple = button.querySelector('.ripple');
    if (oldRipple) oldRipple.remove();

    button.appendChild(circle);
    setTimeout(() => circle.remove(), 500);
  }

  // ─── Event Listeners ────────────────────────────────────
  allButtons.forEach(btn => {
    btn.addEventListener('click', function (e) {
      createRipple(this, e);

      const action = this.dataset.action;
      const value = this.dataset.value;

      switch (action) {
        case 'number':
          inputNumber(value);
          if (state.operator && !state.shouldResetDisplay) {
            // typing after operator
          } else if (!state.operator) {
            clearOperatorHighlight();
          }
          break;
        case 'decimal':    inputDecimal(); break;
        case 'operator':   handleOperator(value); break;
        case 'equals':     handleEquals(); break;
        case 'clear':      handleClear(); break;
        case 'toggle-sign': handleToggleSign(); break;
        case 'percent':    handlePercent(); break;
        case 'func':       handleScientificFunc(value); break;
        case 'constant':   handleConstant(value); break;
        case '2nd':        toggle2ndMode(); break;
        case 'paren':
          if (value === '(') {
            if (state.shouldResetDisplay || state.currentInput === '0') {
              state.currentInput = '(';
              state.shouldResetDisplay = false;
            } else {
              state.currentInput += '(';
            }
          } else {
            state.currentInput += ')';
          }
          updateDisplay();
          break;
      }
    });
  });

  // Mode toggles
  sciToggleBtn.addEventListener('click', toggleSciMode);
  historyToggleBtn.addEventListener('click', toggleHistory);
  historyClearBtn.addEventListener('click', clearHistory);

  // ─── Keyboard Support ────────────────────────────────────
  const keyMap = {
    '0': () => inputNumber('0'),
    '1': () => inputNumber('1'),
    '2': () => inputNumber('2'),
    '3': () => inputNumber('3'),
    '4': () => inputNumber('4'),
    '5': () => inputNumber('5'),
    '6': () => inputNumber('6'),
    '7': () => inputNumber('7'),
    '8': () => inputNumber('8'),
    '9': () => inputNumber('9'),
    '.': () => inputDecimal(),
    '+': () => handleOperator('+'),
    '-': () => handleOperator('−'),
    '*': () => handleOperator('×'),
    '/': () => handleOperator('÷'),
    '%': () => handlePercent(),
    'Enter': () => handleEquals(),
    '=': () => handleEquals(),
    'Backspace': () => {
      if (state.currentInput === 'Error') { handleClear(); return; }
      if (state.currentInput.length > 1) {
        state.currentInput = state.currentInput.slice(0, -1);
        if (state.currentInput === '-') state.currentInput = '0';
      } else {
        state.currentInput = '0';
      }
      updateDisplay();
    },
    'Escape': () => handleClear(),
    'c': () => handleClear(),
    'C': () => handleClear(),
    'h': () => toggleHistory(),
  };

  document.addEventListener('keydown', (e) => {
    const handler = keyMap[e.key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  });

  // ─── Init ──────────────────────────────────────────────
  updateDisplay();
})();
