class AdvancedCalculator {
    constructor() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;        this.memory = 0;
        this.lastAnswer = 0;
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.isScientificMode = false;
        this.angleMode = localStorage.getItem('angleMode') || 'deg';
        this.currentTheme = localStorage.getItem('calculatorTheme') || 'dark';
        this.decimalPlaces = parseInt(localStorage.getItem('decimalPlaces')) || 6;
        this.soundEnabled = JSON.parse(localStorage.getItem('soundEnabled')) ?? true;        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
        this.updateHistory();
        this.applyTheme();
        this.updateAngleMode();
        
        // Add keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    initializeElements() {
        this.expressionDisplay = document.getElementById('expression');
        this.resultDisplay = document.getElementById('result');
        this.basicModeBtn = document.getElementById('basicMode');
        this.scientificModeBtn = document.getElementById('scientificMode');
        this.scientificFunctions = document.getElementById('scientificFunctions');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.exportHistoryBtn = document.getElementById('exportHistory');
        this.clearAllBtn = document.getElementById('clearAll');
        this.clearEntryBtn = document.getElementById('clearEntry');
        this.equalsBtn = document.getElementById('equals');
        this.memoryClearBtn = document.getElementById('memoryClear');
        this.memoryRecallBtn = document.getElementById('memoryRecall');
        this.memoryAddBtn = document.getElementById('memoryAdd');
        this.memorySubtractBtn = document.getElementById('memorySubtract');
        this.memoryStatus = document.getElementById('memoryStatus');
        this.angleModeDisplay = document.getElementById('angleMode');
        this.themeToggle = document.getElementById('themeToggle');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.ansBtn = document.getElementById('ansBtn');
    }
      attachEventListeners() {
        // Mode switching
        if (this.basicModeBtn) this.basicModeBtn.addEventListener('click', () => this.switchMode('basic'));
        if (this.scientificModeBtn) this.scientificModeBtn.addEventListener('click', () => this.switchMode('scientific'));
        
        // Theme toggle
        if (this.themeToggle) this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Settings
        if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.openSettings());
        if (this.closeSettings) this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
          // Number and operator buttons
        document.querySelectorAll('.btn.number').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addButtonPressEffect(btn);
                this.inputNumber(btn.dataset.value);
            });
        });
        
        document.querySelectorAll('.btn.operator').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addButtonPressEffect(btn);
                this.inputOperator(btn.dataset.value);
            });
        });
          document.querySelectorAll('.btn.function').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addButtonPressEffect(btn);
                this.inputFunction(btn.dataset.value);
            });
        });
          // Control buttons
        if (this.clearAllBtn) this.clearAllBtn.addEventListener('click', () => {
            this.addButtonPressEffect(this.clearAllBtn);
            this.clearAll();
        });
        if (this.clearEntryBtn) this.clearEntryBtn.addEventListener('click', () => {
            this.addButtonPressEffect(this.clearEntryBtn);
            this.clearEntry();
        });
        if (this.equalsBtn) this.equalsBtn.addEventListener('click', () => {
            this.addButtonPressEffect(this.equalsBtn);
            this.calculate();
        });
        
        // Memory buttons
        if (this.memoryClearBtn) this.memoryClearBtn.addEventListener('click', () => this.memoryClear());
        if (this.memoryRecallBtn) this.memoryRecallBtn.addEventListener('click', () => this.memoryRecall());
        if (this.memoryAddBtn) this.memoryAddBtn.addEventListener('click', () => this.memoryAdd());        if (this.memorySubtractBtn) this.memorySubtractBtn.addEventListener('click', () => this.memorySubtract());
        
        // Answer button
        if (this.ansBtn) this.ansBtn.addEventListener('click', () => this.inputLastAnswer());
        
        // History
        if (this.clearHistoryBtn) this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        if (this.exportHistoryBtn) this.exportHistoryBtn.addEventListener('click', () => this.exportHistory());
        
        // Settings modal
        document.querySelectorAll('[data-angle]').forEach(btn => {
            btn.addEventListener('click', () => this.setAngleMode(btn.dataset.angle));
        });
        
        const decimalSlider = document.getElementById('decimalPlaces');
        if (decimalSlider) {
            decimalSlider.addEventListener('input', (e) => this.setDecimalPlaces(e.target.value));
        }
        
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => this.setSoundEnabled(e.target.checked));
        }
        
        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Close modal on background click
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettingsModal();
                }
            });
        }
    }
    
    playSound(type = 'click') {
        if (!this.soundEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const frequencies = {
                click: 800,
                error: 200,
                equals: 1000
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Audio context not available
        }
    }
      switchMode(mode) {
        this.playSound();
        
        this.isScientificMode = mode === 'scientific';
        
        // Reset active states
        [this.basicModeBtn, this.scientificModeBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // Hide all function panels
        if (this.scientificFunctions) this.scientificFunctions.classList.remove('show');
        
        if (mode === 'basic' && this.basicModeBtn) {
            this.basicModeBtn.classList.add('active');
        } else if (mode === 'scientific' && this.scientificModeBtn) {
            this.scientificModeBtn.classList.add('active');
            if (this.scientificFunctions) this.scientificFunctions.classList.add('show');
        }
    }
    
    toggleTheme() {
        this.playSound();
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('calculatorTheme', this.currentTheme);
    }
    
    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
    
    openSettings() {
        this.playSound();
        if (this.settingsModal) this.settingsModal.classList.add('show');
        
        // Update settings values
        const decimalSlider = document.getElementById('decimalPlaces');
        const decimalValue = document.getElementById('decimalValue');
        const soundToggle = document.getElementById('soundToggle');
        
        if (decimalSlider) decimalSlider.value = this.decimalPlaces;
        if (decimalValue) decimalValue.textContent = this.decimalPlaces;
        if (soundToggle) soundToggle.checked = this.soundEnabled;
    }
    
    closeSettingsModal() {
        this.playSound();
        if (this.settingsModal) this.settingsModal.classList.remove('show');
    }
    
    setAngleMode(mode) {
        this.playSound();
        this.angleMode = mode;
        this.updateAngleMode();
        localStorage.setItem('angleMode', mode);
    }
    
    updateAngleMode() {
        if (this.angleModeDisplay) {
            this.angleModeDisplay.textContent = this.angleMode.toUpperCase();
        }
        
        // Update toggle buttons
        document.querySelectorAll('[data-angle]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.angle === this.angleMode);
        });
    }
    
    setDecimalPlaces(value) {
        this.decimalPlaces = parseInt(value);
        const decimalValue = document.getElementById('decimalValue');
        if (decimalValue) decimalValue.textContent = value;
        localStorage.setItem('decimalPlaces', value);
        this.updateDisplay();
    }
    
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('soundEnabled', JSON.stringify(enabled));
    }
    
    switchNumberSystem(system) {
        this.playSound();
        this.currentNumberSystem = system;
        
        document.querySelectorAll('.sys-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.system === system);
        });
        
        // Convert current input to new system
        if (this.currentInput !== '0') {
            const decimal = this.toDecimal(this.currentInput, this.currentNumberSystem);
            this.currentInput = this.fromDecimal(decimal, system);
            this.updateDisplay();
        }
    }
    
    toDecimal(value, system) {
        switch (system) {
            case 'hex': return parseInt(value, 16);
            case 'oct': return parseInt(value, 8);
            case 'bin': return parseInt(value, 2);
            default: return parseFloat(value);
        }
    }
    
    fromDecimal(value, system) {
        const intValue = Math.floor(value);
        switch (system) {
            case 'hex': return intValue.toString(16).toUpperCase();
            case 'oct': return intValue.toString(8);
            case 'bin': return intValue.toString(2);
            default: return value.toString();
        }
    }
    
    inputNumber(num) {
        this.playSound();
        
        if (this.waitingForOperand) {
            this.currentInput = num;
            this.waitingForOperand = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }
        this.updateDisplay();
    }
    
    inputLastAnswer() {
        this.playSound();
        this.currentInput = this.lastAnswer.toString();
        this.updateDisplay();
    }
      inputOperator(nextOperator) {
        this.playSound();
        const inputValue = parseFloat(this.currentInput);
        
        if (nextOperator === 'backspace') {
            this.backspace();
            return;
        }
        
        if (nextOperator === 'negate') {
            this.currentInput = (inputValue * -1).toString();
            this.updateDisplay();
            return;
        }
        
        if (nextOperator === '.') {
            if (this.currentInput.indexOf('.') === -1) {
                this.currentInput += '.';
                this.updateDisplay();
            }
            return;
        }
        
        if (this.previousInput === '') {
            this.previousInput = inputValue;
        } else if (this.operator) {
            const currentValue = this.previousInput || 0;
            const newValue = this.performCalculation(this.operator, currentValue, inputValue);
            
            this.currentInput = String(newValue);
            this.previousInput = newValue;
        }
        
        this.waitingForOperand = true;
        this.operator = nextOperator;
        this.updateDisplay();
    }
    
    inputFunction(func) {
        this.playSound();
        const inputValue = parseFloat(this.currentInput);
        let result;
        
        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(this.toRadians(inputValue));
                    break;
                case 'cos':
                    result = Math.cos(this.toRadians(inputValue));
                    break;
                case 'tan':
                    result = Math.tan(this.toRadians(inputValue));
                    break;
                case 'ln':
                    if (inputValue <= 0) throw new Error('Invalid input');
                    result = Math.log(inputValue);
                    break;
                case 'log':
                    if (inputValue <= 0) throw new Error('Invalid input');
                    result = Math.log10(inputValue);
                    break;
                case 'sqrt':
                    if (inputValue < 0) throw new Error('Invalid input');
                    result = Math.sqrt(inputValue);
                    break;
                case 'pow':
                    this.operator = '**';
                    this.previousInput = inputValue;
                    this.waitingForOperand = true;
                    this.updateDisplay();
                    return;
                case 'exp':
                    result = Math.exp(inputValue);
                    break;
                case 'factorial':
                    result = this.factorial(inputValue);
                    break;
                case 'pi':
                    result = Math.PI;
                    break;
                case 'e':
                    result = Math.E;
                    break;                case 'abs':
                    result = Math.abs(inputValue);
                    break;
                case 'percent':
                    result = inputValue / 100;
                    break;
                case 'inverse':
                    if (inputValue === 0) throw new Error('Division by zero');
                    result = 1 / inputValue;
                    break;
                case 'square':
                    result = inputValue * inputValue;
                    break;
                default:
                    return;            }
            
            // Add scientific function to history
            const functionName = this.getFunctionDisplayName(func);
            let expression;
            
            // Special cases for constants that don't take input
            if (func === 'pi' || func === 'e') {
                expression = functionName;
            } else {
                expression = `${functionName}(${this.formatNumber(inputValue)})`;
            }
            
            this.addToHistory(expression, result);
            
            this.currentInput = this.formatResult(result);
            this.lastAnswer = result;
            this.updateDisplay();
        } catch (error) {
            this.showError('Error');
            this.playSound('error');
        }
    }
    
    inputBitOperation(operation) {
        this.playSound();
        const inputValue = this.toDecimal(this.currentInput, this.currentNumberSystem);
        
        if (operation === 'not') {
            const result = ~inputValue;
            this.currentInput = this.fromDecimal(result, this.currentNumberSystem);
            this.updateDisplay();
        } else {
            this.operator = operation;
            this.previousInput = inputValue;
            this.waitingForOperand = true;
            this.updateDisplay();
        }
    }
      calculate() {
        this.playSound('equals');
        const inputValue = parseFloat(this.currentInput);
        
        if (this.previousInput !== '' && this.operator) {
            const newValue = this.performCalculation(this.operator, this.previousInput, inputValue);
            
            // Add to history
            const expression = `${this.formatNumber(this.previousInput)} ${this.getOperatorSymbol(this.operator)} ${this.formatNumber(inputValue)}`;
            this.addToHistory(expression, newValue);
            
            this.currentInput = String(newValue);
            this.lastAnswer = newValue;
            this.previousInput = '';
            this.operator = null;
            this.waitingForOperand = true;
            this.updateDisplay();
        }
    }
    
    performCalculation(operator, firstOperand, secondOperand) {
        try {
            switch (operator) {
                case '+':
                    return firstOperand + secondOperand;
                case '-':
                    return firstOperand - secondOperand;
                case '*':
                    return firstOperand * secondOperand;
                case '/':
                    if (secondOperand === 0) throw new Error('Division by zero');
                    return firstOperand / secondOperand;
                case '**':
                    return Math.pow(firstOperand, secondOperand);
                case 'and':
                    return firstOperand & secondOperand;
                case 'or':
                    return firstOperand | secondOperand;
                case 'xor':
                    return firstOperand ^ secondOperand;
                case 'lsh':
                    return firstOperand << secondOperand;
                case 'rsh':
                    return firstOperand >> secondOperand;
                default:
                    return secondOperand;
            }
        } catch (error) {
            throw new Error('Calculation error');
        }
    }
    
    backspace() {
        this.playSound();
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }
    
    clearAll() {
        this.playSound();
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.updateDisplay();
    }
    
    clearEntry() {
        this.playSound();
        this.currentInput = '0';
        this.updateDisplay();
    }
    
    // Memory functions
    memoryClear() {
        this.playSound();
        this.memory = 0;
        this.updateMemoryIndicator();
    }
    
    memoryRecall() {
        this.playSound();
        this.currentInput = String(this.memory);
        this.updateDisplay();
    }
    
    memoryAdd() {
        this.playSound();
        this.memory += parseFloat(this.currentInput);
        this.updateMemoryIndicator();
    }
    
    memorySubtract() {
        this.playSound();
        this.memory -= parseFloat(this.currentInput);
        this.updateMemoryIndicator();
    }
    
    updateMemoryIndicator() {
        if (this.memoryStatus) {
            this.memoryStatus.classList.toggle('active', this.memory !== 0);
        }
    }
    
    // Memory Bank functions
    storeToMemoryBank(slot) {
        this.playSound();
        this.memoryBank[slot] = parseFloat(this.currentInput);
        this.updateMemoryBank();
    }
    
    recallFromMemoryBank(slot) {
        this.playSound();
        this.currentInput = this.memoryBank[slot].toString();
        this.updateDisplay();
    }
    
    updateMemoryBank() {
        document.querySelectorAll('.memory-slot').forEach(slot => {
            const slotNumber = slot.dataset.slot;
            const valueElement = slot.querySelector('.slot-value');
            if (valueElement) {
                const value = this.memoryBank[slotNumber];
                valueElement.textContent = this.formatNumber(value);
            }
        });
    }
    
    // Constants functions
    inputConstant(constant) {
        this.playSound();
        let value;
        switch (constant) {
            case 'pi':
                value = Math.PI;
                break;
            case 'e':
                value = Math.E;
                break;
            case 'phi':
                value = (1 + Math.sqrt(5)) / 2; // Golden ratio
                break;
            case 'sqrt2':
                value = Math.sqrt(2);
                break;
            default:
                return;
        }
        
        this.currentInput = value.toString();
        this.updateDisplay();
    }

    // History functions
    addToHistory(expression, result) {
        const historyItem = {
            expression: expression,
            result: this.formatResult(result),
            timestamp: new Date().toLocaleString()
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        this.updateHistory();
    }
    
    updateHistory() {
        if (!this.historyList) return;
        
        this.historyList.innerHTML = '';
        
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">${item.result}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.currentInput = item.result.replace(/,/g, '');
                this.updateDisplay();
                this.playSound();
            });
            
            this.historyList.appendChild(historyItem);
        });
    }
    
    clearHistory() {
        this.playSound();
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.updateHistory();
    }
    
    exportHistory() {
        this.playSound();
        const historyText = this.history.map(item => 
            `${item.expression} = ${item.result} (${item.timestamp})`
        ).join('\n');
        
        const blob = new Blob([historyText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculator-history-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Utility functions
    toRadians(degrees) {
        return this.angleMode === 'deg' ? degrees * (Math.PI / 180) : degrees;
    }
    
    factorial(n) {
        if (n < 0 || !Number.isInteger(n)) throw new Error('Invalid input');
        if (n === 0 || n === 1) return 1;
        if (n > 170) throw new Error('Number too large');
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    formatResult(value) {
        if (isNaN(value) || !isFinite(value)) {
            return 'Error';
        }
        
        if (this.isProgrammerMode) {
            return this.fromDecimal(Math.floor(value), this.currentNumberSystem);
        }
        
        // Handle very large or very small numbers
        if (Math.abs(value) > Math.pow(10, 15) || (Math.abs(value) < Math.pow(10, -this.decimalPlaces) && value !== 0)) {
            return value.toExponential(this.decimalPlaces);
        }
        
        // Round to avoid floating point errors
        const rounded = Math.round(value * Math.pow(10, this.decimalPlaces)) / Math.pow(10, this.decimalPlaces);
        
        return rounded.toLocaleString('en-US', {
            maximumFractionDigits: this.decimalPlaces
        });
    }
      formatNumber(value) {
        return value.toLocaleString();
    }
      getOperatorSymbol(operator) {
        const symbols = {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷',
            '**': '^'
        };
        return symbols[operator] || operator;
    }
      getFunctionDisplayName(func) {
        const displayNames = {
            'sin': 'sin',
            'cos': 'cos',
            'tan': 'tan',
            'ln': 'ln',
            'log': 'log',
            'sqrt': '√',
            'exp': 'exp',
            'factorial': '!',
            'pi': 'π',
            'e': 'e',
            'abs': 'abs',
            'percent': '%',
            'inverse': '1/x',
            'square': 'x²'
        };
        return displayNames[func] || func;
    }
      updateDisplay() {
        if (!this.resultDisplay) return;
        
        this.resultDisplay.textContent = this.formatResult(parseFloat(this.currentInput));
        
        let expression = '';
        if (this.previousInput !== '' && this.operator) {
            expression = `${this.formatNumber(this.previousInput)} ${this.getOperatorSymbol(this.operator)}`;
        }
        
        if (this.expressionDisplay) {
            this.expressionDisplay.textContent = expression;
        }
        
        // Remove error class if present
        const displaySection = document.querySelector('.display-section');
        if (displaySection) {
            displaySection.classList.remove('error');
        }
    }
    
    showError(message) {
        this.playSound('error');
        if (this.resultDisplay) {
            this.resultDisplay.textContent = message;
        }
        
        const displaySection = document.querySelector('.display-section');
        if (displaySection) {
            displaySection.classList.add('error');
        }
        
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
    }
    
    handleKeyPress(e) {
        // Don't prevent default for important browser shortcuts
        if (e.ctrlKey || e.metaKey) return;
        
        e.preventDefault();
        
        if (e.key >= '0' && e.key <= '9') {
            this.inputNumber(e.key);
        } else if (e.key === '.') {
            this.inputOperator('.');
        } else if (e.key === '+') {
            this.inputOperator('+');
        } else if (e.key === '-') {
            this.inputOperator('-');
        } else if (e.key === '*') {
            this.inputOperator('*');
        } else if (e.key === '/') {
            this.inputOperator('/');
        } else if (e.key === 'Enter' || e.key === '=') {
            this.calculate();
        } else if (e.key === 'Escape') {
            this.clearAll();
        } else if (e.key === 'Backspace') {
            this.inputOperator('backspace');
        } else if (e.key === 'p' || e.key === 'P') {
            this.inputFunction('pi');
        } else if (e.key === 'e' || e.key === 'E') {
            this.inputFunction('e');
        }
    }
    
    addButtonPressEffect(button) {
        button.classList.add('pressed');
        setTimeout(() => {
            button.classList.remove('pressed');
        }, 150);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedCalculator();
});
