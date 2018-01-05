import { flatten, room } from "../../tools/index";

export = {
    title: "schoolroom",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto house-corner-2",
        "face street",
        "rotate -90",
        "jump 18",
        room({width: 19.75, depth: 13}),
        "push",
        "jump 1.25",
        "marker school-deck-portal",
        "pop",
        "rotate 90",
        "jump 13",
        "rotate -90",
        "jump 9",
        "marker fireplace-2",
    ])
};