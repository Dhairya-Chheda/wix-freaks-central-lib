let iframeId = "iframeCookie"; // id for the iframe on wix editor

// Form details hidden field ids, form id. follow the same format
const wixForms = [
    {
        // old wix form
        formId: "wixForms1", // for old wix form, form id
        formFields: [
            "utmSource", // ids for hidden fields
            "utmMedium",
            "utmCampaign",
            "utmTerm",
            "utmContent",
            "leadType",
            "referral",
            "gclid",
            "fbclid",
            "landingPage",
            "landingPageGroup",
        ],
    },
    {
        // new wix form
        formId: "offersForm", // for new wix forms, form id
    },
];

function onready() {
    // call function for each form entry mentioned above
    wixForms.forEach((form) => {
        formIframeActions(form.formId, iframeId, form.formFields);
    });
}

function formIframeActions(formId, iframeId, formFieldIds) {
    let iframeInterval;
    let formElem;
    let formInterval;

    // check for form
    function checkForm(id) {
        let count = 0;
        formInterval = setInterval(() => {
            formElem = $w(`#${id}`);
            console.log("Looking for form");

            if (formElem) {
                clearInterval(formInterval);
            } else if (count >= 30) {
                clearInterval(formInterval);
            }

            count++;
        }, 1000);
    }

    // check for iframe
    function checkFormIframe(iframeId) {
        let iframeCount = 0;
        iframeInterval = setInterval(() => {
            console.log("Looking for iframe");
            const iframeElem = $w(`#${iframeId}`);

            let utmFields;
            if (iframeElem) {
                iframeElem.onMessage((e) => {
                    if (e.data.dom) {
                        console.log("Cookie from Dom", e.data);
                        const cookie = e.data.cookie;

                        if (cookie) {
                            utmFields = JSON.parse(cookie);
                        } else {
                            utmFields = captureUtmData();

                            // if cookie not present then create new cookie by posting message to iframe
                            iframeElem.postMessage({
                                velo: "Message from velo",
                                cookie: JSON.stringify(utmFields),
                            });
                        }

                        if (utmFields.gclid && utmFields.gclid !== "none") {
                            if (utmFields.utm_source === "none") {
                                utmFields.utm_source = "google";
                            }
                            if (utmFields.utm_medium === "none") {
                                utmFields.utm_medium = "paid search";
                            }
                        } else if (utmFields.fbclid && utmFields.fbclid !== "none") {
                            if (utmFields.utm_source === "none") {
                                utmFields.utm_source = "facebook";
                            }
                            if (utmFields.utm_medium === "none") {
                                utmFields.utm_medium = "paid search";
                            }
                        }
                    }

                    // if form is present on page then update its hidden fields
                    if (formElem) {
                        if (formFieldIds) {
                            updateUtmParameters(formElem, utmFields, formFieldIds);
                        } else {
                            updateUtmParameters(formElem, utmFields);
                        }
                    }
                });

                clearInterval(iframeInterval);
            } else if (iframeCount >= 30) {
                clearInterval(iframeInterval);
            }

            iframeCount++;
        }, 1000);
    }

    checkForm(formId);
    checkFormIframe(iframeId);
}

function updateUtmParameters(formElem, formFields, formFieldIds) {
    try {
        if (!formFieldIds) {
            formElem.setFieldValues({
                utm_source: formFields.utm_source,
                utm_medium: formFields.utm_medium,
                utm_campaign: formFields.utm_campaign,
                utm_term: formFields.utm_term,
                utm_content: formFields.utm_content,
                lead_type: formFields.lead_type,
                referral: formFields.referral || formFields.refferal,
                gclid: formFields.gclid,
                fbclid: formFields.fbclid,
                landing_page: formFields.landingPage,
                landing_page_group: formFields.landingPageGroup,
            });
        } else {
            setFormFields(formFieldIds, formFields);
        }
    } catch (error) {
        console.log(error);
        setFormFields(formFieldIds, formFields);
    }
}

function setFormFields(formFieldIds, formFields) {
    const [
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        leadType,
        referral,
        gclid,
        fbclid,
        landingPage,
        landingPageGroup,
    ] = formFieldIds;
    $w(`#${utmSource}`).value = formFields.utm_source;
    $w(`#${utmMedium}`).value = formFields.utm_medium;
    $w(`#${utmCampaign}`).value = formFields.utm_campaign;
    $w(`#${utmTerm}`).value = formFields.utm_term;
    $w(`#${utmContent}`).value = formFields.utm_content;
    $w(`#${leadType}`).value = formFields.lead_type;
    $w(`#${referral}`).value = formFields.referral || formFields.refferal;
    $w(`#${gclid}`).value = formFields.gclid;
    $w(`#${fbclid}`).value = formFields.fbclid;
    $w(`#${landingPage}`).value = formFields.landingPage;
    $w(`#${landingPageGroup}`).value = formFields.landingPageGroup;
}

