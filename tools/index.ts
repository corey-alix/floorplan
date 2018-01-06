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

export function staircase(options = {
    count: 6,
    descend: 0.67,
    depth: 0.67,
    width: 3.75,
}) {
    let result = [];
    for (let i = 0; i < options.count; i++) {
        let even = (0 == i % 2);
        result.push(`descend ${options.descend}`);
        result.push(`move ${options.depth}`);
        result.push(even ? "rotate -90" : "rotate 90");
        result.push(`move ${options.width}`);
        result.push(even ? "rotate 90" : "rotate -90");
    }
    return result;
}

export function room(options = {
    width: 12,
    depth: 8,
    title: "",
}) {
    let result = [];
    
    result.push(`marker ${options.title}`);
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

export function arc(options = {
    segments: 6,
    degrees: -90,
    length: 20,
}) {
    let result = [];
    let delta_angle = Math.round(10 * options.degrees / (options.segments - 1)) / 10;
    let depth = Math.round(10 * options.length / options.segments) / 10;

    for (let step = 0; step < options.segments; step++) {
        step > 0 && result.push(`marker ${Math.abs(delta_angle)}°`);
        result.push(`move ${depth}`);
        result.push(`rotate ${delta_angle}`);
    }

    return result;
}

