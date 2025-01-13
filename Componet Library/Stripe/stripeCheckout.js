import Stripe from "stripe";
import wixSecretsBackend from 'wix-secrets-backend';
import wixMembersBackend from 'wix-members-backend';
import wixData from 'wix-data';

import { STRIPE_LIVE_MODE, STRIPE_LIVE_KEY, STRIPE_TEST_KEY, STRIPE_SUCCESS_URL, SRIPE_CANCEL_URL } from "public/stripeConstants";


let stripe;
async function getStripe() {

    if (stripe) {
        return stripe;
    }

    const stripeApiKey = await wixSecretsBackend.getSecret(STRIPE_LIVE_MODE ? STRIPE_LIVE_KEY : STRIPE_TEST_KEY);
    stripe = new Stripe(stripeApiKey);
    return stripe;

}

// create checkout with new product and prices for lineitems with transfer to Connected Account
async function createCheckoutLink({
    stripeConnectAcc,
    currency = "usd",
    lineItems = [],
    mode = "payment",
    message = "Default Message",
}) {
    let toReturn = {
        status: "error",
        lineItems,
    };

    try {
        const stripe = await getStripe();
        // name and price
        let line_items = [];
        for (const lineItem of lineItems) {
            const { name, price } = lineItem;
            const product = await stripe.products.create({ name });
            const unit_amount = Math.floor(price * 100);

            const toPrice = {
                unit_amount,
                product: product.id,
                currency: "usd",
            };

            if (mode === "subscription") {
                toPrice.recurring = { interval: lineItem.interval }; // if subscription, pass interval type with lineItem like month, year, etc
            }

            const priceObj = await stripe.prices.create(toPrice);

            line_items.push({
                price: priceObj.id,
                quantity: 1,
            });
        }

        // Creating session object with payment intent
        const sessionObj = {
            line_items: line_items,
            mode,
            success_url: STRIPE_SUCCESS_URL,
            cancel_url: SRIPE_CANCEL_URL,
            currency: currency,
        };

        // get stripe account for selected receiver
        // if mode is payment then create payment intent object
        if (mode === "payment") {
            const payment_intent_data = {
                transfer_data: {
                    destination: stripeConnectAcc,
                    amount: "<Amount_Transfer_Destination_Acc>", // Amount needs to calculated
                },
            };
            sessionObj.payment_intent_data = payment_intent_data;
        } else if (mode === "subscription") {
            const subscription_data = {
                transfer_data: {
                    destination: stripeConnectAcc,
                    amount_percent: "<Percent_Amount_Transfer_Destination_Acc>", // amount percent needs to be transferred
                },
            };
            sessionObj.subscription_data = subscription_data;
        }

        if (message) {
            sessionObj.metadata = { message };
        }

        const session = await stripe.checkout.sessions.create(sessionObj);
        return session;
    } catch (e) {
        console.error(e);
        console.error(toReturn);
        return toReturn;
    }
}

