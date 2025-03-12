function showErrMsg(
    errMSgId = 'errMsg', 
    errResp = { message: 'An error occurred' }
) {
    // Check if the error message element exists
    if (!$w(`#${errMSgId}`)) {
        console.log("Error Message element not found");
        return;
    }

    // Display the error message
    $w(`#${errMSgId}`).text = errResp.message;
    $w(`#${errMSgId}`).expand();

    // After 5 seconds, reset the message and hide the element
    setTimeout(() => {
        $w(`#${errMSgId}`).text = "Oops, something has gone wrong";
        $w(`#${errMSgId}`).collapse();
    }, 5000);
}


function showSuccessMsg(
    successMSgId = 'successMsg', 
    succResp = { message: 'Operation successful' }
) {
    // Check if the success message element exists
    if (!$w(`#${successMSgId}`)) {
        console.log("Error Message element not found");
        return;
    }

    // Display the success message
    $w(`#${successMSgId}`).text = succResp.message;
    $w(`#${successMSgId}`).expand();

    // After 5 seconds, reset the message and hide the element
    setTimeout(() => {
        $w(`#${successMSgId}`).text = "Oops, something has gone wrong";
        $w(`#${successMSgId}`).collapse();
    }, 5000);
}

/**
 * Attaches input and change event listeners to a list of text fields.
 * 
 * @param {Array<string>} fieldIds - An array of IDs for the text fields to check. Default is an empty array [].
 * 
 * @returns {void}
 */
function checkInputTextFields(fieldIds = []) {
    // Iterate through each field ID provided
    for (let i = 0; i < fieldIds.length; i++) {
        if ($w(`#${fieldIds[i]}`)) {
            // Add an event listener for input events
            $w(`#${fieldIds[i]}`).onInput((event) => {
                if (checkValidity(fieldIds) && $w('#chkBoxMLOCComm').checked) {
                    $w('#btnNext1').enable();
                } else {
                    $w('#btnNext1').disable();
                }
            });

            // Add an event listener for change events
            $w(`#${fieldIds[i]}`).onChange((event) => {
                if (checkValidity(fieldIds) && $w('#chkBoxMLOCComm').checked) {
                    $w('#btnNext1').enable();
                } else {
                    $w('#btnNext1').disable();
                }
            });
        }
    }
}


function checkValidity(fieldIds = []) {
    // Iterate through each field ID provided
    for (let i = 0; i < fieldIds.length; i++) {
        // If the field exists and is not valid, return false
        if ($w(`#${fieldIds[i]}`) && !($w(`#${fieldIds[i]}`).valid)) {
            return false;
        }
    }

    // If all fields are valid, return true
    return true;
}
