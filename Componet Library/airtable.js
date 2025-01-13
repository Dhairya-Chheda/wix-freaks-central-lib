
import wixData from 'wix-data';

export function getAirtableData(baseId, token, tableName) {
    const apiUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const httpMethod = 'GET';
    // checks if data is present or not
    fetch(apiUrl, { headers: headers })
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            return data;
        })
        .catch(error => {
            // console.log(error);
            return error
        });

}

export function sendDataToAirtable(baseId, token, tableName, body) {
    const apiUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ fields: body }),
    };

    return fetch(apiUrl, requestOptions)
        .then(response => response.json())
        .then(result => {
            console.log(result);
            return result
        })
        .catch(error => {
            console.error('Error sending data to Airtable:', error);
            throw error;
        });

}

export function updateToAirtable(baseId, token, tableName, body, recordId) {

    const apiUrl = `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const requestOptions = {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ fields: body })
    };

    return fetch(apiUrl, requestOptions)
        .then(response => response.json())
        .then(result => {
            console.log('Record updated in Airtable:', result);
            return result;
        })
        .catch(error => {
            console.error('Error updating record in Airtable:', error);
            throw error;
        });
}

export function deleteToAirtable(baseId, token, tableName, recordId) {
    const airtableApiUrl = `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`;
    fetch(airtableApiUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => console.log('Deleted from Airtable:', data))
        .catch(error => console.error('Error deleting from Airtable:', error));
}

let arr = []
export async function sendAndUpdateDataFromAirtableToWix(collectionId, airtableBaseId, airtableTableName, airtableApiKey) {
    const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
    const headers = {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
    };
    const httpMethod = 'GET';

    fetch(url, { headers: headers })
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            data.records.map((i) => {
                // console.log(i.id)
                // console.log(i.fields.Name)
                arr.push(i.id)

                //insert and update
                wixData.query(collectionId)
                    .eq("id", i.id)
                    .find()
                    .then((results) => {
                        if (results.items.length > 0) {
                            // console.log(results.items[0]); //see item below

                            let toUpdate = {
                                "_id": results.items[0]._id,
                                "id": i.id,
                                ...i.fields
                            }
                            wixData.update(collectionId, toUpdate);

                        } else {
                            // handle case where no matching items found

                            let toInsert = {
                                "id": i.id,
                                ...i.fields
                            }

                            wixData.insert(collectionId, toInsert)
                                .then((item) => {
                                    console.log(item); //see item below
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    });

            })

        })
        .catch(error => {
            console.log(error);
        });
}

let arr1 = [];
export function removeDatafromWixWithAirtable(collectionId, airtableBaseId, airtableTableName, airtableApiKey) {
    const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
    const headers = {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
    };
    const httpMethod = 'GET';

    fetch(url, { headers: headers })
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            data.records.map((i) => {
                // console.log(i.id)
                // console.log(i.fields.Name)
                arr1.push(i.id)
                //delete
                wixData.query(collectionId)
                    .find()
                    .then((results) => {
                        if (results.items.length > 0) {
                            results.items.map((j) => {

                                if (!arr1.includes(j.id)) {
                                    //
                                    // console.log("doesnt include", j)
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
        })
}