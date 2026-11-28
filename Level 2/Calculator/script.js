
const currentDisplay = document.getElementById("current-display");
const previousDisplay = document.getElementById("previous-display");
const buttons = document.querySelectorAll("button");

let currentInput = "0";
let previousInput = "";
let operator = null;
let shouldReset = false;

function updateDisplay() {
    currentDisplay.textContent = currentInput;
    previousDisplay.textContent = previousInput;
}

function inputNumber(number) {
    if (currentInput === "Error") {
        currentInput = "0";
    }

    if (shouldReset) {
        currentInput = "0";
        shouldReset = false;
    }

    if (number === "." && currentInput.includes(".")) {
        return;
    }

    if (currentInput === "0" && number !== ".") {
        currentInput = number;
    } else {
        currentInput += number;
    }

    updateDisplay();
}

function chooseOperator(selectedOperator) {
    if (currentInput === "Error") return;

    if (operator !== null && !shouldReset) {
        calculate();
    }

    previousInput = currentInput;
    operator = selectedOperator;
    shouldReset = true;

    updateDisplay();
}

function calculate() {
    if (operator === null || shouldReset) return;

    const firstNumber = parseFloat(previousInput);
    const secondNumber = parseFloat(currentInput);

    if (operator === "/" && secondNumber === 0) {
        currentInput = "Error: Division by 0";
        previousInput = "";
        operator = null;
        shouldReset = true;
        updateDisplay();
        return;
    }

    let result;

    switch (operator) {
        case "+":
            result = firstNumber + secondNumber;
            break;

        case "-":
            result = firstNumber - secondNumber;
            break;

        case "*":
            result = firstNumber * secondNumber;
            break;

        case "/":
            result = firstNumber / secondNumber;
            break;

        default:
            return;
    }

    currentInput = String(Number(result.toPrecision(12)));
    previousInput = "";
    operator = null;
    shouldReset = true;

    updateDisplay();
}

function clearCalculator() {
    currentInput = "0";
    previousInput = "";
    operator = null;
    shouldReset = false;

    updateDisplay();
}

function deleteNumber() {
    if (currentInput === "Error") {
        clearCalculator();
        return;
    }

    if (shouldReset) {
        currentInput = "0";
        shouldReset = false;
    } else {
        currentInput = currentInput.slice(0, -1);

        if (currentInput === "" || currentInput === "-") {
            currentInput = "0";
        }
    }

    updateDisplay();
}

buttons.forEach(button => {
    button.addEventListener("click", () => {
        const number = button.dataset.number;
        const selectedOperator = button.dataset.operator;
        const action = button.dataset.action;

        if (number !== undefined) {
            inputNumber(number);
        }

        if (selectedOperator !== undefined) {
            chooseOperator(selectedOperator);
        }

        if (action === "calculate") {
            calculate();
        }

        if (action === "clear") {
            clearCalculator();
        }

        if (action === "delete") {
            deleteNumber();
        }
    });
});

updateDisplay();
