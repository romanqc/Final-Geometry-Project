// Offset.js - Principal Point Offset Demo
// Canvas 1 - Slide 1

let offsetSketch = function(p) {
    let useTranslation = true;

    // Intrinsic camera parameters
    let fx = 400;
    let fy = 400;
    let cx = 200;
    let cy = 200;

    // A test 3D point in world coordinates
    let worldPoint;

    p.setup = function() {
        let canvas = p.createCanvas(600, 600);
        canvas.parent('canvas-1');
        p.textSize(15);
        worldPoint = p.createVector(1, 1, 5);
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-1');
        if (container && container.classList.contains('fullscreen')) {
            let w = parseInt(container.dataset.fullscreenWidth) || window.innerWidth;
            let h = parseInt(container.dataset.fullscreenHeight) || window.innerHeight;
            p.resizeCanvas(w, h);
        } else {
            p.resizeCanvas(600, 600);
        }
    };

    p.draw = function() {
        p.background(0);

        // Project worldPoint into 2D using the pinhole model
        let projected = projectPoint(worldPoint);

        // Draw coordinate axes for clarity
        drawAxes();

        // Draw the projected point
        p.fill(255, 200, 0);
        p.noStroke();
        p.ellipse(projected.x, projected.y, 12, 12);

        p.fill(255);
        p.noStroke();
        p.text("Projected point = (" + p.nf(projected.x, 1, 2) + ", " + p.nf(projected.y, 1, 2) + ")", 10, p.height - 40);
        p.text("Translation: " + (useTranslation ? "ON (digital image coords)" : "OFF (image-plane coords)"), 10, p.height - 20);
        p.text("Press 'T' to toggle", 10, p.height - 60);
    };

    function projectPoint(P) {
        // Basic pinhole projection:
        // u = fx * X / Z
        // v = fy * Y / Z

        let u = fx * (P.x / P.z);
        let v = fy * (P.y / P.z);

        if (useTranslation) {
            // Add the principal point offsets (cx, cy)
            u += cx;
            v += cy;
        }

        return p.createVector(u, v);
    }

    p.keyPressed = function() {
        if (p.key === 't' || p.key === 'T') {
            useTranslation = !useTranslation;
        }
    };

    function drawAxes() {
        p.stroke(80);
        // Image center (only accurate when translation is ON)
        p.line(cx, 0, cx, p.height);
        p.line(0, cy, p.width, cy);
        p.stroke(255);
    }
};

// Create the instance
new p5(offsetSketch);