import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

export function getDataFromTrello(listId, apiKey, apiToken) {

    let apiUrl = `https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${apiToken}`

    fetch(apiUrl, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            console.log('Board information:', data);
            return data;
        })
        .catch(error => {
            console.error('Error getting board information:', error);
        });
}

export function addCardToTrello(apiKey, apiToken, listId, cardData) {
    const apiUrl = `https://api.trello.com/1/cards?idList=${listId}&key=${apiKey}&token=${apiToken}`;

    fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Card created successfully:', data);
            return data
        })
        .catch(error => {
            console.error('Error creating card:', error);
            return error
        });
}

export function updateCardToTrello(apiKey, apiToken, cardId, updatedCardData) {
    const apiUrl = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${apiToken}`

    fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedCardData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Card updated successfully:', data);
            return data
        })
        .catch(error => {
            console.error('Error updating card:', error);
            return error
        });
}

export function removeCardFromTrello(apiKey, apiToken, cardId) {
    const apiUrl = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${apiToken}`
    fetch(apiUrl, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                console.log('Card deleted successfully');
                return response
            } else {
                console.error('Error deleting card:', response.statusText);

            }
        })
        .catch(error => {
            console.error('Error deleting card:', error);
            return error
        });
}

export function createLablesToTrello(apiKey, apiToken, label, cardId) {
    label.map(async (i) => {
        const labelData = {
            name: i.name, // Replace with a name for the attachment
        };
        console.log(labelData, "lableData");
        console.log(i.colour, "lableData colour");
        try {
            let response = await fetch(`https://api.trello.com/1/cards/${cardId}/labels?color=${i.colour}&key=${apiKey}&token=${apiToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(labelData),
            })

            if (!response.ok) {
                throw new Error(`Failed to create label: ${response.status} ${response.statusText}`);
            }
            const responseData = await response.json();
            console.log("response data", responseData);
            return responseData
        } catch (err) {
            return err;
        }

    })

}

let check = false;
export function createCheckListsToTrello(apiKey, apiToken, cardId, item) {

    const checkListUrl = `https://api.trello.com/1/checklists?idCard=${cardId}&key=${apiKey}&token=${apiToken}`
    for (const key in item) {
        console.log("key", key);
        const innerObject = item[key];
        console.log("innerObject", innerObject)
        const checklistData = {
            name: key,
        };

        // Make a POST request to create the checklist
        fetch(checkListUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checklistData),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to create checklist: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Checklist created successfully:', data);
                console.log("item tasks", item);
                for (const innerKey in innerObject) {
                    console.log("key", key);
                    console.log("inner key", innerKey);
                    const value = innerObject[innerKey];

                    if (value === "done") {
                        check = true
                    } else {
                        check = false
                    }
                    console.log("value", value, "check", check)
                    if (item) {
                        let checkItemUrl = `https://api.trello.com/1/checklists/${data.id}/checkItems?name=${data.name}&key=${apiKey}&token=${apiToken}`

                        const checklistItemData = {
                            name: innerKey,
                            checked: check
                        };
                        fetch(checkItemUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(checklistItemData),
                            })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to create checklist: ${response.status} ${response.statusText}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                console.log('Checklist created successfully:', data);
                            })
                            .catch(error => {
                                console.error('Error creating checklist:', error);
                            });

                    }
                }
            })
            .catch(error => {
                console.error('Error creating checklist:', error);
            });

    }
}

export function createAttachmentsInTrello(cardId, apiKey, apiToken, cardData) {
    let apiUrl = `https://api.trello.com/1/cards/${cardId}/attachments?key=${apiKey}&token=${apiToken}`

    fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Attachment created successfully:', data);
            return data
        })
        .catch(error => {
            console.error('Error creating card:', error);
            return error
        });
}

export async function sendAndUpdateDataFromTrelloToWix(collectionId, apiKey, apiToken, listId) {

    const apiUrl = `https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${apiToken}`;

    fetch(apiUrl, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            // console.log('Board information:', data);

            data.map((i) => {
                // console.log(i.name)
                // console.log(i.desc)
                // console.log(i.id)

                //insert and update

                wixData.query(collectionId)
                    .eq("trelloId", i.id)
                    .find()
                    .then((results) => {
                        if (results.items.length > 0) {
                            console.log(results.items[0]); //see item below
                            // console.log("field name", i.fields.Name)
                            // console.log("id", i.id)
                        
                            let toUpdate = {
                                "_id": results.items[0]._id,
                                "trelloId": i.id,
                                "title": i.name,
                                "desc": i.desc,
                                // "date": i.start,
                                // "url": i.attachments
                            };

                            wixData.update(collectionId, toUpdate)
                                .then((results) => {
                                    // console.log(results); //see item below
                                })
                                .catch((err) => {
                                    console.log(err);
                                });

                        } else {
                            // handle case where no matching items found
                            let toInsert = {
                                "title": i.name,
                                "trelloId": i.id,
                                "desc": i.desc

                            };
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
            console.error('Error getting board information:', error);
        });
}

let arr = []
export function removeDatafromWixWithTrello(collectionId, apiKey, apiToken, listId) {
    const apiUrl = `https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${apiToken}`;

    fetch(apiUrl, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            // console.log('Board information:', data);

            data.map((i) => {
                // console.log(i.name)
                // console.log(i.desc)
                // console.log(i.id)
                arr.push(i.id)
                //delete
                wixData.query(collectionId)
                    .find()
                    .then((results) => {
                        if (results.items.length > 0) {
                            results.items.map((j) => {
                                if (!arr.includes(j.trelloId)) {
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
        }).catch(error => {
            console.error('Error getting board information:', error);
        });
}