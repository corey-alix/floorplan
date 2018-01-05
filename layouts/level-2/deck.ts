import { flatten, room, staircase } from "../../tools/index";

export = {
    title: "back-deck-upper",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto back-deck-portal",
        "face street",
        "rotate 90",
        "jump 4",
        "rotate 90",
        room({ width: 17.5, depth: 8 }),
        "goto house-corner-2",
        "face street",
        "rotate 180",
        room({ width: 8, depth: 37.83 }),
        "rotate 90",
        "jump 37.83",
        staircase(),
        "descend 0.67",
        "rotate -90",
        room({ width: 8, depth: 6 }),
        "jump 8",
        "rotate -90",
        staircase(),
        "descend 0.67",
        "rotate 90",
        "jump 4",
        "marker parking",
        "stop"
    ])
};