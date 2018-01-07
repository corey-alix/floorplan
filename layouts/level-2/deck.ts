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
        room({ width: 17.5, depth: 8, title: "deck-1" }),
        "goto house-corner-2",
        "face street",
        "rotate 180",
        room({ width: 8, depth: 37.83, title: "deck-2" }),
        "rotate 90",
        "jump 37.83",
        "right 4",
        staircase({
            title: "deck-flight-1",
            count: 6,
            descend: 0.67,
            depth: 0.67,
            width: 3.75
        }),
        "left 3.75",
        "descend 0.67",
        "rotate -90",
        room({ width: 8, depth: 6, title: "platform-1" }),
        "jump 4",
        "rotate -90",
        staircase({
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