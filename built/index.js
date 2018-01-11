define("render", ["require", "exports", "openlayers"], function (require, exports, ol) {
    "use strict";
    const MeterConvert = {
        "m": 1,
        "km": 1 / 1000,
        "ft": 3.28084,
        "in": 39.37008,
        "mi": 0.000621371
    };
    function round(v) {
        return Math.round(v * 100) / 100;
    }
    function englishUnits(v) {
        let result = "";
        let feet = Math.floor(v);
        let inches = Math.floor(12 * (v - feet));
        if (feet)
            result += `${feet}'`;
        if (inches)
            result += `${inches}"`;
        return result;
    }
    function getLength(geom) {
        return geom.getLineStrings().reduce((a, b) => a + b.getLength(), 0); // * MeterConvert["ft"];
    }
    class Renderer {
        constructor() {
            this.state = {
                units: "ft",
                position: new ol.geom.Point([0, 0]),
                direction: 0,
                elevation: 0,
                locations: [{
                        name: "origin",
                        point: new ol.geom.Point([0, 0]),
                    }],
                stack: [],
                rightHandRule: false,
                orientations: [
                    {
                        name: "north",
                        direction: 0,
                    },
                    {
                        name: "south",
                        direction: 180,
                    },
                    {
                        name: "west",
                        direction: 90,
                    },
                    {
                        name: "east",
                        direction: -90,
                    },
                ],
            };
        }
        render(source, features = []) {
            this.features = features;
            this.state.rightHandRule = "false" !== source.righthand;
            if (source.directions)
                source.directions.forEach(d => this.addDirection(d.name, d.direction));
            if (source.places)
                source.places.forEach(d => this.addPlace(d.name, d.location));
            source.start && this.goto([source.start]);
            source.route && source.route.forEach(route => {
                let tokens = route.split(" ");
                let command = tokens.shift();
                switch (command) {
                    case "back":
                        this.back(tokens);
                        break;
                    case "ascend":
                        this.ascend(tokens);
                        break;
                    case "descend":
                        this.descend(tokens);
                        break;
                    case "face":
                        this.face(tokens);
                        break;
                    case "forward":
                        this.forward(tokens);
                        break;
                    case "goto":
                        this.goto(tokens);
                        break;
                    case "jump":
                        this.jump(tokens);
                        break;
                    case "left":
                        this.left(tokens);
                        break;
                    case "right":
                        this.right(tokens);
                        break;
                    case "rotate":
                        this.rotate(tokens);
                        break;
                    case "marker":
                        this.marker(tokens);
                        break;
                    case "move":
                        this.move(tokens);
                        break;
                    case "stop":
                        this.stop(tokens);
                        break;
                    case "push":
                        this.push(tokens);
                        break;
                    case "pop":
                        this.pop(tokens);
                        break;
                    default: console.warn(`cannot process ${command}: ${tokens}`);
                }
            });
            source.routes && source.routes.forEach(source => this.render(source, this.features));
            return this.features;
        }
        transform(geom) {
            if (geom instanceof ol.geom.Point) {
                let c = geom.getFirstCoordinate();
                return new ol.geom.Point([c[0] / MeterConvert["ft"], c[1] / MeterConvert["ft"]]);
            }
            if (geom instanceof ol.geom.MultiLineString) {
                let c = geom.getCoordinates().map(v => v.map(v => [v[0] / MeterConvert["ft"], v[1] / MeterConvert["ft"]]));
                return new ol.geom.MultiLineString(c);
            }
            throw "unknown geometry type";
        }
        push(location) {
            console.log("push", location);
            this.state.stack.push({
                position: this.state.position,
                direction: this.state.direction,
                elevation: this.state.elevation,
            });
        }
        pop(location) {
            console.log("pop", location);
            let data = this.state.stack.pop();
            this.state.position = data.position;
            this.state.direction = data.direction;
            this.state.elevation = data.elevation;
        }
        getLocation(location) {
            let key = location.join(" ");
            let result = this.state.locations.find(l => l.name === key);
            if (!result)
                console.warn(`no location for ${key}`);
            return result && result.point;
        }
        getOrientation(location) {
            let key = location.join(" ");
            let result = this.state.orientations.find(l => l.name === key);
            if (!result)
                console.warn(`no orientation for ${key}`);
            return result && result.direction;
        }
        addPlace(name, location) {
            this.state.locations.push({
                name: name,
                point: new ol.geom.Point(location)
            });
        }
        addDirection(name, direction) {
            this.state.orientations.push({
                name: name,
                direction: direction
            });
        }
        ascend(location) {
            console.log("ascend", location);
            this.state.elevation += parseFloat(location[0]);
        }
        descend(location) {
            console.log("descend", location);
            this.state.elevation -= parseFloat(location[0]);
        }
        face(location) {
            console.log("face", location);
            this.state.direction = this.getOrientation(location);
        }
        goto(location) {
            console.log("goto", location);
            this.state.position = this.getLocation(location);
        }
        jump(location) {
            console.log("jump", location);
            this.trs(location);
        }
        forward(location) {
            console.log("forward", location);
            this.trs(location);
        }
        back(location) {
            console.log("back", location);
            this.rotate(["180"]);
            this.trs(location);
            this.rotate(["-180"]);
        }
        left(location) {
            console.log("left", location);
            this.rotate(["90"]);
            this.trs(location);
            this.rotate(["-90"]);
        }
        right(location) {
            console.log("right", location);
            this.rotate(["-90"]);
            this.trs(location);
            this.rotate(["90"]);
        }
        marker(location) {
            console.log("marker", location);
            if (!this.state.locations.find(l => l.name === location[0])) {
                this.addPlace(location.join(" "), this.state.position.getCoordinates());
            }
            let point = new ol.Feature({
                name: location.join(" "),
                geometry: this.transform(this.state.position)
            });
            this.features.push(point);
        }
        move(location) {
            console.log("move", location);
            let geom = this.trs(location);
            this.features.push(new ol.Feature({
                name: englishUnits(getLength(geom)),
                orientation: (360 + this.state.direction + 90) % 180,
                geometry: this.transform(geom)
            }));
        }
        trs(location) {
            let coords = [];
            let [x, y] = this.state.position.getCoordinates();
            coords.push([x, y]);
            let scalar = parseFloat(location[0]);
            if (this.state.rightHandRule) {
                [x, y] = [x - scalar * Math.sin(Math.PI * this.state.direction / 180), y + scalar * Math.cos(Math.PI * this.state.direction / 180)];
            }
            else {
                [x, y] = [x + scalar * Math.sin(Math.PI * this.state.direction / 180), y + scalar * Math.cos(Math.PI * this.state.direction / 180)];
            }
            coords.push([x, y]);
            this.state.position = new ol.geom.Point([x, y]);
            let geom = new ol.geom.MultiLineString([coords]);
            return geom;
        }
        rotate(location) {
            console.log("rotate", location);
            this.state.direction += parseFloat(location[0]);
        }
        stop(location) {
            console.log("stop", location);
        }
    }
    var renderer = new Renderer();
    return renderer;
});
define("bower_components/ol3-fun/ol3-fun/common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Generate a UUID
     * @returns UUID
     *
     * Adapted from http://stackoverflow.com/a/2117523/526860
     */
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    function asArray(list) {
        let result = new Array(list.length);
        for (let i = 0; i < list.length; i++) {
            result.push(list[i]);
        }
        return result;
    }
    exports.asArray = asArray;
    // ie11 compatible
    function toggle(e, className, toggle = false) {
        !toggle ? e.classList.remove(className) : e.classList.add(className);
    }
    exports.toggle = toggle;
    function parse(v, type) {
        if (typeof type === "string")
            return v;
        if (typeof type === "number")
            return parseFloat(v);
        if (typeof type === "boolean")
            return (v === "1" || v === "true");
        if (Array.isArray(type)) {
            return (v.split(",").map(v => parse(v, type[0])));
        }
        throw `unknown type: ${type}`;
    }
    exports.parse = parse;
    function getQueryParameters(options, url = window.location.href) {
        let opts = options;
        Object.keys(opts).forEach(k => {
            doif(getParameterByName(k, url), v => {
                let value = parse(v, opts[k]);
                if (value !== undefined)
                    opts[k] = value;
            });
        });
    }
    exports.getQueryParameters = getQueryParameters;
    function getParameterByName(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    exports.getParameterByName = getParameterByName;
    function doif(v, cb) {
        if (v !== undefined && v !== null)
            cb(v);
    }
    exports.doif = doif;
    function mixin(a, b) {
        Object.keys(b).forEach(k => a[k] = b[k]);
        return a;
    }
    exports.mixin = mixin;
    function defaults(a, ...b) {
        b.forEach(b => {
            Object.keys(b).filter(k => a[k] === undefined).forEach(k => a[k] = b[k]);
        });
        return a;
    }
    exports.defaults = defaults;
    /**
     * Adds exactly one instance of the CSS to the app with a mechanism
     * for disposing by invoking the destructor returned by this method.
     * Note the css will not be removed until the dependency count reaches
     * 0 meaning the number of calls to cssin('id') must match the number
     * of times the destructor is invoked.
     * let d1 = cssin('foo', '.foo { background: white }');
     * let d2 = cssin('foo', '.foo { background: white }');
     * d1(); // reduce dependency count
     * d2(); // really remove the css
     * @param name unique id for this style tag
     * @param css css content
     * @returns destructor
     */
    function cssin(name, css) {
        let id = `style-${name}`;
        let styleTag = document.getElementById(id);
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = id;
            styleTag.type = "text/css";
            document.head.appendChild(styleTag);
            styleTag.appendChild(document.createTextNode(css));
        }
        let dataset = styleTag.dataset;
        dataset["count"] = parseInt(dataset["count"] || "0") + 1 + "";
        return () => {
            dataset["count"] = parseInt(dataset["count"] || "0") - 1 + "";
            if (dataset["count"] === "0") {
                styleTag.remove();
            }
        };
    }
    exports.cssin = cssin;
    function debounce(func, wait = 50, immediate = false) {
        let timeout;
        return ((...args) => {
            let later = () => {
                timeout = null;
                if (!immediate)
                    func.apply(this, args);
            };
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow)
                func.call(this, args);
        });
    }
    exports.debounce = debounce;
    /**
     * poor $(html) substitute due to being
     * unable to create <td>, <tr> elements
     */
    function html(html) {
        let a = document.createElement("div");
        a.innerHTML = html;
        return (a.firstElementChild || a.firstChild);
    }
    exports.html = html;
    function pair(a1, a2) {
        let result = [];
        a1.forEach(v1 => a2.forEach(v2 => result.push([v1, v2])));
        return result;
    }
    exports.pair = pair;
    function range(n) {
        var result = new Array(n);
        for (var i = 0; i < n; i++)
            result[i] = i;
        return result;
    }
    exports.range = range;
    // http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    function shuffle(array) {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
    exports.shuffle = shuffle;
});
define("bower_components/ol3-fun/ol3-fun/navigation", ["require", "exports", "openlayers", "bower_components/ol3-fun/ol3-fun/common"], function (require, exports, ol, common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A less disorienting way of changing the maps extent (maybe!)
     * Zoom out until new feature is visible
     * Zoom to that feature
     */
    function zoomToFeature(map, feature, options) {
        options = common_1.defaults(options || {}, {
            duration: 1000,
            padding: 256,
            minResolution: 2 * map.getView().getMinResolution()
        });
        let view = map.getView();
        let currentExtent = view.calculateExtent(map.getSize());
        let targetExtent = feature.getGeometry().getExtent();
        let doit = (duration) => {
            view.fit(targetExtent, {
                size: map.getSize(),
                padding: [options.padding, options.padding, options.padding, options.padding],
                minResolution: options.minResolution,
                duration: duration
            });
        };
        if (ol.extent.containsExtent(currentExtent, targetExtent)) {
            // new extent is contained within current extent, pan and zoom in
            doit(options.duration);
        }
        else if (ol.extent.containsExtent(currentExtent, targetExtent)) {
            // new extent is contained within current extent, pan and zoom out
            doit(options.duration);
        }
        else {
            // zoom out until target extent is in view
            let fullExtent = ol.extent.createEmpty();
            ol.extent.extend(fullExtent, currentExtent);
            ol.extent.extend(fullExtent, targetExtent);
            let dscale = ol.extent.getWidth(fullExtent) / ol.extent.getWidth(currentExtent);
            let duration = 0.5 * options.duration;
            view.fit(fullExtent, {
                size: map.getSize(),
                padding: [options.padding, options.padding, options.padding, options.padding],
                minResolution: options.minResolution,
                duration: duration
            });
            setTimeout(() => doit(0.5 * options.duration), duration);
        }
    }
    exports.zoomToFeature = zoomToFeature;
});
// ported from https://github.com/gmaclennan/parse-dms/blob/master/index.js
define("bower_components/ol3-fun/ol3-fun/parse-dms", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function decDegFromMatch(m) {
        var signIndex = {
            "-": -1,
            "N": 1,
            "S": -1,
            "E": 1,
            "W": -1
        };
        var latLonIndex = {
            "-": "",
            "N": "lat",
            "S": "lat",
            "E": "lon",
            "W": "lon"
        };
        var degrees, minutes, seconds, sign, latLon;
        sign = signIndex[m[2]] || signIndex[m[1]] || signIndex[m[6]] || 1;
        degrees = Number(m[3]);
        minutes = m[4] ? Number(m[4]) : 0;
        seconds = m[5] ? Number(m[5]) : 0;
        latLon = latLonIndex[m[1]] || latLonIndex[m[6]];
        if (!inRange(degrees, 0, 180))
            throw 'Degrees out of range';
        if (!inRange(minutes, 0, 60))
            throw 'Minutes out of range';
        if (!inRange(seconds, 0, 60))
            throw 'Seconds out of range';
        return {
            decDeg: sign * (degrees + minutes / 60 + seconds / 3600),
            latLon: latLon
        };
    }
    function inRange(value, a, b) {
        return value >= a && value <= b;
    }
    function parse(dmsString) {
        dmsString = dmsString.trim();
        // Inspired by https://gist.github.com/JeffJacobson/2955437
        // See https://regex101.com/r/kS2zR1/3
        var dmsRe = /([NSEW])?(-)?(\d+(?:\.\d+)?)[°º:d\s]?\s?(?:(\d+(?:\.\d+)?)['’‘′:]\s?(?:(\d{1,2}(?:\.\d+)?)(?:"|″|’’|'')?)?)?\s?([NSEW])?/i;
        var dmsString2;
        let m1 = dmsString.match(dmsRe);
        if (!m1)
            throw 'Could not parse string';
        // If dmsString starts with a hemisphere letter, then the regex can also capture the 
        // hemisphere letter for the second coordinate pair if also in the string
        if (m1[1]) {
            m1[6] = undefined;
            dmsString2 = dmsString.substr(m1[0].length - 1).trim();
        }
        else {
            dmsString2 = dmsString.substr(m1[0].length).trim();
        }
        let decDeg1 = decDegFromMatch(m1);
        let m2 = dmsString2.match(dmsRe);
        let decDeg2 = m2 && decDegFromMatch(m2);
        if (typeof decDeg1.latLon === 'undefined') {
            if (!isNaN(decDeg1.decDeg) && decDeg2 && isNaN(decDeg2.decDeg)) {
                // If we only have one coordinate but we have no hemisphere value,
                // just return the decDeg number
                return decDeg1.decDeg;
            }
            else if (!isNaN(decDeg1.decDeg) && decDeg2 && !isNaN(decDeg2.decDeg)) {
                // If no hemisphere letter but we have two coordinates,
                // infer that the first is lat, the second lon
                decDeg1.latLon = 'lat';
                decDeg2.latLon = 'lon';
            }
            else {
                throw 'Could not parse string';
            }
        }
        // If we parsed the first coordinate as lat or lon, then assume the second is the other
        if (typeof decDeg2.latLon === 'undefined') {
            decDeg2.latLon = decDeg1.latLon === 'lat' ? 'lon' : 'lat';
        }
        return {
            [decDeg1.latLon]: decDeg1.decDeg,
            [decDeg2.latLon]: decDeg2.decDeg
        };
    }
    exports.parse = parse;
});
define("bower_components/ol3-fun/index", ["require", "exports", "bower_components/ol3-fun/ol3-fun/common", "bower_components/ol3-fun/ol3-fun/navigation", "bower_components/ol3-fun/ol3-fun/parse-dms"], function (require, exports, common, navigation, dms) {
    "use strict";
    let index = common.defaults(common, {
        dms: dms,
        navigation: navigation
    });
    return index;
});
define("bower_components/ol3-layerswitcher/ol3-layerswitcher/ol3-layerswitcher", ["require", "exports", "openlayers", "bower_components/ol3-fun/index"], function (require, exports, ol, ol3_fun_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Creates an array containing all sub-layers
     */
    function allLayers(lyr) {
        let result = [];
        lyr.getLayers().forEach(function (lyr, idx, a) {
            result.push(lyr);
            if ("getLayers" in lyr) {
                result = result.concat(allLayers(lyr));
            }
        });
        return result;
    }
    /**
     * Generate a UUID
     * @returns UUID
     *
     * Adapted from http://stackoverflow.com/a/2117523/526860
     */
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    const DEFAULT_OPTIONS = {
        tipLabel: 'Layers',
        openOnMouseOver: false,
        closeOnMouseOut: false,
        openOnClick: true,
        closeOnClick: true,
        className: 'layer-switcher',
        target: null
    };
    class LayerSwitcher extends ol.control.Control {
        /**
         * OpenLayers 3 Layer Switcher Control.
         * See [the examples](./examples) for usage.
         * @param opt_options Control options, extends olx.control.ControlOptions adding:
         *                              **`tipLabel`** `String` - the button tooltip.
         */
        constructor(options) {
            options = ol3_fun_1.defaults(options || {}, DEFAULT_OPTIONS);
            super(options);
            this.afterCreate(options);
        }
        afterCreate(options) {
            this.hiddenClassName = `ol-unselectable ol-control ${options.className}`;
            this.shownClassName = this.hiddenClassName + ' shown';
            let element = document.createElement('div');
            element.className = this.hiddenClassName;
            let button = this.button = document.createElement('button');
            button.setAttribute('title', options.tipLabel);
            element.appendChild(button);
            this.panel = document.createElement('div');
            this.panel.className = 'panel';
            element.appendChild(this.panel);
            this.unwatch = [];
            this.element = element;
            this.setTarget(options.target);
            if (options.openOnMouseOver) {
                element.addEventListener("mouseover", () => this.showPanel());
            }
            if (options.closeOnMouseOut) {
                element.addEventListener("mouseout", () => this.hidePanel());
            }
            if (options.openOnClick || options.closeOnClick) {
                button.addEventListener('click', e => {
                    this.isVisible() ? options.closeOnClick && this.hidePanel() : options.openOnClick && this.showPanel();
                    e.preventDefault();
                });
            }
        }
        isVisible() {
            return this.element.className != this.hiddenClassName;
        }
        /**
         * Show the layer panel.
         */
        showPanel() {
            if (this.element.className != this.shownClassName) {
                this.element.className = this.shownClassName;
                this.renderPanel();
            }
        }
        /**
         * Hide the layer panel.
         */
        hidePanel() {
            this.element.className = this.hiddenClassName;
            this.unwatch.forEach(f => f());
        }
        /**
         * Re-draw the layer panel to represent the current state of the layers.
         */
        renderPanel() {
            this.ensureTopVisibleBaseLayerShown();
            while (this.panel.firstChild) {
                this.panel.removeChild(this.panel.firstChild);
            }
            var ul = document.createElement('ul');
            this.panel.appendChild(ul);
            this.state = [];
            let map = this.getMap();
            let view = map.getView();
            this.renderLayers(map, ul);
            {
                let doit = () => {
                    let res = view.getResolution();
                    this.state.filter(s => !!s.input).forEach(s => {
                        let min = s.layer.getMinResolution();
                        let max = s.layer.getMaxResolution();
                        s.input.disabled = !(min <= res && (max === 0 || res < max));
                    });
                };
                let h = view.on("change:resolution", doit);
                doit();
                this.unwatch.push(() => ol.Observable.unByKey(h));
            }
        }
        ;
        /**
         * Ensure only the top-most base layer is visible if more than one is visible.
         */
        ensureTopVisibleBaseLayerShown() {
            let visibleBaseLyrs = allLayers(this.getMap()).filter(l => l.get('type') === 'base' && l.getVisible());
            if (visibleBaseLyrs.length)
                this.setVisible(visibleBaseLyrs.shift(), true);
        }
        ;
        /**
         * Toggle the visible state of a layer.
         * Takes care of hiding other layers in the same exclusive group if the layer
         * is toggle to visible.
         */
        setVisible(lyr, visible) {
            if (lyr.getVisible() !== visible) {
                if (visible && lyr.get('type') === 'base') {
                    // Hide all other base layers regardless of grouping
                    allLayers(this.getMap()).filter(l => l !== lyr && l.get('type') === 'base' && l.getVisible()).forEach(l => this.setVisible(l, false));
                }
                lyr.setVisible(visible);
                this.dispatchEvent({
                    type: visible ? "show-layer" : "hide-layer",
                    layer: lyr
                });
            }
        }
        ;
        /**
         * Render all layers that are children of a group.
         */
        renderLayer(lyr, container) {
            let result;
            let li = document.createElement('li');
            container.appendChild(li);
            let lyrTitle = lyr.get('title');
            let label = document.createElement('label');
            label.htmlFor = uuid();
            lyr.on('load:start', () => li.classList.add("loading"));
            lyr.on('load:end', () => li.classList.remove("loading"));
            ol3_fun_1.toggle(li, "loading", true === lyr.get("loading"));
            if ('getLayers' in lyr && !lyr.get('combine')) {
                if (!lyr.get('label-only')) {
                    let input = result = document.createElement('input');
                    input.id = label.htmlFor;
                    input.type = 'checkbox';
                    input.checked = lyr.getVisible();
                    input.addEventListener('change', () => {
                        ol3_fun_1.toggle(ul, 'hide-layer-group', !input.checked);
                        this.setVisible(lyr, input.checked);
                        let childLayers = lyr.getLayers();
                        this.state.filter(s => s.container === ul && s.input && s.input.checked).forEach(state => {
                            this.setVisible(state.layer, input.checked);
                        });
                    });
                    li.appendChild(input);
                }
                li.classList.add('group');
                label.innerHTML = lyrTitle;
                li.appendChild(label);
                let ul = document.createElement('ul');
                result && ol3_fun_1.toggle(ul, 'hide-layer-group', !result.checked);
                li.appendChild(ul);
                this.renderLayers(lyr, ul);
            }
            else {
                li.classList.add('layer');
                let input = result = document.createElement('input');
                input.id = label.htmlFor;
                if (lyr.get('type') === 'base') {
                    input.classList.add('basemap');
                    input.type = 'radio';
                    input.addEventListener("change", () => {
                        if (input.checked) {
                            ol3_fun_1.asArray(this.panel.getElementsByClassName("basemap")).filter(i => i.tagName === "INPUT").forEach(i => {
                                if (i.checked && i !== input)
                                    i.checked = false;
                            });
                        }
                        this.setVisible(lyr, input.checked);
                    });
                }
                else {
                    input.type = 'checkbox';
                    input.addEventListener("change", () => {
                        this.setVisible(lyr, input.checked);
                    });
                }
                input.checked = lyr.get('visible');
                li.appendChild(input);
                label.innerHTML = lyrTitle;
                li.appendChild(label);
            }
            this.state.push({
                container: container,
                input: result,
                layer: lyr
            });
        }
        /**
         * Render all layers that are children of a group.
         */
        renderLayers(map, elm) {
            var lyrs = map.getLayers().getArray().slice().reverse();
            return lyrs.filter(l => !!l.get('title')).forEach(l => this.renderLayer(l, elm));
        }
    }
    exports.LayerSwitcher = LayerSwitcher;
});
define("bower_components/ol3-layerswitcher/index", ["require", "exports", "bower_components/ol3-layerswitcher/ol3-layerswitcher/ol3-layerswitcher"], function (require, exports, LayerSwitcher) {
    "use strict";
    return LayerSwitcher;
});
define("bower_components/ol3-symbolizer/ol3-symbolizer/format/base", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("bower_components/ol3-symbolizer/ol3-symbolizer/format/ol3-symbolizer", ["require", "exports", "openlayers"], function (require, exports, ol) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function doif(v, cb) {
        if (v !== undefined && v !== null)
            cb(v);
    }
    function mixin(a, b) {
        Object.keys(b).forEach(k => a[k] = b[k]);
        return a;
    }
    class StyleConverter {
        fromJson(json) {
            return this.deserializeStyle(json);
        }
        toJson(style) {
            return this.serializeStyle(style);
        }
        /**
         * uses the interior point of a polygon when rendering a 'point' style
         */
        setGeometry(feature) {
            let geom = feature.getGeometry();
            if (geom instanceof ol.geom.Polygon) {
                geom = geom.getInteriorPoint();
            }
            return geom;
        }
        assign(obj, prop, value) {
            //let getter = prop[0].toUpperCase() + prop.substring(1);
            if (value === null)
                return;
            if (value === undefined)
                return;
            if (typeof value === "object") {
                if (Object.keys(value).length === 0)
                    return;
            }
            if (prop === "image") {
                if (value.hasOwnProperty("radius")) {
                    prop = "circle";
                }
                if (value.hasOwnProperty("points")) {
                    prop = "star";
                }
            }
            obj[prop] = value;
        }
        serializeStyle(style) {
            let s = {};
            if (!style)
                return null;
            if (typeof style === "string")
                return style;
            if (typeof style === "number")
                return style;
            if (style.getColor)
                mixin(s, this.serializeColor(style.getColor()));
            if (style.getImage)
                this.assign(s, "image", this.serializeStyle(style.getImage()));
            if (style.getFill)
                this.assign(s, "fill", this.serializeFill(style.getFill()));
            if (style.getOpacity)
                this.assign(s, "opacity", style.getOpacity());
            if (style.getStroke)
                this.assign(s, "stroke", this.serializeStyle(style.getStroke()));
            if (style.getText)
                this.assign(s, "text", this.serializeStyle(style.getText()));
            if (style.getWidth)
                this.assign(s, "width", style.getWidth());
            if (style.getOffsetX)
                this.assign(s, "offset-x", style.getOffsetX());
            if (style.getOffsetY)
                this.assign(s, "offset-y", style.getOffsetY());
            if (style.getWidth)
                this.assign(s, "width", style.getWidth());
            if (style.getFont)
                this.assign(s, "font", style.getFont());
            if (style.getRadius)
                this.assign(s, "radius", style.getRadius());
            if (style.getRadius2)
                this.assign(s, "radius2", style.getRadius2());
            if (style.getPoints)
                this.assign(s, "points", style.getPoints());
            if (style.getAngle)
                this.assign(s, "angle", style.getAngle());
            if (style.getRotation)
                this.assign(s, "rotation", style.getRotation());
            if (style.getOrigin)
                this.assign(s, "origin", style.getOrigin());
            if (style.getScale)
                this.assign(s, "scale", style.getScale());
            if (style.getSize)
                this.assign(s, "size", style.getSize());
            if (style.getAnchor) {
                this.assign(s, "anchor", style.getAnchor());
                "anchorXUnits,anchorYUnits,anchorOrigin".split(",").forEach(k => {
                    this.assign(s, k, style[`${k}_`]);
                });
            }
            // "svg"
            if (style.path) {
                if (style.path)
                    this.assign(s, "path", style.path);
                if (style.getImageSize)
                    this.assign(s, "imgSize", style.getImageSize());
                if (style.stroke)
                    this.assign(s, "stroke", style.stroke);
                if (style.fill)
                    this.assign(s, "fill", style.fill);
                if (style.scale)
                    this.assign(s, "scale", style.scale); // getScale and getImgSize are modified in deserializer               
                if (style.imgSize)
                    this.assign(s, "imgSize", style.imgSize);
            }
            // "icon"
            if (style.getSrc)
                this.assign(s, "src", style.getSrc());
            if (s.points && s.radius !== s.radius2)
                s.points /= 2; // ol3 defect doubles point count when r1 <> r2  
            return s;
        }
        serializeColor(color) {
            if (color instanceof Array) {
                return {
                    color: ol.color.asString(color)
                };
            }
            else if (color instanceof CanvasGradient) {
                return {
                    gradient: color
                };
            }
            else if (color instanceof CanvasPattern) {
                return {
                    pattern: color
                };
            }
            else if (typeof color === "string") {
                return {
                    color: color
                };
            }
            throw "unknown color type";
        }
        serializeFill(fill) {
            return this.serializeStyle(fill);
        }
        deserializeStyle(json) {
            let image;
            let text;
            let fill;
            let stroke;
            if (json.circle)
                image = this.deserializeCircle(json.circle);
            else if (json.star)
                image = this.deserializeStar(json.star);
            else if (json.icon)
                image = this.deserializeIcon(json.icon);
            else if (json.svg)
                image = this.deserializeSvg(json.svg);
            else if (json.image && (json.image.img || json.image.path))
                image = this.deserializeSvg(json.image);
            else if (json.image && json.image.src)
                image = this.deserializeIcon(json.image);
            else if (json.image)
                throw "unknown image type";
            if (json.text)
                text = this.deserializeText(json.text);
            if (json.fill)
                fill = this.deserializeFill(json.fill);
            if (json.stroke)
                stroke = this.deserializeStroke(json.stroke);
            let s = new ol.style.Style({
                image: image,
                text: text,
                fill: fill,
                stroke: stroke
            });
            image && s.setGeometry(feature => this.setGeometry(feature));
            return s;
        }
        deserializeText(json) {
            json.rotation = json.rotation || 0;
            json.scale = json.scale || 1;
            let [x, y] = [json["offset-x"] || 0, json["offset-y"] || 0];
            {
                let p = new ol.geom.Point([x, y]);
                p.rotate(json.rotation, [0, 0]);
                p.scale(json.scale, json.scale);
                [x, y] = p.getCoordinates();
            }
            return new ol.style.Text({
                fill: json.fill && this.deserializeFill(json.fill),
                stroke: json.stroke && this.deserializeStroke(json.stroke),
                text: json.text,
                font: json.font,
                offsetX: x,
                offsetY: y,
                rotation: json.rotation,
                scale: json.scale
            });
        }
        deserializeCircle(json) {
            let image = new ol.style.Circle({
                radius: json.radius,
                fill: json.fill && this.deserializeFill(json.fill),
                stroke: json.stroke && this.deserializeStroke(json.stroke)
            });
            image.setOpacity(json.opacity);
            return image;
        }
        deserializeStar(json) {
            let image = new ol.style.RegularShape({
                radius: json.radius,
                radius2: json.radius2,
                points: json.points,
                angle: json.angle,
                fill: json.fill && this.deserializeFill(json.fill),
                stroke: json.stroke && this.deserializeStroke(json.stroke)
            });
            doif(json.rotation, v => image.setRotation(v));
            doif(json.opacity, v => image.setOpacity(v));
            return image;
        }
        deserializeIcon(json) {
            if (!json.anchor) {
                json.anchor = [json["anchor-x"] || 0.5, json["anchor-y"] || 0.5];
            }
            let image = new ol.style.Icon({
                anchor: json.anchor || [0.5, 0.5],
                anchorOrigin: json.anchorOrigin || "top-left",
                anchorXUnits: json.anchorXUnits || "fraction",
                anchorYUnits: json.anchorYUnits || "fraction",
                //crossOrigin?: string;
                img: undefined,
                imgSize: undefined,
                offset: json.offset,
                offsetOrigin: json.offsetOrigin,
                opacity: json.opacity,
                scale: json.scale,
                snapToPixel: json.snapToPixel,
                rotateWithView: json.rotateWithView,
                rotation: json.rotation,
                size: json.size,
                src: json.src,
                color: json.color
            });
            image.load();
            return image;
        }
        deserializeSvg(json) {
            json.rotation = json.rotation || 0;
            json.scale = json.scale || 1;
            if (json.img) {
                let symbol = document.getElementById(json.img);
                if (!symbol) {
                    throw `unable to find svg element: ${json.img}`;
                }
                if (symbol) {
                    // but just grab the path is probably good enough
                    let path = (symbol.getElementsByTagName("path")[0]);
                    if (path) {
                        if (symbol.viewBox) {
                            if (!json.imgSize) {
                                json.imgSize = [symbol.viewBox.baseVal.width, symbol.viewBox.baseVal.height];
                            }
                        }
                        json.path = (json.path || "") + path.getAttribute('d');
                    }
                }
            }
            let canvas = document.createElement("canvas");
            if (json.path) {
                {
                    // rotate a rectangle and get the resulting extent
                    [canvas.width, canvas.height] = json.imgSize.map(v => v * json.scale);
                    if (json.stroke && json.stroke.width) {
                        let dx = 2 * json.stroke.width * json.scale;
                        canvas.width += dx;
                        canvas.height += dx;
                    }
                }
                let ctx = canvas.getContext('2d');
                let path2d = new Path2D(json.path);
                // rotate  before it is in the canvas (avoids pixelation)
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(json.scale, json.scale);
                ctx.translate(-json.imgSize[0] / 2, -json.imgSize[1] / 2);
                if (json.fill) {
                    ctx.fillStyle = json.fill.color;
                    ctx.fill(path2d);
                }
                if (json.stroke) {
                    ctx.strokeStyle = json.stroke.color;
                    ctx.lineWidth = json.stroke.width;
                    ctx.stroke(path2d);
                }
            }
            let icon = new ol.style.Icon({
                img: canvas,
                imgSize: [canvas.width, canvas.height],
                rotation: json.rotation,
                scale: 1,
                anchor: json.anchor || [canvas.width / 2, canvas.height],
                anchorOrigin: json.anchorOrigin,
                anchorXUnits: json.anchorXUnits || "pixels",
                anchorYUnits: json.anchorYUnits || "pixels",
                //crossOrigin?: string;
                offset: json.offset,
                offsetOrigin: json.offsetOrigin,
                opacity: json.opacity,
                snapToPixel: json.snapToPixel,
                rotateWithView: json.rotateWithView,
                size: [canvas.width, canvas.height],
                src: undefined
            });
            return mixin(icon, {
                path: json.path,
                stroke: json.stroke,
                fill: json.fill,
                scale: json.scale,
                imgSize: json.imgSize
            });
        }
        deserializeFill(json) {
            let fill = new ol.style.Fill({
                color: json && this.deserializeColor(json)
            });
            return fill;
        }
        deserializeStroke(json) {
            let stroke = new ol.style.Stroke();
            doif(json.color, v => stroke.setColor(v));
            doif(json.lineCap, v => stroke.setLineCap(v));
            doif(json.lineDash, v => stroke.setLineDash(v));
            doif(json.lineJoin, v => stroke.setLineJoin(v));
            doif(json.miterLimit, v => stroke.setMiterLimit(v));
            doif(json.width, v => stroke.setWidth(v));
            return stroke;
        }
        deserializeColor(fill) {
            if (fill.color) {
                return fill.color;
            }
            if (fill.gradient) {
                let type = fill.gradient.type;
                let gradient;
                if (0 === type.indexOf("linear(")) {
                    gradient = this.deserializeLinearGradient(fill.gradient);
                }
                else if (0 === type.indexOf("radial(")) {
                    gradient = this.deserializeRadialGradient(fill.gradient);
                }
                if (fill.gradient.stops) {
                    // preserve
                    mixin(gradient, {
                        stops: fill.gradient.stops
                    });
                    let stops = fill.gradient.stops.split(";");
                    stops = stops.map(v => v.trim());
                    stops.forEach(colorstop => {
                        let stop = colorstop.match(/ \d+%/m)[0];
                        let color = colorstop.substr(0, colorstop.length - stop.length);
                        gradient.addColorStop(parseInt(stop) / 100, color);
                    });
                }
                return gradient;
            }
            if (fill.pattern) {
                let repitition = fill.pattern.repitition;
                let canvas = document.createElement('canvas');
                let spacing = canvas.width = canvas.height = fill.pattern.spacing | 6;
                let context = canvas.getContext('2d');
                context.fillStyle = fill.pattern.color;
                switch (fill.pattern.orientation) {
                    case "horizontal":
                        for (var i = 0; i < spacing; i++) {
                            context.fillRect(i, 0, 1, 1);
                        }
                        break;
                    case "vertical":
                        for (var i = 0; i < spacing; i++) {
                            context.fillRect(0, i, 1, 1);
                        }
                        break;
                    case "cross":
                        for (var i = 0; i < spacing; i++) {
                            context.fillRect(i, 0, 1, 1);
                            context.fillRect(0, i, 1, 1);
                        }
                        break;
                    case "forward":
                        for (var i = 0; i < spacing; i++) {
                            context.fillRect(i, i, 1, 1);
                        }
                        break;
                    case "backward":
                        for (var i = 0; i < spacing; i++) {
                            context.fillRect(spacing - 1 - i, i, 1, 1);
                        }
                        break;
                    case "diagonal":
                        for (var i = 0; i < spacing; i++) {
                            context.fillRect(i, i, 1, 1);
                            context.fillRect(spacing - 1 - i, i, 1, 1);
                        }
                        break;
                }
                return mixin(context.createPattern(canvas, repitition), fill.pattern);
            }
            if (fill.image) {
                let canvas = document.createElement('canvas');
                let [w, h] = [canvas.width, canvas.height] = fill.image.imgSize;
                let context = canvas.getContext('2d');
                let [dx, dy] = [0, 0];
                let image = document.createElement("img");
                image.src = fill.image.imageData;
                image.onload = () => context.drawImage(image, 0, 0, w, h);
                return "rgba(255,255,255,0.1)"; // TODO
            }
            throw "invalid color configuration";
        }
        deserializeLinearGradient(json) {
            let rx = /\w+\((.*)\)/m;
            let [x0, y0, x1, y1] = JSON.parse(json.type.replace(rx, "[$1]"));
            let canvas = document.createElement('canvas');
            // not correct, assumes points reside on edge
            canvas.width = Math.max(x0, x1);
            canvas.height = Math.max(y0, y1);
            var context = canvas.getContext('2d');
            let gradient = context.createLinearGradient(x0, y0, x1, y1);
            mixin(gradient, {
                type: `linear(${[x0, y0, x1, y1].join(",")})`
            });
            return gradient;
        }
        deserializeRadialGradient(json) {
            let rx = /radial\((.*)\)/m;
            let [x0, y0, r0, x1, y1, r1] = JSON.parse(json.type.replace(rx, "[$1]"));
            let canvas = document.createElement('canvas');
            // not correct, assumes radial centered
            canvas.width = 2 * Math.max(x0, x1);
            canvas.height = 2 * Math.max(y0, y1);
            var context = canvas.getContext('2d');
            let gradient = context.createRadialGradient(x0, y0, r0, x1, y1, r1);
            mixin(gradient, {
                type: `radial(${[x0, y0, r0, x1, y1, r1].join(",")})`
            });
            return gradient;
        }
    }
    exports.StyleConverter = StyleConverter;
});
define("bower_components/ol3-symbolizer/index", ["require", "exports", "bower_components/ol3-symbolizer/ol3-symbolizer/format/ol3-symbolizer"], function (require, exports, Symbolizer) {
    "use strict";
    return Symbolizer;
});
define("bower_components/ol3-draw/ol3-draw/ol3-button", ["require", "exports", "openlayers", "bower_components/ol3-fun/ol3-fun/common", "bower_components/ol3-symbolizer/index"], function (require, exports, ol, common_2, ol3_symbolizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Button extends ol.control.Control {
        constructor(options) {
            super(options);
            this.options = options;
            this.handlers = [];
            this.symbolizer = new ol3_symbolizer_1.StyleConverter();
            this.cssin();
            options.element.className = `${options.className} ${options.position}`;
            let button = common_2.html(`<input type="button" value="${options.label}" />`);
            this.handlers.push(() => options.element.remove());
            button.title = options.title;
            options.element.appendChild(button);
            this.set("active", false);
            button.addEventListener("click", () => {
                this.dispatchEvent("click");
                this.set("active", !this.get("active"));
            });
            this.on("change:active", () => {
                this.options.element.classList.toggle("active", this.get("active"));
                options.map.dispatchEvent({
                    type: options.eventName,
                    control: this
                });
            });
        }
        static create(options) {
            options = common_2.mixin(common_2.mixin({}, Button.DEFAULT_OPTIONS), options);
            options.element = options.element || document.createElement("DIV");
            let button = new (options.buttonType)(options);
            if (options.map) {
                options.map.addControl(button);
            }
            return button;
        }
        setPosition(position) {
            this.options.position.split(' ')
                .forEach(k => this.options.element.classList.remove(k));
            position.split(' ')
                .forEach(k => this.options.element.classList.add(k));
            this.options.position = position;
        }
        destroy() {
            this.handlers.forEach(h => h());
            this.setTarget(null);
        }
        cssin() {
            let className = this.options.className;
            let positions = common_2.pair("top left right bottom".split(" "), common_2.range(24))
                .map(pos => `.${className}.${pos[0] + (-pos[1] || '')} { ${pos[0]}:${0.5 + pos[1]}em; }`);
            this.handlers.push(common_2.cssin(className, `
            .${className} {
                position: absolute;
                background-color: rgba(255,255,255,.4);
            }
            .${className}.active {
                background-color: white;
            }
            .${className}:hover {
                background-color: white;
            }
            .${className} input[type="button"] {
                color: rgba(0,60,136,1);
                background: transparent;
                border: none;
                width: 2em;
                height: 2em;
            }
            ${positions.join('\n')}
        `));
        }
        setMap(map) {
            let options = this.options;
            super.setMap(map);
            options.map = map;
            if (!map) {
                this.destroy();
                return;
            }
        }
    }
    Button.DEFAULT_OPTIONS = {
        className: "ol-button",
        position: "top right",
        label: "Button",
        title: "Button",
        eventName: "click:button",
        buttonType: Button
    };
    exports.Button = Button;
});
define("bower_components/ol3-draw/ol3-draw/ol3-draw", ["require", "exports", "openlayers", "bower_components/ol3-draw/ol3-draw/ol3-button", "bower_components/ol3-fun/ol3-fun/common"], function (require, exports, ol, ol3_button_1, common_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Draw extends ol3_button_1.Button {
        constructor(options) {
            super(options);
            this.interactions = {};
            this.handlers.push(() => Object.keys(this.interactions).forEach(k => {
                let interaction = this.interactions[k];
                interaction.setActive(false);
                options.map.removeInteraction(interaction);
            }));
            this.on("change:active", () => {
                let active = this.get("active");
                let interaction = this.interactions[options.geometryType];
                if (active) {
                    if (!interaction) {
                        interaction = this.interactions[options.geometryType] = this.createInteraction();
                    }
                    interaction.setActive(true);
                }
                else {
                    interaction && interaction.setActive(false);
                }
            });
            let style = this.options.style.map(s => this.symbolizer.fromJson(s));
            if (!options.layers) {
                let layer = new ol.layer.Vector({
                    style: style,
                    source: new ol.source.Vector()
                });
                options.map.addLayer(layer);
                options.layers = [layer];
            }
        }
        static create(options) {
            options = common_3.mixin(common_3.mixin({}, Draw.DEFAULT_OPTIONS), options);
            return ol3_button_1.Button.create(options);
        }
        createInteraction() {
            let options = this.options;
            let source = options.layers[0].getSource();
            let style = options.style.map(s => this.symbolizer.fromJson(s));
            let draw = new ol.interaction.Draw({
                type: options.geometryType,
                geometryName: options.geometryName,
                source: source,
                style: style
            });
            draw.setActive(false);
            ["drawstart", "drawend"].forEach(eventName => {
                draw.on(eventName, args => this.dispatchEvent(args));
            });
            draw.on("change:active", () => this.options.element.classList.toggle("active", draw.getActive()));
            options.map.addInteraction(draw);
            return draw;
        }
    }
    Draw.DEFAULT_OPTIONS = {
        className: "ol-draw",
        geometryType: "Point",
        geometryName: "geom",
        label: "Draw",
        title: "Draw",
        buttonType: Draw,
        eventName: "draw-feature",
        style: [
            {
                circle: {
                    radius: 12,
                    opacity: 1,
                    fill: {
                        color: "rgba(0,0,0,0.5)"
                    },
                    stroke: {
                        color: "rgba(255,255,255,1)",
                        width: 3
                    }
                }
            },
            {
                fill: {
                    color: "rgba(0,0,0,0.5)"
                },
                stroke: {
                    color: "rgba(255,255,255,1)",
                    width: 5
                }
            },
            {
                stroke: {
                    color: "rgba(0,0,0,1)",
                    width: 1
                }
            }
        ]
    };
    exports.Draw = Draw;
});
define("bower_components/ol3-draw/index", ["require", "exports", "bower_components/ol3-draw/ol3-draw/ol3-draw"], function (require, exports, Draw) {
    "use strict";
    return Draw;
});
define("bower_components/ol3-draw/ol3-draw/ol3-edit", ["require", "exports", "openlayers", "bower_components/ol3-fun/ol3-fun/common", "bower_components/ol3-draw/ol3-draw/ol3-button"], function (require, exports, ol, common_4, ol3_button_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Modify extends ol3_button_2.Button {
        constructor(options) {
            super(options);
            let styles = common_4.defaults(options.style, Modify.DEFAULT_OPTIONS.style);
            let select = new ol.interaction.Select({
                style: (feature, res) => {
                    let featureType = feature.getGeometry().getType();
                    let style = styles[featureType].map(s => this.symbolizer.fromJson(s));
                    switch (featureType) {
                        case "MultiLineString":
                        case "MultiPolygon":
                        case "Polygon":
                        case "MultiPoint":
                        case "Point":
                            styles["EditPoints"].map(s => this.symbolizer.fromJson(s)).forEach(otherStyle => {
                                otherStyle.setGeometry(() => {
                                    let geom = feature.getGeometry();
                                    let points;
                                    if (geom instanceof ol.geom.MultiPolygon) {
                                        points = geom.getCoordinates()[0][0];
                                    }
                                    else if (geom instanceof ol.geom.Polygon) {
                                        points = geom.getCoordinates()[0];
                                    }
                                    else if (geom instanceof ol.geom.MultiLineString) {
                                        points = geom.getCoordinates()[0];
                                    }
                                    else if (geom instanceof ol.geom.MultiPoint) {
                                        points = geom.getCoordinates();
                                    }
                                    else if (geom instanceof ol.geom.Point) {
                                        points = [geom.getCoordinates()];
                                    }
                                    return new ol.geom.MultiPoint(points);
                                });
                                style.push(otherStyle);
                            });
                    }
                    return style;
                }
            });
            let modify = new ol.interaction.Modify({
                features: select.getFeatures(),
                style: (feature, res) => {
                    let featureType = feature.getGeometry().getType();
                    let style = (options.style[featureType] || Modify.DEFAULT_OPTIONS.style[featureType])
                        .map(s => this.symbolizer.fromJson(s));
                    return style;
                }
            });
            ["modifystart", "modifyend"].forEach(eventName => {
                modify.on(eventName, args => this.dispatchEvent(args));
            });
            select.on("select", (args) => {
                modify.setActive(true);
            });
            this.once("change:active", () => {
                [select, modify].forEach(i => {
                    i.setActive(false);
                    options.map.addInteraction(i);
                });
                this.handlers.push(() => {
                    [select, modify].forEach(i => {
                        i.setActive(false);
                        options.map.removeInteraction(i);
                    });
                });
            });
            this.on("change:active", () => {
                let active = this.get("active");
                select.setActive(active);
                if (!active)
                    select.getFeatures().clear();
            });
        }
        static create(options) {
            options = common_4.defaults({}, options, Modify.DEFAULT_OPTIONS);
            return ol3_button_2.Button.create(options);
        }
    }
    Modify.DEFAULT_OPTIONS = {
        className: "ol-edit",
        label: "Edit",
        title: "Edit",
        eventName: "modify-feature",
        style: {
            "Point": [{
                    circle: {
                        radius: 2,
                        fill: {
                            color: "rgba(255, 0, 0, 1)"
                        },
                        stroke: {
                            color: "rgba(255, 0, 0, 1)",
                            width: 1
                        },
                        opacity: 1
                    }
                }],
            "EditPoints": [{
                    circle: {
                        radius: 5,
                        fill: {
                            color: "rgb(255, 165, 0)"
                        },
                        opacity: 0.2
                    }
                }],
            "MultiLineString": [{
                    stroke: {
                        color: "rgba(0, 0, 0, 0.5)",
                        width: 3
                    }
                }],
            "Circle": [{
                    fill: {
                        color: "blue"
                    },
                    stroke: {
                        color: "red",
                        width: 2
                    }
                }],
            "Polygon": [{
                    fill: {
                        color: "rgba(0, 0, 0, 0.1)"
                    },
                    stroke: {
                        color: "rgba(0, 0, 0, 1)",
                        width: 1
                    }
                }],
            "MultiPolygon": [{
                    fill: {
                        color: "rgba(0, 0, 0, 0.1)"
                    },
                    stroke: {
                        color: "rgba(0, 0, 0, 1)",
                        width: 1
                    }
                }]
        },
        buttonType: Modify
    };
    exports.Modify = Modify;
});
define("bower_components/ol3-draw/ol3-draw/measure-extension", ["require", "exports", "openlayers", "bower_components/ol3-fun/index"], function (require, exports, ol, ol3_fun_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let wgs84Sphere = new ol.Sphere(6378137);
    const MeterConvert = {
        "m": 1,
        "km": 1 / 1000,
        "ft": 3.28084,
        "in": 39.37008,
        "mi": 0.000621371
    };
    function distance(c1, c2) {
        let [dx, dy] = [c2[0] - c1[0], c2[1] - c1[1]];
        return Math.sqrt(dx * dx + dy * dy);
    }
    class Measurement {
        constructor(options) {
            this.options = options;
            ol3_fun_2.cssin("measure", `

.tooltip {
    position: relative;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    color: white;
    padding: 4px 8px;
    opacity: 0.7;
    white-space: nowrap;
}
.tooltip-measure {
    opacity: 1;
    font-weight: bold;
}
.tooltip-static {
    background-color: #ffcc33;
    color: black;
    border: 1px solid white;
}
.tooltip-measure:before,
.tooltip-static:before {
    border-top: 6px solid rgba(0, 0, 0, 0.5);
    border-right: 6px solid transparent;
    border-left: 6px solid transparent;
    content: "";
    position: absolute;
    bottom: -6px;
    margin-left: -7px;
    left: 50%;
}
.tooltip-static:before {
    border-top-color: #ffcc33;
}

    `);
            this.createMeasureTooltip();
        }
        static create(options) {
            options = ol3_fun_2.defaults({}, options || {}, Measurement.DEFAULT_OPTIONS);
            return new Measurement(options);
        }
        createMeasureTooltip() {
            let options = this.options;
            if (this.measureTooltipElement) {
                this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
            }
            this.measureTooltipElement = document.createElement('div');
            this.measureTooltipElement.className = 'tooltip tooltip-measure';
            this.measureTooltip = new ol.Overlay({
                element: this.measureTooltipElement,
                offset: [0, -15],
                positioning: 'bottom-center'
            });
            options.map.addOverlay(this.measureTooltip);
            options.draw.on('drawstart', (evt) => {
                let listener = evt.feature.getGeometry().on('change', (evt) => {
                    var geom = evt.target;
                    let coordinates = this.flatten({ geom: geom });
                    let output = this.formatLength({ map: options.map, coordinates: coordinates });
                    this.measureTooltipElement.innerHTML = output;
                    this.measureTooltip.setPosition(coordinates[coordinates.length - 1]);
                });
                options.draw.once('drawend', () => ol.Observable.unByKey(listener));
            });
            options.edit.on('modifystart', (evt) => {
                let feature = evt.features.getArray()[0];
                let geom = feature.getGeometry();
                let coordinates = this.flatten({ geom: geom });
                let originalDistances = this.computeDistances({ map: options.map, coordinates: coordinates });
                let listener = geom.on('change', evt => {
                    let coordinates = this.flatten({ geom: geom });
                    let distances = this.computeDistances({ map: options.map, coordinates: coordinates });
                    distances.some((d, i) => {
                        if (d === originalDistances[i])
                            return false;
                        this.measureTooltipElement.innerHTML = this.formatLengths([d, distances.reduce((a, b) => a + b, 0)]);
                        this.measureTooltip.setPosition(coordinates[i]);
                        return true;
                    });
                });
                options.edit.once('modifyend', () => ol.Observable.unByKey(listener));
            });
        }
        // move to ol3-fun
        flatten(args) {
            let coordinates;
            if (args.geom instanceof ol.geom.LineString) {
                coordinates = args.geom.getCoordinates();
            }
            else if (args.geom instanceof ol.geom.MultiLineString) {
                coordinates = args.geom.getLineString(0).getCoordinates();
            }
            else if (args.geom instanceof ol.geom.Polygon) {
                coordinates = args.geom.getLinearRing(0).getCoordinates();
            }
            else if (args.geom instanceof ol.geom.MultiPolygon) {
                coordinates = args.geom.getPolygon(0).getLinearRing(0).getCoordinates();
            }
            return coordinates;
        }
        computeDistances(args) {
            // move to floorplan, pass in as option
            let coordinates = args.coordinates;
            //return coordinates.map((c, i) => distance(i ? coordinates[i - 1] : c, c));
            let sourceProj = args.map.getView().getProjection();
            coordinates = coordinates.map(c => ol.proj.transform(c, sourceProj, 'EPSG:4326'));
            return coordinates.map((c, i) => wgs84Sphere.haversineDistance(i ? coordinates[i - 1] : c, c));
        }
        /**
         * Format length output.
         * @param {ol.geom.LineString} line The line.
         * @return {string} The formatted length.
         */
        formatLength(args) {
            let options = this.options;
            let distances = this.computeDistances(args);
            let length = distances.reduce((a, b) => a + b, 0);
            let lengths = [length];
            if (options.measureCurrentSegment && distances.length > 2) {
                lengths.push(distances.pop());
            }
            return this.formatLengths(lengths);
        }
        formatLengths(lengths) {
            let options = this.options;
            return lengths.map(l => {
                let uom = options.uom;
                let length = l;
                let result = [""];
                uom.some(uom => {
                    let value = MeterConvert[uom] * length;
                    let wholePart = Math.floor(value);
                    if (0 !== wholePart) {
                        result.push(`${wholePart} ${uom}`);
                    }
                    length = (value - wholePart) / MeterConvert[uom];
                    return (length < 0.00001);
                });
                return result.join(" ");
            }).join("<br/>");
        }
    }
    Measurement.DEFAULT_OPTIONS = {
        uom: ["ft", "in"],
        measureCurrentSegment: true
    };
    exports.Measurement = Measurement;
});
define("tools/toolbar", ["require", "exports", "bower_components/ol3-draw/index", "bower_components/ol3-draw/ol3-draw/ol3-edit", "bower_components/ol3-draw/ol3-draw/measure-extension"], function (require, exports, ol3_draw_1, ol3_edit_1, measure_extension_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function add(map) {
        measure_extension_1.Measurement.create({
            map: map,
            draw: ol3_draw_1.Draw.create({ map: map, geometryType: "MultiLineString", position: "bottom right-1", label: "📏", title: "Measure" }),
            edit: ol3_edit_1.Modify.create({ map: map, position: "bottom right-3", label: "✍", title: "Modify" }),
            uom: ["mi", "ft", "in"]
        });
    }
    exports.add = add;
});
define("tools/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const default_options = {
        arc: {
            title: "",
            segments: 6,
            degrees: -90,
            length: 20,
        },
        room: {
            title: "",
            width: 12,
            depth: 8,
        },
        staircase: {
            title: "",
            count: 6,
            descend: 0.67,
            depth: 0.67,
            width: 3.75,
        }
    };
    function flatten(arr) {
        let result = [];
        arr.forEach(item => {
            if (Array.isArray(item)) {
                result = result.concat(item);
            }
            else {
                result.push(item);
            }
        });
        return result;
    }
    exports.flatten = flatten;
    function defaults(target, defaults) {
        Object.keys(defaults).forEach(k => {
            if (undefined === target[k])
                target[k] = defaults[k];
        });
        return target;
    }
    exports.defaults = defaults;
    function staircase(options = default_options.staircase) {
        options = defaults(options, default_options.staircase);
        let result = [];
        if (options.count) {
            options.title && result.push(`marker ${options.title}`);
            for (let i = 0; i < options.count; i++) {
                let even = (0 === i % 2);
                result.push(`descend ${options.descend}`);
                result.push(`move ${options.depth}`);
                result.push(even ? "rotate 90" : "rotate -90");
                result.push(`move ${options.width}`);
                result.push(even ? "rotate -90" : "rotate 90");
            }
            if (1 === options.count % 2)
                result.push(`right ${options.width}`);
        }
        return result;
    }
    exports.staircase = staircase;
    function room(options = default_options.room) {
        options = defaults(options, default_options.room);
        let result = [];
        options.title && result.push(`marker ${options.title}`);
        result.push(`move ${options.width}`);
        result.push("rotate 90");
        result.push(`move ${options.depth}`);
        result.push("rotate 90");
        result.push(`move ${options.width}`);
        result.push("rotate 90");
        result.push(`move ${options.depth}`);
        result.push("rotate 90");
        return result;
    }
    exports.room = room;
    function arc(options = default_options.arc) {
        options = defaults(options, default_options.arc);
        let result = [];
        let delta_angle = Math.round(10 * options.degrees / (options.segments - 1)) / 10;
        let depth = Math.round(10 * options.length / options.segments) / 10;
        options.title && result.push(`marker ${options.title}`);
        for (let step = 0; step < options.segments; step++) {
            step > 0 && result.push(`marker ${Math.abs(delta_angle)}°`);
            result.push(`move ${depth}`);
            result.push(`rotate ${delta_angle}`);
        }
        return result;
    }
    exports.arc = arc;
});
define("layouts/level-0/basement", ["require", "exports", "tools/index"], function (require, exports, index_1) {
    "use strict";
    return {
        title: "basement",
        units: "feet",
        righthand: "true",
        route: index_1.flatten([
            "goto telephone-pole",
            "face street",
            "rotate -90",
            "jump 9",
            "rotate -90",
            "descend 3",
            "jump 36",
            "jump 25",
            "left 8",
            "descend 16",
            index_1.room({ width: 27, depth: 11, title: "garage-single" }),
            "left 11.5",
            "back 4",
            index_1.room({ width: 14, depth: 18, title: "utility-room" }),
            "forward 14",
            "left 6.67",
            index_1.room({ width: 3.75, depth: 11.17, title: "fireplace" }),
            "left 11.83",
            "back 14",
            index_1.room({ width: 10.5, depth: 7, title: "laundry-room" }),
            "forward 11",
            "right 18.5",
            index_1.room({ width: 19.5, depth: 25.3, title: "basement" }),
            "forward 19.5",
            "left 25.3",
            "marker basement-corner-1",
        ])
    };
});
define("layouts/level-0/index", ["require", "exports", "layouts/level-0/basement"], function (require, exports, basement) {
    "use strict";
    return {
        title: "basement",
        places: [{
                name: "telephone-pole",
                location: [60, -60]
            }],
        directions: [{
                name: "street",
                direction: 180
            }],
        routes: [basement],
    };
});
define("layouts/level-1/bathroom", ["require", "exports", "tools/index"], function (require, exports, index_2) {
    "use strict";
    return {
        title: "bathroom",
        units: "feet",
        righthand: "true",
        route: index_2.flatten([
            "goto basement-corner-1",
            "face street",
            "rotate -90",
            "forward 0.5",
            index_2.room({ width: 9.33, depth: 8, title: "kids-bathroom" }),
        ])
    };
});
define("layouts/level-1/bedroom1", ["require", "exports", "tools/index"], function (require, exports, index_3) {
    "use strict";
    return {
        title: "bedroom-1",
        units: "feet",
        righthand: "true",
        route: index_3.flatten([
            "goto basement-corner-1",
            "face street",
            "right 25.23",
            index_3.room({ width: 12.5, depth: 15, title: "julia-room" }),
            "forward 13",
            index_3.room({ width: 5, depth: 7, title: "julia-closet" }),
        ])
    };
});
define("layouts/level-1/bedroom2", ["require", "exports", "tools/index"], function (require, exports, index_4) {
    "use strict";
    return {
        title: "bedroom-2",
        units: "feet",
        righthand: "true",
        route: index_4.flatten([
            "goto basement-corner-1",
            "face street",
            "forward 20.5",
            "right 12",
            index_4.room({ width: 12, depth: 12, title: "nathan-room" }),
            "right 2.33",
            index_4.room({ width: 12, depth: 1.83, title: "nathan-closet" }),
        ])
    };
});
define("layouts/level-1/bedroom3", ["require", "exports", "tools/index"], function (require, exports, index_5) {
    "use strict";
    return {
        title: "bedroom-3",
        units: "feet",
        righthand: "true",
        route: index_5.flatten([
            "goto basement-corner-1",
            "face street",
            "right 25.23",
            "forward 20.5",
            index_5.room({ width: 12, depth: 11, title: "lydia-room" }),
            "push",
            "forward 12",
            "marker house-corner-4",
            "pop",
            "back 2.33",
            index_5.room({ width: 1.83, depth: 7, title: "lydia-closet" }),
        ])
    };
});
define("layouts/level-1/index", ["require", "exports", "layouts/level-1/bathroom", "layouts/level-1/bedroom1", "layouts/level-1/bedroom2", "layouts/level-1/bedroom3"], function (require, exports, bathroom, bedroom1, bedroom2, bedroom3) {
    "use strict";
    return {
        title: "level-1",
        routes: [bathroom, bedroom1, bedroom2, bedroom3],
    };
});
define("layouts/level-2/garage", ["require", "exports", "tools/index"], function (require, exports, index_6) {
    "use strict";
    return {
        title: "garage",
        units: "feet",
        righthand: "true",
        route: index_6.flatten([
            "goto garage-corner-1",
            "face street",
            "rotate 180",
            index_6.room({ width: 25, depth: 20 }),
            "push",
            "rotate 90",
            "jump 10",
            "marker 16' garage door",
            "pop",
            "jump 25",
            "rotate 90",
            "jump 20",
            "rotate 90",
            "jump 3",
            "marker convex-edge-01a",
            "jump 4",
            "marker garage-porch-portal",
            "stop garage",
            "goto convex-corner-01",
            "face street",
            "rotate 90",
            "jump 8",
            "rotate 90",
            index_6.room({ width: 19, depth: 8 }),
            "jump 19",
            "rotate 90",
            "jump 4",
            "marker back-deck-portal",
            "stop deck",
            "goto concave-corner-1",
            "face street",
            index_6.room({ width: 2, depth: 12 }),
            "jump 1",
            "rotate 90",
            "jump 6",
            "marker shelving"
        ])
    };
});
define("layouts/level-2/front-porch", ["require", "exports", "tools/index"], function (require, exports, index_7) {
    "use strict";
    return {
        title: "front-porch",
        units: "feet",
        righthand: "true",
        route: index_7.flatten([
            "goto convex-edge-01b",
            "face street",
            "rotate -90",
            index_7.room({ width: 4.5, depth: 5.5 }),
            "goto convex-edge-01a",
            index_7.room({ width: 25, depth: 8 }),
            "jump 18",
            "rotate -90",
            index_7.room({ width: 3, depth: 7 }),
            "jump 3",
            "rotate 90",
            "jump 4",
            "marker front-door",
            "goto convex-edge-01c",
            "face street",
            "jump 8",
            "rotate 90",
            "jump 2",
            "rotate -90",
            index_7.staircase({
                count: 3,
                descend: 0.67,
                depth: 0.67,
                width: 10
            }),
        ])
    };
});
define("layouts/level-2/deck", ["require", "exports", "tools/index"], function (require, exports, index_8) {
    "use strict";
    return {
        title: "back-deck-upper",
        units: "feet",
        righthand: "true",
        route: index_8.flatten([
            "goto back-deck-portal",
            "face street",
            "rotate 90",
            "jump 4",
            "rotate 90",
            index_8.room({ width: 17.5, depth: 8, title: "deck-1" }),
            "goto house-corner-2",
            "face street",
            "rotate 180",
            index_8.room({ width: 8, depth: 37.83, title: "deck-2" }),
            "rotate 90",
            "jump 37.83",
            "right 4",
            index_8.staircase({
                title: "deck-flight-1",
                count: 6,
                descend: 0.67,
                depth: 0.67,
                width: 3.75
            }),
            "left 3.75",
            "descend 0.67",
            "rotate -90",
            index_8.room({ width: 8, depth: 6, title: "platform-1" }),
            "jump 4",
            "rotate -90",
            index_8.staircase({
                title: "deck-flight-2",
                count: 6,
                descend: 0.67,
                depth: 0.67,
                width: 3.75
            }),
            "descend 0.67",
            "rotate 90",
            "jump 4",
            "marker parking",
            "stop"
        ])
    };
});
define("layouts/level-2/kitchen", ["require", "exports", "tools/index"], function (require, exports, index_9) {
    "use strict";
    return {
        title: "kitchen",
        units: "feet",
        righthand: "true",
        route: index_9.flatten([
            "goto house-corner-2",
            "face street",
            "push",
            "jump 11.75",
            "marker kitchen-garage-portal",
            "pop",
            "rotate -90",
            index_9.room({ width: 17.83, depth: 13 }),
            "jump 17.83",
            "rotate 90",
            "jump 11.67",
            "marker kitchen-school-portal",
        ])
    };
});
define("layouts/level-2/livingroom", ["require", "exports", "tools/index"], function (require, exports, index_10) {
    "use strict";
    return {
        title: "living room",
        units: "feet",
        righthand: "true",
        route: index_10.flatten([
            "goto convex-edge-01a",
            "face street",
            "rotate 180",
            index_10.room({
                width: 14,
                depth: 17
            }),
            "jump 14",
            "rotate 90",
            "jump 9",
            "marker fireplace-3",
        ])
    };
});
define("layouts/level-2/dining", ["require", "exports", "tools/index"], function (require, exports, index_11) {
    "use strict";
    return {
        title: "level-2",
        units: "feet",
        righthand: "true",
        route: index_11.flatten([
            "goto convex-corner-01",
            "face street",
            "rotate 180",
            index_11.room({ width: 14.5, depth: 12 }),
            "jump 14.5",
            "rotate 90",
            "jump 5.33",
            "marker dining-kitchen-portal",
            "stop dining room",
        ])
    };
});
define("layouts/level-2/schoolroom", ["require", "exports", "tools/index"], function (require, exports, index_12) {
    "use strict";
    return {
        title: "schoolroom",
        units: "feet",
        righthand: "true",
        route: index_12.flatten([
            "goto house-corner-2",
            "face street",
            "rotate -90",
            "jump 18",
            index_12.room({ width: 19.75, depth: 13 }),
            "push",
            "jump 1.25",
            "marker school-deck-portal",
            "pop",
            "rotate 90",
            "jump 13",
            "rotate -90",
            "jump 9",
            "marker fireplace-2",
        ])
    };
});
define("layouts/level-2/walkway", ["require", "exports", "tools/index"], function (require, exports, index_13) {
    "use strict";
    return {
        title: "walkway",
        units: "feet",
        righthand: "true",
        route: index_13.flatten([
            "goto garage-corner-1",
            "face street",
            "rotate -90",
            "jump 20",
            "push",
            index_13.arc({
                segments: 5,
                degrees: -80,
                length: 21,
            }),
            "pop",
            "rotate 90",
            "jump 10",
            "rotate -90",
            index_13.arc({
                segments: 5,
                degrees: -80,
                length: 37,
            }),
        ])
    };
});
define("layouts/level-2/index", ["require", "exports", "layouts/level-2/garage", "layouts/level-2/front-porch", "layouts/level-2/deck", "layouts/level-2/kitchen", "layouts/level-2/livingroom", "layouts/level-2/dining", "layouts/level-2/schoolroom", "layouts/level-2/walkway"], function (require, exports, garage, porch, deck, kitchen, livingroom, dining, schoolroom, walkway) {
    "use strict";
    return {
        title: "level-2",
        units: "feet",
        righthand: "true",
        route: [
            "goto telephone-pole",
            "face street",
            "rotate -90",
            "jump 9",
            "rotate -90",
            "descend 3",
            "jump 36",
            "marker garage-corner-1",
            "jump 25",
            "rotate 90",
            "move 4",
            "marker garage-deck-portal",
            "move 4",
            "marker convex-corner-01",
            "push",
            "jump 12",
            "marker concave-corner-1",
            "pop",
            "rotate -90",
            "jump 28.5",
            "marker house-corner-2",
            "rotate 90",
            "jump 63.75",
            "marker house-corner-3",
            "rotate 90",
            "jump 34",
            "marker house-corner-4",
            "rotate 90",
            "jump 26.75",
            "marker convex-edge-01b",
            "rotate 90",
            "jump 2.5",
            "rotate -90",
            "jump 8",
            "marker convex-edge-01c",
            "stop"
        ],
        routes: [
            garage,
            porch,
            deck,
            dining,
            livingroom,
            kitchen,
            schoolroom,
            walkway,
        ]
    };
});
define("layouts/level-3/bedroom1", ["require", "exports", "tools/index"], function (require, exports, index_14) {
    "use strict";
    return {
        title: "bedroom 1",
        units: "feet",
        righthand: "true",
        route: index_14.flatten([
            "goto house-corner-4",
            "face street",
            "back 12.33",
            "left 11.83",
            index_14.room({ width: 12.33, depth: 11.33, title: "daniel-room" }),
            "forward 6.33",
            "right 2.33",
            index_14.room({ width: 6, depth: 1.83, title: "daniel-closet" }),
        ])
    };
});
define("layouts/level-3/bedroom2", ["require", "exports", "tools/index"], function (require, exports, index_15) {
    "use strict";
    return {
        title: "bedroom 2",
        units: "feet",
        righthand: "true",
        route: index_15.flatten([
            "goto house-corner-4",
            "face street",
            "back 12.33",
            index_15.room({ width: 12.33, depth: 11.33, title: "benjamin-room" }),
            "back 2.25",
            index_15.room({ width: 1.83, depth: 7.83, title: "benjamin-closet-1" }),
            "forward 2.25",
            "left 11.83",
            "right 1.83",
            index_15.room({ width: 6, depth: 1.83, title: "benjamin-closet-2" }),
        ])
    };
});
define("layouts/level-3/bedroom3", ["require", "exports", "tools/index"], function (require, exports, index_16) {
    "use strict";
    return {
        title: "master bedroom",
        units: "feet",
        righthand: "true",
        route: index_16.flatten([
            "goto julia-room",
            "face street",
            index_16.room({ width: 8, depth: 7, title: "master bathroom" }),
            "left 7.5",
            index_16.room({ width: 13, depth: 18, title: "master bedroom" }),
            "forward 13",
            "left 4",
            index_16.room({ width: 3.5, depth: 6, title: "master-closet" }),
        ])
    };
});
define("layouts/level-3/bathroom1", ["require", "exports", "tools/index"], function (require, exports, index_17) {
    "use strict";
    return {
        title: "front-porch",
        units: "feet",
        righthand: "true",
        route: index_17.flatten([
            "goto julia-room",
            "face street",
            "forward 8.5",
            index_17.room({ width: 10, depth: 7, title: "green-bathroom" }),
        ])
    };
});
define("layouts/level-3/attic-portal", ["require", "exports", "tools/index"], function (require, exports, index_18) {
    "use strict";
    return {
        title: "kitchen",
        units: "feet",
        righthand: "true",
        route: index_18.flatten([])
    };
});
define("layouts/level-3/index", ["require", "exports", "layouts/level-3/bedroom1", "layouts/level-3/bedroom2", "layouts/level-3/bedroom3", "layouts/level-3/bathroom1", "layouts/level-3/attic-portal"], function (require, exports, bedroom1, bedroom2, bedroom3, bathroom1, attic) {
    "use strict";
    return {
        title: "level-3",
        units: "feet",
        righthand: "true",
        routes: [
            bedroom1,
            bedroom2,
            bedroom3,
            bathroom1,
            attic,
        ]
    };
});
define("layouts/stairways/index", ["require", "exports", "tools/index"], function (require, exports, index_19) {
    "use strict";
    return {
        title: "stairways",
        units: "feet",
        righthand: "true",
        route: index_19.flatten([
            "goto basement-corner-1",
            "face street",
            "forward 8.5",
            "rotate -90",
            index_19.staircase({ count: 7, descend: -7 / 12, depth: 11.375 / 12, width: 41 / 12 }),
            "ascend 0.53",
            index_19.room({ width: 3.5, depth: 8 }),
            "left 8",
            "rotate 180",
            index_19.staircase({ count: 6, descend: -0.53, depth: 0.96, width: 3.33 }),
            "ascend 0.53",
            "right 4",
            index_19.room({ width: 4.5, depth: 7 }),
            "rotate 180",
            "right 3.5",
            index_19.staircase({ count: 6, descend: -0.53, depth: 0.96, width: 3.33 }),
        ])
    };
});
define("index", ["require", "exports", "openlayers", "render", "bower_components/ol3-layerswitcher/index", "tools/toolbar", "layouts/level-0/index", "layouts/level-1/index", "layouts/level-2/index", "layouts/level-3/index", "layouts/stairways/index"], function (require, exports, ol, renderer, ol3_layerswitcher_1, toolbar_1, level_0, level_1, level_2, level_3, stairways) {
    "use strict";
    const marker_color = ol.color.asString([20, 240, 20, 1]);
    const line_color = ol.color.asString([160, 160, 160, 1]);
    const text_color = ol.color.asString([200, 200, 200, 1]);
    const wall_width = 3;
    class App {
        forceLayer(map, level) {
            if (!this.layers)
                this.layers = {};
            if (this.layers[level])
                return this.layers[level];
            let source = new ol.source.Vector();
            let layer = new ol.layer.Vector({
                title: level,
                source: source,
                style: (feature, res) => {
                    let rotation = -(Math.PI / 180) * (feature.get("orientation") || 0);
                    switch (feature.getGeometry().getType()) {
                        case "Point":
                            return new ol.style.Style({
                                image: new ol.style.Circle({
                                    radius: 3,
                                    fill: new ol.style.Fill({
                                        color: marker_color
                                    }),
                                }),
                                text: res > 0.08 ? null : new ol.style.Text({
                                    text: feature.get("name"),
                                    offsetX: 0,
                                    offsetY: -10,
                                    scale: 1.2,
                                    stroke: new ol.style.Stroke({
                                        color: line_color
                                    }),
                                    fill: new ol.style.Fill({
                                        color: text_color
                                    }),
                                })
                            });
                        case "MultiLineString":
                        case "LineString":
                            return new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: line_color,
                                    width: wall_width,
                                }),
                                text: res > 0.04 ? undefined : new ol.style.Text({
                                    text: feature.get("name"),
                                    offsetY: 12,
                                    rotation: rotation,
                                    scale: 1.5,
                                    stroke: new ol.style.Stroke({
                                        color: line_color,
                                    }),
                                    fill: new ol.style.Fill({
                                        color: text_color,
                                    }),
                                })
                            });
                        default:
                            return new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'green',
                                    width: 1
                                })
                            });
                    }
                }
            });
            this.layers[level] = layer;
            map.addLayer(layer);
            return layer;
        }
        run() {
            let mapDiv = document.createElement("div");
            document.body.appendChild(mapDiv);
            let map = new ol.Map({
                target: mapDiv,
                view: new ol.View({
                    center: [0, 0],
                    zoom: 20,
                }),
                controls: ol.control.defaults({ attribution: false })
            });
            [level_0, level_1, level_2, level_3, stairways].forEach((level, i) => {
                let features = renderer.render(level);
                this.forceLayer(map, level.title).getSource().addFeatures(features);
            });
            let layerSwitcher = new ol3_layerswitcher_1.LayerSwitcher({
                tipLabel: 'Layers',
                openOnMouseOver: false,
                closeOnMouseOut: false,
                openOnClick: true,
                closeOnClick: true,
                target: null
            });
            layerSwitcher.on("show-layer", (args) => {
                console.log("show layer:", args.layer.get("title"));
            });
            layerSwitcher.on("hide-layer", (args) => {
                console.log("hide layer:", args.layer.get("title"));
            });
            map.addControl(layerSwitcher);
            toolbar_1.add(map);
        }
        ;
    }
    let go = () => new App().run();
    return go;
});
