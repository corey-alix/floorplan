import { flatten, room } from "../../tools/index";

export = {
    title: "garage",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto garage-corner-1",
        "face street",
        "rotate 180",
        room({ width: 25, depth: 20 }),
        "push",
        "rotate 90",
        "jump 10",
        "marker 16' garage door",
        "pop",
        "jump 25",
        "rotate 90",
        "jump 20",
        "rotate 90",
        "jump 3",
        "marker convex-edge-01a",
        "jump 4",
        "marker garage-porch-portal",
        "stop garage",
        "goto convex-corner-01",
        "face street",
        "rotate 90",
        "jump 8",
        "rotate 90",
        room({ width: 19, depth: 8 }),
        "jump 19",
        "rotate 90",
        "jump 4",
        "marker back-deck-portal",
        "stop deck"
    ])
};