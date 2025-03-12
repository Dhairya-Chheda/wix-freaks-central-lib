/**
 * Generate a UI Avatar URL with customized parameters
 * 
 * @param {Object} options - Configuration options for the avatar
 * @param {string} options.name - Full name to generate initials from
 * @param {number} [options.size=128] - Size of the avatar in pixels
 * @param {string} [options.background='0D8ABC'] - Background color (hex without #)
 * @param {string} [options.color='fff'] - Text color (hex without #)
 * @param {number} [options.length=2] - Number of characters to use (1 or 2)
 * @param {number} [options.fontSize=0.5] - Font size as proportion of size (0.1-1)
 * @param {boolean} [options.rounded=false] - Whether to round the avatar
 * @param {boolean} [options.uppercase=true] - Whether to use uppercase letters
 * @param {boolean} [options.bold=false] - Whether to use bold text
 * @param {string} [options.format='svg'] - Image format (svg or png)
 * @returns {string} - The generated avatar URL
 */
export function generateAvatar(options) {
    // Set default options
    const defaults = {
        name: 'User',
        size: 128,
        background: '0D8ABC',
        color: 'fff',
        length: 2,
        fontSize: 0.5,
        rounded: false,
        uppercase: true,
        bold: false,
        format: 'svg'
    };

    // Merge defaults with provided options
    const config = { ...defaults, ...options };

    // Ensure name is valid
    if (!config.name || config.name.trim() === '') {
        config.name = 'User';
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append('name', config.name);
    params.append('size', config.size);
    params.append('background', config.background);
    params.append('color', config.color);
    params.append('length', config.length);
    params.append('font-size', config.fontSize);
    
    if (config.rounded) {
        params.append('rounded', 'true');
    }
    
    if (!config.uppercase) {
        params.append('uppercase', 'false');
    }
    
    if (config.bold) {
        params.append('bold', 'true');
    }
    
    params.append('format', config.format);

    // Construct and return the URL
    return `https://ui-avatars.com/api/?${params.toString()}`;
}

/**
 * Example usage for a user object in Wix database:
 * 
 * // Import
 * import { generateAvatar } from 'public/ui-avatars';
 * 
 * // Simple usage with just a name
 * $w("#profileImage").src = generateAvatar({ name: "John Doe" });
 * 
 * // Advanced usage with custom options
 * $w("#profileImage").src = generateAvatar({ 
 *     name: user.fullName,
 *     background: "FF5733",
 *     color: "000000",
 *     rounded: true,
 *     bold: true
 * });
 * 
 * // Dynamic user profile image (use custom if available, otherwise generate avatar)
 * function getUserProfileImage(user) {
 *     if (user.profileImage) {
 *         return user.profileImage;
 *     }
 *     
 *     return generateAvatar({
 *         name: `${user.firstName} ${user.lastName}`,
 *         rounded: true
 *     });
 * }
 */
