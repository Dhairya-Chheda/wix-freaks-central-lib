import wixData from 'wix-data';
import wixMarketingBackend from 'wix-marketing-backend';


// create new coupon
// check documentation for info
// couponScope = {
//     namespace: "pricingPlans", // app name
//     group: {
//         name: "plan",
//         entityId: "17fefc3f-e90f-4e4f-b2c2-f530abc624e2", // specific plan id to apply coupon
//     },
// }
export const getCoupon = async (discountPercentage, couponScope, couponName="Standard Coupon", usageLimit=1, couponLength=15) => {
    try {
        // We are storing all promocodes generated in one database, in order to check uniqueness of code generated
        const codes = await wixData.query("ScholarshipData").find();
        const scholCodes = codes.items[0].scholarshipCodes;
        const promoCode = getUniquePromo(couponLength, scholCodes); // code length, previously used codes

        const codeId = await wixMarketingBackend.coupons.createCoupon({
            name: couponName,
            code: promoCode,
            startTime: new Date(),
            usageLimit: usageLimit,
            percentOffRate: discountPercentage,
            scope: couponScope,
        });

        scholCodes[promoCode] = codeId.id;
        const updatedCodes = await wixData.update("ScholarshipData", codes.items[0], {
            suppressAuth: true,
        });

        return {
            success: "success",
            coupon: {
                couponId: codeId.id,
                couponCode: promoCode,
            },
        };
    } catch (error) {
        return {
            success: "error",
            message: error,
        };
    }
};

// function to get unique code
function getUniquePromo(codeLength, usedCodes) {
    const codeChars = "01234aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ56789";

    let currCode = "";

    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * codeChars.length);
        currCode += codeChars.charAt(randomIndex);
    }

    while (usedCodes[currCode]) {
        currCode = "";

        for (let i = 0; i < codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * codeChars.length);
            currCode += codeChars.charAt(randomIndex);
        }
    }

    return currCode;
}