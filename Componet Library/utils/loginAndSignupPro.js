import { authentication } from "wix-members-frontend";
import wixLocationFrontend from 'wix-location-frontend';
import wixData from 'wix-data';
import wixWindowFrontend from 'wix-window-frontend';
import wixStorage from 'wix-storage';

/**
 * Enhanced login function with comprehensive error handling and UI feedback
 * 
 * @param {string} emailFieldId - ID of the email input field
 * @param {string} passwordFieldId - ID of the password input field
 * @param {string} [redirectUrl="/"] - URL to redirect after successful login
 * @param {string} [successMsgId="#successMessage"] - ID of success message element
 * @param {Object} [successResponse={ message: "Login successful!" }] - Success message object
 * @param {string} [errorMsgId="#errorMessage"] - ID of error message element
 * @param {Object} [errorResponse={ message: "Login failed. Please check your credentials." }] - Error message object
 * @param {string} [buttonId="#submitButton"] - ID of the login button
 * @param {string} [loaderId="#loader"] - ID of the loader element
 * @param {boolean} [rememberMe=false] - Whether to remember login credentials
 * @param {string} [rememberMeId="#rememberMe"] - ID of remember me checkbox
 * @param {Function} [onSuccess=null] - Callback function to execute on successful login
 * @param {Function} [onError=null] - Callback function to execute on login error
 */
export function enhancedLogin({
    emailFieldId = '#email',
    passwordFieldId = '#password',
    redirectUrl = "/",
    successMsgId = '#successMessage',
    successResponse = { message: "Login successful!" },
    errorMsgId = '#errorMessage',
    errorResponse = { message: "Login failed. Please check your credentials." },
    buttonId = '#submitButton',
    loaderId = '#loader',
    rememberMe = false,
    rememberMeId = '#rememberMe',
    onSuccess = null,
    onError = null
}) {
    // Setup button click event
    $w(buttonId).onClick(async () => {
        try {
            // Input validation
            if (!validateLoginInputs(emailFieldId, passwordFieldId)) {
                return;
            }

            // Show loader
            if ($w(loaderId)) {
                $w(loaderId).show();
            }

            // Disable button during login attempt
            $w(buttonId).disable();

            // Get email and password values
            const email = $w(emailFieldId).value;
            const password = $w(passwordFieldId).value;

            // Check for remember me
            const shouldRemember = rememberMe && $w(rememberMeId) ? $w(rememberMeId).checked : false;

            // Attempt login
            const loginResult = await authentication.login(email, password);
            
            // Handle successful login
            console.log("Member logged in successfully:", loginResult);
            
            // Store credentials if remember me is checked
            if (shouldRemember) {
                storeCredentials(email, password);
            }

            // Show success message
            showSuccessMessage(successMsgId, successResponse.message);
            
            // Execute success callback if provided
            if (typeof onSuccess === 'function') {
                onSuccess(loginResult);
            }

            // Redirect after success
            if (redirectUrl) {
                setTimeout(() => {
                    wixLocationFrontend.to(redirectUrl);
                }, 1500);
            }
        } catch (error) {
            // Handle login error
            console.error("Login error:", error);
            
            // Show error message
            const errorMsg = getLoginErrorMessage(error);
            showErrorMessage(errorMsgId, errorMsg || errorResponse.message);
            
            // Execute error callback if provided
            if (typeof onError === 'function') {
                onError(error);
            }
        } finally {
            // Hide loader
            if ($w(loaderId)) {
                $w(loaderId).hide();
            }
            
            // Re-enable button
            $w(buttonId).enable();
        }
    });

    // Initialize remember me functionality
    if (rememberMe && $w(rememberMeId)) {
        initializeRememberMe(emailFieldId, passwordFieldId, rememberMeId);
    }
}

