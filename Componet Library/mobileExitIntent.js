import wixWindowFrontend from "wix-window-frontend";

$w.onReady(() => {
    // Configuration options
    const config = {
        scrollDiffLimit: 500,      // Minimum scroll distance to trigger (px)
        checkIntervalMs: 50,       // How often to check scroll position (ms)
        maxScrollDepth: 150,       // Maximum scroll depth to trigger (px)
        allowMultipleShows: false, // Whether lightbox can show multiple times
        clearIntervalAfterShow: false, // Whether to stop checking after first show
        lightboxId: 'ExitIntent'   // ID of the lightbox to show
    };

    // Tracking variables
    let lastScrollY = 0;
    let lightboxShown = false;

    // Set up scroll position check
    const checkInterval = setInterval(() => {
        wixWindowFrontend.getBoundingRect().then((windowSizeInfo) => {
            const currentScrollY = windowSizeInfo.scroll.y;
            const scrollDiff = lastScrollY - currentScrollY;

            // Check if we should show lightbox based on scroll behavior
            if (shouldShowLightbox(scrollDiff, currentScrollY, config, lightboxShown)) {
                console.log('Trigger lightbox!');
                wixWindowFrontend.openLightbox(config.lightboxId);
                
                // Update tracking state
                lightboxShown = !config.allowMultipleShows;

                // Optionally clear interval
                if (config.clearIntervalAfterShow) {
                    clearInterval(checkInterval);
                }
            }

            lastScrollY = currentScrollY;
        });
    }, config.checkIntervalMs);

    // Optional: Clean up interval when page unloads
    // Uncomment if needed
    // window.onunload = () => clearInterval(checkInterval);
});

/**
 * Determines if the lightbox should be shown based on scroll behavior and configuration
 * @param {number} scrollDiff - Distance scrolled since last check
 * @param {number} currentScrollY - Current scroll position
 * @param {Object} config - Configuration options
 * @param {boolean} lightboxShown - Whether lightbox has been shown
 * @returns {boolean} Whether lightbox should be shown
 */
function shouldShowLightbox(scrollDiff, currentScrollY, config, lightboxShown) {
    return (!lightboxShown &&
            scrollDiff > config.scrollDiffLimit &&
            currentScrollY < config.maxScrollDepth);
}