function captureUtmData() {
    const query = wixLocationFrontend.query;
    let utmData = {
        utm_source: query["utm_source"] || "none",
        utm_medium: query["utm_medium"] || "none",
        utm_campaign: query["utm_campaign"] || "none",
        utm_term: query["utm_term"] || "none",
        utm_content: query["utm_content"] || "none",
        lead_type: query["lead_type"] || "none",
        referral: query["referral"] || "none",
        gclid: query["gclid"] || "none",
        fbclid: query["fbclid"] || "none",
    };

    let isValidData = false;
    for (let param in utmData) {
        if (utmData[param] !== "none") {
            isValidData = true;
        }
    }

    if (isValidData) {
        utmData.landingPage = wixLocationFrontend.url.split("?")[0] || "none";
        const landingPageSegments = wixLocationFrontend.path;
        const pathUrl = landingPageSegments.slice(0, landingPageSegments.length - 1).join("/");
        utmData.landingPageGroup = wixLocationFrontend.baseUrl + `/${pathUrl}` || "none";
        return utmData;
    } else {
        return noUTMdata();
    }
}

function noUTMdata() {
    var referrer = wixWindowFrontend.referrer;
    var referralName = checkReferral(referrer);

    const landingPage = wixLocationFrontend.url.split("?")[0] || "none";
    const landingPageSegments = wixLocationFrontend.path;
    const pathUrl = landingPageSegments.slice(0, landingPageSegments.length - 1).join("/");
    const landingPageGroup = wixLocationFrontend.baseUrl + `/${pathUrl}` || "none";

    if (referralName) {
        var data = {
            utm_source: referralName.name,
            utm_medium: referralName.medium,
            utm_campaign: "none",
            utm_term: "none",
            utm_content: "none",
            lead_type: "none",
            referral: referrer.split("?")[0],
            gclid: "none",
            fbclid: "none",
            landingPage,
            landingPageGroup,
        };
        return data;
    } else {
        console.log("No referral source detected.");
        var data2 = {
            utm_source: "none",
            utm_medium: "organic traffic",
            utm_campaign: "none",
            utm_term: "none",
            utm_content: "none",
            lead_type: "none",
            referral: "none",
            gclid: "none",
            fbclid: "none",
            landingPage,
            landingPageGroup,
        };
        return data2;
    }
}

function isValidData(data) {
    const phoneRegex = /^\d+$/;

    const emailRegex = /^[a-zA-Z0–9._-]+@[a-zA-Z0–9.-]+\.[a-zA-Z]{2,4}$/;

    const isNameValid = data.Name && data.Name.trim() !== "";
    const isPhoneValid =
        data.Phone && data.Phone.trim() !== "" && phoneRegex.test(data.Phone.trim());

    const isEmailValid = !data.Email || emailRegex.test(data.Email.trim());

    return isNameValid && isPhoneValid && isEmailValid;
}

const referralMatchers = [
    {
        pattern: "(?:twitter.com|t.co)",
        result: { name: "Twitter", medium: "organic social" },
    },
    {
        pattern: "(?:google).*(?:\\/url\\?|\\/search\\?)",
        result: { name: "Google", medium: "organic search" },
    },
    {
        pattern: "(?:facebook.com|fb.com)",
        result: { name: "Facebook", medium: "organic social" },
    },
    {
        pattern: "pinterest.com",
        result: { name: "Pinterest", medium: "organic social" },
    },
    {
        pattern: "(?:youtube.com|youtu.be)",
        result: { name: "YouTube", medium: "organic video" },
    },
    {
        pattern: "linkedin.com",
        result: { name: "LinkedIn", medium: "organic social" },
    },
    {
        pattern: "instagram.com",
        result: { name: "Instagram", medium: "organic social" },
    },
    {
        pattern: "reddit.com",
        result: { name: "Reddit", medium: "organic social" },
    },
    { pattern: "quora.com", result: { name: "Quora", medium: "organic social" } },
    {
        pattern: "tiktok.com",
        result: { name: "TikTok", medium: "organic social" },
    },
    {
        pattern: "(?:google).*adurl",
        result: { name: "Google Ads", medium: "paid search" },
    },
    { pattern: "bing.com", result: { name: "Bing", medium: "organic search" } },
    { pattern: "yahoo.com", result: { name: "Yahoo", medium: "organic search" } },
    {
        pattern: "duckduckgo.com",
        result: { name: "DuckDuckGo", medium: "organic search" },
    },
    { pattern: ".*", result: { name: "other", medium: "organic traffic" } },
];

function checkReferral(referrerURL) {
    if (referrerURL == "") return null;
    for (const matcher of referralMatchers) {
        const regex = new RegExp(matcher.pattern);
        if (regex.test(referrerURL)) {
            return matcher.result;
        }
    }
    return null;
}
