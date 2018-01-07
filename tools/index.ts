const default_options = {
    arc: {
        title: "",
        segments: 6,
        degrees: -90,
        length: 20,
    },
    room: {
        title: "",
        width: 12,
        depth: 8,
    },
    staircase: {
        title: "",
        count: 6,
        descend: 0.67,
        depth: 0.67,
        width: 3.75,
    }
};

export function flatten<T>(arr: T[]) {
    let result = [] as Array<T>;
    arr.forEach(item => {
        if (Array.isArray(item)) {
            result = result.concat(item);
        } else {
            result.push(item);
        }
    });
    return result;
}

export function defaults<P extends any, Q extends any>(target: P, defaults: Q) {
    Object.keys(defaults).forEach(k => {
        if (undefined === target[k]) target[k] = defaults[k];
    })
    return <P & Q>target;
}

export function staircase(options: Partial<typeof default_options.staircase> = default_options.staircase) {
    options = defaults(options, default_options.staircase);
    let result = [];
    if (options.count) {
        options.title && result.push(`marker ${options.title}`);
        for (let i = 0; i < options.count; i++) {
            let even = (0 === i % 2);
            result.push(`descend ${options.descend}`);
            result.push(`move ${options.depth}`);
            result.push(even ? "rotate 90" : "rotate -90");
            result.push(`move ${options.width}`);
            result.push(even ? "rotate -90" : "rotate 90");
        }
        if (1 === options.count % 2) result.push(`right ${options.width}`);
    }

    return result;
}

export function room(options: Partial<typeof default_options.room> = default_options.room) {
    options = defaults(options, default_options.room);

    let result = [];

    options.title && result.push(`marker ${options.title}`);
    result.push(`move ${options.width}`);
    result.push("rotate 90");
    result.push(`move ${options.depth}`);
    result.push("rotate 90");
    result.push(`move ${options.width}`);
    result.push("rotate 90");
    result.push(`move ${options.depth}`);
    result.push("rotate 90");
    return result;
}

export function arc(options: Partial<typeof default_options.arc> = default_options.arc) {
    options = defaults(options, default_options.arc);

    let result = [];
    let delta_angle = Math.round(10 * options.degrees / (options.segments - 1)) / 10;
    let depth = Math.round(10 * options.length / options.segments) / 10;

    options.title && result.push(`marker ${options.title}`);

    for (let step = 0; step < options.segments; step++) {
        step > 0 && result.push(`marker ${Math.abs(delta_angle)}°`);
        result.push(`move ${depth}`);
        result.push(`rotate ${delta_angle}`);
    }

    return result;
}

