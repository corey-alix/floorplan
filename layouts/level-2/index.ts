import garage = require("./garage");
import porch = require("./front-porch");
import deck = require("./deck");
import kitchen = require("./kitchen");
import livingroom = require("./livingroom");
import dining = require("./dining");
import schoolroom = require("./schoolroom");

export = {
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