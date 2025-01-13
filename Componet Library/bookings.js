import { Permissions, webMethod } from 'wix-web-module';
import { resources, sessions } from 'wix-bookings-backend';
import { services } from 'wix-bookings.v2';
import { categories } from 'wix-bookings.v1';
import wixMembersBackend from 'wix-members-backend';
import * as wixAuth from 'wix-auth';
import wixData from 'wix-data';
import { bookings } from "wix-bookings-backend";

//confirm Bookings
export const confirmBooking =  async (bookingId) => {
    const confirmBookingOptions = {
        participantNotification: {
            notifyParticipants: true,
            message: "We are pleased to let you know that your booking has been confirmed"
        },
        suppressAuth: true
    };

    return bookings
        .confirmBooking(bookingId, confirmBookingOptions)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return error;
        });
};

//decline Bookings
export const declineBooking =  (bookingId) => {
    const declineBookingOptions = {
        participantNotification: {
            notifyParticipants: true,
            message: "Sorry, but your booking request has been declined.",
        },
        suppressAuth: true
    };

    return bookings
        .declineBooking(bookingId, declineBookingOptions)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return error;
        });
};

//cancel Bookings
export const cancelBooking =  (bookingId) => {

    const elevatedCancelBooking = wixAuth.elevate(bookings.cancelBooking);

    const cancelBookingOptions = {
        participantNotification: {
            notifyParticipants: true,
            message: "Sorry, but your booking request has been declined.",
        }
    };

    return elevatedCancelBooking(bookingId, cancelBookingOptions)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            return error;
        });
};

