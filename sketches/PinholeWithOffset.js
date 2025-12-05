// PinholeWithOffset.js - Stereographic vs Orthographic Projection Demo
// Canvas 4 - Slide 7

let intrinsicSketch = function(p) {
    let boxWidth = 100;
    let boxHeight = 100;
    let boxDistance = 100;

    // Toggle between projection types
    let showOrthographic = false;
    
    // Perspective parameters
    let f = 100;  // Should match boxDistance (pinhole to film distance)
    let cx = 10;  // Reduced for clearer visualization
    let cy = -8;  // Reduced for clearer visualization

    // Camera rotation and zoom
    let angleX = 0;
    let angleY = 0;
    let zoom = 100;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isDragging = false;

    p.setup = function() {
        let canvas = p.createCanvas(600, 600, p.WEBGL);
        canvas.parent('canvas-4');
        p.smooth();
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-4');
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

        // Camera box
        p.push();
        p.stroke(255);
        p.noFill();
        p.strokeWeight(1);
        p.box(boxDistance, boxHeight, boxWidth);
        p.pop();

        // Object inside camera (cube)
        let boxw = 10;
        let boxh = 10;
        let boxl = 10;
        p.push();
        p.noStroke();
        p.fill(255);
        p.box(boxw, boxh, boxl);
        p.pop();

        // Object corners (front face)
        let verts = [
            p.createVector(boxw/2,  boxh/2,  boxl/2),
            p.createVector(boxw/2, -boxh/2,  boxl/2),
            p.createVector(boxw/2, -boxh/2, -boxl/2),
            p.createVector(boxw/2,  boxh/2, -boxl/2)
        ];

        let planeX = -boxDistance/2;

        if (showOrthographic) {
            // ORTHOGRAPHIC PROJECTION
            drawOrthographicProjection(verts, planeX, boxw, boxh, boxl);
        } else {
            // STEREOGRAPHIC (PERSPECTIVE) PROJECTION
            drawStereographicProjection(verts, planeX);
        }

        // Film plane
        p.push();
        p.translate(planeX - 1, 0, 0);
        p.rotateY(p.HALF_PI);
        p.noStroke();
        p.fill(255, 255, 255, 200);
        p.rectMode(p.CENTER);
        p.rect(0, 0, boxWidth, boxHeight);
        p.pop();

        // HUD
        drawHUD();
    };

    function drawStereographicProjection(verts, planeX) {
        // Pinhole (center of projection)
        let pinhole = p.createVector(boxDistance/2, 0, 0);
        
        // Draw pinhole
        p.push();
        p.translate(pinhole.x, pinhole.y, pinhole.z);
        p.noFill();
        p.stroke(255, 200, 0);
        p.strokeWeight(8);
        p.point(0, 0, 0);
        p.pop();

        let projected_geo = [];
        let projected_intr = [];

        for (let i = 0; i < verts.length; i++) {
            // Geometric projection (ray-plane intersection)
            let hit = intersectWithPlaneX(pinhole, verts[i], planeX);
            projected_geo.push(hit);

            // Draw converging rays (pinhole to vertex)
            p.stroke(255, 200, 100, 200);
            p.strokeWeight(2);
            p.line(pinhole.x, pinhole.y, pinhole.z,
                   verts[i].x, verts[i].y, verts[i].z);
            
            // Draw rays to film
            p.stroke(100, 150, 255, 200);
            p.strokeWeight(2);
            p.line(verts[i].x, verts[i].y, verts[i].z,
                   hit.x, hit.y, hit.z);

            // Intrinsic projection (with principal point offset)
            let Pc = p5.Vector.sub(verts[i], pinhole);
            let q = projectIntrinsic(Pc);
            projected_intr.push(q);
        }

        // Draw geometric projection on film (blue)
        p.push();
        p.fill(100, 150, 255, 150);
        p.stroke(60, 100, 200);
        p.strokeWeight(2);
        p.beginShape();
        for (let pv of projected_geo) {
            p.vertex(pv.x, pv.y, pv.z);
        }
        p.endShape(p.CLOSE);
        p.pop();

        // Draw intrinsic projection on film (orange - with offset)
        p.push();
        p.translate(planeX, 0, 0);
        p.rotateY(p.HALF_PI);
        p.stroke(255, 150, 0);
        p.strokeWeight(3);
        p.noFill();
        p.beginShape();
        for (let q of projected_intr) {
            p.vertex(q.x, q.y);
        }
        p.endShape(p.CLOSE);
        p.pop();
    }

    function drawOrthographicProjection(verts, planeX, boxw, boxh, boxl) {
        // Light source at infinity (represented as square at pinhole plane)
        let lightSourceX = boxDistance/2;
        let lightSize = 40;
        
        // Draw light source square
        p.push();
        p.translate(lightSourceX, 0, 0);
        p.rotateY(p.HALF_PI);
        p.noFill();
        p.stroke(255, 200, 0);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.rect(0, 0, lightSize, lightSize);
        p.pop();

        // Draw parallel rays from light source through cube vertices to film
        let projected_ortho = [];
        
        for (let i = 0; i < verts.length; i++) {
            let v = verts[i];
            
            // Orthographic projection: just drop the X coordinate
            // (parallel rays in X direction)
            let projPoint = p.createVector(planeX, v.y, v.z);
            projected_ortho.push(projPoint);
            
            // Draw parallel ray from light source plane through vertex to film
            p.stroke(100, 255, 150, 200);
            p.strokeWeight(2);
            
            // Ray from light source to vertex
            p.line(lightSourceX, v.y, v.z,
                   v.x, v.y, v.z);
            
            // Ray from vertex to film
            p.line(v.x, v.y, v.z,
                   planeX, v.y, v.z);
        }

        // Draw orthographic projection on film (green)
        p.push();
        p.fill(100, 255, 150, 150);
        p.stroke(50, 200, 100);
        p.strokeWeight(2);
        p.beginShape();
        for (let pv of projected_ortho) {
            p.vertex(pv.x, pv.y, pv.z);
        }
        p.endShape(p.CLOSE);
        p.pop();
        
        // Show that orthographic has NO principal point offset
        // Just pure Y, Z coordinates (no cx, cy needed)
    }

    function projectIntrinsic(Pc) {
        // Perspective projection: divide by depth
        // The focal length should equal the distance from pinhole to film
        let x_img = f * (Pc.y / Pc.x);
        let y_img = f * (Pc.z / Pc.x);

        // Add principal point offset (TRANSLATION ONLY - no scaling)
        x_img += cx;
        y_img += cy;

        return p.createVector(x_img, y_img, 0);
    }

    function intersectWithPlaneX(P, V, planeX) {
        let t = (planeX - P.x) / (V.x - P.x);
        return p.createVector(
            P.x + t * (V.x - P.x),
            P.y + t * (V.y - P.y),
            P.z + t * (V.z - P.z)
        );
    }

    function drawHUD() {
        p.push();
        p.resetMatrix();
        p.camera();
        p.fill(255);
        p.noStroke();
        p.textSize(13);
        p.textAlign(p.LEFT);
        
        let msg = "Press T to toggle projection type | ";
        if (showOrthographic) {
            msg += "[ORTHOGRAPHIC] - Parallel rays, no principal point";
        } else {
            msg += "[PERSPECTIVE] - Converging rays, with principal point offset";
        }
        
        p.text(msg, -p.width/2 + 12, p.height/2 - 12);
        p.pop();
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
            zoom += event.delta * 0.5;  // Increased from 0.1 to 0.5 for faster zoom
            zoom = p.constrain(zoom, -300, 1000);  // Much wider range: was (50, 500), now (10, 800)
            return false;
        }
    };

    // Keyboard toggle
    p.keyPressed = function() {
        if (p.key === 't' || p.key === 'T') {
            showOrthographic = !showOrthographic;
        }
    };

    function isMouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width && 
               p.mouseY >= 0 && p.mouseY <= p.height;
    }
};

// Create the instance
new p5(intrinsicSketch);