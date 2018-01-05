import { flatten, room } from "../../tools/index";

export = {
    title: "schoolroom",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto kitchen-school-portal",
        "face street",
        "jump 1.33",
        "rotate 180",
        room({width: 13, depth: 20}),
        "rotate 90",
        "jump 9",
        "marker fireplace-2",
        "stop schoolroom",
    ])
};