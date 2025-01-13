export function addAndDeleteItemsToRepeater(
    addButtonId = 'addButton', 
    repeaterId = 'repeater1', 
    deleteBtnId = 'deleteButton'
) {
    // Add a new item to the repeater when the add button is clicked
    $w(addButtonId).onClick(() => {
        console.log("CURRENT REPEATER DATA - ", $w(repeaterId).data);

        // Get the current data of the repeater
        let currRepeaterData = $w(repeaterId).data;
        console.log(currRepeaterData);

        // Add a new item with a unique _id to the repeater data
        currRepeaterData.push({
            _id: `item${currRepeaterData.length + 999}`,
        });

        // Update the repeater with the new data
        $w(repeaterId).data = currRepeaterData;
    });

    // Set up the delete functionality for each item in the repeater
    $w(repeaterId).forEachItem(($item, itemData, index) => {
        $item(deleteBtnId).onClick(() => {
            console.log("clicked delete");
            console.log(itemData);

            // Find the index of the item to be deleted in the repeater data
            const index = $w(repeaterId).data.findIndex((item) => {
                console.log("item", item);
                return item._id === itemData._id;
            });

            // If the item is found, remove it from the data and update the repeater
            if (index !== -1) {
                let stepData = $w(repeaterId).data;
                stepData.splice(index, 1);
                $w(repeaterId).data = stepData;
            }
        });
    });

    // Ensure the delete button is functional for items already in the repeater
    $w(repeaterId).onItemReady(($item, itemData, index) => {
        $item(deleteBtnId).onClick(() => {
            console.log("clicked delete");
            console.log(itemData);

            // Find the index of the item to be deleted in the repeater data
            const index = $w(repeaterId).data.findIndex((item) => {
                console.log("item", item);
                return item._id === itemData._id;
            });

            // If the item is found, remove it from the data and update the repeater
            if (index !== -1) {
                let stepData = $w(repeaterId).data;
                stepData.splice(index, 1);
                $w(repeaterId).data = stepData;
            }
        });
    });
}