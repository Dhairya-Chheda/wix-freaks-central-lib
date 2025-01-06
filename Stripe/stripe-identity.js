import { Permissions, webMethod } from "wix-web-module";
import stripe from "stripe";
import wixSecretsBackend from "wix-secrets-backend";

export const createVerificatioinSesseion = webMethod(
    Permissions.Anyone,
    async (memberId, returnUrl) => {
        try {
            const apiKey = await wixSecretsBackend.getSecret("Stripe_Identity_Secret_API_KEY");
            const stripeInstance = stripe(apiKey);
            const verificationSession = await stripeInstance.identity.verificationSessions.create({
                type: 'document',
                metadata: {
                    user_id: memberId,
                },
                return_url: returnUrl
            });
            if(verificationSession.error){
                throw new Error(verificationSession.error.message);
            }
            return verificationSession.url
        } catch (err) {
            console.log('Error in CreateVerificationSession: ',err);
        }
    }
);

//stripe-identity webhook to assign badge on Successfull use verification.

import { ok, badRequest } from 'wix-http-functions';
import { badges } from "wix-members.v2";
import { elevate } from "wix-auth";

export async function post_verificationUpdate(request) {

    const response = {
        "headers": {
            "Content-Type": "application/json"
        }
    }

    try {

        const body = await request.body.json();

        const userId = body.data.object.metadata.user_id;
        const status = body.data.object.status;

        if (status === "verified") {
                const elevatedAssignBadge = elevate(badges.assignBadge);
                const membersIdsWithBadge = await elevatedAssignBadge('PASTE BADGE_ID', [userId]);
                console.log("Badge Assigned Successfully!!: ",membersIdsWithBadge);
        }

        return ok(response);

    } catch (err) {
        response.body = {
            "error": err
        }
        console.log('Error from webhook: ',err);
        return badRequest(response);
    }
}