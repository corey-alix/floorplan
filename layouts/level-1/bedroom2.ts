import { flatten, room } from "../../tools/index";

export = {
    title: "bedroom-2",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto basement-corner-1",
        "face street",
        "forward 20.5",
        "right 12",
        room({ width: 12, depth: 12, title: "nathan-room" }),
        "right 2.33",
        room({ width: 12, depth: 1.83, title: "nathan-closet" }),
  ])
};