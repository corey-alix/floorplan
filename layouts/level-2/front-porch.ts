import { flatten, room, staircase } from "../../tools/index";

export = {
    title: "front-porch",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto convex-edge-01b",
        "face street",
        "rotate -90",
        room({ width: 4.5, depth: 5.5 }),
        "goto convex-edge-01a",
        room({ width: 25, depth: 8 }),
        "jump 18",
        "rotate -90",
        room({ width: 3, depth: 7 }),
        "jump 3",
        "rotate 90",
        "jump 4",
        "marker front-door",
        "goto convex-edge-01c",
        "face street",
        "jump 8",
        "rotate 90",
        "jump 2",
        "rotate -90",
        staircase({
            count: 3,
            descend: 0.67,
            depth: 0.67, 
            width: 10
        }),
    ])
};