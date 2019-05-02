const settings = {
    isStaticBackground: false,
    showFlies: true,
    showFps: false,
    eraseBackground: true,
    backgroundColor: "#ffffff",
    treeColor: "#000000",
    isStaticTreeColor: false
};

const sketch = p => {
    let width;
    let height;

    let rootX, rootY;

    let trunkLength = 20;
    let trunkLengthStep = 0.1;
    const trunkLengthMax = 250;

    const branchAngle = p.PI / 2;

    let t = 0;
    let tStep = 0.01;

    let backgroundColorT = 0;
    let backgroundColorTStep = 0.001;

    let walkers = [];
    let branchCounter = 0;

    let tree;

    p.setup = () => {
        const canvasParent = document.getElementById("canvas");

        let width = canvasParent.clientWidth;
        let height = canvasParent.clientHeight;

        const canvas = p.createCanvas(
            canvasParent.clientWidth,
            canvasParent.clientHeight
        );

        canvas.parent(canvasParent);

        // p.frameRate(25);

        rootX = width / 2;
        rootY = 0;

        tree = new Tree({
            x: rootX,
            y: rootY,
            calclulateLength: lengF,
            calclulateAngle: angleF,
            color: 255,
            p: p,
            branchAngle: branchAngle
        });

        walkers.push(
            new Walker({ p: p, x: width / 2, y: height / 2, width, height })
        );
        walkers.push(
            new Walker({
                p: p,
                r: 10,
                x: width / 2,
                y: height / 2,
                speed: 50,
                seed: 1000,
                width,
                height
            })
        );
    };

    p.draw = () => {
        let morningColor = p.color(194, 216, 249);
        let nightColor = p.color(19, 2, 56);

        let sunColor = p.color(244, 199, 17);
        let moonColor = p.color(158, 250, 255);

        p.rotate(p.PI);
        p.translate(-p.width, -p.height);

        if (settings.eraseBackground) {
            p.background(
                getBackgroundColor(morningColor, nightColor, backgroundColorT)
            );
        }

        backgroundColorT += backgroundColorTStep;

        if (backgroundColorT >= 1 || backgroundColorT <= 0) {
            backgroundColorTStep = -backgroundColorTStep;
        }

        if (trunkLength < trunkLengthMax) {
            trunkLength += trunkLengthStep;
            trunkLengthStep *= 0.99999;
        } else {
            trunkLength = 10;
        }

        tree.trunkLength = trunkLength;
        tree.color = getTreeColor(t);

        tree.draw();

        t += tStep;

        if (settings.showFlies) {
            walkers.forEach(w => w.update(t));
            walkers.forEach(w => w.draw());
        }

        p.resetMatrix();
        if (settings.showFps) {
            p.text(p.frameRate().toFixed(0), 100, 100);
        }
    };

    function lengF(l, depth, side) {
        // return l * 0.7;
        return l * randomForBranchMemoized(depth + side);

        // TODO: not working good
        return (
            l *
            p.map(
                noiseMemoized(
                    depth * 10000 + depth * (side === "R" ? 0.1 : 0.2)
                ),
                0,
                1,
                0.0,
                0.9
            )
        );
        return l * noiseMemoized(depth * 1000);
    }

    function randomForBranch(depth) {
        return p.random(0.3, 0.9);
    }

    function angleF(angle, depth) {
        // const remain = t - Math.floor(t);

        // return angle / 2;
        return angle * cycledNoise(depth * 10000, t);
        // return angle * random(0.1, 0.9)
    }

    function cycledNoise(value, t) {
        const remain = roundTo(t - Math.floor(t), 4);

        let tt;
        if (Math.floor(t) % 2 === 0) {
            tt = remain;
        } else {
            tt = 1 - remain;
        }

        return noiseMemoized(value + tt);
    }

    function getBackgroundColor(a, b, t) {
        if (settings.isStaticBackground) {
            return settings.backgroundColor;
        } else {
            return p.lerpColor(a, b, t);
        }
    }

    function getTreeColor(t) {
        if (settings.isStaticTreeColor) {
            return settings.treeColor;
        }
        return p.color(
            p.map(cycledNoise(100, t), 0, 1, 0, 255),
            p.map(cycledNoise(10000, t), 0, 1, 0, 255),
            p.map(cycledNoise(90000, t), 0, 1, 0, 255)
        );
    }

    const randomForBranchMemoized = memo(randomForBranch);
    const noiseMemoized = memo(p.noise);
};

