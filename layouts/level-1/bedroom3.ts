import { flatten, room } from "../../tools/index";

export = {
    title: "bedroom-3",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto basement-corner-1",
        "face street",
        "right 25.23",
        "forward 20.5",
        room({ width: 12, depth: 11, title: "lydia-room" }),
        "back 2.33",
        room({ width: 1.83, depth: 7, title: "lydia-closet" }),
  ])
};