import { flatten, room } from "../../tools/index";

export = {
    title: "kitchen",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto deck portal side 1",
        "rotate 180",
        "jump 12",
        "rotate 90",
        "jump 3",
        "rotate -90",
        "move 18",
        "rotate -90",
        "move 3.5",
        "jump 4",
        "move 6.5",
        "rotate -90",
        "move 8.5",
        "marker fireplace-3",
        "move 9.5",
        "rotate -90",
        "move 3.5",
        "jump 4",
        "move 6.5",
        "stop living room",
    ])
};