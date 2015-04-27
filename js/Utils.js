var Utils = {
    /**
     * Add cross-browser transformation to element
     *
     * @param {HTMLElement} element
     * @param {String}      transformation
     */
    setTransform: function(element, transformation) {
        element.style.webkitTransform = transformation;
        element.style.MozTransform = transformation;
        element.style.msTransform = transformation;
        element.style.OTransform = transformation;
        element.style.transform = transformation;
    },

    /**
     * Check if browser is Safari
     * Chrome also includes 'Safari' in UA string, must check for absence of 'Chrome' too
     *
     * @returns {Boolean}
     */
    isSafari: function() {
        return navigator.userAgent.indexOf('Safari') > -1 &&
            navigator.userAgent.indexOf('Chrome') === -1;
    }
};
