import { flatten, room } from "../../tools/index";

export = {
    title: "front-porch",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto julia-room",
        "face street",
        "forward 8.5",
        room({ width: 10, depth: 7, title: "green-bathroom" }),
    ])
};