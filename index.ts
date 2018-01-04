import ol = require("openlayers");
import renderer = require("./render");
import level_2 = require("./layouts/level-2/index");

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
        }
    );

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

export = go;