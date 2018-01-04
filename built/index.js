define("render", ["require", "exports", "openlayers"], function (require, exports, ol) {
    "use strict";
    class Renderer {
        constructor() {
            this.state = {
                position: new ol.geom.Point([0, 0]),
                direction: 0,
                elevation: 0,
                locations: [{
                        name: "origin",
                        point: new ol.geom.Point([0, 0]),
                    }],
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
            this.state.rightHandRule = "true" === source.righthand;
            if (source.directions)
                source.directions.forEach(d => this.addDirection(d.name, d.direction));
            if (source.places)
                source.places.forEach(d => this.addPlace(d.name, d.location));
            source.start && this.goto([source.start]);
            source.route && source.route.forEach(route => {
                let tokens = route.split(" ");
                let command = tokens.shift();
                switch (command) {
                    case "ascend":
                        this.ascend(tokens);
                        break;
                    case "descend":
                        this.descend(tokens);
                        break;
                    case "face":
                        this.face(tokens);
                        break;
                    case "jump":
                        this.jump(tokens);
                        break;
                    case "goto":
                        this.goto(tokens);
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
                    default: console.warn(`cannot process ${command}: ${tokens}`);
                }
            });
            source.routes && source.routes.forEach(source => this.render(source, this.features));
            return this.features;
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
        marker(location) {
            console.log("marker", location);
            let point = new ol.Feature({
                name: location.join(" "),
                geometry: this.state.position
            });
            if (!this.state.locations.find(l => l.name === location[0])) {
                this.addPlace(location.join(" "), this.state.position.getCoordinates());
            }
            this.features.push(point);
        }
        move(location) {
            console.log("move", location);
            let geom = this.trs(location);
            this.features.push(new ol.Feature({
                name: location.join(" "),
                orientation: (360 + this.state.direction + 90) % 180,
                geometry: geom
            }));
        }
        trs(location) {
            let geom = new ol.geom.LineString([]);
            let [x, y] = this.state.position.getCoordinates();
            geom.appendCoordinate([x, y]);
            let scalar = parseFloat(location[0]);
            if (this.state.rightHandRule) {
                [x, y] = [x - scalar * Math.sin(Math.PI * this.state.direction / 180), y + scalar * Math.cos(Math.PI * this.state.direction / 180)];
            }
            else {
                [x, y] = [x + scalar * Math.sin(Math.PI * this.state.direction / 180), y + scalar * Math.cos(Math.PI * this.state.direction / 180)];
            }
            geom.appendCoordinate([x, y]);
            this.state.position = new ol.geom.Point([x, y]);
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
define("layouts/level-2/garage", ["require", "exports"], function (require, exports) {
    "use strict";
    return {
        title: "garage",
        units: "feet",
        righthand: "true",
        start: "telephone-pole",
        route: [
            "face street",
            "rotate -90",
            "jump 9",
            "rotate -90",
            "decend 3",
            "jump 36",
            "marker garage door side 1",
            "rotate 90",
            "move 20",
            "marker garage door side 2",
            "rotate -90",
            "move 18",
            "marker porch portal side 1",
            "jump 3",
            "marker porch portal side 2",
            "move 4",
            "marker connect to house",
            "rotate -90",
            "move 12",
            "rotate 90",
            "marker deck portal side 1",
            "move 19",
            "marker back-deck portal side 1",
            "rotate -90",
            "move 8",
            "marker back-deck portal side 2",
            "rotate -90",
            "move 19",
            "marker deck portal side 2",
            "move 25",
            "stop",
        ]
    };
});
define("layouts/level-2/front-porch", ["require", "exports"], function (require, exports) {
    "use strict";
    return {
        title: "front-porch",
        units: "feet",
        righthand: "true",
        route: [
            "goto porch portal side 2",
            "face street",
            "rotate 180",
            "move 1",
            "rotate 90",
            "move 18",
            "rotate -90",
            "move 3",
            "rotate 90",
            "move 2.5",
            "jump 3",
            "move 2.5",
            "rotate 90",
            "move 11",
            "rotate 90",
            "move 26",
            "rotate 90",
            "move 4",
            "stop",
        ]
    };
});
define("tools/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    function staircase(options = {
            count: 6,
            descend: 0.67,
            depth: 0.67,
            width: 3.75,
        }) {
        let result = [];
        for (let i = 0; i < options.count; i++) {
            let even = (0 == i % 2);
            result.push(`descend ${options.descend}`);
            result.push(`move ${options.depth}`);
            result.push(even ? "rotate -90" : "rotate 90");
            result.push(`move ${options.width}`);
            result.push(even ? "rotate 90" : "rotate -90");
        }
        return result;
    }
    exports.staircase = staircase;
    function room(options = {
            width: 12,
            depth: 8,
        }) {
        let result = [];
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
});
define("layouts/level-2/deck", ["require", "exports", "tools/index"], function (require, exports, index_1) {
    "use strict";
    return {
        title: "back-deck-upper",
        units: "feet",
        righthand: "true",
        route: index_1.flatten([
            "goto back-deck portal side 1",
            "face street",
            "rotate 180",
            "move 9",
            "rotate 90",
            "move 37.83",
            "marker staircase side 1",
            "rotate -90",
            "move 8",
            "marker staircase side 2",
            "rotate -90",
            "move 37.83",
            "move 8",
            "rotate -90",
            "move 8",
            "move 9",
            "rotate -90",
            "move 8",
            "stop",
            "goto staircase side 1",
            "face street",
            "rotate -90",
            index_1.staircase(),
            "descend 0.67",
            "move 6",
            "marker platform",
            "rotate -90",
            "move 8",
            "rotate -90",
            "move 6",
            index_1.staircase(),
            "descend 0.67",
            "move 0.67",
            "marker ground level",
            "stop"
        ])
    };
});
define("layouts/level-2/kitchen", ["require", "exports", "tools/index"], function (require, exports, index_2) {
    "use strict";
    return {
        title: "kitchen",
        units: "feet",
        righthand: "true",
        route: index_2.flatten([
            "goto dining portal-1",
            "face street",
            "rotate 90",
            "move 5.33",
            "rotate 90",
            "move 13",
            "rotate 90",
            "move 17.83",
            "rotate 90",
            "move 13",
            "marker kitchen pantry",
            "rotate 90",
            "move 9.5",
            "stop kitchen",
        ])
    };
});
define("layouts/level-2/livingroom", ["require", "exports", "tools/index"], function (require, exports, index_3) {
    "use strict";
    return {
        title: "kitchen",
        units: "feet",
        righthand: "true",
        route: index_3.flatten([
            "goto deck portal side 1",
            "rotate 180",
            "jump 12",
            "rotate 90",
            "jump 3",
            "rotate -90",
            "move 18",
            "rotate -90",
            "move 3.5",
            "jump 4",
            "move 6.5",
            "rotate -90",
            "move 8.5",
            "marker fireplace-3",
            "move 9.5",
            "rotate -90",
            "move 3.5",
            "jump 4",
            "move 6.5",
            "stop living room",
        ])
    };
});
define("layouts/level-2/dining", ["require", "exports"], function (require, exports) {
    "use strict";
    return {
        title: "level-2",
        units: "feet",
        righthand: "true",
        start: "deck portal side 1",
        route: [
            "face street",
            "rotate 180",
            "move 14.5",
            "rotate 90",
            "move 5.33",
            "marker dining portal-1",
            "jump 3",
            "marker dining portal-2",
            "move 3.66",
            "rotate 90",
            "move 7.5",
            "jump 4",
            "move 3",
            "rotate 90",
            "move 12",
            "stop dining room",
        ]
    };
});
define("layouts/level-2/schoolroom", ["require", "exports"], function (require, exports) {
    "use strict";
    return {
        title: "schoolroom",
        units: "feet",
        righthand: "true",
        route: [
            "goto kitchen pantry",
            "face street",
            "rotate 180",
            "move 13",
            "rotate 90",
            "move 20",
            "rotate 90",
            "move 13",
            "rotate 90",
            "move 11",
            "marker fireplace-2",
            "move 9",
            "stop schoolroom",
        ]
    };
});
define("layouts/level-2/index", ["require", "exports", "layouts/level-2/garage", "layouts/level-2/front-porch", "layouts/level-2/deck", "layouts/level-2/kitchen", "layouts/level-2/livingroom", "layouts/level-2/dining", "layouts/level-2/schoolroom"], function (require, exports, garage, porch, deck, kitchen, livingroom, dining, schoolroom) {
    "use strict";
    return {
        title: "level-2",
        units: "feet",
        righthand: "true",
        places: [{
                name: "telephone-pole",
                location: [60, -60]
            }],
        directions: [{
                name: "street",
                direction: 180
            }],
        routes: [
            garage,
            porch,
            deck,
            dining,
            livingroom,
            kitchen,
            schoolroom
        ]
    };
});
define("index", ["require", "exports", "openlayers", "render", "layouts/level-2/index"], function (require, exports, ol, renderer, level_2) {
    "use strict";
    let go = () => {
        let mapDiv = document.createElement("div");
        document.body.appendChild(mapDiv);
        let source = new ol.source.Vector();
        let layer = new ol.layer.Vector({
            source: source,
            style: (feature, res) => {
                let rotation = Math.PI * (feature.get("orientation") || 0) / 180;
                switch (feature.getGeometry().getType()) {
                    case "Point":
                        return new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 3,
                                fill: new ol.style.Fill({
                                    color: [0, 0, 0, 1],
                                }),
                            }),
                            text: new ol.style.Text({
                                text: feature.get("name"),
                                offsetX: 0,
                                offsetY: -10,
                            })
                        });
                    default:
                        return new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: [0, 0, 0, 1],
                            }),
                            text: new ol.style.Text({
                                text: feature.get("name"),
                                offsetY: 8,
                                rotation: rotation,
                            })
                        });
                }
            }
        });
        let map = new ol.Map({
            target: mapDiv,
            layers: [layer],
            view: new ol.View({
                center: [0, 0],
                zoom: 20,
            }),
        });
        [level_2].forEach(shape => {
            let features = renderer.render(shape);
            source.addFeatures(features);
        });
    };
    return go;
});
