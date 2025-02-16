import wixWidget from 'wix-widget';
import wixEditor from 'wix-editor';
import wixData from 'wix-data';

export async function setupCheckboxGroup(
    collectionName = '@coadapted-technologies/payment-icons-pro/Icons', // Default database collection name
    fieldName = 'title', // Default field name for distinct query
    checkboxElementId = '#iconsCheckbox', // Default checkbox group element ID
    selectAllLabel = 'Select All', // Default label for "Select All" option
    selectAllValue = 'all' // Default value for "Select All" option
) {
    // Fetch distinct icon names from the database
    let iconName = await wixData.query(collectionName).distinct(fieldName);

    // Map the icon names to the desired format for the checkbox options
    let iconOptions = iconName.items.map(item => ({ 'label': item, 'value': item }));
    let allOptions = [{ 'label': selectAllLabel, 'value': selectAllValue }, ...iconOptions];

    // Set the options for the checkbox
    $w(checkboxElementId).options = allOptions;

    // State to track "Select All" selection
    let allState = true;

    // Handle the change event for the checkbox group
    $w(checkboxElementId).onChange(() => {
        let selectedValues = $w(checkboxElementId).value; // Array of selected values

        if (selectedValues.includes(selectAllValue)) {
            // If "Select All" is selected
            if (selectedValues.length === allOptions.length - 1) {
                // If "Select All" and all other options are selected, allow individual item deselection
                $w(checkboxElementId).value = selectedValues.filter(item => item !== selectAllValue);
                allState = false;
            } else {
                // If "Select All" is selected but not all options are selected, select all options
                $w(checkboxElementId).value = allOptions.map(item => item.value);
                allState = true;
            }
        } else {
            // If "Select All" is not selected
            if (selectedValues.length === 0) {
                // If no options are selected, keep everything deselected
                $w(checkboxElementId).value = [];
                allState = false;
            } else if (selectedValues.length === iconOptions.length) {
                // If all individual options are selected, automatically select "Select All"
                $w(checkboxElementId).value = allOptions.map(item => item.value);
                allState = false;
            } else {
                // If some individual options are selected, update the selection
                $w(checkboxElementId).value = selectedValues;
                allState = false;
            }
        }
    });
}