/**
 * Enhanced signup function with comprehensive validation and error handling
 * 
 * @param {Object} options - Configuration options for signup
 * @param {string} options.emailFieldId - ID of the email input field
 * @param {string} options.passwordFieldId - ID of the password input field
 * @param {string} [options.confirmPasswordFieldId] - ID of the confirm password field
 * @param {Object} [options.contactInfo={}] - Additional contact info fields for registration
 * @param {string} [options.redirectUrl="/"] - URL to redirect after successful signup
 * @param {string} [options.successMsgId="#successMessage"] - ID of success message element
 * @param {Object} [options.successResponse={ message: "Signup successful!" }] - Success message object
 * @param {string} [options.errorMsgId="#errorMessage"] - ID of error message element
 * @param {Object} [options.errorResponse={ message: "Signup failed!" }] - Error message object
 * @param {string} [options.buttonId="#submitButton"] - ID of the signup button
 * @param {string} [options.loaderId="#loader"] - ID of the loader element
 * @param {boolean} [options.termsRequired=false] - Whether to require terms acceptance
 * @param {string} [options.termsCheckboxId="#termsCheckbox"] - ID of terms acceptance checkbox
 * @param {string} [options.termsErrorMsg="You must accept the terms and conditions"] - Error message for terms not accepted
 * @param {boolean} [options.addToDatabase=false] - Whether to add user info to a database
 * @param {string} [options.collectionName="Members"] - Collection name for database storage
 * @param {Object} [options.dataMapping={}] - Field mapping for database storage
 * @param {boolean} [options.assignRole=false] - Whether to assign a role after signup
 * @param {string} [options.roleId=""] - Role ID to assign
 * @param {Function} [options.onSuccess=null] - Callback function on successful signup
 * @param {Function} [options.onError=null] - Callback function on signup error
 * @param {Function} [options.validatePassword=null] - Custom password validation function
 */
export function enhancedSignup(options) {
    // Default configuration
    const config = {
        emailFieldId: '#email',
        passwordFieldId: '#password',
        confirmPasswordFieldId: '#confirmPassword',
        contactInfo: {},
        redirectUrl: "/",
        successMsgId: '#successMessage',
        successResponse: { message: "Signup successful!" },
        errorMsgId: '#errorMessage',
        errorResponse: { message: "Signup failed!" },
        buttonId: '#submitButton',
        loaderId: '#loader',
        termsRequired: false,
        termsCheckboxId: '#termsCheckbox',
        termsErrorMsg: "You must accept the terms and conditions",
        addToDatabase: false,
        collectionName: "Members",
        dataMapping: {},
        assignRole: false,
        roleId: "",
        onSuccess: null,
        onError: null,
        validatePassword: null,
        ...options
    };

    // Setup button click event
    $w(config.buttonId).onClick(async () => {
        try {
            // Basic validation
            if (!validateSignupInputs(config)) {
                return;
            }

            // Show loader
            if ($w(config.loaderId)) {
                $w(config.loaderId).show();
            }

            // Disable button during signup process
            $w(config.buttonId).disable();

            // Get form values
            const email = $w(config.emailFieldId).value;
            const password = $w(config.passwordFieldId).value;
            
            // Prepare contact info
            const contactInfo = prepareContactInfo(config.contactInfo);
            
            // Register options
            const registerOptions = {
                contactInfo: contactInfo,
                privacyStatus: "PUBLIC"
            };

            // Attempt registration
            const registrationResult = await authentication.register(email, password, registerOptions);

            // Handle different registration statuses
            if (registrationResult.status === "PENDING") {
                const approvalToken = registrationResult.approvalToken;
                console.log("Member registered and waiting for approval:", approvalToken);
                showSuccessMessage(config.successMsgId, "Registration complete. Please wait for approval.");
            } else {
                console.log("Member registered and logged in:", registrationResult);
                
                // Add to database if required
                if (config.addToDatabase) {
                    await addUserToDatabase(registrationResult.member, config.collectionName, config.dataMapping);
                }
                
                // Assign role if required
                if (config.assignRole && config.roleId) {
                    try {
                        await assignRoleToMember(config.roleId, registrationResult.member._id);
                    } catch (roleError) {
                        console.error("Error assigning role:", roleError);
                    }
                }
                
                // Show success message
                showSuccessMessage(config.successMsgId, config.successResponse.message);
                
                // Execute success callback if provided
                if (typeof config.onSuccess === 'function') {
                    config.onSuccess(registrationResult);
                }
                
                // Redirect after success
                if (config.redirectUrl) {
                    setTimeout(() => {
                        wixLocationFrontend.to(config.redirectUrl);
                    }, 1500);
                }
            }
        } catch (error) {
            console.error("Signup error:", error);
            
            // Parse and show specific error message
            const errorMsg = getSignupErrorMessage(error);
            showErrorMessage(config.errorMsgId, errorMsg || config.errorResponse.message);
            
            // Execute error callback if provided
            if (typeof config.onError === 'function') {
                config.onError(error);
            }
        } finally {
            // Hide loader
            if ($w(config.loaderId)) {
                $w(config.loaderId).hide();
            }
            
            // Re-enable button
            $w(config.buttonId).enable();
        }
    });
}

