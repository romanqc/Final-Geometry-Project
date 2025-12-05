// PinholeCamera.js - Basic 3D Pinhole Camera Demo
// Canvas 2 - Slide 2

let pinholeSketch = function(p) {
    let boxWidth = 60;
    let boxHeight = 60;
    let boxDistance = 100;
    
    // Camera rotation and zoom
    let angleX = 0;
    let angleY = 0;
    let zoom = 100;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isDragging = false;

    p.setup = function() {
        let canvas = p.createCanvas(600, 600, p.WEBGL);
        canvas.parent('canvas-2');
        p.smooth();
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-2');
        if (container && container.classList.contains('fullscreen')) {
            let w = parseInt(container.dataset.fullscreenWidth) || window.innerWidth;
            let h = parseInt(container.dataset.fullscreenHeight) || window.innerHeight;
            p.resizeCanvas(w, h);
        } else {
            p.resizeCanvas(600, 600);
        }
    };

    p.draw = function() {
        p.background(18);
        p.lights();
        
        // Apply camera transformations
        p.translate(0, 0, -zoom);
        p.rotateX(angleX);
        p.rotateY(angleY);
        
        // Camera housing (box)
        p.push();
        p.noFill();
        p.stroke(180);
        p.strokeWeight(1);
        p.box(boxDistance, boxHeight, boxWidth);
        p.pop();

        // Pinhole
        let pinholeX = boxDistance / 2;
        let pinhole = p.createVector(pinholeX, 0, 0);
        p.push();
        p.translate(pinholeX, 0, 0);
        p.stroke(255, 200, 0);
        p.strokeWeight(8);
        p.point(0, 0, 0);
        p.pop();

        // Object (cube at center)
        let boxw = 10;
        let boxh = 10;
        let boxl = 10;
        p.push();
        p.noStroke();
        p.fill(255);
        p.box(boxw, boxh, boxl);
        p.pop();

        // Object vertices (front face)
        let verts = [
            p.createVector(boxw/2,  boxh/2,  boxl/2),
            p.createVector(boxw/2, -boxh/2,  boxl/2),
            p.createVector(boxw/2, -boxh/2, -boxl/2),
            p.createVector(boxw/2,  boxh/2, -boxl/2)
        ];

        // Film plane position
        let planeX = -boxDistance / 2;
        let projected = [];

        // Project vertices and draw rays
        for (let i = 0; i < verts.length; i++) {
            let V = verts[i];
            
            // Draw ray from pinhole to vertex
            p.stroke(255, 220, 0, 200);
            p.strokeWeight(1);
            p.line(pinhole.x, pinhole.y, pinhole.z, V.x, V.y, V.z);

            // Calculate intersection with film plane
            let hit = intersectWithPlaneX(pinhole, V, planeX);
            projected.push(hit);

            // Draw ray to film plane
            p.stroke(0, 200, 255, 200);
            p.line(pinhole.x, pinhole.y, pinhole.z, hit.x, hit.y, hit.z);

            // Mark the hit point
            p.stroke(0, 200, 255);
            p.strokeWeight(6);
            p.point(hit.x, hit.y, hit.z);
        }

        // Draw projected polygon on film plane
        p.push();
        p.fill(0);
        p.noStroke();
        p.beginShape();
        for (let p_vec of projected) {
            p.vertex(p_vec.x, p_vec.y, p_vec.z);
        }
        p.endShape(p.CLOSE);
        p.pop();

        // Film plane (white rectangle)
        p.push();
        p.translate(-boxDistance/2 - 1, 0, 0);
        p.rotateY(p.HALF_PI);
        p.noStroke();
        p.fill(255);
        p.rectMode(p.CENTER);
        p.rect(0, 0, boxWidth, boxHeight);
        p.pop();
    };

    function intersectWithPlaneX(P, V, planeX) {
        let t = (planeX - P.x) / (V.x - P.x);
        return p.createVector(
            P.x + t * (V.x - P.x),
            P.y + t * (V.y - P.y),
            P.z + t * (V.z - P.z)
        );
    }

    // Mouse interaction for rotation
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

    // Mouse wheel for zoom
    p.mouseWheel = function(event) {
        if (isMouseInCanvas()) {
            zoom += event.delta * 0.1;
            zoom = p.constrain(zoom, 50, 500);
            return false; // Prevent page scroll
        }
    };

    function isMouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width && 
               p.mouseY >= 0 && p.mouseY <= p.height;
    }
};

// Create the instance
new p5(pinholeSketch);