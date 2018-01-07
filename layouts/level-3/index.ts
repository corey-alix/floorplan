import { flatten, room, staircase } from "../../tools/index";
import bedroom1 = require("./bedroom1");
import bedroom2 = require("./bedroom2");
import bedroom3 = require("./bedroom3");
import bathroom1 = require("./bathroom1");
import attic = require("./attic-portal");

export = {
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