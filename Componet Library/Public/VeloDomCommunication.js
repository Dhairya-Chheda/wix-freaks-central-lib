// Custom code needs to be added to sites custom codes from settings

var portalCookie;
var count = 0;
var intervalIdCustCode = setInterval(() => {
    sendMessageToFirstIframe({ dom: "Message from DOM" });
}, 1000);
function sendMessageToFirstIframe(message) {
    const iframe = document.querySelector(
        "#comp-lyijzkpq_r_comp-lzwq1go6 > wix-iframe > div > iframe" // selector for iframe
    ) || document.querySelector(
        "#comp-lye8busp_r_comp-lzwq1go6 > wix-iframe > div > iframe" // // selector for iframe on pricing plans page
    );
    //#comp-lyijzkpq_r_comp-lzwq1go6 > wix-iframe > div > iframe
    //#comp-lye8busp_r_comp-lzwq1go6 > wix-iframe > div > iframe
    // console.log("iframe", iframe); 
    if (iframe) {
        portalCookie = iframe;
        window.addEventListener("message", function (event) {
            if (event.source === portalCookie.contentWindow) {
                if (event.data.velo) {
                    // console.log("Message recieved from Velo in the DOM:", event.data.velo);
                    const cookie = event.data.cookie;
                    if (cookie) {
                        setCookie("lila_utm_data", cookie, 30);
                    }
                }
            }
        });

        setTimeout(() => {
            const cookie = getCookie("lila_utm_data");
            message.cookie = cookie;
            portalCookie.contentWindow.postMessage(message, "*");
        }, 2000);
        clearInterval(intervalIdCustCode);
        count++;
    } else {
        console.log("No iframe found in the document.");
        if (count >= 30) {
            clearInterval(intervalIdCustCode);
        }

        count++;
    }
}

// Function to get a cookie by name
function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Function to set a cookie
function setCookie(name, value, days) {
    // console.log(`Setting cookie: ${name}`);
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
    // console.log(`Set cookie ${name}: ${value} (expires in ${days} days)`);
}



// Code for iframe. needs to inserted within iframe code
// ----------------------------------------------------------------------------------------------------------------------

window.addEventListener("message", function (event) {
    if (event.data.dom) {
        console.log("Message recieved from DOM in the iFrame:", event.data.dom);
        window.parent.postMessage({ ...event.data }, "*");
    }
    if (event.data.velo) {
        console.log("Message recieved from Velo in iFrames:", event.data);
        window.parent.postMessage({ ...event.data }, "*");
    }
});