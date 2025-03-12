import Stripe from "stripe";
import wixSecretsBackend from 'wix-secrets-backend';

import { STRIPE_LIVE_MODE, STRIPE_LIVE_KEY, STRIPE_TEST_KEY, STRIPE_REFRESH_URL_CONNECT, SRIPE_RETURN_URL_CONNECT } from "public/stripeConstants";


let stripe;
async function getStripe() {

    if (stripe) {
        return stripe;
    }

    const stripeApiKey = await wixSecretsBackend.getSecret(STRIPE_LIVE_MODE ? STRIPE_LIVE_KEY : STRIPE_TEST_KEY);
    stripe = new Stripe(stripeApiKey);
    return stripe;

}

// Create Stripe Connect Express Account
export async function createStripeAccount(data) {
    try {
        const accountData = {
            type: "express",
            email: data.currentUserEmail,
            country: data.country,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
        };

        const individual = {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.currentUserEmail,
            address: {
                line1: data.addressLine1,
                line2: data.addressLine2,
                city: data.city,
                state: data.state,
                country: data.country,
            },
        };

        accountData.individual = individual;

        const stripe = await getStripe();
        const account = await stripe.accounts.create(accountData);

        return account;
    } catch (error) {
        console.log(error);
        return {
            success: "error",
            message: error.message,
        };
    }
}

// Create Stripe Connect Standard Account
export async function createStandardConnectAcc() {
    try {
        const accountData = {
            type: "standard",
        };

        const stripe = await getStripe();
        const account = await stripe.accounts.create(accountData);

        return account;
    } catch (error) {
        console.log(error);
        return {
            success: "error",
            message: error.message,
        };
    }
}

// check connected accounts onboarding status
export async function checkForPendingRequirements(accountId) {
    try {
        const stripe = await getStripe();
        const account = await stripe.accounts.retrieve(accountId);
        if (
            account.requirements.currently_due.length > 0 ||
            account.requirements.eventually_due.length > 0 ||
            account.requirements.past_due.length > 0
        ) {
            return {
                success: "success",
                requirements: "pending",
            };
        }

        return {
            success: "success",
            requirements: "satisfied",
        };
    } catch (error) {
        return {
            success: "error",
            message: error.message,
        };
    }
}

export async function getLoginLink(accountId) {
    try {
        const stripe = await getStripe();
        const loginUrl = await stripe.accounts.createLoginLink(accountId);
        return {
            success: "success",
            loginUrl: loginUrl.url,
        };
    } catch (error) {
        return {
            success: "error",
            message: error.message,
        };
    }
}

async function createAccountLink(accountId) {
    try {
        const stripe = await getStripe();
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: STRIPE_REFRESH_URL_CONNECT,
            return_url: SRIPE_RETURN_URL_CONNECT,
            type: "account_onboarding",
            collection_options: {
                fields: "eventually_due",
                future_requirements: "include",
            },
        });

        return {
            success: "success",
            account_url: accountLink.url,
        };
    } catch (error) {
        console.log(error);
        return {
            success: "error",
            message: error.message,
        };
    }
}