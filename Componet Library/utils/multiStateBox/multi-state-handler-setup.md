# Multi-State Box Handler Setup Guide

This guide explains how to set up and use the Multi-State Box Handler module for creating multi-step forms in Wix.

## Table of Contents

1. [Wix Editor Setup](#wix-editor-setup)
2. [Setting Up Your Multi-State Box](#setting-up-your-multi-state-box)
3. [Configuring the Multi-State Handler](#configuring-the-multi-state-handler)
4. [Adding Validation](#adding-validation)
5. [Customizing the Submission Process](#customizing-the-submission-process)
6. [Troubleshooting](#troubleshooting)

## Wix Editor Setup

Before coding, you need to set up elements in the Wix Editor:

1. **Add a Multi-State Box**:
   - Add a multi-state box element to your page
   - Create states for each form step (follow naming convention: `STATE_NAME_STATE`)
   - Design each state with appropriate input fields and buttons

2. **Create Navigation Buttons**:
   - Add "Next" buttons to each state (except the last)
   - Name them following the pattern: `btnNext1`, `btnNext2`, etc.
   - Add "Previous" buttons to each state (except the first)
   - Name them following the pattern: `btnPrev2`, `btnPrev3`, etc.
   - Add a "Submit" button to the final state

3. **Add a Progress Bar**:
   - Add a progress bar element to show form completion progress
   - Set its initial value to match first step percentage (e.g., 25% for 4 states)

4. **Add Message Elements**:
   - Add text elements for success and error messages
   - Set them to collapsed by default

5. **Ensure Proper Element IDs**:
   - Use the Wix Freaks naming convention for all elements:
     - Inputs: `firstNameInp`, `emailInp`, etc.
     - Buttons: `submitBtn`, etc.
     - Text elements: `errorMsgText`, `successMsgText`, etc.

## Setting Up Your Multi-State Box

In your page code, import and configure the multi-state handler:

```javascript
import { initMultiStateBox, setupInputValidation, showSuccessMessage, showErrorMessage } from 'public/multi-state-handler';

$w.onReady(function () {
    // Define state names
    const stateNames = [
        "PERSONAL_INFO_STATE",
        "CONTACT_INFO_STATE",
        "DOCUMENT_UPLOAD_STATE",
        "REVIEW_STATE"
    ];
    
    // Map inputs to states
    const inputMappings = {
        "PERSONAL_INFO_STATE": ["firstNameInp", "lastNameInp"],
        "CONTACT_INFO_STATE": ["emailInp", "phoneInp"],
        "DOCUMENT_UPLOAD_STATE": ["documentUpload"],
        "REVIEW_STATE": []
    };
    
    // Initialize multi-state handler
    const multiStateForm = initMultiStateBox({
        multiStateBoxId: "#formMultiStateBox",
        progressBarId: "#formProgressBar",
        nextBtnPrefix: "btnNext",
        prevBtnPrefix: "btnPrev",
        submitBtnId: "submitBtn",
        stateNames: stateNames,
        inputMappings: inputMappings,
        collection: "FormSubmissions",
        resetOnSubmit: true
    });
}
```

## Adding Validation

Set up validation for each state's inputs:

```javascript
// Set up validation for each state
setupInputValidation("#btnNext1", inputMappings["PERSONAL_INFO_STATE"]);
setupInputValidation("#btnNext2", inputMappings["CONTACT_INFO_STATE"]);
setupInputValidation("#btnNext3", inputMappings["DOCUMENT_UPLOAD_STATE"]);

// Add custom validation for specific inputs
multiStateForm.addValidation("phoneInp", (value, element) => {
    const phoneRegex = /^\d{10}$/;
    const isValid = phoneRegex.test(value);
    
    if (!isValid) {
        element.validationMessage = "Please enter a valid 10-digit phone number";
    }
    
    return isValid;
});
```

## Customizing the Submission Process

Override the default submission process if needed:

```javascript
// Custom submission handler
$w("#submitBtn").onClick(() => {
    if (multiStateForm.validate()) {
        const formData = multiStateForm.getFormData();
        
        // Add additional data
        multiStateForm.addFormData({
            "submissionDate": new Date(),
            "status": "Pending"
        });
        
        // Custom submission logic
        wixData.insert("Applications", formData)
            .then((result) => {
                showSuccessMessage("successMsg", "Your form has been submitted successfully!");
                multiStateForm.reset();
            })
            .catch((error) => {
                showErrorMessage("errorMsg", "There was an error submitting your form. Please try again.");
            });
    }
});
```

## Setting Up Review State

If you have a review state, update it with collected data:

```javascript
// Handle displaying collected data in review state
$w("#formMultiStateBox").onChange((event) => {
    if (event.target.currentState === "REVIEW_STATE") {
        updateReviewPage(multiStateForm.getFormData());
    }
});

function updateReviewPage(formData) {
    $w("#reviewNameText").text = `${formData.firstNameInp} ${formData.lastNameInp}`;
    $w("#reviewEmailText").text = formData.emailInp;
    // Update other review fields...
}
```

## Troubleshooting

Common issues and solutions:

1. **Next button not enabling**:
   - Check that all required inputs have proper validation rules
   - Ensure input IDs in the inputMappings match the actual element IDs
   - Check browser console for any JavaScript errors

2. **Form not progressing to next state**:
   - Verify state names match exactly with the multi-state box states
   - Check that button IDs follow the naming convention

3. **Data not being collected**:
   - Ensure input elements are properly mapped to states
   - Check that input values are being properly set and captured

4. **Upload button validation not working**:
   - For upload buttons, validation checks if files were uploaded (length > 0)
   - Make sure upload button has proper permissions and settings

5. **Form submission issues**:
   - Check that the collection name exists and is spelled correctly
   - Verify that the form data structure matches the collection schema
   - Check browser console for any database insertion errors
