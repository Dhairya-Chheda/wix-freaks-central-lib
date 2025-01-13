import Stripe from "stripe";
import wixSecretsBackend from 'wix-secrets-backend';

import { STRIPE_LIVE_MODE, STRIPE_LIVE_KEY, STRIPE_TEST_KEY, SRIPE_RETURN_URL_CUST_PORTAL } from "public/stripeConstants";


let stripe;
async function getStripe() {

    if (stripe) {
        return stripe;
    }

    const stripeApiKey = await wixSecretsBackend.getSecret(STRIPE_LIVE_MODE ? STRIPE_LIVE_KEY : STRIPE_TEST_KEY);
    stripe = new Stripe(stripeApiKey);
    return stripe;

}

// check for active subscription
export const isSubscriptionActive = async (subscriptionId) => {
    try {
        const stripe = await getStripe();
        const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscriptionDetails.status === "active" || subscriptionDetails.status === "trialing") {
            return true;
        }

        return false;
    } catch (error) {
        console.log(error);
    }
};

// function to get customer portal redirect
export const getCustomerPortalSession = async (customerId) => {
    try {
        const stripe = await getStripe();
        const custPortalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: SRIPE_RETURN_URL_CUST_PORTAL,
        });

        return {
            success: "success",
            custSession: custPortalSession,
        };
    } catch (error) {
        return {
            success: "error",
            message: error.message,
        };
    }
};