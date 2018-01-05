import { flatten, room } from "../../tools/index";

export = {
    title: "kitchen",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto dining-kitchen-portal",
        "face street",
        "rotate 90",
        "jump 5.33",
        "rotate 90",
        room({width: 13, depth: 17.83}),
        "rotate 90",
        "jump 17.83",
        "rotate -90",
        "jump 1.33",
        "marker kitchen-school-portal",
        "stop",
    ])
};