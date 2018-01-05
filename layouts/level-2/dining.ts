import { flatten, room } from "../../tools/index";

export = {
    title: "level-2",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto convex-corner-01",
        "face street",
        "rotate 180",
        room({width: 14.5, depth: 12}),
        "jump 14.5",
        "rotate 90",
        "jump 5.33",
        "marker dining-kitchen-portal",
        "stop dining room",
    ])
};