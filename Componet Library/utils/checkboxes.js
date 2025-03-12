import wixWidget from 'wix-widget';
import wixEditor from 'wix-editor';
import wixData from 'wix-data';

/**
 * Sets up a checkbox group with "Select All" functionality
 * 
 * @param {string} collectionName - Database collection to query for options
 * @param {string} fieldName - Field name to use for distinct query
 * @param {string} checkboxElementId - ID of the checkbox element (with # prefix)
 * @param {string} selectAllLabel - Label for the "Select All" option
 * @param {string} selectAllValue - Value for the "Select All" option
 * @returns {Promise<void>} - Promise that resolves when setup is complete
 */
export async function setupCheckboxGroup(
    collectionName = '@coadapted-technologies/payment-icons-pro/Icons', 
    fieldName = 'title', 
    checkboxElementId = '#iconsCheckbox', 
    selectAllLabel = 'Select All', 
    selectAllValue = 'all'
) {
    try {
        // Validate parameters
        if (!checkboxElementId || !checkboxElementId.startsWith('#')) {
            throw new Error('Invalid checkbox element ID. ID must start with #');
        }
        
        if (!$w(checkboxElementId)) {
            throw new Error(`Checkbox element with ID "${checkboxElementId}" not found`);
        }

        // Fetch distinct values from the database
        let queryResults = await wixData.query(collectionName).distinct(fieldName);
        
        if (!queryResults || !queryResults.items) {
            console.error(`No items found in collection "${collectionName}" for field "${fieldName}"`);
            return;
        }

        // Map the results to the desired format for checkbox options
        const itemOptions = queryResults.items.map(item => ({ 
            'label': item, 
            'value': item 
        }));
        
        // Create final options with "Select All" at the beginning
        const allOptions = [
            { 'label': selectAllLabel, 'value': selectAllValue }, 
            ...itemOptions
        ];

        // Set the options for the checkbox group
        $w(checkboxElementId).options = allOptions;

        // Initialize state for "Select All" tracking
        let isSelectAllChecked = false;
        let isUpdatingSelection = false; // Flag to prevent recursive onChange calls

        // Handle the change event for the checkbox group
        $w(checkboxElementId).onChange(() => {
            if (isUpdatingSelection) {
                return; // Prevent recursive calls during programmatic updates
            }
            
            isUpdatingSelection = true;
            const selectedValues = $w(checkboxElementId).value; // Array of selected values
            
            // Handle "Select All" logic
            if (selectedValues.includes(selectAllValue)) {
                // "Select All" is currently selected
                if (!isSelectAllChecked) {
                    // If "Select All" was just checked, select all options
                    $w(checkboxElementId).value = allOptions.map(item => item.value);
                    isSelectAllChecked = true;
                } else {
                    // If user deselected some items while "Select All" was checked,
                    // uncheck "Select All" but keep the other selections
                    if (selectedValues.length < allOptions.length) {
                        const filteredSelection = selectedValues.filter(item => item !== selectAllValue);
                        $w(checkboxElementId).value = filteredSelection;
                        isSelectAllChecked = false;
                    }
                }
            } else {
                // "Select All" is not selected
                isSelectAllChecked = false;
                
                // If all individual items are selected, automatically check "Select All" too
                if (selectedValues.length === itemOptions.length) {
                    $w(checkboxElementId).value = [...selectedValues, selectAllValue];
                    isSelectAllChecked = true;
                }
            }
            
            isUpdatingSelection = false;
        });
        
    } catch (error) {
        console.error("Error setting up checkbox group:", error);
        // Optionally display error to user using a designated error message element
        // if ($w('#errorMsg')) {
        //     $w('#errorMsg').text = `Error setting up options: ${error.message}`;
        //     $w('#errorMsg').expand();
        // }
    }
}