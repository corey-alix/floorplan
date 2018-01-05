import { flatten, room } from "../../tools/index";

export = {
    title: "living room",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto convex-edge-01a",
        "face street",
        "rotate 180",
        room({
            width: 14,
            depth: 17
        }),
        "jump 14",
        "rotate 90",
        "jump 9",
        "marker fireplace-3",
    ])
};