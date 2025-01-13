import wixSecretsBackend from 'wix-secrets-backend';
import wixFetch from 'wix-fetch';


// const emailResp = sendEmail({ receiver, subject, template }, emailSenderName, emailLabel, resendDomain);
// emailResp.then((emailId) => {}).catch((error) => {console.log(error);} )
export const sendEmail = async (emailContent, admin = "WixFreaks Support", label = "app-support", domain="wixdev.com") => {
    try {
        const { receiver, subject, template } = emailContent;

        // const resend = await getResend();
        const resendKey = await wixSecretsBackend.getSecret("RESEND_KEY");

        let EMAIL_SENDER = `${admin} <${label}@${domain}>`; // Manage sender email

        const resendUrl = "https://api.resend.com/emails";
        const reqOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
                from: EMAIL_SENDER,
                to: receiver,
                subject: subject,
                html: template,
            }),
        };

        const emailIdResp = await wixFetch.fetch(resendUrl, reqOptions);
        const jsonResp = await emailIdResp.json();
        return jsonResp;
        
    } catch (error) {
        console.log(error);
        return Promise.reject(error);
    }
};