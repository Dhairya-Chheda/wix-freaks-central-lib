
function calculateDistance(loc1, loc2) {
    const { lat: lat1, lng: lon1 } = loc1;
    const { lat: lat2, lng: lon2 } = loc2;

    // Convert latitude and longitude from degrees to radians
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);

    // Calculate the distance using Haversine formula
    const dlat = lat2Rad - lat1Rad;
    const dlon = lon2Rad - lon1Rad;
    const a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Radius of the Earth in kilometers
    const earthRadius = 6371;

    // Calculate the distance in kilometers
    const distance = earthRadius * c;

    return distance;
}

function isWithinRadius(loc1, loc2, radius) {
    const { lat: lat1, lng: lng1 } = loc1;
    const { lat: lat2, lng: lng2 } = loc2;
    // Convert latitude and longitude from degrees to radians
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lng1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lng2);

    // Calculate the distance using Haversine formula
    const dlat = lat2Rad - lat1Rad;
    const dlon = lon2Rad - lon1Rad;
    const a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Radius of the Earth in kilometers (you can adjust this value)
    const earthRadius = 6371;

    // Calculate the distance in kilometers
    const distance = earthRadius * c;

    // Check if the distance is within the specified radius
    return distance <= radius;
}
export const fetchAddress = async (latitude, longitude) => {
    if (!latitude || !longitude) {
        console.error("Latitude and Longitude are required!");
        return;
    }

    try {
        // Nominatim API endpoint
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

        // Fetch address from the API
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch address: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Build the address object
        const address = {
            formatted: data.display_name || "Unknown Address",
            location: {
                latitude,
                longitude,
            },
            streetAddress: {
                name: data.suburb || data.neighbourhood || "Unknown Suburb",
            },
            city: data.city || data.town || data.village || "Unknown City",
            subdivision: data.state || "Unknown State",
            country: data.country || "Unknown Country",
            postalCode: data.postcode || "Unknown Postal Code",
        };

        return address;

    } catch (error) {
        console.error("Error fetching address:", error);
        return null;
    }
};
