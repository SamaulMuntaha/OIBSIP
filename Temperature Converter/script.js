
function convertTemperature() {

    const input = document.getElementById("temperature");
    const unit = document.getElementById("fromUnit").value;
    const error = document.getElementById("error");

    const celsiusResult = document.getElementById("celsiusResult");
    const fahrenheitResult = document.getElementById("fahrenheitResult");
    const kelvinResult = document.getElementById("kelvinResult");

    const value = Number(input.value);

    // Reset previous results
    error.textContent = "";

    celsiusResult.textContent = "--";
    fahrenheitResult.textContent = "--";
    kelvinResult.textContent = "--";

    // Validate input
    if (input.value.trim() === "" || !Number.isFinite(value)) {
        error.textContent = "Please enter a valid numeric temperature!";
        return;
    }

    // Convert input into Celsius
    let celsius;

    if (unit === "C") {
        celsius = value;
    } else if (unit === "F") {
        celsius = (value - 32) * 5 / 9;
    } else {
        celsius = value - 273.15;
    }

    // Absolute zero validation
    if (celsius < -273.15) {
        error.textContent =
            "Invalid temperature! It cannot be below absolute zero.";
        return;
    }

    // Calculate all three units
    const fahrenheit = (celsius * 9 / 5) + 32;
    const kelvin = celsius + 273.15;

    // Display all results
    celsiusResult.textContent = celsius.toFixed(2) + " °C";
    fahrenheitResult.textContent = fahrenheit.toFixed(2) + " °F";
    kelvinResult.textContent = kelvin.toFixed(2) + " K";
}