class Walker {
    constructor({
        p,
        r = 20,
        color = 255,
        seed = 10000,
        speed = 10,
        x = 0,
        y = 0,
        width,
        height
    }) {
        this.x = x;
        this.y = y;
        this.p = p;
        this.seed = seed;
        this.speed = speed;
        this.color = color;
        this.r = r;
        this.width = width;
        this.height = height;

        this.t = 0;
        this.dt = p.map(speed, 0, 100, 0.005, 0.01);
    }
    update(dt) {
        this.t += this.dt;
        this.x = this.p.map(this.p.noise(this.t), 0, 1, 0, this.width);
        this.y = this.p.map(
            this.p.noise(this.t + this.seed),
            0,
            1,
            0,
            this.height
        );
    }

    draw() {
        this.p.fill(this.color);
        this.p.circle(this.x, this.y, this.r);
    }
}

class SunMoon {
    constructor({ radius, start, end, t = 0, sunColor, moonColor, step }) {
        this.radius = radius;
        this.start = start;
        this.end = end;
        this.sunColor = sunColor;
        this.moonColor = moonColor;
        this.step = step;

        this._direction = 1;
        this._t = t;
    }

    update(t) {
        this.t = t;

        this._t += this.step * this._direction;

        if (this._t > 1) {
            this._t = 1;
            this._direction = -1;
        } else if (this._t < 0) {
            this._t = 0;
            this._direction = 1;
        }
    }

    draw() {
        let circleColor = this.sunColor;

        if (this._direction > 0) {
            circleColor = this.sunColor;
        }

        if (this._direction < 0) {
            circleColor = moonColor;
        }

        p.fill(circleColor);
        const sunX = p.lerp(this.start.x, this.end.x, this._t);
        const sunY = p.lerp(this.start.y, this.end.y, this._t);
        // print(sunY)
        p.circle(sunX, sunY, this.radius);
    }
}

// TODO: move implementation here
class Tree {
    constructor({
        x,
        y,
        trunkLength,
        branchAngle,
        t,
        p,
        color,
        calclulateAngle,
        calclulateLength
    }) {
        this.x = x;
        this.y = y;
        this.trunkLength = trunkLength;
        this.branchAngle = branchAngle;
        this.t = t;
        this.p = p;
        this.color = color;
        this.calclulateAngle = calclulateAngle;
        this.calclulateLength = calclulateLength;
    }

    update() {}

    draw() {
        const x1 = this.x; // map(noise(t), 0, 1, -50, 50)
        const y1 = this.y + this.trunkLength; // map(noise(t + 99999), 0, 1, 0, height/5 + 40)

        const localX = x1 - this.x;
        const localY = y1 - this.y;

        this.p.stroke(this.color);

        this.p.line(this.x, this.y, x1, y1);

        this.drawBranch(
            this.x,
            this.y,
            localX,
            localY,
            this.trunkLength,
            this.branchAngle,
            0,
            0
        );
    }

