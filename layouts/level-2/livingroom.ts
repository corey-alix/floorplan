import { flatten, room } from "../../tools/index";

export = {
    title: "living room",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto convex-corner-01",
        "face street",
        "rotate -90",
        "jump 12",
        "rotate 90",
        "jump 3",
        "rotate 180",
        room({
            width: 14,
            depth: 18
        }),
        "jump 14",
        "rotate 90",
        "jump 9",
        "marker fireplace-3",
        "stop",
    ])
};