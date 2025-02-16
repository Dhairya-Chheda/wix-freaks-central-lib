import wixData from 'wix-data';

export async function filterByDropdown(
    collectionName = 'myCollection', 
    arr = [], 
    fields = [], 
    repeaterId = 'repeater1', 
    inputField = 'inputField1', 
    inputFields = []
) {
    let query = wixData.query(collectionName);
    let n = arr.length;
    let result;

    // Check if the main input field has a value
    if ($w(`#${inputField}`).value) {
        inputFields.forEach(async (i) => {
            let query = wixData.query(collectionName);
            console.log("inputFields", i);
            console.log("value", $w(`#${inputField}`).value);
            query = query.contains(i, $w(`#${inputField}`).value);
            let results = await query.find();
            
            // If results are found, set them to the result variable and update the repeater
            if (results.items.length > 0) {
                result = results.items;
                console.log("res in ", result);
                $w(`#${repeaterId}`).data = result;
            }
        });
    }

    // Loop through each dropdown to add filters to the query
    for (let i = 0; i < n; i++) {
        if ($w(`#${arr[i]}`).value) {
            console.log("value", $w(`#${arr[i]}`).value);
            console.log("fields", fields);
            query = query.eq(fields[i], $w(`#${arr[i]}`).value);
            console.log("query", query);
        }
    }

    // If a result was found using the main input field, set the repeater data
    if (result) {
        $w(`#${repeaterId}`).data = result;
    } else {
        // Otherwise, execute the query and update the repeater with the results
        result = await query.find();
        console.log("results", result.items);
        $w(`#${repeaterId}`).data = result.items;
    }
}

export async function filterByInput(
    collectionName = 'myCollection', 
    inputField = 'inputField1', 
    fields = [], 
    repeaterId = 'repeater1'
) {
    let query = wixData.query(collectionName);
    let n = fields.length;
    let result = [];

    // Check if the input field has a value
    if ($w(`#${inputField}`).value) {
        fields.forEach(async (i) => {
            let query = wixData.query(collectionName);
            console.log("fields", i);
            console.log("value", $w(`#${inputField}`).value);
            query = query.contains(i, $w(`#${inputField}`).value);
            let results = await query.find();

            // If results are found, set them to the result variable and update the repeater
            if (results.items.length > 0) {
                result = results.items;
                console.log("res", result);
                $w(`#${repeaterId}`).data = result;
            }
        });
    }
}