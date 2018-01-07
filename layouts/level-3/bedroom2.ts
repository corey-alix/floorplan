import { flatten, room } from "../../tools/index";

export = {
    title: "bedroom 2",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto house-corner-4",
        "face street",
        "back 12.33",
        room({ width: 12.33, depth: 11.33, title: "benjamin-room" }),
        "back 2.25",
        room({ width: 1.83, depth: 7.83, title: "benjamin-closet-1" }),
        "forward 2.25",
        "left 11.83",
        "right 1.83",
        room({ width: 6, depth: 1.83, title: "benjamin-closet-2" }),
    ])
};