    drawBranch(x0, y0, x, y, leng, angle, prevAngle, depth) {
        if (leng < 5) return;

        const ll = Math.sqrt(x * x + y * y);
        const nx = x / ll;
        const ny = y / ll;

        const angle1 = prevAngle + this.calclulateAngle(angle * 0.5, depth);
        const angle2 = prevAngle - this.calclulateAngle(angle * 0.5, depth);

        const point1 = rotateByAngle1(nx, ny, angle1);
        const point2 = rotateByAngle1(nx, ny, angle2);

        const branch1Length = this.calclulateLength(leng, depth, "L");
        const branch2Length = this.calclulateLength(leng, depth, "R");

        this.p.line(
            x0 + x,
            y0 + y,
            x0 + x + point1[0] * branch1Length,
            y0 + y + point1[1] * branch1Length
        );
        this.p.line(
            x0 + x,
            y0 + y,
            x0 + x + point2[0] * branch2Length,
            y0 + y + point2[1] * branch2Length
        );

        this.drawBranch(
            x0 + x,
            y0 + y,
            x0 + x + point1[0] * branch1Length - (x0 + x),
            y0 + y + point1[1] * branch1Length - (y0 + y),
            branch1Length,
            angle,
            angle1,
            depth + 1
        );

        this.drawBranch(
            x0 + x,
            y0 + y,
            x0 + x + point2[0] * branch2Length - (x0 + x),
            y0 + y + point2[1] * branch2Length - (y0 + y),
            branch2Length,
            angle,
            angle2,
            depth + 1
        );
    }
}

function memo(generator) {
    const storage = {};

    return function() {
        // TODO: maybe it could make bottleneck
        const key = [...arguments].join(",");
        if (storage[key] === undefined) {
            const value = generator.apply(this, [...arguments]);

            storage[key] = value;
            memo.calculationCalls++;
        } else {
            memo.savedCalls++;
        }

        return storage[key];
    };
}

memo.savedCalls = 0;
memo.calculationCalls = 0;

// TODO: move to utils
function rotateByAngle(x, y, angle) {
    const xr = x * Math.cos(angle) - y * Math.sin(angle);
    const yr = x * Math.sin(angle) + y * Math.cos(angle);

    return [xr, yr];
}

function rotateByAngle1(x, y, angle) {
    const d = Math.sqrt(x * x + y * y);
    const xr = d * Math.sin(angle);
    const yr = d * Math.cos(angle);

    return [xr, yr];
}

function roundTo(value, digits) {
    return parseFloat(value.toFixed(digits));
}

let myp5;

function initCanvas() {
    myp5 = new p5(sketch);
}

function destructCanvas() {
    myp5.remove();
}

initCanvas();


let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        destructCanvas();
        initCanvas();
    }, 400);
});

document
    .querySelector(".controls__reset-button")
    .addEventListener("click", () => {
        destructCanvas();
        initCanvas();
    });

document.querySelector(".controls_options-static-background").checked =
    settings.isStaticBackground;

document
    .querySelector(".controls_options-static-background")
    .addEventListener("click", e => {
        settings.isStaticBackground = e.target.checked;
    });

document.querySelector(".controls_options-show-flies").checked =
    settings.showFlies;

document
    .querySelector(".controls_options-show-flies")
    .addEventListener("click", e => {
        settings.showFlies = e.target.checked;
    });

document.querySelector(".controls_options-show-fps").checked = settings.showFps;

document
    .querySelector(".controls_options-show-fps")
    .addEventListener("click", e => {
        settings.showFps = e.target.checked;
    });

document.querySelector(".controls_options-erase-background").checked =
    settings.eraseBackground;

document
    .querySelector(".controls_options-erase-background")
    .addEventListener("click", e => {
        settings.eraseBackground = e.target.checked;
    });

document.querySelector(".controls_options-background-color").value =
    settings.backgroundColor;

document
    .querySelector(".controls_options-background-color")
    .addEventListener("change", e => {
        settings.backgroundColor = e.target.value;
    });

document.querySelector(".controls_options-static-tree-color").checked =
    settings.isStaticBackground;

document
    .querySelector(".controls_options-static-tree-color")
    .addEventListener("click", e => {
        settings.isStaticTreeColor = e.target.checked;
    });

document.querySelector(".controls_options-tree-color").value =
    settings.treeColor;

document
    .querySelector(".controls_options-tree-color")
    .addEventListener("change", e => {
        settings.treeColor = e.target.value;
    });
