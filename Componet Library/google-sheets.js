import { getValues } from "@velo/google-sheets-integration-backend";
import wixData from 'wix-data';

export async function deleteFromSheetsToWix(collectionId, sheetId) {
    let count = 0;
    let arr = []
    const sheetData = await getValues(sheetId, "A1:Z100");
    sheetData.data.values.map((i) => {
        count += 1;
        arr.push(i[0])
        wixData.query(collectionId)
            .find()
            .then((results) => {
                if (results.items.length > 0) {
                    console.log(results.items[0]); //see item below
                    results.items.map((j) => {
                        if (!arr.includes(j.row)) {
                            wixData.remove(collectionId, j._id)
                                .then((result) => {
                                    console.log(result); // see removed item below
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        }
                    })

                } else {
                    // handle case where no matching items found
                }
            })
            .catch((err) => {
                console.log(err);
            });
    })
}

let arr2 = []
export async function sheetsToWixSync(collectionId, sheetId, range) {
    // Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
    // Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
    try {
        const columns = await getValues(sheetId, "A1:Z1");

        const sheetData = await getValues(sheetId, range);
        console.log("columns", columns);
        columns.data.values[0].map((i) => {
            arr2.push(i);
        })
        let lenght = columns.data.values[0].length
        console.log("sheetData", sheetData);
        sheetData.data.values.map((i) => {

            wixData.query(collectionId)
                .eq("row", i[0])
                .find()
                .then((results) => {
                    if (results.items.length > 0) {
                        console.log(results.items[0]); //see item below
                        let item = results.items[0];

                        let ToUpdate = {
                            "_id": item._id,
                        }
                        for (let k = 0; k <= lenght - 1; k++) {
                            ToUpdate[arr2[k]] = i[k]
                        }

                        console.log("Toupdate", ToUpdate);

                        wixData.update(collectionId, ToUpdate)
                            .then((results) => {
                                console.log(results); //see item below
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    } else {
                        // handle case where no matching items found

                        let toInsert = {};
                        for (let k = 0; k <= lenght - 1; k++) {
                            toInsert[arr2[k]] = i[k]
                        }

                        wixData.insert(collectionId, toInsert)
                            .then((item) => {
                                console.log("added new item", item); //see item below

                            })
                            .catch((err) => {
                                console.log("error in adding item", err);
                            });

                    }
                })
                .catch((err) => {
                    console.log(err);
                });

        })
        /* Assuming sheetData.values is an array of arrays*/
    } catch (error) {
        console.error('Error:', error);
    }

}