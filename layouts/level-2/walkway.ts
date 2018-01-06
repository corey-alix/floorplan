import { flatten, arc } from "../../tools/index";

export = {
    title: "walkway",
    units: "feet",
    righthand: "true",
    route: flatten([
        "goto garage-corner-1",
        "face street",
        "rotate -90",
        "jump 20",
        "push",
        arc({
            segments: 5,
            degrees: -80,
            length: 21,
        }),
        "pop",
        "rotate 90",
        "jump 10",
        "rotate -90",
        arc({
            segments: 5,
            degrees: -80,
            length: 37,
        }),
    ])
};