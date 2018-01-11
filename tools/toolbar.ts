import ol = require("openlayers");
import { Button } from "ol3-draw/ol3-button";
import { Draw } from "ol3-draw";
import { Modify } from "ol3-draw/ol3-draw/ol3-edit";
import { Measurement } from "ol3-draw/ol3-draw/measure-extension";
import { cssin, defaults } from "ol3-fun";

export function add(map: ol.Map) {

    Measurement.create({
        map: map,
        draw: Draw.create({ map: map, geometryType: "MultiLineString", position: "bottom right-1", label: "📏", title: "Measure"  }),
        edit: Modify.create({ map: map, position: "bottom right-3", label: "✍", title: "Modify" }),
        uom: ["mi", "ft", "in"]
    });

}