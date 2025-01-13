import { currentCart, checkout,  } from "wix-ecom-backend";

// get current cart items
export const getCartDetails = async () => {
try {
    const currCart = await currentCart.getCurrentCart();
    const currency = currCart.currency.toLowerCase();
    let planDetails;
    const lineItems = currCart.lineItems.map((item) => {
        // products for plans created on Wix Store
        if (item.catalogReference.catalogItemId === "5c2d6b95-0105-3b1a-1666-a7b5acb6eedb") {
            planDetails = "price_1PIW8lRsiHdA4aoW162zuwjd";
        } else if (
            item.catalogReference.catalogItemId === "7e99a4db-e0f5-6900-aa9a-8774bdbe3f0b"
        ) {
            planDetails = "price_1PDKGwRsiHdA4aoWSypS6RVa";
        }

        return {
            name: item.productName.original,
            price: item.priceBeforeDiscounts.amount,
            currency: currency,
            quantity: item.quantity,
            catalogReference: item.catalogReference,
            physicalProperties: item.physicalProperties,
            productName: item.productName,
            itemType: item.itemType,
        };
    });

    const couponIndex = currCart.appliedDiscounts.findIndex((discItem) => {
        return discItem.coupon ? true : false;
    });
    let coupon;
    if (couponIndex >= 0) {
        coupon = currCart.appliedDiscounts[couponIndex].coupon;
    }

    return {
        _id: currCart._id,
        currency,
        lineItems,
        planDetails,
        coupon,
    };
} catch (error) {
    console.log(error);
}
};

// Empty current cart
export const emptyCurrCart = async () => {
    try {
        const lineItemIds = [];
        const currCart = await currentCart.getCurrentCart();
        console.log("current cart after checkout", currCart);
        currCart.lineItems.forEach((item) => {
            lineItemIds.push(item._id);
        });

        if (lineItemIds.length > 0) {
            await currentCart.removeLineItemsFromCurrentCart(lineItemIds);
        }
    } catch (error) {
        console.log(error);
    }
};

// create checkout
export const createCheckout = async (cartDetails, overrideUrl) => {
    try {
        // line items for checkout
        const purchItems = cartDetails.lineItems.map((item) => {
            if (item) {
                return {
                    catalogReference: item.catalogReference,
                    quantity: item.quantity,
                };
            }
        });

        const newCheckout = await checkout.createCheckout({
            channelType: "WEB",
            lineItems: purchItems,
            cartId: cartDetails._id,
            overrideCheckoutUrl: overrideUrl, // override checkout url if required
        });

        return newCheckout;
    } catch (error) {
        console.log(error);
    }
};

// get checkout url
export const getCheckoutUrl = async (checkoutId) => {
    try {
        const checkoutUrl = await checkout.getCheckoutUrl(checkoutId);
        return checkoutUrl;
    } catch (error) {
        console.log(error);
    }
};