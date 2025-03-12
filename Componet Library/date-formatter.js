/**
 * Format a date into various string representations
 * 
 * @param {Date|string} date - Date object or date string to format
 * @param {Object} options - Formatting options
 * @param {string} [options.format='long'] - Predefined format name: 
 *   'long' (March 10, 2025)
 *   'short' (Mar 10, 2025)
 *   'numeric' (3/10/2025)
 *   'iso' (2025-03-10)
 *   'time' (9:00 AM)
 *   'long-time' (March 10, 2025, 9:00 AM)
 *   'day-month' (10 March)
 *   'month-year' (March 2025)
 *   'weekday' (Monday, March 10)
 *   'relative' (Today, Yesterday, Tomorrow, or long format)
 * @param {string} [options.locale='en-US'] - Locale for formatting (e.g., 'en-US', 'fr-FR')
 * @param {Object} [options.custom] - Custom Intl.DateTimeFormat options for advanced formatting
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
    // Default options
    const defaults = {
        format: 'long',
        locale: 'en-US'
    };

    // Merge defaults with provided options
    const config = { ...defaults, ...options };

    // Convert string to Date object if needed
    const dateObject = (date instanceof Date) ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObject.getTime())) {
        console.error('Invalid date provided:', date);
        return 'Invalid Date';
    }

    // Handle relative format (Today, Yesterday, Tomorrow)
    if (config.format === 'relative') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const dateToCheck = new Date(dateObject);
        dateToCheck.setHours(0, 0, 0, 0);
        
        if (dateToCheck.getTime() === today.getTime()) {
            return 'Today';
        } else if (dateToCheck.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else if (dateToCheck.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            // Fall back to long format for other dates
            config.format = 'long';
        }
    }

    // Define formatting options based on requested format
    let formatOptions = {};
    
    switch (config.format) {
        case 'long':
            formatOptions = { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            };
            break;
            
        case 'short':
            formatOptions = { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            };
            break;
            
        case 'numeric':
            formatOptions = { 
                month: 'numeric', 
                day: 'numeric', 
                year: 'numeric' 
            };
            break;
            
        case 'iso':
            return dateObject.toISOString().split('T')[0];
            
        case 'time':
            formatOptions = { 
                hour: 'numeric', 
                minute: 'numeric', 
                hour12: true 
            };
            break;
            
        case 'long-time':
            formatOptions = { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric', 
                minute: 'numeric', 
                hour12: true 
            };
            break;
            
        case 'day-month':
            formatOptions = { 
                month: 'long', 
                day: 'numeric' 
            };
            break;
            
        case 'month-year':
            formatOptions = { 
                month: 'long', 
                year: 'numeric' 
            };
            break;
            
        case 'weekday':
            formatOptions = { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            };
            break;
            
        default:
            // Use custom options if provided, otherwise default to long format
            formatOptions = config.custom || { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            };
    }

    // Format the date using Intl.DateTimeFormat
    return new Intl.DateTimeFormat(config.locale, formatOptions).format(dateObject);
}

/**
 * Example usage:
 * 
 * // Import in your Wix page code
 * import { formatDate } from 'public/date-formatter';
 * 
 * // Basic usage with default (long) format
 * const formattedDate = formatDate(new Date()); // "March 10, 2025"
 * 
 * // Different predefined formats
 * formatDate(new Date(), { format: 'short' });       // "Mar 10, 2025"
 * formatDate(new Date(), { format: 'numeric' });     // "3/10/2025"
 * formatDate(new Date(), { format: 'iso' });         // "2025-03-10"
 * formatDate(new Date(), { format: 'time' });        // "9:00 AM"
 * formatDate(new Date(), { format: 'long-time' });   // "March 10, 2025, 9:00 AM"
 * formatDate(new Date(), { format: 'day-month' });   // "10 March"
 * formatDate(new Date(), { format: 'month-year' });  // "March 2025"
 * formatDate(new Date(), { format: 'weekday' });     // "Monday, March 10"
 * formatDate(new Date(), { format: 'relative' });    // "Today", "Yesterday", "Tomorrow", or long format
 * 
 * // Different locales
 * formatDate(new Date(), { locale: 'fr-FR' });       // "10 mars 2025"
 * formatDate(new Date(), { locale: 'es-ES' });       // "10 de marzo de 2025"
 * formatDate(new Date(), { locale: 'de-DE' });       // "10. März 2025"
 * 
 * // Custom formatting
 * formatDate(new Date(), { 
 *   custom: { 
 *     weekday: 'short', 
 *     month: 'long', 
 *     day: '2-digit',
 *     hour: '2-digit',
 *     minute: '2-digit',
 *     hour12: false
 *   } 
 * }); // "Mon, March 10, 09:00"
 */
