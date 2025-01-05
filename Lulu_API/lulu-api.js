import { Permissions, webMethod } from "wix-web-module";
import wixData from 'wix-data';
import querystring from 'querystring'
import axios from 'axios';

const hostUrl = 'https://api.sandbox.lulu.com';

export async function generateAccessToken(luluAuthTokken) {
    return axios({
            method: 'post',
            url: `${hostUrl}/auth/realms/glasstree/protocol/openid-connect/token`,
            withCredentials: true,
            crossdomain: true,
            data: querystring.stringify({ 'grant_type': 'client_credentials' }),
            headers: {
                'Authorization': `Basic ${luluAuthTokken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                "Cache-Control": "no-cache",
            }
        }).then((response) => {
            tokken = response.data.access_token;
            // interval = response.data.expires_in;
            return response.data.access_token;
        })
        .catch(function (error) {
            console.log("Post Error : " + error);
        });
}

export const validateBookInterior = webMethod(Permissions.Anyone, (url) => {

    const pdfSource = JSON.stringify({
        "source_url": url
    })

    return generateAccessToken().then((tokken) => {
            return axios({
                'method': 'POST',
                'url': `${hostUrl}/validate-interior/`,
                'headers': {
                    'Authorization': `Bearer ${tokken}`,
                    ' Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                },
                data: pdfSource,
            }).then((res) => {
                console.log('validate: ', res);
                return res.data;
            })
        })
        .catch((error) => {
            console.log('Error in Validaion: ', error);
            throw new Error(`Error in Validaion: ${error}`)
        })
})

export const validateBookCover = webMethod(Permissions.Anyone, async (coverUrl, podId, pageCount) => {

    const pdfSource = JSON.stringify({
        "source_url": coverUrl,
        "pod_package_id": podId,
        "interior_page_count": pageCount,
    })

    return generateAccessToken().then((tokken) => {
        return axios({
                'method': 'POST',
                'url': `${hostUrl}/validate-cover/`,
                'headers': {
                    'Authorization': `Bearer ${tokken}`,
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                },
                data: pdfSource,
            }).then((res) => {
                console.log('validate: ', res);
                return res.data;
            })
            .catch((e) => {
                console.log('Error in Validaion: ', e);
                throw new Error(e)
            })
    })
})

export const validateBookInteriorRecord = webMethod(Permissions.Anyone, (id) => {
    return generateAccessToken().then((tokken) => {
        return axios({
                'method': 'GET',
                'url': `${hostUrl}/validate-interior/${id}`,
                'headers': {
                    'Authorization': `Bearer ${tokken}`,
                    ' Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            })
            .then((res) => {
                console.log('Record:', res?.data);
                return res.data;
            })
            .catch(e => {
                throw new Error(e);
            })
    })
})

export const validateBookCoverRecord = webMethod(Permissions.Anyone, (id) => {
    return generateAccessToken().then((tokken) => {
        return axios({
                'method': 'GET',
                'url': `${hostUrl}/validate-cover/${id}`,
                'headers': {
                    'Authorization': `Bearer ${tokken}`,
                    ' Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            })
            .then((res) => {
                console.log('Record:', res?.data);
                return res.data;
            })
            .catch(e => {
                throw new Error(e);
            })
    })
})

async function printhook(BASE_URL) {
    var raw = JSON.stringify({
        "topics": [
            "PRINT_JOB_STATUS_CHANGED"
        ],
        "url": `${BASE_URL}/\_functions/printJobsUpdates` // CREATE A WEBHOOK TO RECEIVE PRINT JOBS UPDATES 
    });

    return generateAccessToken().then(() => {
        return axios({
                'method': 'POST',
                'url': `${hostUrl}/webhooks/`,
                'headers': {
                    'Authorization': `Bearer ${tokken}`,
                    ' Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                },
                data: raw,
            })
            .then((res) => {
                console.log('Hook Response: ', res?.data);
            })
            .catch((e) => {
                console.log('Error from printHook: ', e);
            })
    })
}

export const createPrintJob = webMethod(Permissions.Anyone, async (details) => {

    const { email, externalId, coverPdfUrl, interiorPdfUrl, podId, quantity, bookName, city, countryCode, name, phoneNo, postCode, stateCode, street, shippingLevel } = details;

    const raw = JSON.stringify({
        "contact_email": email,
        "external_id": externalId,
        "line_items": [{
            "external_id": externalId,
            "printable_normalization": {
                "cover": {
                    "source_url": coverPdfUrl
                },
                "interior": {
                    "source_url": interiorPdfUrl
                },
                "pod_package_id": podId
            },
            "quantity": quantity,
            "title": bookName
        }],
        "production_delay": 1,
        "shipping_address": {
            "city": city,
            "country_code": countryCode,
            "name": name,
            "phone_number": phoneNo,
            "postcode": postCode,
            "state_code": stateCode,
            "street1": street
        },
        "shipping_level": shippingLevel
    });

    return generateAccessToken()
        .then((tokken) => {
            console.log(raw);
            return axios({
                    'method': 'POST',
                    'url': `${hostUrl}/print-jobs/`,
                    'headers': {
                        'Authorization': `Bearer ${tokken}`,
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    },
                    'data': raw,
                })
                .then((res) => {
                    // printhook();
                    return res.data;
                })
                .then(async (res) => {
                    console.log(res);

                    await wixData.insert('BookOrders', {
                            title: res.line_items[0].title,
                            printJobId: res.id,
                            printJobStatus: res.status.name,
                            bookId: res.external_id,
                            quantity: res.line_items[0].quantity,
                            paymentStatus: "PAID",
                            address: `Name: ${name} \n
                                      Phone No: ${phoneNo} \n
                                      Street: ${street} \n
                                      City: ${city} \n
                                      State Code: ${stateCode} \n
                                      Post Code: ${postCode} \n 
                                      Country Code: ${countryCode} \n`
                        })
                        .then(() => {
                            console.log('Order Created Successfully !!');
                            return "Order Created Successfully !!"
                        })
                        .catch(e => { throw new Error(e) })
                })
                .catch((e) => {
                    throw new Error(e)
                })
        })
})

export const calculatePrintJobCost = webMethod(Permissions.Anyone, async (details) => {

    const { name, pageCount, podId, quantity, city, countryCode, phoneNo, postCode, stateCode, street, shippingLevel } = details;

    if (!podId) {
        return 'No podID';
    }

    var raw = JSON.stringify({
        "line_items": [{
            "page_count": pageCount,
            "pod_package_id": podId,
            "quantity": quantity
        }],
        "shipping_address": {
            "name": name,
            "city": city,
            "country_code": countryCode,
            "postcode": postCode,
            "state_code": stateCode,
            "street1": street,
            "phone_number": phoneNo
        },
        "shipping_option": shippingLevel
    });

    return generateAccessToken().then((tokken) => {
        return axios({
                'method': 'POST',
                'url': `${hostUrl}/print-job-cost-calculations/`,
                'headers': {
                    'Authorization': `Bearer ${tokken}`,
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                },
                data: raw,
            })
            .then(res => res?.data)
            .catch(e => {
                if (e.response.status == 400) {
                    return {
                        status: 400,
                        data: e.response.data
                    }
                } else {
                    throw new Error(e.message);
                }
            })
    })
})

async function getPrintJobs() {
    return generateAccessToken().then((tokken)=>{
        return axios({
            'method': 'GET',
            'url': `${hostUrl}/print-jobs/statistics/`,
            'headers': {
                'Authorization': `Bearer ${Tokken}`,
                ' Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            },
        })
    })
}

export const getSinglePrintJob = webMethod(Permissions.Anyone, (id) => {

    return generateAccessToken().then((tokken) => {
        return axios({
                'method': 'GET',
                'url': `${hostUrl}/print-jobs/${id}`,
                'headers': {
                    'Authorization': `Bearer ${tokken}`,
                    ' Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                },
            }).then(res => res.data)
            .catch(e => { throw new Error(e) })
    })

})

async function cancelJob(id) {

    var raw = JSON.stringify({
        "name": "CANCELED"
    });

    return generateAccessToken().then((tokken)=>{
        return axios({
            'method': 'GET',
            'url': `${hostUrl}/print-jobs/${id}/status/`,
            'headers': {
                'Authorization': `Bearer ${Tokken}`,
                ' Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            },
            data: raw
        })
    })
}