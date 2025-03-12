/**
 * Multi-State Box Handler
 * 
 * A module for managing multi-state forms in Wix with state navigation,
 * input validation, progress tracking, and data collection.
 * 
 * @module public/multi-state-handler
 */

import wixData from 'wix-data';

/**
 * Initialize a multi-state box with configuration options
 * 
 * @param {Object} config - Configuration for the multi-state box
 * @param {string} config.multiStateBoxId - ID of the multi-state box element
 * @param {string} config.progressBarId - ID of the progress bar element (optional)
 * @param {string} config.nextBtnPrefix - Prefix for next button IDs (default: 'btnNext')
 * @param {string} config.prevBtnPrefix - Prefix for previous button IDs (default: 'btnPrev')
 * @param {string} config.submitBtnId - ID of the submit button on the final state
 * @param {string[]} config.stateNames - Array of state names for the multi-state box
 * @param {Object} config.inputMappings - Mapping of states to input elements 
 * @param {function} config.onSubmit - Function to call on form submission
 * @param {string} config.collection - Wix Data collection name for submission
 * @returns {Object} - Multi-state box controller with methods
 */
export function initMultiStateBox(config) {
    // Default configuration
    const defaultConfig = {
        nextBtnPrefix: 'btnNext',
        prevBtnPrefix: 'btnPrev',
        progressBarId: null,
        onSubmit: null
    };

    // Merge provided config with defaults
    const settings = { ...defaultConfig, ...config };

    // Validate required configuration
    if (!settings.multiStateBoxId) {
        console.error("Multi-state box ID is required");
        return null;
    }

    if (!settings.stateNames || !Array.isArray(settings.stateNames) || settings.stateNames.length === 0) {
        console.error("State names array is required and must not be empty");
        return null;
    }
    
    // State variables
    let currentStateIndex = 0;
    let formData = {};
    let states = settings.stateNames;
    let inputMap = settings.inputMappings || {};
    let validationFunctions = {};

    /**
     * Initialize the multi-state box
     * @private
     */
    function initialize() {
        // Set initial state
        updateState(0);
        
        // Attach event handlers to navigation buttons
        for (let i = 0; i < states.length; i++) {
            // Next buttons (all states except last)
            if (i < states.length - 1) {
                const nextBtnId = `#${settings.nextBtnPrefix}${i+1}`;
                if ($w(nextBtnId)) {
                    $w(nextBtnId).onClick(() => {
                        if (validateCurrentState()) {
                            collectStateData();
                            goToNextState();
                        }
                    });
                }
            }
            
            // Previous buttons (all states except first)
            if (i > 0) {
                const prevBtnId = `#${settings.prevBtnPrefix}${i+1}`;
                if ($w(prevBtnId)) {
                    $w(prevBtnId).onClick(() => {
                        goToPreviousState();
                    });
                }
            }
        }
        
        // Attach submit handler to the submit button
        if (settings.submitBtnId && $w(settings.submitBtnId)) {
            $w(settings.submitBtnId).onClick(() => {
                if (validateCurrentState()) {
                    collectStateData();
                    handleSubmit();
                }
            });
        }
    }

    /**
     * Update the multi-state box to show the specified state
     * @private
     * @param {number} stateIndex - Index of the state to show
     */
    function updateState(stateIndex) {
        if (stateIndex < 0 || stateIndex >= states.length) {
            console.error(`Invalid state index: ${stateIndex}`);
            return;
        }
        
        // Change multi-state box state
        $w(settings.multiStateBoxId).changeState(states[stateIndex]);
        
        // Update current state index
        currentStateIndex = stateIndex;
        
        // Update progress bar if configured
        updateProgress();
    }

    /**
     * Navigate to the next state
     * @private
     */
    function goToNextState() {
        if (currentStateIndex < states.length - 1) {
            updateState(currentStateIndex + 1);
        }
    }

    /**
     * Navigate to the previous state
     * @private
     */
    function goToPreviousState() {
        if (currentStateIndex > 0) {
            updateState(currentStateIndex - 1);
        }
    }

    /**
     * Update the progress bar based on current state
     * @private
     */
    function updateProgress() {
        if (settings.progressBarId && $w(settings.progressBarId)) {
            const progressPercentage = ((currentStateIndex + 1) / states.length) * 100;
            $w(settings.progressBarId).value = progressPercentage;
        }
    }

    /**
     * Validate all inputs in the current state
     * @private
     * @returns {boolean} - Whether all inputs are valid
     */
    function validateCurrentState() {
        const currentState = states[currentStateIndex];
        
        // Get inputs for the current state
        const stateInputs = inputMap[currentState] || [];
        
        // Check validation for all inputs
        for (const inputId of stateInputs) {
            const inputElement = $w(`#${inputId}`);
            
            // Skip if element doesn't exist
            if (!inputElement) {
                console.warn(`Input element #${inputId} not found`);
                continue;
            }
            
            // Check basic validation (for standard inputs)
            if (typeof inputElement.valid === 'boolean' && !inputElement.valid) {
                return false;
            }
            
            // Special case for upload buttons (check if files were uploaded)
            if (inputElement.type === 'UploadButton' && inputElement.value.length === 0) {
                return false;
            }
            
            // Apply custom validation if defined for this input
            if (validationFunctions[inputId] && !validationFunctions[inputId](inputElement.value, inputElement)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Collect data from inputs in the current state
     * @private
     */
    function collectStateData() {
        const currentState = states[currentStateIndex];
        
        // Get inputs for the current state
        const stateInputs = inputMap[currentState] || [];
        
        // Collect values from all inputs
        for (const inputId of stateInputs) {
            const inputElement = $w(`#${inputId}`);
            
            // Skip if element doesn't exist
            if (!inputElement) {
                continue;
            }
            
            // Store the input value
            formData[inputId] = inputElement.value;
        }
    }

    /**
     * Handle form submission
     * @private
     */
    function handleSubmit() {
        // Call custom onSubmit handler if provided
        if (typeof settings.onSubmit === 'function') {
            settings.onSubmit(formData);
            return;
        }
        
        // Default behavior: Insert data to collection if specified
        if (settings.collection) {
            wixData.insert(settings.collection, formData)
                .then((result) => {
                    console.log("Form data saved successfully:", result);
                    // Reset form after successful submission if needed
                    if (settings.resetOnSubmit) {
                        resetForm();
                    }
                })
                .catch((error) => {
                    console.error("Error saving form data:", error);
                });
        }
    }

    /**
     * Reset the form to its initial state
     * @private
     */
    function resetForm() {
        // Clear collected data
        formData = {};
        
        // Return to first state
        updateState(0);
        
        // Clear all inputs
        for (const state in inputMap) {
            for (const inputId of inputMap[state]) {
                const inputElement = $w(`#${inputId}`);
                if (inputElement && typeof inputElement.value !== 'undefined') {
                    // Reset based on input type
                    if (inputElement.type === 'UploadButton') {
                        // Can't directly reset upload button
                    } else if (Array.isArray(inputElement.value)) {
                        inputElement.value = [];
                    } else if (typeof inputElement.value === 'string') {
                        inputElement.value = '';
                    } else if (typeof inputElement.value === 'boolean') {
                        inputElement.value = false;
                    }
                }
            }
        }
    }

    // Public API
    const controller = {
        /**
         * Navigate to a specific state by index
         * @param {number} stateIndex - Index of the state to navigate to
         */
        goToState: function(stateIndex) {
            updateState(stateIndex);
        },
        
        /**
         * Get the current state index
         * @returns {number} - Current state index
         */
        getCurrentStateIndex: function() {
            return currentStateIndex;
        },
        
        /**
         * Get the collected form data
         * @returns {Object} - Collected form data
         */
        getFormData: function() {
            return { ...formData };
        },
        
        /**
         * Add a custom validation function for an input
         * @param {string} inputId - ID of the input element
         * @param {function} validationFn - Validation function that returns boolean
         */
        addValidation: function(inputId, validationFn) {
            validationFunctions[inputId] = validationFn;
        },
        
        /**
         * Reset the form to its initial state
         */
        reset: resetForm,
        
        /**
         * Manually trigger form validation
         * @returns {boolean} - Whether all inputs are valid
         */
        validate: validateCurrentState,
        
        /**
         * Add additional form data that might not be tied to specific inputs
         * @param {Object} data - Additional data to add to form submission
         */
        addFormData: function(data) {
            formData = { ...formData, ...data };
        }
    };
    
    // Initialize the controller
    initialize();
    
    return controller;
}

/**
 * Set up input validation for changing button state based on field validity
 * 
 * @param {string} buttonId - ID of the button to enable/disable
 * @param {string[]} inputIds - Array of input IDs to validate
 * @param {function} [customValidation] - Optional custom validation function
 */
export function setupInputValidation(buttonId, inputIds, customValidation) {
    // Initial validation
    validateAndUpdateButton();
    
    // Add event listeners to all inputs
    for (const inputId of inputIds) {
        if ($w(`#${inputId}`)) {
            $w(`#${inputId}`).onInput(() => validateAndUpdateButton());
            $w(`#${inputId}`).onChange(() => validateAndUpdateButton());
        }
    }
    
    /**
     * Validate all inputs and update button state
     * @private
     */
    function validateAndUpdateButton() {
        const allValid = checkValidity();
        
        if (allValid) {
            $w(buttonId).enable();
        } else {
            $w(buttonId).disable();
        }
    }
    
    /**
     * Check validity of all inputs
     * @private
     * @returns {boolean} - Whether all inputs are valid
     */
    function checkValidity() {
        // If custom validation function is provided, use it
        if (typeof customValidation === 'function') {
            return customValidation();
        }
        
        // Standard validation
        for (const inputId of inputIds) {
            const input = $w(`#${inputId}`);
            
            // Skip if element doesn't exist
            if (!input) {
                continue;
            }
            
            // Check validation for standard inputs
            if (typeof input.valid === 'boolean' && !input.valid) {
                return false;
            }
            
            // Special case for upload buttons (check if files were uploaded)
            if (input.type === 'UploadButton' && input.value.length === 0) {
                return false;
            }
        }
        
        return true;
    }
}

/**
 * Display an error message for a specified duration
 * 
 * @param {string} messageId - ID of the text element to display the message
 * @param {string} message - Message to display
 * @param {number} [duration=5000] - Duration in milliseconds to display the message
 */
export function showErrorMessage(messageId, message, duration = 5000) {
    if (!$w(`#${messageId}`)) {
        console.error(`Error message element #${messageId} not found`);
        return;
    }
    
    $w(`#${messageId}`).text = message;
    $w(`#${messageId}`).expand();
    
    setTimeout(() => {
        $w(`#${messageId}`).collapse();
    }, duration);
}

/**
 * Display a success message for a specified duration
 * 
 * @param {string} messageId - ID of the text element to display the message
 * @param {string} message - Message to display
 * @param {number} [duration=5000] - Duration in milliseconds to display the message
 */
export function showSuccessMessage(messageId, message, duration = 5000) {
    if (!$w(`#${messageId}`)) {
        console.error(`Success message element #${messageId} not found`);
        return;
    }
    
    $w(`#${messageId}`).text = message;
    $w(`#${messageId}`).expand();
    
    setTimeout(() => {
        $w(`#${messageId}`).collapse();
    }, duration);
}