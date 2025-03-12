/**
 * Multi-State Box Form Implementation Example
 * 
 * This example shows how to use the multi-state-handler module
 * to create a multi-step form with validation and submission.
 */

import { initMultiStateBox, setupInputValidation, showSuccessMessage, showErrorMessage } from 'public/multi-state-handler';

// Import wixData for database operations
import wixData from 'wix-data';

// Initialize when the page is ready
$w.onReady(function () {
    // Define state names for your multi-state box
    // These should match the state names in your multi-state box element
    const stateNames = [
        "PERSONAL_INFO_STATE",
        "CONTACT_INFO_STATE",
        "DOCUMENT_UPLOAD_STATE",
        "REVIEW_STATE"
    ];
    
    // Map input elements to each state
    const inputMappings = {
        "PERSONAL_INFO_STATE": [
            "firstNameInp", 
            "lastNameInp", 
            "dobInp"
        ],
        "CONTACT_INFO_STATE": [
            "emailInp", 
            "phoneInp", 
            "addressInp"
        ],
        "DOCUMENT_UPLOAD_STATE": [
            "idUpload", 
            "photoUpload"
        ],
        "REVIEW_STATE": [] // No inputs in review state
    };
    
    // Initialize the multi-state box handler
    const multiStateForm = initMultiStateBox({
        multiStateBoxId: "#formMultiStateBox", // ID of your multi-state box
        progressBarId: "#formProgressBar",     // ID of your progress bar
        nextBtnPrefix: "btnNext",              // Prefix for next buttons
        prevBtnPrefix: "btnPrev",              // Prefix for previous buttons
        submitBtnId: "submitBtn",              // ID of submit button
        stateNames: stateNames,                // State names array
        inputMappings: inputMappings,          // Input mappings
        collection: "Applications",            // Database collection for submission
        resetOnSubmit: true                    // Reset form after submission
    });
    
    // Add custom validation for specific inputs
    multiStateForm.addValidation("phoneInp", (value, element) => {
        // Custom phone validation (example)
        const phoneRegex = /^\d{10}$/;
        const isValid = phoneRegex.test(value);
        
        if (!isValid) {
            element.validationMessage = "Please enter a valid 10-digit phone number";
        }
        
        return isValid;
    });
    
    // Set up validation for each state's next button
    setupInputValidation("#btnNext1", inputMappings["PERSONAL_INFO_STATE"]);
    setupInputValidation("#btnNext2", inputMappings["CONTACT_INFO_STATE"]);
    setupInputValidation("#btnNext3", inputMappings["DOCUMENT_UPLOAD_STATE"]);
    
    // Custom handling for submit button (optional)
    $w("#submitBtn").onClick(() => {
        if (multiStateForm.validate()) {
            const formData = multiStateForm.getFormData();
            
            // Add additional data not tied to specific inputs
            multiStateForm.addFormData({
                "submissionDate": new Date(),
                "status": "Pending"
            });
            
            // Custom submission logic (example)
            wixData.insert("Applications", formData)
                .then((result) => {
                    showSuccessMessage("successMsg", "Your application has been submitted successfully!");
                    multiStateForm.reset();
                })
                .catch((error) => {
                    showErrorMessage("errorMsg", "There was an error submitting your application. Please try again.");
                    console.error("Form submission error:", error);
                });
        }
    });
    
    // Handle displaying uploaded files in review state
    $w("#formMultiStateBox").onChange((event) => {
        // Update review page with collected data when reaching the review state
        if (event.target.currentState === "REVIEW_STATE") {
            updateReviewPage(multiStateForm.getFormData());
        }
    });
});

/**
 * Update the review page with collected form data
 * @param {Object} formData - Collected form data
 */
function updateReviewPage(formData) {
    // Display personal information
    $w("#reviewNameText").text = `${formData.firstNameInp} ${formData.lastNameInp}`;
    $w("#reviewDobText").text = formData.dobInp;
    
    // Display contact information
    $w("#reviewEmailText").text = formData.emailInp;
    $w("#reviewPhoneText").text = formData.phoneInp;
    $w("#reviewAddressText").text = formData.addressInp;
    
    // Display document information
    if (formData.idUpload && formData.idUpload.length > 0) {
        $w("#reviewIdText").text = `ID document uploaded: ${formData.idUpload[0].name}`;
    }
    
    if (formData.photoUpload && formData.photoUpload.length > 0) {
        $w("#reviewPhotoText").text = `Photo uploaded: ${formData.photoUpload[0].name}`;
    }
}