/**
 * Social login function for authentication via social providers
 * 
 * @param {string} provider - Social provider ('facebook', 'google', 'apple')
 * @param {string} [buttonId="#socialButton"] - ID of the social login button
 * @param {string} [redirectUrl="/"] - URL to redirect after successful login
 * @param {Function} [onSuccess=null] - Callback function to execute on successful login
 * @param {Function} [onError=null] - Callback function to execute on login error
 */
// Add social login function later
// export function socialLogin(provider, buttonId = '#socialButton', redirectUrl = "/", onSuccess = null, onError = null) {
//     $w(buttonId).onClick(async () => {
//         try {
//             let socialProvider;
            
//             // Determine social provider
//             switch(provider.toLowerCase()) {
//                 case 'facebook':
//                     socialProvider = authentication.LOGIN_PROVIDER.FACEBOOK;
//                     break;
//                 case 'google':
//                     socialProvider = authentication.LOGIN_PROVIDER.GOOGLE;
//                     break;
//                 case 'apple':
//                     socialProvider = authentication.LOGIN_PROVIDER.APPLE;
//                     break;
//                 default:
//                     throw new Error(`Unsupported social provider: ${provider}`);
//             }
            
//             // Initiate social login
//             const loginResult = await authentication.login(socialProvider);
//             console.log(`${provider} login successful:`, loginResult);
            
//             // Execute success callback if provided
//             if (typeof onSuccess === 'function') {
//                 onSuccess(loginResult);
//             }
            
//             // Redirect after success
//             if (redirectUrl) {
//                 wixLocationFrontend.to(redirectUrl);
//             }
//         } catch (error) {
//             console.error(`${provider} login error:`, error);
            
//             // Execute error callback if provided
//             if (typeof onError === 'function') {
//                 onError(error);
//             }
//         }
//     });
// }

/**
 * Password reset function
 * 
 * @param {string} emailFieldId - ID of the email input field
 * @param {string} [buttonId="#resetButton"] - ID of the reset button
 * @param {string} [successMsgId="#successMessage"] - ID of success message element
 * @param {string} [errorMsgId="#errorMessage"] - ID of error message element
 * @param {string} [loaderId="#loader"] - ID of the loader element
 */
export function passwordReset(emailFieldId, buttonId = '#resetButton', successMsgId = '#successMessage', errorMsgId = '#errorMessage', loaderId = '#loader') {
    $w(buttonId).onClick(async () => {
        try {
            const email = $w(emailFieldId).value;
            
            // Validate email
            if (!email || !isValidEmail(email)) {
                showErrorMessage(errorMsgId, "Please enter a valid email address");
                return;
            }
            
            // Show loader
            if ($w(loaderId)) {
                $w(loaderId).show();
            }
            
            // Disable button during request
            $w(buttonId).disable();
            
            // Request password reset
            await authentication.sendResetPasswordEmail(email);
            
            // Show success message
            showSuccessMessage(successMsgId, "Password reset email has been sent. Please check your inbox.");
        } catch (error) {
            console.error("Password reset error:", error);
            
            // Show error message
            showErrorMessage(errorMsgId, "Failed to send password reset email. Please try again later.");
        } finally {
            // Hide loader
            if ($w(loaderId)) {
                $w(loaderId).hide();
            }
            
            // Re-enable button
            $w(buttonId).enable();
        }
    });
}

/**
 * Logout function with redirect
 * 
 * @param {string} [buttonId="#logoutButton"] - ID of the logout button
 * @param {string} [redirectUrl="/"] - URL to redirect after successful logout
 * @param {Function} [onBeforeLogout=null] - Callback before logout
 * @param {Function} [onAfterLogout=null] - Callback after logout
 */
