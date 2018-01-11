import ol = require("openlayers");
import renderer = require("./render");
import { LayerSwitcher } from "ol3-layerswitcher";
import { add as addToolbar } from "./tools/toolbar";

import level_0 = require("./layouts/level-0/index");
import level_1 = require("./layouts/level-1/index");
import level_2 = require("./layouts/level-2/index");
import level_3 = require("./layouts/level-3/index");
import stairways = require("./layouts/stairways/index");

const marker_color = ol.color.asString([20, 240, 20, 1]);
const line_color = ol.color.asString([160, 160, 160, 1]);
const text_color = ol.color.asString([200, 200, 200, 1]);
const wall_width = 3;

class App {

    private layers: { [id: string]: ol.layer.Vector; };

    private forceLayer(map: ol.Map, level: string) {

        if (!this.layers) this.layers = {};
        if (this.layers[level]) return this.layers[level];

        let source = new ol.source.Vector();
        let layer = new ol.layer.Vector({
            title: level,
            source: source,
            style: (feature: ol.Feature, res: number) => {

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

        let layerSwitcher = new LayerSwitcher({
            tipLabel: 'Layers',
            openOnMouseOver: false,
            closeOnMouseOut: false,
            openOnClick: true,
            closeOnClick: true,
            target: null
        });

        layerSwitcher.on("show-layer", (args: { layer: ol.layer.Base }) => {
            console.log("show layer:", args.layer.get("title"));
        });

        layerSwitcher.on("hide-layer", (args: { layer: ol.layer.Base }) => {
            console.log("hide layer:", args.layer.get("title"));
        });

        map.addControl(layerSwitcher);

        addToolbar(map);
    };

}

let go = () => new App().run();

export = go;