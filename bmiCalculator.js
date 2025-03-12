function calculateBMI(config) {
    const {
        weightInputId,
        heightInputId,
        inchesInputId,
        ageInputId,
        genderInputId,
        bmiValueId,
        bmiResultId,
        resultBoxId,
        measurementSystem = "imperial", // Default to imperial (feet, inches)
        bmiCategories = getDefaultBMICategories(), // Default BMI categories
    } = config

    const weight = parseFloat($w(weightInputId).value); // Weight
    const heightFeet = parseFloat($w(heightInputId).value); // Height in feet or meters
    const heightInches = inchesInputId ? parseFloat($w(inchesInputId).value || 0) : 0; // Additional height in inches
    const age = parseInt($w(ageInputId).value, 10); // Age
    const gender = $w(genderInputId)?.value || ""; // Gender (if applicable)

    // Validate inputs
    if (!isValidInput(weight, heightFeet, heightInches, age)) {
        focusInvalidInput([weightInputId, heightInputId, inchesInputId, ageInputId]);
        return;
    }

    // Convert height to meters if necessary
    const heightInMeters = measurementSystem === "imperial"
        ? convertToMeters(heightFeet, heightInches)
        : heightFeet;

    // Calculate BMI
    const bmi = parseFloat((weight / (heightInMeters ** 2)).toFixed(2));
    $w(bmiValueId).text = bmi.toString();

    // Determine BMI category
    const category = getBMICategory(bmi, age, bmiCategories);
    if (category) {
        $w(bmiResultId).changeState(category.state);
    }

    // Expand the results box
    if (resultBoxId) {
        $w(resultBoxId).expand();
    }
}

/**
 * Converts height in feet and inches to meters.
 */
function convertToMeters(feet, inches = 0) {
    if (feet <= 0 || isNaN(feet) || inches < 0 || isNaN(inches)) {
        console.error("Invalid height input.");
        return null;
    }
    const totalFeet = feet + inches / 12;
    return parseFloat((totalFeet * 0.3048).toFixed(2)); // Convert feet to meters
}

/**
 * Determines the BMI category based on BMI value, age, and custom categories.
 */
function getBMICategory(bmi, age, bmiCategories) {
    for (const category of bmiCategories) {
        if (age >= category.ageRange[0] && age <= category.ageRange[1]) {
            for (const range of category.ranges) {
                if (bmi >= range.min && bmi <= range.max) {
                    return range;
                }
            }
        }
    }
    return null;
}

/**
 * Provides default BMI categories for various age groups.
 */
function getDefaultBMICategories() {
    return [
        {
            ageRange: [0, 17], // Children and teens
            ranges: [
                { min: 0, max: 5, label: "Underweight", state: "underweight" },
                { min: 5, max: 85, label: "Healthy weight", state: "healthy" },
                { min: 85, max: 95, label: "Overweight", state: "overweight" },
                { min: 95, max: Infinity, label: "Obese", state: "obese" },
            ],
        },
        {
            ageRange: [18, 65], // Adults 18-65
            ranges: [
                { min: 0, max: 18.4, label: "Underweight", state: "underweight" },
                { min: 18.5, max: 24.9, label: "Healthy weight", state: "healthy" },
                { min: 25, max: 29.9, label: "Overweight", state: "overweight" },
                { min: 30, max: Infinity, label: "Obesity", state: "obese" },
            ],
        },
        {
            ageRange: [66, Infinity], // Adults over 65
            ranges: [
                { min: 0, max: 21.9, label: "Underweight", state: "underweight" },
                { min: 22, max: 27, label: "Healthy weight", state: "healthy" },
                { min: 27.1, max: 30, label: "Overweight", state: "overweight" },
                { min: 30.1, max: Infinity, label: "Obesity", state: "obese" },
            ],
        },
    ];
}

/**
 * Validates the input values for weight, height, and age.
 */
function isValidInput(weight, heightFeet, heightInches, age) {
    return weight > 0 && heightFeet > 0 && age > 0 && (heightInches >= 0 || isNaN(heightInches));
}

/**
 * Focuses on the first invalid input field.
 */
function focusInvalidInput(inputIds) {
    for (const id of inputIds) {
        if (id && !$w(id).valid) {
            $w(id).focus();
            break;
        }
    }
}
