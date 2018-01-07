import { flatten, room } from "../../tools/index";

export = {
    title: "master bedroom",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto julia-room",
        "face street",
        room({ width: 8, depth: 7, title: "master bathroom" }),
        "left 7.5",
        room({ width: 13, depth: 18, title: "master bedroom" }),
        "forward 13",
        "left 4",
        room({ width: 3.5, depth: 6, title: "master-closet" }),
    ])
};