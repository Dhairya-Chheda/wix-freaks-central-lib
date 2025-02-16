import wixCrmBackend from 'wix-crm-backend';
import { triggeredEmails, contacts } from "wix-crm-backend";
import wixData from 'wix-data';
import wixMembersBackend from 'wix-members-backend';

// Get contacts custom fields
export const getCustomFields = async () => {
    try {
        const custFields = await wixCrmBackend.contacts
            .queryExtendedFields()
            .find({ suppressAuth: true });

        return {
            success: "success",
            fields: custFields.items,
        };
    } catch (error) {
        return {
            success: "error",
            message: error,
        };
    }
};

// Send mails to group of members
export const emailGroupOfMembers = (mailingList, emailTemplate, emailVariables) => {
    mailingList.forEach(async (mailuser) => {
        triggeredEmails
            .emailMember(emailTemplate, mailuser, {
                variables: { ...emailVariables },
            })
            .then(() => {
                console.log("Email sent");
            })
            .catch(() => {
                console.log("Email sending failed");
            });
    });
};

// Send mails to group of contacts
export const emailGroupOfContact = (mailingList, emailTemplate, emailVariables) => {
    mailingList.forEach(async (mailuser) => {
        triggeredEmails
            .emailContact(emailTemplate, mailuser, {
                variables: { ...emailVariables },
            })
            .then(() => {
                console.log("Email sent");
            })
            .catch(() => {
                console.log("Email sending failed");
            });
    });
};

// update members details
export const updateMemberDetails2 = async (memberId, customData) => {
    try {
        const updatedMember = await wixMembersBackend.members.updateMember(memberId, {
            contactDetails: {
                customFields: {
                    // your custom field id
                    "custom.door-fob-id": {
                        name: "rfidFobHexCode", // name of your custom field
                        value: customData.rfidFobHexCode, // value to insert for that field
                    },
                },
            },
        });

        return {
            success: "success",
            member: updatedMember,
        };
    } catch (error) {
        return {
            success: "error",
            message: error,
        };
    }
};

// check if member exists
export const checkMemberExists = async (searchData) => {
    try {
        const { searchEmail } = searchData;
        const members = await wixData
            .query("Members/FullData")
            .eq("loginEmail", searchEmail)
            .find({ suppressAuth: true });

        if (members.items.length > 0) {
            return {
                success: "success",
                userExists: true,
                user: members.items[0]._id,
            };
        } else {
            return {
                success: "error",
                message: "User details not found",
                userExists: false,
            };
        }
    } catch (error) {
        return {
            success: "error",
            message: error,
            userExists: false,
        };
    }
};

// get all contacts with given rfid
export const getContactsByCustField = async (custFieldId, custFieldVal) => {
    try {
        // query contacts using one of its custom field
        const contacts = await wixCrmBackend.contacts
            .queryContacts()
            .eq(custFieldId, custFieldVal)
            .find({ suppressAuth: true });
        return {
            success: "success",
            contacts: contacts.items,
        };
    } catch (error) {
        return {
            success: "error",
            message: error,
        };
    }
};


// check if contact with provided email exists
export const checkIfContactExists = async (userEmail) => {
    try {
        const oldContacts = await contacts
            .queryContacts()
            .eq("primaryInfo.email", userEmail)
            .find({ suppressAuth: true });

        if (oldContacts.items.length === 0) {
            return {
                success: "success",
                contactExists: false,
            };
        }

        return {
            success: "success",
            contactExists: true,
            contact: oldContacts.items[0],
        };
    } catch (error) {
        return {
            success: "error",
            message: error.message,
        };
    }
};

// create new contact if not exists and return contact details
export const getOrCreateContact = async (userDetails) => {
    try {

        const { email, firstname, lastname } = userDetails;

        const oldContact = await checkIfContactExists(email);

        if (oldContact.success === "error") {
            return oldContact;
        }

        if (oldContact.success === "success" && oldContact.contactExists) {
            return {
                success: "success",
                contact: oldContact.contact,
            };
        }

        const contactInfo = {
            name: {
                first: firstname,
                last: lastname,
            },
            emails: [{
                email: email,
                primary: true,
            }, ],
        };

        const contact = await contacts.createContact(contactInfo, { suppressAuth: true });

        return {
            success: "success",
            contact,
        };
    } catch (error) {
        return {
            success: "error",
            message: error.message,
        };
    }
};

// Send mails to group of users
// mailingList = [{ email: "", firstname: "", lastname: "" }, { email: "", firstname: "", lastname: "" }, .....]
export const emailGroupOfusers = async (mailingList, emailTemplateId) => {
    try {
        
        mailingList.forEach(async (mailuser) => {
            // get contact details
            const contactInfo = await getOrCreateContact(mailuser);
            if (contactInfo.success === "success") {
                console.log(contactInfo.contact);
                // send triggered mail
                triggeredEmails
                    .emailContact(emailTemplateId, contactInfo.contact._id, {
                        variables: {
                            username: mailuser.firstname,
                            userEmail: mailuser.email,
                        },
                    })
                    .then(() => {
                        console.log("Mail sent " + mailuser.firstname);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            } else {
                console.log(contactInfo);
            }
        });
    } catch (error) {
        return {
            success: "error",
            message: error.message,
        };
    }
};