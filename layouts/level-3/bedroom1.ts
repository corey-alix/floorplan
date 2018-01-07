import { flatten, room, staircase } from "../../tools/index";

export = {
    title: "bedroom 1",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto house-corner-4",
        "face street",
        "back 12.33",
        "left 11.83",
        room({ width: 12.33, depth: 11.33, title: "daniel-room" }),
        "forward 6.33",
        "right 2.33",
        room({ width: 6, depth: 1.83, title: "daniel-closet" }),
    ])
};