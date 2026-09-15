export function calculate({ operation, a, b }) {
  console.log("Calculator tool called");

  if (operation === "add") {
    return a + b;
  }

  if (operation === "subtract") {
    return a - b;
  }

  if (operation === "multiply") {
    return a * b;
  }

  if (operation === "divide") {
    if (b === 0) {
      throw new Error("Cannot divide by 0");
    }

    return a / b;
  }

  if (operation === "mod") {
    if (b === 0) {
      throw new Error("Cannot calculate mod by 0");
    }

    return a % b;
  }

  if (operation === "power") {
    return a ** b;
  }

  throw new Error(`Unsupported operation: ${operation}`);
}