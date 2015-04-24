/**
 * SVGRepository Constructor
 *
 * @constructor
 */
function SVGRepository() {
    this._repo = {};
}

/**
 * Save an SVG to the repository
 *
 * @param {String} id
 * @param {XMLDocument} data
 *
 * @returns {XMLDocument|Boolean}
 */
SVGRepository.prototype.save = function(id, data) {
    if (data.toString() === '[object XMLDocument]') {
        return this._repo[id] = data.cloneNode(true);
    } else {
        return false;
    }
};

/**
 * Load an SVG from the repository
 *
 * @param {String} id
 *
 * @returns {XMLDocument|Boolean}
 */
SVGRepository.prototype.load = function(id) {
    return this._repo[id].cloneNode(true) || false;
};

/**
 * Check if SVG exists in repository
 *
 * @param {String} id
 *
 * @returns {Boolean}
 */
SVGRepository.prototype.has = function(id) {
    return this._repo.hasOwnProperty(id);
};