// get resource using id
export const getResourceById =  async (resourceId) => {
    try {

        const resourceResp = await resources.queryResourceCatalog().eq("_id", resourceId).find({ suppressAuth: true });

        console.log(resourceId, resourceResp.items);
        if (resourceResp.items.length > 0) {
            return {
                success: 'success',
                item: resourceResp.items[0]
            };
        }

        return {
            success: 'error',
            message: "Resource does not exists"
        }

    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
};

// get business schedule
export const getBusinessSchedule =  () => {
    return resources
        .queryResourceCatalog()
        .eq("slugs.name", "business")
        .find()
        .then((results) => {
            const businessResource = results.items[0].resource;
            return businessResource;
        });
};

// register new artist as a staff
export const createStaff =  async (staffDetails) => {
    try {

        if (!staffDetails.name || !staffDetails.email) {
            return {
                success: 'error',
                message: "Please enter valid details"
            };
        }

        // staff details object
        const staffInfo = {
            name: staffDetails.name,
            email: staffDetails.email,
            tags: ['staff'],
        };

        // staff's schedule/availability info
        const scheduleInfo = [{
            availability: {
                linkedSchedules: [],
                start: new Date()
            }
        }];

        // create new resource
        const staffMember = await resources.createResource(staffInfo, scheduleInfo, { suppressAuth: true });

        // set schedule
        await setDefaultWorkHours(staffMember);

        return {
            success: 'success',
            newResource: staffMember
        };

    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
};

// set default working hours
async function setDefaultWorkHours(resource) {

    try {

        const days = ['MO', 'TU', 'WE', 'TH', 'FR'];
        const currDate = new Date();

        for (let day of days) {
            const recurrenceObj = {
                scheduleId: resource.scheduleIds[0],
                start: {
                    localDateTime: {
                        year: currDate.getFullYear(),
                        monthOfYear: currDate.getMonth() + 1,
                        dayOfMonth: currDate.getDate(),
                        hourOfDay: 10,
                        minutesOfHour: 0
                    }
                },
                end: {
                    localDateTime: {
                        year: currDate.getFullYear(),
                        monthOfYear: currDate.getMonth() + 1,
                        dayOfMonth: currDate.getDate(),
                        hourOfDay: 18,
                        minutesOfHour: 0
                    }
                },
                type: "WORKING_HOURS",
                recurrence: `FREQ=WEEKLY;INTERVAL=1;BYDAY=${day}`
            };

            await sessions.createSession(recurrenceObj, { suppressAuth: true });

        }

    } catch (error) {
        console.log(error);
    }

}

// update resource schedules
// data format [{day: 'MO', start: 'HH:MM', end: 'HH:MM'}]
export const setAvailability =  async (availability, artistStaffId) => {
    try {

        const currMember = await wixMembersBackend.currentMember.getMember({ fieldsets: ['FULL'] });
        // const artistDetails = await wixData.query("ArtistsDatabase").eq("artistEmail", currMember.loginEmail).find();

        // if(artistDetails.items.length<=0){
        //   return {
        //     success: 'error',
        //     message: "Artist details not found"
        //   }
        // }

        let staffScheduleId;

        // if(artistDetails.items[0].artistScheduleId){
        //   staffScheduleId = artistDetails.items[0].artistScheduleId;
        // }
        // else{
        // get resource/staff details
        const resource = await getResourceById(artistStaffId);
        staffScheduleId = resource.item.resource.scheduleIds[0];
        // }

        // remove previous sessions
        await removePrevSessions(staffScheduleId);

        // current date
        const currDate = new Date();

        for (const dayAvailability of availability) {
            const { day, slots } = dayAvailability;

            for (const slot of slots) {
                const startHrs = Number(slot.start.substring(0, 2));
                const startMin = Number(slot.start.substring(3));
                const endHrs = Number(slot.end.substring(0, 2));
                const endMin = Number(slot.end.substring(3));

                // check if end time is before start time
                if (endHrs < startHrs || (endHrs === startHrs && endMin <= startMin)) {
                    continue; // Skip invalid time slots
                }

                const recurrenceObj = {
                    scheduleId: staffScheduleId,
                    start: {
                        localDateTime: {
                            year: currDate.getFullYear(),
                            monthOfYear: currDate.getMonth() + 1,
                            dayOfMonth: currDate.getDate(),
                            hourOfDay: startHrs,
                            minutesOfHour: startMin
                        }
                    },
                    end: {
                        localDateTime: {
                            year: currDate.getFullYear(),
                            monthOfYear: currDate.getMonth() + 1,
                            dayOfMonth: currDate.getDate(),
                            hourOfDay: endHrs,
                            minutesOfHour: endMin
                        }
                    },
                    type: "WORKING_HOURS",
                    recurrence: `FREQ=WEEKLY;INTERVAL=1;BYDAY=${day}`
                };

                await sessions.createSession(recurrenceObj, { suppressAuth: true });
            }
        }

        return {
            success: 'success',
        };

    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
};

// remove previous sessions
async function removePrevSessions(scheduleId) {
    try {

        const existingWorkingHours = await sessions.querySessions()
            .ne("recurrence", null)
            .eq("scheduleId", scheduleId).find({ suppressAuth: true });

        for (let i = 0; i < existingWorkingHours.items.length; i++) {
            await sessions.deleteSession(existingWorkingHours.items[i]._id, { suppressAuth: true });
        }

    } catch (error) {
        console.log(error);
    }
}

// get first category for service
async function getFirstCategory() {
    const response = await categories.listCategories();
    return response.categories[0];
}

// create service
// dataFormat = {
//   name: "",
//   description: "",
//   tagLine: "",
//   duration: ,
//   address: {
//      addressLine: serviceDetails.address.addressLine,
//      city: serviceDetails.address.city,
//      postalCode: serviceDetails.address.postalCode,
//      country: 
//   }
//   price: "",
//   image: "" // image url
// };
export const createNewService =  async (resourceId, serviceDetails, artistStaffId) => {
    try {

        const currMember = await wixMembersBackend.currentMember.getMember({ fieldsets: ['FULL'] });
        // const artistDetails = await wixData.query("ArtistsDatabase").eq("artistEmail", currMember.loginEmail).find();

        // if (artistDetails.items.length <= 0) {
        //     return {
        //         success: 'error',
        //         message: "Artist details not found"
        //     }
        // }

        // get category
        const category = await getFirstCategory();

        // service info object
        const serviceInfo = {
            type: services.ServiceType.APPOINTMENT,
            name: serviceDetails.name,
            staffMemberIds: artistStaffId,
            category: category,
            onlineBooking: {
                enabled: true,
                requireManualApproval: true
            },
            schedule: {
                availabilityConstraints: {
                    sessionDurations: [serviceDetails.duration]
                }
            },
            hidden: false
        };

        // add descr, tagline, image, price, address if provided
        if (serviceDetails.description) {
            serviceInfo.description = serviceDetails.description;
        }

        if (serviceDetails.tagLine) {
            serviceInfo.tagLine = serviceDetails.tagLine;
        }

        if (serviceDetails.image) {
            serviceInfo.media = {
                coverMedia: {
                    image: serviceDetails.image
                }
            };
        }

        if (!serviceDetails.price || serviceDetails.price <= 0) {
            serviceInfo.payment = {
                rateType: services.RateType.NO_FEE,
                options: {
                    online: false,
                    inPerson: true,
                    deposit: false,
                    pricingPlan: false
                }
            };
        } else if (serviceDetails.price) {
            serviceInfo.payment = {
                rateType: services.RateType.FIXED,
                fixed: {
                    price: {
                        currency: "GBP",
                        value: serviceDetails.price
                    }
                },
                options: {
                    online: false,
                    inPerson: true,
                    deposit: false,
                    pricingPlan: false
                }
            };
        }

        if (serviceDetails.address) {
            serviceInfo.locations = [{
                type: services.LocationType.CUSTOM,
                custom: {
                    address: {
                        addressLine1: serviceDetails.address.addressLine,
                        city: serviceDetails.address.city,
                        postalCode: serviceDetails.address.postalCode,
                        country: serviceDetails.address.country
                    }
                }
            }];
        }

        const elevatedCreateService = wixAuth.elevate(services.createService);
        // create service
        const service = await elevatedCreateService(serviceInfo);
        console.log('Service', service);
        saveServiceDetails(service);

        return {
            success: 'success',
            service
        };

    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
};

// Get Service Details

export const updateService =  async (resourceId, serviceID, collectionID, serviceDetails, currency) => {
    try {
        console.log('Service Id', serviceID);
        console.log('Collection Id', collectionID);
        console.log('To be updated', serviceDetails);
        // check for valid req
        // const isValidReq = await checkForValidRequest(resourceId);
        // if(isValidReq.success!=='success'){
        //   return {
        //     success: 'error',
        //     message: 'Invalid request'
        //   };
        // }

        // service info object
        let toUpdate = await services.getService(serviceID);

        toUpdate.name = serviceDetails.name;

        toUpdate.schedule = {
            availabilityConstraints: {
                sessionDurations: [serviceDetails.duration]
            }
        }

        if (serviceDetails.description) {
            toUpdate.description = serviceDetails.description;
        }

        if (serviceDetails.tagLine) {
            toUpdate.tagLine = serviceDetails.tagLine;
        }

        if (serviceDetails.image) {
            toUpdate.media = {
                coverMedia: {
                    image: serviceDetails.image
                }
            };
        }

        if (!serviceDetails.price || serviceDetails.price <= 0) {
            toUpdate.payment = {
                rateType: services.RateType.NO_FEE,
                options: {
                    online: false,
                    inPerson: true,
                    deposit: false,
                    pricingPlan: false
                }
            };
        } else if (serviceDetails.price) {
            toUpdate.payment = {
                rateType: services.RateType.FIXED,
                fixed: {
                    price: {
                        currency: currency,
                        value: serviceDetails.price
                    }
                },
                options: {
                    online: false,
                    inPerson: true,
                    deposit: false,
                    pricingPlan: false
                }
            };
        }

        if (serviceDetails.address) {
            toUpdate.locations = [{
                type: services.LocationType.CUSTOM,
                custom: {
                    address: {
                        addressLine1: serviceDetails.address.addressLine,
                        city: serviceDetails.address.city,
                        postalCode: serviceDetails.address.postalCode,
                        country: serviceDetails.address.country
                    }
                }
            }];
        }

        console.log('updated service obj', toUpdate)
        const elevatedUpdateService = wixAuth.elevate(services.updateService);
        // update service
        const service = await elevatedUpdateService(serviceID, toUpdate);
        console.log('Updated Service', service)
        updateServiceDetails(collectionID, service);

        return {
            success: 'success',
            service
        };

    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
};

export const deleteService = async (resourceId, serviceID, collectionID) => {
    try {

        // check for valid req
        // const isValidReq = await checkForValidRequest(resourceId);
        // if(isValidReq.success!=='success'){
        //   return {
        //     success: 'error',
        //     message: 'Invalid request'
        //   };
        // }

        const elevatedDeleteService = wixAuth.elevate(services.deleteService);
        // create service
        const service = await elevatedDeleteService(serviceID);

        deleteServiceDetails(collectionID);
        console.log('successfull deletion')
        return {
            success: 'success',
            service
        };

    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
};

// add service entry to wix collection
async function saveServiceDetails(service, colllectionId) {
    try {

        const address = service.locations[0].calculatedAddress;
        // console.log('Address',address);
        const media = service.media;
        const fixedPrice = service.payment.fixed;
        const duration = service.schedule.availabilityConstraints.sessionDurations[0];
        const staffMembers = service.staffMemberIds;

        const serviceInfo = {
            title: service.name,
            serviceDescription: service.description || "",
            serviceTagline: service.tagLine || "",
            slotDuration: duration,
            servicePrice: fixedPrice ? Number(fixedPrice.price.value) : 0,
            serviceArtist: staffMembers,
            serviceAddress: address.formatted,
            addressLine1: address.addressLine,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country,
            serviceId: service._id,
            servicePage: service.urls.servicePage,
            bookingPage: service.urls.bookingPage
        }

        if (media) {
            serviceInfo.serviceImage = media.mainMedia ? media.mainMedia.image : (media.coverMedia ? media.coverMedia.image : "");
        }

        await wixData.insert(colllectionId, serviceInfo, { suppressAuth: true });

    } catch (error) {
        console.error(error);
    }
}

async function updateServiceDetails(id, service, collectionId) {
    try {

        const address = service.locations[0].calculatedAddress;
        // console.log('Address',address);
        const media = service.media;
        const fixedPrice = service.payment.fixed;
        const duration = service.schedule.availabilityConstraints.sessionDurations[0];
        const staffMembers = service.staffMemberIds;

        const serviceInfo = {
            _id: id,
            title: service.name,
            serviceDescription: service.description || "",
            serviceTagline: service.tagLine || "",
            slotDuration: duration,
            servicePrice: fixedPrice ? Number(fixedPrice.price.value) : 0,
            serviceArtist: staffMembers,
            serviceAddress: address.formatted,
            addressLine1: address.addressLine,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country,
            serviceId: service._id,
            servicePage: service.urls.servicePage,
            bookingPage: service.urls.bookingPage
        }

        if (media) {
            serviceInfo.serviceImage = media.mainMedia ? media.mainMedia.image : (media.coverMedia ? media.coverMedia.image : "");
        }

        await wixData.update(collectionId, serviceInfo, { suppressAuth: true });

    } catch (error) {
        console.error(error);
    }
}

async function deleteServiceDetails(id, collectionId) {
    try {

        await wixData.remove(collectionId, id, { suppressAuth: true });

    } catch (error) {
        console.error(error);
    }
}

// get services list
export const getServiceList = async (resourceId, collectionId, fieldName) => {
    try {

        const serviceList = await wixData.query(collectionId).eq(fieldName, [resourceId]).find();

        return {
            success: 'success',
            items: serviceList.items
        };

    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
};

// check for valid user
export async function checkForValidRequest(resourceId) {
    try {
        // fetch current logged user and resource we are updating
        const currentUser = await wixMembersBackend.currentMember.getMember({ fieldsets: ['FULL'] });
        // console.log(currentUser)
        const resource = await getResourceById(resourceId);
        // console.log(resource)
        if (resource.success !== 'success') {
            return {
                success: 'error',
                message: resource.message
            }
        }

        if (!currentUser) {
            return {
                success: 'error',
                message: "User not logged in"
            }
        }

        // check if both the users are same with there email ids
        if (currentUser.loginEmail !== resource.item.resource.email) {
            return {
                success: 'error',
                message: 'Not authorised'
            }
        }

        return {
            success: 'success'
        }
    } catch (error) {
        return {
            success: 'error',
            message: error.message
        }
    }
}