import { flatten, staircase as steps, room } from "../../tools/index";

export = {
    title: "kitchen",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto dining portal-1",
        "face street",
        "rotate 90",
        "move 5.33",
        "rotate 90",
        "move 13",
        "rotate 90",
        "move 17.83",
        "rotate 90",
        "move 13",
        "marker kitchen pantry",
        "rotate 90",
        "move 9.5",
        "stop kitchen",
    ])
};