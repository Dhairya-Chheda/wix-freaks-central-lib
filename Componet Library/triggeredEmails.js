

import { Permissions, webMethod } from "wix-web-module";
import { contacts, triggeredEmails } from 'wix-crm-backend';
import wixCrmBackend from 'wix-crm-backend';

let contactId

export const sendMail = webMethod(Permissions.Anyone, async (firstName, email, triggeredEmailId,variables) => {

    console.log("backend triggered", firstName, email, triggeredEmailId);
    let options = {
        "suppressAuth": true
    }
    const queryResults = await contacts.queryContacts()
        .eq('info.emails.email', email)
        .find(options);

    console.log("queryresults", queryResults);

    if (queryResults.length === 0) {
        console.log("no contact found")
        contactId = await createContact(firstName, email);
        console.log("contact id", contactId)
        await emailContact( email,contactId, triggeredEmailId,variables);
    } else {

        contactId = queryResults.items[0]._id
        console.log("contactId", contactId);
        await emailContact(email, contactId ,triggeredEmailId,variables);
    }

})

export const emailContact = webMethod(Permissions.Anyone, (email, contactId, triggeredEmailId,variables) => {
    console.log(" send email is triggered ", email, contactId, triggeredEmailId,variables);
    return triggeredEmails.emailContact(triggeredEmailId, contactId,{
        "variables":variables
    })
        .then(() => {
            console.log('Email was sent to contact');
        })
        .catch((error) => {
            console.error(error);
        });
})

export const createContact = webMethod(Permissions.Anyone,async (firstName, email) => {
    return wixCrmBackend.createContact({
            "firstName": firstName,
            "emails": [email],

        })
        .then((result) => {
            const contactId = result;
            return contactId;
        });
}
)