export const getCheckoutLink = async (planPriceId, productList = [], currency = "USD", coupon = null) => {
    try {
        const stripe = await getStripe();

        // name and price
        let line_items = [];

        // list to track items for order creation
        const products_list = [];
        let totalWeight = 0;

        for (const prod of productList) {
            const {
                name,
                price,
                currency,
                quantity,
                catalogReference, //Optional // Wix Store product catalog reference
                productName, //Optional // wix Store product name property
                itemType, //Optional // wix store product item type
                physicalProperties, //Optional // wix store product property
            } = prod;

            // Product created for membership plan on wix stores
            if (catalogReference.catalogItemId === "5c2d6b95-0105-3b1a-1666-a7b5acb6eedb") {
                continue;
            }
            if (catalogReference.catalogItemId === "7e99a4db-e0f5-6900-aa9a-8774bdbe3f0b") {
                continue;
            }

            // 20% discount on product as they are purchasing plan
            const unit_amount = price * 100 - Math.round(price * 100 * 0.2);

            // We can avaoid creating product and price each time
            // create product and price and directly we can use that price id or product id

            // create price for products other than membership plans
            const toPrice = {
                unit_amount,
                currency,
                product_data: {
                    name,
                },
                // metadata for tracking purpose // Optional
                metadata: {
                    catalogReference: JSON.stringify(catalogReference),
                    productName: JSON.stringify(productName),
                    itemType: JSON.stringify(itemType),
                    physicalProperties: JSON.stringify(physicalProperties),
                },
            };

            const priceObj = await stripe.prices.create(toPrice);
            priceObj.quantity = quantity;
            products_list.push(priceObj);

            // adding product weights
            totalWeight += physicalProperties.weight * quantity;

            line_items.push({
                price: priceObj.id,
                quantity: quantity,
            });
        }

        // membership plan
        line_items.push({
            price: planPriceId,
            quantity: 1,
        });

        // push plan to list
        products_list.push({
            id: planPriceId,
            quantity: 1,
        });

        // Here also we can avoid price creation every time.
        // We can create shipping prices on stripe and use those price ids

        // check for shipping charge
        if (!coupon || coupon.code != "RDCfree") {
            // calculate shipping charge
            const shipCharge = getShippingCharge(totalWeight);

            const shipPriceObj = {
                unit_amount: shipCharge * 100,
                currency,
                product_data: {
                    name: "Shipping Charge",
                },
            };

            const shipPrice = await stripe.prices.create(shipPriceObj);
            line_items.push({
                price: shipPrice.id,
                quantity: 1,
            });
        } else {
            const shipPriceObj = {
                unit_amount: 0,
                currency,
                product_data: {
                    name: "Free Shipping",
                },
            };

            const shipPrice = await stripe.prices.create(shipPriceObj);
            line_items.push({
                price: shipPrice.id,
                quantity: 1,
            });
        }

        // Creating session object
        const sessionObj = {
            line_items: line_items,
            mode: "subscription",
            success_url: STRIPE_SUCCESS_URL,
            cancel_url: SRIPE_CANCEL_URL,
            currency: currency,
            shipping_address_collection: {
                allowed_countries: ["US", "CA"],
            },
        };

        // create or get customer
        const currMember = await wixMembersBackend.currentMember.getMember({
            fieldsets: ["FULL"],
        });

        // get saved customer id for user
        const userDtls = await wixData.query("UserDetails").eq("_owner", currMember._id).find();

        if (userDtls.items.length <= 0) {
            console.log("userDetails not found while creating checkout");
            return;
        }

        // Customer creation
        if (userDtls.items[0].customerId) {
            sessionObj.customer = userDtls.items[0].customerId;
        } else {
            const customer = await stripe.customers.create({
                name: userDtls.items[0].fullName,
                email: userDtls.items[0].email,
            });
            sessionObj.customer = customer.id;
            userDtls.items[0].customerId = customer.id;
        }

        const session = await stripe.checkout.sessions.create(sessionObj);

        userDtls.items[0].checkoutId = session.id;
        userDtls.items[0].lineItems = products_list;

        // update user details with checkout id
        await wixData.update("UserDetails", userDtls.items[0], { suppressAuth: true });

        return session;
    } catch (error) {
        return {
            success: "error",
            message: error,
        };
    }
}

// get shipping charge
function getShippingCharge(totalWeight) {

    switch (true) {
    case (totalWeight <= 60):
        return 40;

    case (totalWeight > 60 && totalWeight <= 120):
        return 80;

    case (totalWeight > 120 && totalWeight <= 160):
        return 120;

    case (totalWeight > 160 && totalWeight <= 200):
        return 160;

    case (totalWeight > 200 && totalWeight <= 500):
        return 200;

    case (totalWeight > 500 && totalWeight <= 1000):
        return 300;

    case (totalWeight > 1000 && totalWeight <= 1500):
        return 400;

    case (totalWeight > 1500 && totalWeight <= 2000):
        return 500;

    case (totalWeight > 2000 && totalWeight <= 2500):
        return 600;

    case (totalWeight > 2500 && totalWeight <= 5000):
        return 1100;

    case (totalWeight > 5000 && totalWeight <= 10000):
        return 1500;

    case (totalWeight > 10000):
        return 1600;

    default:
        return 0;
    }

}