import ol = require("openlayers");
import renderer = require("./render");
import level_2 = require("./layouts/level-2/index");

const marker_color = ol.color.asString([20, 240, 20, 1]);
const line_color = ol.color.asString([160, 160, 160, 1]);
const text_color = ol.color.asString([200, 200, 200, 1]);
const wall_width = 3;

let go = () => {

    let mapDiv = document.createElement("div");
    document.body.appendChild(mapDiv);
    let source = new ol.source.Vector();
    let layer = new ol.layer.Vector(
        {
            source: source,
            style: (feature: ol.Feature, res: number) => {

                let rotation = Math.PI * (feature.get("orientation") || 0) / 180;

                switch (feature.getGeometry().getType()) {
                    case "Point":
                        return new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 3,
                                fill: new ol.style.Fill({
                                    color: marker_color,
                                }),
                            }),
                            text: res > 0.08 ? null : new ol.style.Text({
                                text: feature.get("name"),
                                offsetX: 0,
                                offsetY: -10,
                                scale: 1.2,
                                fill: new ol.style.Stroke({
                                    color: text_color,
                                })
                            })
                        });
                    default:
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
                                fill: new ol.style.Stroke({
                                    color: text_color,
                                }),
                            })
                        });
                }
            }
        }
    );

    let map = new ol.Map({
        target: mapDiv,
        layers: [layer],
        view: new ol.View({
            center: [0, 0],
            zoom: 20,
        }),
        controls: ol.control.defaults({attribution: false})
    });

    [level_2].forEach(shape => {
        let features = renderer.render(shape);
        source.addFeatures(features);
    });
};

export = go;