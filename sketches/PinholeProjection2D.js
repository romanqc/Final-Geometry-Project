// PinholeProjection2D.js - 2D Pinhole Projection Visualization
// Canvas 6 - Slide 7 (second demo)

let projection2DSketch = function(p) {
    let f = 180.0;
    let px = 40.0;
    let py = 0.0;

    let S;    // Start world point
    let C;    // Camera (pinhole) = (0,0)
    let I;    // Physical intersection on film
    let current;

    let tAnim = 0;
    let animating = true;
    let showOffset = true;
    let showFilmGrid = true;

    let marginLeft = 190;
    let canvasCenterX;
    let canvasCenterY;

    let worldLimitZmin = -400;
    let worldLimitZmax = 900;

    p.setup = function() {
        let canvas = p.createCanvas(1000, 650);
        canvas.parent('canvas-6');
        p.frameRate(60);

        canvasCenterX = marginLeft + 360;
        canvasCenterY = p.height * 0.5;

        S = p.createVector(220, 700);
        C = p.createVector(0, 200);

        computeFilmIntersection();
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-6');
        if (container && container.classList.contains('fullscreen')) {
            let w = parseInt(container.dataset.fullscreenWidth) || window.innerWidth;
            let h = parseInt(container.dataset.fullscreenHeight) || window.innerHeight;
            p.resizeCanvas(w, h);
            canvasCenterX = marginLeft + (w - marginLeft) * 0.5;
            canvasCenterY = h * 0.5;
        } else {
            p.resizeCanvas(1000, 650);
            canvasCenterX = marginLeft + 360;
            canvasCenterY = 325;
        }
    };

    function computeFilmIntersection() {
        let filmZ;
        if (S.y > C.y) {
            filmZ = C.y - f;
        } else {
            filmZ = C.y + f;
        }
        
        let t = (filmZ - S.y) / (C.y - S.y);
        let xFilm = S.x + t * (C.x - S.x);
        
        I = p.createVector(xFilm, filmZ);
    }

    p.draw = function() {
        p.background(245);
        drawHUD();

        p.push();
        p.translate(canvasCenterX, canvasCenterY);

        drawAxes();
        drawWorldDivider();
        drawFilmPlane();

        animatePoint();
        drawRay();
        drawAllPoints();
        drawProjectionLine();
        drawProjections();

        p.pop();

        drawControlsLegend();
    };

    function animatePoint() {
        if (animating) {
            tAnim += 0.008;
            if (tAnim >= 1) { 
                tAnim = 1; 
                animating = false; 
            }
        }

        if (tAnim < 0.5) {
            let t = p.map(tAnim, 0, 0.5, 0, 1);
            current = p5.Vector.lerp(S, C, t);
        } else {
            let t = p.map(tAnim, 0.5, 1, 0, 1);
            current = p5.Vector.lerp(C, I, t);
        }
    }

    function drawAxes() {
        let cScreenY = worldToScreenZ(C.y);
        
        p.fill(0);
        p.ellipse(0, cScreenY, 8, 8);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text("C", 0, cScreenY - 12);

        p.stroke(100);
        p.line(-20, cScreenY, 20, cScreenY);
        p.line(0, -20, 0, 20);
    }

    function drawWorldDivider() {
        p.stroke(180);
        p.line(260, -300, 260, 300);
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.text("World (Z > 0)", 268, -300);
    }

    function drawFilmPlane() {
        let filmZ = C.y - f;
        let x = worldToScreenX(0, filmZ);

        p.stroke(120, 30, 30);
        p.strokeWeight(2);
        p.line(x, -320, x, 320);
        p.strokeWeight(1);

        let noOriginX = worldToScreenX(0, filmZ);
        let offsetOriginX = worldToScreenX(px, filmZ);

        p.fill(0, 100, 255);
        p.noStroke();
        p.ellipse(noOriginX, worldToScreenZ(filmZ), 6, 6);

        if (showOffset) {
            p.fill(200, 30, 30);
            p.ellipse(offsetOriginX, worldToScreenZ(filmZ), 6, 6);
        }

        if (showFilmGrid) drawFilmGrid();
    }

    function drawFilmGrid() {
        let filmZ = C.y - f;
        let grid = 40;
        
        p.stroke(0, 100, 255, 120);
        p.strokeWeight(1);
        for (let gx = -400; gx <= 400; gx += grid) {
            let x = worldToScreenX(gx, filmZ);
            p.line(x, -320, x, 320);
        }

        if (showOffset) {
            p.stroke(200, 30, 30, 150);
            p.strokeWeight(2);
            for (let gx = -400; gx <= 400; gx += grid) {
                let x = worldToScreenX(gx + px, filmZ);
                p.line(x, -320, x, 320);
            }
            p.strokeWeight(1);
        }
    }

    function drawProjectionLine() {
        if (p.abs(S.y - C.y) < 0.0001) return;
        
        let filmZ;
        if (S.y > C.y) {
            filmZ = C.y - f;
        } else {
            filmZ = C.y + f;
        }
        
        let t = (filmZ - S.y) / (C.y - S.y);
        let x = S.x + t * (C.x - S.x);
        let screenX = worldToScreenX(x, filmZ);
        
        p.stroke(0, 150, 255, 150);
        p.strokeWeight(3);
        p.line(screenX, -320, screenX, 320);
        p.strokeWeight(1);
    }

    function drawRay() {
        p.stroke(0, 150, 50);
        p.strokeWeight(2);

        p.line(
            worldToScreenX(current.x, current.y),
            worldToScreenZ(current.y),
            worldToScreenX(C.x, C.y),
            worldToScreenZ(C.y)
        );

        p.line(
            worldToScreenX(C.x, C.y),
            worldToScreenZ(C.y),
            worldToScreenX(I.x, I.y),
            worldToScreenZ(I.y)
        );
        p.strokeWeight(1);
    }

    function drawAllPoints() {
        // S
        p.fill(255, 140, 0);
        p.stroke(140, 70, 0);
        p.ellipse(worldToScreenX(S.x, S.y), worldToScreenZ(S.y), 12, 12);
        label("S", S);

        // I
        p.fill(0);
        p.noStroke();
        p.ellipse(worldToScreenX(I.x, I.y), worldToScreenZ(I.y), 10, 10);
        label("I", I);

        // animated point
        p.fill(255, 180, 80);
        p.ellipse(worldToScreenX(current.x, current.y), worldToScreenZ(current.y), 11, 11);
    }

    function drawProjections() {
        let filmZ = C.y - f;
        if (p.abs(current.y - C.y) < 0.0001) return;

        let x = (filmZ - C.y) * current.x / (current.y - C.y);

        // P (blue)
        p.fill(0, 150, 255);
        p.noStroke();
        p.ellipse(worldToScreenX(x, filmZ), worldToScreenZ(filmZ), 9, 9);
        label("P", p.createVector(x, filmZ));

        // P₀ (red)
        if (showOffset) {
            p.fill(220, 100, 100);
            p.ellipse(worldToScreenX(x + px, filmZ), worldToScreenZ(filmZ), 9, 9);
            label("P₀", p.createVector(x + px, filmZ));
        }
    }

    function label(s, pv) {
        p.fill(0);
        p.noStroke();
        p.textAlign(p.LEFT, p.CENTER);
        p.text(s, worldToScreenX(pv.x, pv.y) + 8, worldToScreenZ(pv.y));
    }

    function worldToScreenX(x, z) {
        return x;
    }

    function worldToScreenZ(z) {
        return p.map(z, worldLimitZmin, worldLimitZmax, -320, 320);
    }

    p.mousePressed = function() {
        if (!isMouseInCanvas()) return;
        
        if (p.mouseX > canvasCenterX - 100) {
            let lx = p.mouseX - canvasCenterX;
            let ly = p.mouseY - canvasCenterY;

            let frac = (ly + 320) / 640.0;
            let z = p.lerp(worldLimitZmin, worldLimitZmax, frac);

            if (z <= C.y + 10) z = C.y + 50;

            S = p.createVector(lx, z);
            computeFilmIntersection();

            tAnim = 0;
            animating = true;
        }
    };

    p.keyPressed = function() {
        if (p.key === 't' || p.key === 'T') showOffset = !showOffset;
        if (p.key === 'g' || p.key === 'G') showFilmGrid = !showFilmGrid;
        if (p.key === 'r' || p.key === 'R') {
            tAnim = 0;
            animating = true;
        }
    };

    function drawHUD() {
        p.fill(25);
        p.noStroke();
        p.rect(8, 8, marginLeft - 16, p.height - 16, 6);

        p.fill(250);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(14);
        p.text("Legend", 20, 20);
        p.textSize(12);
        p.text("S  – world point", 20, 50);
        p.text("C  – pinhole", 20, 70);
        p.text("I   – physical intersection", 20, 90);
        p.text("P  – projection (no offset)", 20, 110);
        p.text("P₀ – with offset (px)", 20, 130);

        p.text("f  = " + f, 20, 170);
        p.text("px = " + px, 20, 190);
        p.text("T: toggle offset", 20, 230);
        p.text("G: toggle grid", 20, 250);
        p.text("Click world → new S", 20, 270);
    }

    function drawControlsLegend() {
        p.push();
        p.translate(marginLeft + 10, 10);
        p.fill(255);
        p.stroke(160);
        p.rect(0, 0, p.width - marginLeft - 20, 36, 6);
        p.fill(0);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.text("T: offset   G: grid   R: restart   Click world: new S", 8, 18);
        p.pop();
    }

    function isMouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width &&
               p.mouseY >= 0 && p.mouseY <= p.height;
    }
};

// Create the instance
new p5(projection2DSketch);