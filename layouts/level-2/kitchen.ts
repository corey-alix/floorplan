import { flatten, room } from "../../tools/index";

export = {
    title: "kitchen",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto house-corner-2",
        "face street",
        "push",
        "jump 11.75",
        "marker kitchen-garage-portal",
        "pop",
        "rotate -90",
        room({width: 17.83, depth: 13}),
        "jump 17.83",
        "rotate 90",
        "jump 11.67",
        "marker kitchen-school-portal",
    ])
};