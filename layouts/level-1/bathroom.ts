import { flatten, room } from "../../tools/index";

export = {
    title: "bathroom",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto basement-corner-1",
        "face street",
        "rotate -90",
        "forward 0.5",
        room({ width: 9.33, depth: 8, title: "kids-bathroom" }),
  ])
};