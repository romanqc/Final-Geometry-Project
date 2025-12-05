// DesarguesParallel.js - Desargues' Theorem with Parallel Planes
// Canvas 7 - Slide 7 (additional demo)

let desarguesParallelSketch = function(p) {
    let O; // Perspectivity center
    let A, B, C; // Triangle 1
    let a, b, c; // Triangle 2
    
    // Camera controls
    let angleX = -0.2;
    let angleY = 0.3;
    let zoom = 600;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isDragging = false;

    p.setup = function() {
        let canvas = p.createCanvas(900, 700, p.WEBGL);
        canvas.parent('canvas-7');
        
        // Perspectivity center
        O = p.createVector(0, 200, 0);

        // Triangle ABC on Plane 1
        A = p.createVector(-200, 100, -150);
        B = p.createVector(-250, 300, -120);
        C = p.createVector(-150, 250, -200);

        // Triangle abc on Plane 2 (projected through O)
        a = projectThrough(O, A, 1.8);
        b = projectThrough(O, B, 1.8);
        c = projectThrough(O, C, 1.8);
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-7');
        if (container && container.classList.contains('fullscreen')) {
            let w = parseInt(container.dataset.fullscreenWidth) || window.innerWidth;
            let h = parseInt(container.dataset.fullscreenHeight) || window.innerHeight;
            p.resizeCanvas(w, h);
        } else {
            p.resizeCanvas(900, 700);
        }
    };

    p.draw = function() {
        p.background(245);
        p.lights();
        
        // Apply camera transformations
        p.translate(0, 0, -zoom);
        p.rotateX(angleX);
        p.rotateY(angleY);

        drawAxes();

        // Draw planes (semi-transparent)
        drawPlane(A, B, C, p.color(120, 180, 255, 80));
        drawPlane(a, b, c, p.color(255, 140, 120, 80));

        // Draw triangles
        drawTriangle(A, B, C, p.color(0, 0, 220));
        drawTriangle(a, b, c, p.color(220, 80, 0));

        // Draw lines from corresponding vertices through O
        p.stroke(0);
        p.strokeWeight(2);
        drawLineThroughO(A, a);
        drawLineThroughO(B, b);
        drawLineThroughO(C, c);

        // Intersections of corresponding sides
        let P1 = lineIntersection3D(B, C, b, c); // BC ∩ bc
        let P2 = lineIntersection3D(C, A, c, a); // CA ∩ ca
        let P3 = lineIntersection3D(A, B, a, b); // AB ∩ ab

        // Draw intersection points
        drawPoint(P1, "P₁");
        drawPoint(P2, "P₂");
        drawPoint(P3, "P₃");

        // Collinearity line through them (proves Desargues)
        p.stroke(0, 180, 0);
        p.strokeWeight(3);
        drawLine3D(P1, P3);

        // Draw perspectivity center O
        drawPoint(O, "O");
    };

    function drawAxes() {
        p.strokeWeight(2);
        p.stroke(255, 0, 0); p.line(0, 0, 0, 150, 0, 0);
        p.stroke(0, 255, 0); p.line(0, 0, 0, 0, 150, 0);
        p.stroke(0, 0, 255); p.line(0, 0, 0, 0, 0, 150);
    }

    function drawTriangle(A, B, C, col) {
        p.stroke(col);
        p.strokeWeight(3);
        p.noFill();
        p.beginShape();
        p.vertex(A.x, A.y, A.z);
        p.vertex(B.x, B.y, B.z);
        p.vertex(C.x, C.y, C.z);
        p.endShape(p.CLOSE);
    }

    function drawPlane(A, B, C, col) {
        p.noStroke();
        p.fill(col);

        let AB = p5.Vector.sub(B, A);
        let AC = p5.Vector.sub(C, A);
        let N = AB.cross(AC);
        N.normalize();

        let size = 400;
        let u = AB.copy().normalize();
        let v = N.copy().cross(u).normalize();

        let p1 = p5.Vector.add(A, p5.Vector.mult(u, size));
        let p2 = p5.Vector.add(A, p5.Vector.mult(v, size));
        let p3 = p5.Vector.sub(A, p5.Vector.mult(u, size));
        let p4 = p5.Vector.sub(A, p5.Vector.mult(v, size));

        p.beginShape();
        p.vertex(p1.x, p1.y, p1.z);
        p.vertex(p2.x, p2.y, p2.z);
        p.vertex(p3.x, p3.y, p3.z);
        p.vertex(p4.x, p4.y, p4.z);
        p.endShape(p.CLOSE);
    }

    function drawPoint(pv, label) {
        p.push();
        p.translate(pv.x, pv.y, pv.z);
        p.fill(0);
        p.stroke(255);
        p.strokeWeight(1);
        p.sphere(8);
        p.pop();

        p.push();
        p.fill(0);
        p.textSize(16);
        p.textAlign(p.CENTER);
        p.text(label, pv.x + 15, pv.y - 10, pv.z);
        p.pop();
    }

    function drawLine3D(p1, p2) {
        p.line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }

    function drawLineThroughO(P, Q) {
        let d = p5.Vector.sub(Q, P).normalize();
        let L = 800;
        let start = p5.Vector.add(O, p5.Vector.mult(d, -L));
        let end = p5.Vector.add(O, p5.Vector.mult(d, L));
        p.stroke(100);
        p.strokeWeight(1);
        p.line(start.x, start.y, start.z, end.x, end.y, end.z);
    }

    function projectThrough(O, X, s) {
        return p5.Vector.add(O, p5.Vector.mult(p5.Vector.sub(X, O), s));
    }

    function lineIntersection3D(A, B, C, D) {
        let u = p5.Vector.sub(B, A);
        let v = p5.Vector.sub(D, C);
        let w = p5.Vector.sub(A, C);

        let a = u.dot(u);
        let b = u.dot(v);
        let c = v.dot(v);
        let d = u.dot(w);
        let e = v.dot(w);
        let Dd = a * c - b * b;

        let sc = (b * e - c * d) / Dd;
        return p5.Vector.add(A, p5.Vector.mult(u, sc));
    }

    // Mouse interaction
    p.mousePressed = function() {
        if (isMouseInCanvas()) {
            isDragging = true;
            lastMouseX = p.mouseX;
            lastMouseY = p.mouseY;
        }
    };

    p.mouseReleased = function() {
        isDragging = false;
    };

    p.mouseDragged = function() {
        if (isDragging && isMouseInCanvas()) {
            angleY += (p.mouseX - lastMouseX) * 0.01;
            angleX += (p.mouseY - lastMouseY) * 0.01;
            lastMouseX = p.mouseX;
            lastMouseY = p.mouseY;
        }
    };

    p.mouseWheel = function(event) {
        if (isMouseInCanvas()) {
            zoom += event.delta * 0.5;
            zoom = p.constrain(zoom, 200, 1200);
            return false;
        }
    };

    function isMouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width &&
               p.mouseY >= 0 && p.mouseY <= p.height;
    }
};

new p5(desarguesParallelSketch);