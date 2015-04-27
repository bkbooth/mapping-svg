/**
 * SVGRepository Constructor
 *
 * @param {Object}  options
 * @param {Boolean} options.debug
 *
 * @constructor
 */
function SVGRepository(options) {
    options = options || {};

    this._repo = {};

    this._debug = options.debug || false;
}

/**
 * Save an SVG to the repository
 *
 * @param {String} id
 * @param {SVGSVGElement} data
 *
 * @returns {SVGSVGElement|Boolean}
 */
SVGRepository.prototype.save = function(id, data) {
    if (this._debug) console.log('SVGRepository.save', id, data, data.toString());

    if (data instanceof SVGSVGElement) {
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
 * @returns {SVGSVGElement|Boolean}
 */
SVGRepository.prototype.load = function(id) {
    if (this._debug) console.log('SVGRepository.load', id);

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
    if (this._debug) console.log('SVGRepository.has', id, this._repo.hasOwnProperty(id));

    return this._repo.hasOwnProperty(id);
};
