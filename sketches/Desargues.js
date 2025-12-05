// Desargues.js - Desargues' Theorem Interactive Demo
// Canvas 5 - Slide 4

let desarguesSketch = function(p) {
    let angle = 25;
    let sliderX = 150; 
    let dragging = false;
    
    let O; 
    
    // Camera controls
    let camRotX = -0.3;
    let camRotY = 0.5;
    let camZoom = 350;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isDraggingCam = false;

    p.setup = function() {
        let canvas = p.createCanvas(800, 600, p.WEBGL);
        canvas.parent('canvas-5');
        
        O = p.createVector(0, -120, 80);
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-5');
        if (container && container.classList.contains('fullscreen')) {
            let w = parseInt(container.dataset.fullscreenWidth) || window.innerWidth;
            let h = parseInt(container.dataset.fullscreenHeight) || window.innerHeight;
            p.resizeCanvas(w, h);
        } else {
            p.resizeCanvas(800, 600);
        }
    };

    p.draw = function() {
        p.background(18);
        
        // 3D Scene
        p.push();
        p.translate(0, 0, -camZoom);
        p.rotateX(camRotX);
        p.rotateY(camRotY);
        
        // Simple lighting
        p.ambientLight(150);
        p.directionalLight(255, 255, 255, 0, 1, -1);

        // Enable transparency blending
        p.blendMode(p.BLEND);

        // Axes
        drawAxes();

        // Intersection line direction
        let Ldir = p.createVector(1, 0, 0);
        let N1 = p.createVector(0, 1, 0);
        let N2 = rotateAroundAxis(N1.copy(), Ldir.copy(), p.radians(angle));

        // Both planes centered at origin
        let C1 = p.createVector(0, 0, 0);
        let C2 = p.createVector(0, 0, 0);

        // Draw planes with better transparency
        drawPlane(C1, N1, p.color(120, 180, 255, 80));
        drawPlane(C2, N2, p.color(255, 140, 120, 80));

        // Draw intersection line
        drawIntersectionLine(C1, N1, C2, N2);

        // Draw point O
        p.push();
        p.noStroke();
        p.fill(255, 255, 0);
        p.translate(O.x, O.y, O.z);
        p.sphere(8);
        p.pop();

        // Rays and triangles
        let dirs = [
            p.createVector(0.3, 0.5, -0.1),
            p.createVector(-0.2, 0.5, 0.15),
            p.createVector(0.05, 0.5, -0.25)
        ];

        let T1 = [];
        let T2 = [];

        // Calculate intersections
        for (let i = 0; i < 3; i++) {
            let D = dirs[i].copy().normalize();
            T1[i] = intersectLinePlane(O, D, C1, N1);
            T2[i] = intersectLinePlane(O, D, C2, N2);
        }

        // Draw rays
        p.strokeWeight(1);
        for (let i = 0; i < 3; i++) {
            let D = dirs[i].copy().normalize();
            p.stroke(255, 200);
            p.line(O.x, O.y, O.z,
                   O.x + D.x * 600, O.y + D.y * 600, O.z + D.z * 600);
        }

        // Draw triangles
        drawTriangle(T1, p.color(120, 180, 255, 150), p.color(60, 130, 240));
        drawTriangle(T2, p.color(255, 140, 120, 150), p.color(240, 90, 60));

        // Connect vertices
        p.strokeWeight(2);
        p.stroke(255, 255, 0);
        for (let i = 0; i < 3; i++) {
            p.line(T1[i].x, T1[i].y, T1[i].z,
                   T2[i].x, T2[i].y, T2[i].z);
        }

        // Draw intersection points
        for (let i = 0; i < 3; i++) {
            if (T1[i]) drawPoint(T1[i], p.color(100, 180, 255));
            if (T2[i]) drawPoint(T2[i], p.color(255, 120, 120));
        }

        p.pop();

        // Draw HUD (slider) - this is in 2D screen space
        drawHUD();
    };

    function drawPlane(C, N, col) {
        let Ntemp = N.copy();
        let X = Ntemp.cross(p.createVector(0, 0, 1));
        if (X.mag() < 0.0001) {
            X = N.copy().cross(p.createVector(0, 1, 0));
        }
        X.normalize();

        let Y = N.copy().cross(X);
        Y.normalize();

        let s = 200;

        // Draw filled plane with transparency
        p.push();
        p.noStroke();
        p.fill(col);
        
        p.beginShape();
        p.vertex(C.x + X.x * s + Y.x * s, C.y + X.y * s + Y.y * s, C.z + X.z * s + Y.z * s);
        p.vertex(C.x - X.x * s + Y.x * s, C.y - X.y * s + Y.y * s, C.z - X.z * s + Y.z * s);
        p.vertex(C.x - X.x * s - Y.x * s, C.y - X.y * s - Y.y * s, C.z - X.z * s - Y.z * s);
        p.vertex(C.x + X.x * s - Y.x * s, C.y + X.y * s - Y.y * s, C.z + X.z * s - Y.z * s);
        p.endShape(p.CLOSE);
        
        // Draw both sides of the plane for proper transparency
        p.beginShape();
        p.vertex(C.x + X.x * s + Y.x * s, C.y + X.y * s + Y.y * s, C.z + X.z * s + Y.z * s);
        p.vertex(C.x + X.x * s - Y.x * s, C.y + X.y * s - Y.y * s, C.z + X.z * s - Y.z * s);
        p.vertex(C.x - X.x * s - Y.x * s, C.y - X.y * s - Y.y * s, C.z - X.z * s - Y.z * s);
        p.vertex(C.x - X.x * s + Y.x * s, C.y - X.y * s + Y.y * s, C.z - X.z * s + Y.z * s);
        p.endShape(p.CLOSE);
        p.pop();

        // Draw outline (opaque)
        p.push();
        p.noFill();
        p.stroke(p.red(col), p.green(col), p.blue(col), 200);
        p.strokeWeight(2);
        p.beginShape();
        p.vertex(C.x + X.x * s + Y.x * s, C.y + X.y * s + Y.y * s, C.z + X.z * s + Y.z * s);
        p.vertex(C.x - X.x * s + Y.x * s, C.y - X.y * s + Y.y * s, C.z - X.z * s + Y.z * s);
        p.vertex(C.x - X.x * s - Y.x * s, C.y - X.y * s - Y.y * s, C.z - X.z * s - Y.z * s);
        p.vertex(C.x + X.x * s - Y.x * s, C.y + X.y * s - Y.y * s, C.z + X.z * s - Y.z * s);
        p.endShape(p.CLOSE);
        p.pop();
    }

    function drawIntersectionLine(C1, N1, C2, N2) {
        let L = N1.copy().cross(N2);
        if (L.mag() < 0.0001) return;
        L.normalize();

        let delta = p5.Vector.sub(C2, C1);
        let denom = L.dot(N2);
        if (p.abs(denom) < 0.0001) return;

        let t = delta.dot(N2) / denom;
        let P0 = p5.Vector.add(C1, p5.Vector.mult(L, t));

        p.stroke(255, 255, 0);
        p.strokeWeight(4);
        p.line(P0.x - L.x * 300, P0.y - L.y * 300, P0.z - L.z * 300,
               P0.x + L.x * 300, P0.y + L.y * 300, P0.z + L.z * 300);
    }

    function intersectLinePlane(P, D, C, N) {
        let denom = N.dot(D);
        if (p.abs(denom) < 1e-4) return null;

        let t = N.dot(p5.Vector.sub(C, P)) / denom;
        return p5.Vector.add(P, p5.Vector.mult(D, t));
    }

    function drawPoint(v, col) {
        p.push();
        p.translate(v.x, v.y, v.z);
        p.noStroke();
        p.fill(col);
        p.sphere(6);
        p.pop();
    }

    function drawTriangle(pts, fillCol, edgeCol) {
        if (!pts[0] || !pts[1] || !pts[2]) return;

        p.fill(fillCol);
        p.noStroke();
        p.beginShape();
        for (let i = 0; i < 3; i++) {
            p.vertex(pts[i].x, pts[i].y, pts[i].z);
        }
        p.endShape(p.CLOSE);

        // Outline
        p.noFill();
        p.stroke(edgeCol);
        p.strokeWeight(2);
        p.beginShape();
        for (let i = 0; i < 3; i++) {
            p.vertex(pts[i].x, pts[i].y, pts[i].z);
        }
        p.endShape(p.CLOSE);
    }

    function drawHUD() {
        // Disable depth testing for HUD
        p.push();
        
        // Set up orthographic projection for 2D overlay
        let cam = p.createCamera();
        cam.ortho(-p.width/2, p.width/2, -p.height/2, p.height/2, 0, 1000);
        p.setCamera(cam);
        p.resetMatrix();
        
        // Now draw in screen coordinates centered at (0,0)
        let sliderStartX = -p.width/2 + 60;
        let sliderEndX = -p.width/2 + 260;
        let sliderY = -p.height/2 + 50;
        
        // Update angle
        angle = p.map(sliderX, 60, 260, 0, 90);
        
        // Draw background for text
        p.noStroke();
        p.fill(0, 0, 0, 180);
        p.rect(sliderStartX - 10, sliderY - 40, 240, 70, 5);
        
        // Draw label
        p.fill(255);
        p.textSize(16);
        p.textAlign(p.LEFT, p.CENTER);
        p.text("Angle: " + p.nf(angle, 1, 1) + "°", sliderStartX, sliderY - 20);

        // Draw slider track
        p.stroke(200);
        p.strokeWeight(3);
        p.line(sliderStartX, sliderY, sliderEndX, sliderY);

        // Draw slider knob
        let knobX = p.map(angle, 0, 90, sliderStartX, sliderEndX);
        p.noStroke();
        p.fill(dragging ? p.color(255, 220, 100) : p.color(255, 200));
        p.ellipse(knobX, sliderY, 24, 24);
        
        // Draw inner circle
        p.fill(100);
        p.ellipse(knobX, sliderY, 10, 10);
        
        p.pop();
    }

    function drawAxes() {
        p.strokeWeight(2);
        p.stroke(255, 0, 0);
        p.line(0, 0, 0, 100, 0, 0);
        p.stroke(0, 255, 0);
        p.line(0, 0, 0, 0, 100, 0);
        p.stroke(0, 0, 255);
        p.line(0, 0, 0, 0, 0, 100);
    }

    function rotateAroundAxis(v, k, theta) {
        let a = k.copy().normalize();
        let cos = p.cos(theta);
        let sin = p.sin(theta);

        let term1 = v.copy().mult(cos);
        let term2 = a.copy().cross(v).mult(sin);
        let term3 = a.copy().mult(a.dot(v) * (1 - cos));

        return term1.add(term2).add(term3);
    }

    // Mouse interaction
    p.mousePressed = function() {
        if (!isMouseInCanvas()) return;
        
        // Check if clicking on slider
        let sliderStartX = 60;
        let sliderEndX = 260;
        let sliderY = 50;
        let knobX = p.map(angle, 0, 90, sliderStartX, sliderEndX);
        
        if (p.dist(p.mouseX, p.mouseY, knobX, sliderY) < 20) {
            dragging = true;
        } else {
            isDraggingCam = true;
            lastMouseX = p.mouseX;
            lastMouseY = p.mouseY;
        }
    };

    p.mouseReleased = function() {
        dragging = false;
        isDraggingCam = false;
    };

    p.mouseDragged = function() {
        if (!isMouseInCanvas()) return;
        
        if (dragging) {
            let sliderStartX = 60;
            let sliderEndX = 260;
            angle = p.map(p.constrain(p.mouseX, sliderStartX, sliderEndX), sliderStartX, sliderEndX, 0, 90);
            sliderX = p.mouseX;
        } else if (isDraggingCam) {
            camRotY += (p.mouseX - lastMouseX) * 0.01;
            camRotX += (p.mouseY - lastMouseY) * 0.01;
            camRotX = p.constrain(camRotX, -p.HALF_PI + 0.1, p.HALF_PI - 0.1);
            lastMouseX = p.mouseX;
            lastMouseY = p.mouseY;
        }
    };

    p.mouseWheel = function(event) {
        if (isMouseInCanvas()) {
            camZoom += event.delta * 0.5;
            camZoom = p.constrain(camZoom, 100, 800);
            return false;
        }
    };

    function isMouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width &&
               p.mouseY >= 0 && p.mouseY <= p.height;
    }
};

// Create the instance
new p5(desarguesSketch);