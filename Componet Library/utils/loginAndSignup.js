import { authentication } from "wix-members-frontend";
import wixLocationFrontend from 'wix-location-frontend';
import wixData from 'wix-data';
import { assignRoleFunction } from "backend/assignRole.jsw"
export function login(
    email,
    password,
    url = "/",
    successMSgId = '#successMessage',
    succResp = { message: "Signup successful!" },
    errResp = { message: "Signup failed!" },
    errMSgId = '#errorMessage',
    buttonId = '#submitButton',
    loaderId = '#loader',
) {
    $w(buttonId).onClick(async () => {
        authentication
            .login(email, password)
            .then(() => {
                console.log("Member is logged in");
                if (url !== "") {
                    wixLocationFrontend.to(url)
                }
                // Hide the loader
                $w(loaderId).hide();

                // Display the success message
                if (!$w(successMSgId)) {
                    console.log("Error: Success Message element not found");
                    return;
                }
                $w(successMSgId).text = succResp.message;
                $w(successMSgId).expand();

                // Collapse the success message after 5 seconds
                setTimeout(() => {
                    $w(successMSgId).text = "Oops, something has gone wrong";
                    $w(successMSgId).collapse();
                }, 5000);

            })
            .catch((error) => {
                console.error(error);
                $w(loaderId).hide();

                // Display the error message
                if (!$w(errMSgId)) {
                    console.log("Error: Error Message element not found");
                    return;
                }
                $w(errMSgId).text = errResp.message;
                $w(errMSgId).expand();

                // Collapse the error message after 5 seconds
                setTimeout(() => {
                    $w(errMSgId).text = "Oops, something has gone wrong";
                    $w(errMSgId).collapse();
                }, 5000);
            });
    })
}

export function signup(
    email,
    password,
    options = {},
    successMSgId = '#successMessage',
    succResp = { message: "Signup successful!" },
    errResp = { message: "Signup failed!" },
    errMSgId = '#errorMessage',
    buttonId = '#submitButton',
    loaderId = '#loader',
    addToDatabase = false,
    collectionName = 'Members',
    insertParameters = {},
    addRole = false,
    roleId = ''
) {
    // Register the user with the provided email, password, and options
    authentication
        .register(email, password, options)
        .then((registrationResult) => {
            // Set up a click event listener for the button
            $w(buttonId).onClick(async () => {
                // Show the loader
                $w(loaderId).show();

                const status = registrationResult.status;

                // Handle pending approval status
                if (status === "PENDING") {
                    const approvalToken = registrationResult.approvalToken;
                    console.log(
                        "Member registered and waiting for approval:",
                        registrationResult,
                    );
                } else {
                    // Member successfully registered and logged in
                    console.log("Member registered and logged in:", registrationResult);

                    // Optionally add the member's data to a database
                    if (addToDatabase) {
                        insertData(collectionName, insertParameters);
                    }

                    // Optionally assign a role to the registered member
                    if (addRole) {
                        await assignRoleFunction(roleId, registrationResult.member._id);
                    }

                    // Hide the loader
                    $w(loaderId).hide();

                    // Display the success message
                    if (!$w(successMSgId)) {
                        console.log("Error: Success Message element not found");
                        return;
                    }
                    $w(successMSgId).text = succResp.message;
                    $w(successMSgId).expand();

                    // Collapse the success message after 5 seconds
                    setTimeout(() => {
                        $w(successMSgId).text = "Oops, something has gone wrong";
                        $w(successMSgId).collapse();
                    }, 5000);
                }
            });
        })
        .catch((error) => {
            // Handle registration errors
            console.error(error);
            $w(loaderId).hide();

            // Display the error message
            if (!$w(errMSgId)) {
                console.log("Error: Error Message element not found");
                return;
            }
            $w(errMSgId).text = errResp.message;
            $w(errMSgId).expand();

            // Collapse the error message after 5 seconds
            setTimeout(() => {
                $w(errMSgId).text = "Oops, something has gone wrong";
                $w(errMSgId).collapse();
            }, 5000);
        });
}

// Helper function to insert data into a specified database collection
function insertData(collectionName, insertData) {
    wixData.insert(collectionName, insertData)
        .then((item) => {
            console.log(item); // Log the inserted item
        })
        .catch((err) => {
            console.log(err); // Log any errors that occur during insertion
        });
}