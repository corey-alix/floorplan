import ol = require("openlayers");

interface Layout {
    start?: string;
    route?: string[];
    righthand?: string;
    routes?: Array<Layout>;
    places?: Array<{ name: string, location: [number, number] }>;
    directions?: Array<{ name: string, direction: number }>;
}

class Renderer {


    private features: ol.Feature[];

    private state = {
        position: new ol.geom.Point([0, 0]),
        direction: 0,
        elevation: 0,
        locations: [{
            name: "origin",
            point: new ol.geom.Point([0, 0]),
        }],
        rightHandRule: false,
        orientations: [
            {
                name: "north",
                direction: 0,
            },
            {
                name: "south",
                direction: 180,
            },
            {
                name: "west",
                direction: 90,
            },
            {
                name: "east",
                direction: -90,
            },
        ],
    }

    render(source: Layout, features = []) {

        this.features = features;
        this.state.rightHandRule = "true" === source.righthand;

        if (source.directions) source.directions.forEach(d => this.addDirection(d.name, d.direction));
        if (source.places) source.places.forEach(d => this.addPlace(d.name, d.location));

        source.start && this.goto([source.start]);

        source.route && source.route.forEach(route => {
            let tokens = route.split(" ");
            let command = tokens.shift();
            switch (command) {
                case "ascend": this.ascend(tokens); break;
                case "descend": this.descend(tokens); break;
                case "face": this.face(tokens); break;
                case "jump": this.jump(tokens); break;
                case "goto": this.goto(tokens); break;
                case "rotate": this.rotate(tokens); break;
                case "marker": this.marker(tokens); break;
                case "move": this.move(tokens); break;
                case "stop": this.stop(tokens); break;
                default: console.warn(`cannot process ${command}: ${tokens}`);
            }
        });

        source.routes && source.routes.forEach(source => this.render(source, this.features));

        return this.features;
    }

    private getLocation(location: string[]) {
        let key = location.join(" ");
        let result = this.state.locations.find(l => l.name === key);
        if (!result) console.warn(`no location for ${key}`);
        return result && result.point;
    }

    private getOrientation(location: string[]) {
        let key = location.join(" ");
        let result = this.state.orientations.find(l => l.name === key);
        if (!result) console.warn(`no orientation for ${key}`);
        return result && result.direction;
    }

    addPlace(name: string, location: [number, number]) {
        this.state.locations.push({
            name: name,
            point: new ol.geom.Point(location)
        });
    }

    addDirection(name: string, direction: number) {
        this.state.orientations.push({
            name: name,
            direction: direction
        });
    }

    private ascend(location: string[]) {
        console.log("ascend", location);
        this.state.elevation += parseFloat(location[0]);
    }

    private descend(location: string[]) {
        console.log("descend", location);
        this.state.elevation -= parseFloat(location[0]);
    }

    private face(location: string[]) {
        console.log("face", location);
        this.state.direction = this.getOrientation(location);
    }

    private goto(location: string[]) {
        console.log("goto", location);
        this.state.position = this.getLocation(location);
    }

    private jump(location: string[]) {
        console.log("jump", location);
        this.trs(location);
    }

    private marker(location: string[]) {
        console.log("marker", location);
        let point = new ol.Feature({
            name: location.join(" "),
            geometry: this.state.position
        });
        if (!this.state.locations.find(l => l.name === location[0])) {
            this.addPlace(location.join(" "), this.state.position.getCoordinates());
        }
        this.features.push(point);
    }

    private move(location: string[]) {
        console.log("move", location);
        let geom = this.trs(location);
        this.features.push(new ol.Feature({
            name: location.join(" "),
            orientation: (360 + this.state.direction + 90) % 180,
            geometry: geom
        }));
    }

    private trs(location: string[]) {
        let geom = new ol.geom.LineString([]);
        let [x, y] = this.state.position.getCoordinates();
        geom.appendCoordinate([x, y]);
        let scalar = parseFloat(location[0]);
        if (this.state.rightHandRule) {
            [x, y] = [x - scalar * Math.sin(Math.PI * this.state.direction / 180), y + scalar * Math.cos(Math.PI * this.state.direction / 180)];
        }
        else {
            [x, y] = [x + scalar * Math.sin(Math.PI * this.state.direction / 180), y + scalar * Math.cos(Math.PI * this.state.direction / 180)];
        }
        geom.appendCoordinate([x, y]);
        this.state.position = new ol.geom.Point([x, y]);
        return geom;
    }

    private rotate(location: string[]) {
        console.log("rotate", location);
        this.state.direction += parseFloat(location[0]);
    }

    private stop(location: string[]) {
        console.log("stop", location);
    }

}

var renderer = new Renderer();

export = renderer;