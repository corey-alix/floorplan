import { flatten, room, staircase } from "../../tools/index";

export = {
    title: "front-porch",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto convex-edge-01a",
        "face street",
        "rotate -90",
        room({ width: 25, depth: 8 }),
        "jump 18",
        "rotate -90",
        room({ width: 3, depth: 7 }),
        "jump 3",
        "rotate 90",
        "jump 4",
        "marker front-door",
        "rotate 90",
        "jump 11",
        "rotate 90",
        "jump 4",
        "rotate -90",
        staircase({
            count: 3,
            descend: 0.67,
            depth: 0.67, 
            width: 7
        }),
        "stop",
    ])
};