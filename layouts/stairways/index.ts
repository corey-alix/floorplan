import { flatten, room, staircase } from "../../tools/index";

export = {
    title: "stairways",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto basement-corner-1",
        "face street",
        "forward 8.5",
        "rotate -90",
        staircase({ count: 7, descend: -7/12, depth: 11.375/12, width: 41/12 }),
        "ascend 0.53",
        room({ width: 3.5, depth: 8 }),
        "left 8",
        "rotate 180",
        staircase({ count: 6, descend: -0.53, depth: 0.96, width: 3.33 }),
        "ascend 0.53",
        "right 4",
        room({ width: 4.5, depth: 7 }),
        "rotate 180",
        "right 3.5",
        staircase({ count: 6, descend: -0.53, depth: 0.96, width: 3.33 }),
    ])
};