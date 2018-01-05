import garage = require("./garage");
import porch = require("./front-porch");
import deck = require("./deck");
import kitchen = require("./kitchen");
import livingroom = require("./livingroom");
import dining = require("./dining");
import schoolroom = require("./schoolroom");
import walkway = require("./walkway");

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
    route: [
        "goto telephone-pole",
        "face street",
        "rotate -90",
        "jump 9",
        "rotate -90",
        "decend 3",
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