export function logout(buttonId = '#logoutButton', redirectUrl = "/", onBeforeLogout = null, onAfterLogout = null) {
    $w(buttonId).onClick(async () => {
        try {
            // Execute before logout callback if provided
            if (typeof onBeforeLogout === 'function') {
                await onBeforeLogout();
            }
            
            // Clear any stored credentials
            clearStoredCredentials();
            
            // Perform logout
            await authentication.logout();
            console.log("Logout successful");
            
            // Execute after logout callback if provided
            if (typeof onAfterLogout === 'function') {
                onAfterLogout();
            }
            
            // Redirect after logout
            if (redirectUrl) {
                wixLocationFrontend.to(redirectUrl);
            }
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

/**
 * Set up automatic login using stored credentials
 * 
 * @param {string} emailFieldId - ID of the email field
 * @param {string} passwordFieldId - ID of the password field
 * @param {string} [buttonId="#loginButton"] - ID of the login button
 * @param {boolean} [autoSubmit=false] - Whether to automatically submit the login form
 */
export function autoLogin(emailFieldId, passwordFieldId, buttonId = '#loginButton', autoSubmit = false) {
    // Check for stored credentials
    const credentials = getStoredCredentials();
    
    if (credentials) {
        // Fill in the form fields
        $w(emailFieldId).value = credentials.email;
        $w(passwordFieldId).value = credentials.password;
        
        // Auto-submit if requested
        if (autoSubmit) {
            setTimeout(() => {
                $w(buttonId).click();
            }, 500);
        }
    }
}

// ------------------- HELPER FUNCTIONS -------------------

/**
 * Validate login form inputs
 */
function validateLoginInputs(emailFieldId, passwordFieldId) {
    const email = $w(emailFieldId).value;
    const password = $w(passwordFieldId).value;
    
    let isValid = true;
    
    // Check email
    if (!email) {
        $w(emailFieldId).valid = false;
        isValid = false;
    } else if (!isValidEmail(email)) {
        $w(emailFieldId).valid = false;
        isValid = false;
    } else {
        $w(emailFieldId).valid = true;
    }
    
    // Check password
    if (!password) {
        $w(passwordFieldId).valid = false;
        isValid = false;
    } else {
        $w(passwordFieldId).valid = true;
    }
    
    return isValid;
}

/**
 * Validate signup form inputs
 */
function validateSignupInputs(config) {
    const email = $w(config.emailFieldId).value;
    const password = $w(config.passwordFieldId).value;
    const confirmPassword = config.confirmPasswordFieldId ? $w(config.confirmPasswordFieldId).value : password;
    
    let isValid = true;
    
    // Check email
    if (!email || !isValidEmail(email)) {
        $w(config.emailFieldId).valid = false;
        isValid = false;
    } else {
        $w(config.emailFieldId).valid = true;
    }
    
    // Check password
    if (!password) {
        $w(config.passwordFieldId).valid = false;
        isValid = false;
    } else {
        // Custom password validation if provided
        if (typeof config.validatePassword === 'function') {
            const validation = config.validatePassword(password);
            if (!validation.valid) {
                $w(config.passwordFieldId).valid = false;
                showErrorMessage(config.errorMsgId, validation.message);
                isValid = false;
            } else {
                $w(config.passwordFieldId).valid = true;
            }
        } else {
            // Default password validation
            if (password.length < 8) {
                $w(config.passwordFieldId).valid = false;
                showErrorMessage(config.errorMsgId, "Password must be at least 8 characters long");
                isValid = false;
            } else {
                $w(config.passwordFieldId).valid = true;
            }
        }
    }
    
    // Check password confirmation
    if (config.confirmPasswordFieldId && password !== confirmPassword) {
        $w(config.confirmPasswordFieldId).valid = false;
        showErrorMessage(config.errorMsgId, "Passwords do not match");
        isValid = false;
    } else if (config.confirmPasswordFieldId) {
        $w(config.confirmPasswordFieldId).valid = true;
    }
    
    // Check terms and conditions
    if (config.termsRequired && $w(config.termsCheckboxId) && !$w(config.termsCheckboxId).checked) {
        showErrorMessage(config.errorMsgId, config.termsErrorMsg);
        isValid = false;
    }
    
    return isValid;
}

/**
 * Prepare contact info from form fields
 */
function prepareContactInfo(contactInfoConfig) {
    const contactInfo = {};
    
    // Process each contact info field
    Object.entries(contactInfoConfig).forEach(([field, elementId]) => {
        if ($w(elementId) && $w(elementId).value) {
            if (field === 'firstName' || field === 'lastName') {
                if (!contactInfo.name) {
                    contactInfo.name = {};
                }
                contactInfo.name[field] = $w(elementId).value;
            } else if (field === 'phone') {
                contactInfo.phones = [{ 
                    phone: $w(elementId).value,
                    primary: true 
                }];
            } else {
                contactInfo[field] = $w(elementId).value;
            }
        }
    });
    
    return contactInfo;
}

/**
 * Add user to a Wix database collection
 */
async function addUserToDatabase(member, collectionName, dataMapping) {
    try {
        // Prepare data to insert
        const data = { _owner: member._id };
        
        // Map field values
        Object.entries(dataMapping).forEach(([dbField, elementId]) => {
            if (typeof elementId === 'string' && elementId.startsWith('#')) {
                // Get value from element
                if ($w(elementId) && $w(elementId).value) {
                    data[dbField] = $w(elementId).value;
                }
            } else if (typeof elementId === 'string' && elementId.startsWith('member.')) {
                // Get value from member object
                const memberField = elementId.replace('member.', '');
                const fieldParts = memberField.split('.');
                
                let value = member;
                for (const part of fieldParts) {
                    if (value && typeof value === 'object') {
                        value = value[part];
                    } else {
                        value = undefined;
                        break;
                    }
                }
                
                if (value !== undefined) {
                    data[dbField] = value;
                }
            } else {
                // Use direct value
                data[dbField] = elementId;
            }
        });
        
        // Insert data
        const result = await wixData.insert(collectionName, data);
        console.log(`User data inserted into ${collectionName}:`, result);
        return result;
    } catch (error) {
        console.error(`Error adding user to ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Assign a role to a member
 */
async function assignRoleToMember(roleId, memberId) {
    try {
        // This requires backend code to assign roles
        // We'll use a messaging mechanism to trigger backend function
        const options = {
            roleId,
            memberId
        };
        
        // This assumes you have a corresponding backend function (assignRole.jsw)
        // and have imported it at the top of this file
        return await wixWindowFrontend.invokeBackendFunction('assignRole', options);
    } catch (error) {
        console.error("Error assigning role:", error);
        throw error;
    }
}

/**
 * Show success message
 */
function showSuccessMessage(elementId, message) {
    if (!$w(elementId)) {
        console.log("Success message:", message);
        return;
    }
    
    $w(elementId).text = message;
    $w(elementId).expand();
    
    // Auto-hide after timeout
    setTimeout(() => {
        if ($w(elementId)) {
            $w(elementId).collapse();
        }
    }, 5000);
}

/**
 * Show error message
 */
function showErrorMessage(elementId, message) {
    if (!$w(elementId)) {
        console.error("Error message:", message);
        return;
    }
    
    $w(elementId).text = message;
    $w(elementId).expand();
    
    // Auto-hide after timeout
    setTimeout(() => {
        if ($w(elementId)) {
            $w(elementId).collapse();
        }
    }, 5000);
}

/**
 * Get specific error message for login errors
 */
function getLoginErrorMessage(error) {
    if (!error) return null;
    
    const errorCode = error.code || error.message;
    
    switch (errorCode) {
        case 'INVALID_EMAIL_OR_PASSWORD':
        case 'INVALID_EMAIL':
        case 'INVALID_PASSWORD':
            return "The email or password you entered is incorrect.";
        case 'TOO_MANY_ATTEMPTS':
            return "Too many failed login attempts. Please try again later or reset your password.";
        case 'USER_BLOCKED':
            return "This account has been temporarily blocked. Please contact support.";
        case 'USER_NOT_FOUND':
            return "No account found with this email. Please check your email or sign up.";
        case 'ACCOUNT_NOT_ACTIVATED':
            return "Account not activated. Please check your email and activate your account.";
        default:
            return error.message || "An error occurred during login. Please try again.";
    }
}

/**
 * Get specific error message for signup errors
 */
function getSignupErrorMessage(error) {
    if (!error) return null;
    
    const errorCode = error.code || error.message;
    
    switch (errorCode) {
        case 'EMAIL_ALREADY_EXISTS':
            return "An account with this email already exists. Please use a different email or try logging in.";
        case 'EMAIL_MALFORMED':
            return "Please enter a valid email address.";
        case 'PASSWORD_TOO_SHORT':
            return "Password must be at least 8 characters long.";
        case 'PASSWORD_TOO_WEAK':
            return "Please choose a stronger password. Include a mix of letters, numbers, and symbols.";
        case 'CAPTCHA_VERIFICATION_FAILED':
            return "CAPTCHA verification failed. Please try again.";
        default:
            return error.message || "An error occurred during signup. Please try again.";
    }
}

/**
 * Basic email validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Store credentials for remember me functionality
 */
function storeCredentials(email, password) {
    try {
        const credentials = {
            email,
            password: encodeURIComponent(password),
            timestamp: Date.now()
        };
        
        wixStorage.local.setItem('rememberedCredentials', JSON.stringify(credentials));
    } catch (error) {
        console.error("Error storing credentials:", error);
    }
}

/**
 * Get stored credentials
 */
function getStoredCredentials() {
    try {
        const storedData = wixStorage.local.getItem('rememberedCredentials');
        if (!storedData) {
            return null;
        }
        
        const credentials = JSON.parse(storedData);
        
        // Check if credentials have expired (30 days)
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        
        if (credentials.timestamp && now - credentials.timestamp > thirtyDaysMs) {
            clearStoredCredentials();
            return null;
        }
        
        // Decode password
        if (credentials.password) {
            credentials.password = decodeURIComponent(credentials.password);
        }
        
        return credentials;
    } catch (error) {
        console.error("Error retrieving credentials:", error);
        return null;
    }
}

/**
 * Clear stored credentials
 */
function clearStoredCredentials() {
    wixStorage.local.removeItem('rememberedCredentials');
}

/**
 * Initialize remember me functionality
 */
function initializeRememberMe(emailFieldId, passwordFieldId, rememberMeId) {
    const credentials = getStoredCredentials();
    
    if (credentials) {
        // Populate fields
        $w(emailFieldId).value = credentials.email;
        $w(passwordFieldId).value = credentials.password;
        
        // Check the remember me checkbox
        $w(rememberMeId).checked = true;
    }
}

/**
 * Check if the user is logged in
 * @returns {Promise<boolean>} True if logged in, false otherwise
 */
export async function isLoggedIn() {
    try {
        const currentUser = await authentication.getCurrentMember();
        return !!currentUser;
    } catch (error) {
        console.error("Error checking login status:", error);
        return false;
    }
}

/**
 * Redirect if not logged in
 * @param {string} redirectUrl - URL to redirect to if not logged in
 * @returns {Promise<boolean>} True if logged in, false if redirected
 */
export async function requireLogin(redirectUrl = "/login") {
    const loggedIn = await isLoggedIn();
    
    if (!loggedIn) {
        wixLocationFrontend.to(redirectUrl);
        return false;
    }
    
    return true;
}

/**
 * Check if the current member has the specified role
 * @param {string} roleId - Role ID to check
 * @returns {Promise<boolean>} True if the member has the role, false otherwise
 */
export async function hasRole(roleId) {
    try {
        const currentMember = await authentication.getCurrentMember();
        
        if (!currentMember) {
            return false;
        }
        
        const roles = currentMember.roles || [];
        return roles.includes(roleId);
    } catch (error) {
        console.error("Error checking role:", error);
        return false;
    }
}

/**
 * Redirect if the current member doesn't have the specified role
 * @param {string} roleId - Role ID to check
 * @param {string} redirectUrl - URL to redirect to if the role check fails
 * @returns {Promise<boolean>} True if the member has the role, false if redirected
 */
export async function requireRole(roleId, redirectUrl = "/access-denied") {
    const hasRequiredRole = await hasRole(roleId);
    
    if (!hasRequiredRole) {
        wixLocationFrontend.to(redirectUrl);
        return false;
    }
    
    return true;
}