import { flatten, room } from "../../tools/index";

export = {
    title: "bedroom-1",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto basement-corner-1",
        "face street",
        "right 25.23",
        room({ width: 12.5, depth: 15, title: "julia-room" }),
        "forward 13",
        room({ width: 5, depth: 7, title: "julia-closet" }),
  ])
};