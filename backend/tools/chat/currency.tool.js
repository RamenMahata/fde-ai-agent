export async function getExchangeRate({ fromCurrency, toCurrency, from, to } = {}) {
    const sourceCurrency = fromCurrency || from;
    const targetCurrency = toCurrency || to;

    if (!sourceCurrency || !targetCurrency) {
        throw new Error("Both fromCurrency and toCurrency are required.");
    }

    console.log("Currency tool called");

    const url = `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(
        sourceCurrency
    )}/${encodeURIComponent(targetCurrency)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Currency API request failed with status ${response.status}`);
    }

    return await response.json();
}