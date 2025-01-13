import { ok, badRequest } from "wix-http-functions";
import Stripe from "stripe";
import wixSecretsBackend from "wix-secrets-backend";

// import functions for calling them on webhook request received
// import {
//     updateCheckoutSessionStatus,
//     updateSubscription,
//     deleteSubscription,
// } from "backend/webhookActions.web";

import {
    STRIPE_LIVE_MODE,
    STRIPE_LIVE_KEY,
    STRIPE_TEST_KEY,
    STRIPE_ENDPOINT_SECRET,
} from "public/stripeConstants";

let stripe;
async function getStripe() {
    if (stripe) {
        return stripe;
    }

    const stripeApiKey = await wixSecretsBackend.getSecret(
        STRIPE_LIVE_MODE ? STRIPE_LIVE_KEY : STRIPE_TEST_KEY
    );
    stripe = new Stripe(stripeApiKey);
    return stripe;
}

// Stripe webhook endpoint
export async function post_updateCheckoutDetails(request) {
    try {
        const sign = request.headers["stripe-signature"];
        const endSecret = await wixSecretsBackend.getSecret(STRIPE_ENDPOINT_SECRET); // Stripe endpoint secret
        const stripe = await getStripe();
        const reqBody = await request.body.buffer();
        const eventData = stripe.webhooks.constructEvent(reqBody, sign, endSecret);

        // checkout complete
        if (eventData.type && eventData.type === "checkout.session.completed") {
            // updateCheckoutSessionStatus(eventData); // checkout completed action
        }
        // subscription ends
        else if (eventData.type && eventData.type === "customer.subscription.deleted") {
            // deleteSubscription(eventData); // subscription deleted action
        }
        // subscription updates
        else if (eventData.type && eventData.type === "customer.subscription.updated") {
            // updateSubscription(eventData); // subscription updated action
        }

        return ok({
            headers: {
                "Content-Type": "application/json",
            },
            body: {
                received: true,
            },
        });
    } catch (error) {
        return badRequest({ body: { message: error.message } });
    }
}