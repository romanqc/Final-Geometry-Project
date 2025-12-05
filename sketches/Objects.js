// Objects.js - Interactive Pinhole Camera with Multiple Shapes
// Canvas 3 - Slide 8

let interactiveSketch = function(p) {
    let boxWidth = 200;
    let boxHeight = 200;
    let boxDistance = 250;

    let PINHOLE_X = boxDistance / 2.0;
    let FILM_X = -boxDistance / 2.0;

    // Mesh system
    let mesh;
    let currentShape = 0;
    let shapeNames = [
        "Cube", "Tetrahedron", "Octahedron", "Icosahedron",
        "Dodecahedron", "Cuboid", "Square Pyramid", "Triangular Prism"
    ];
    
    // Movable object
    let objectPos;
    let uniformScale = 60.0;

    // Selection & dragging
    let objectSelected = false;
    let dragging = false;

    // Camera rotation and zoom
    let angleX = 0.3;
    let angleY = 0.5;
    let zoom = 600;
    let lastMouseX = 0;
    let lastMouseY = 0;

    p.setup = function() {
        let canvas = p.createCanvas(700, 700, p.WEBGL);
        canvas.parent('canvas-3');
        p.smooth();
        
        objectPos = p.createVector(300, 0, 0);
        mesh = generateShape(currentShape);
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-3');
        if (container && container.classList.contains('fullscreen')) {
            let w = parseInt(container.dataset.fullscreenWidth) || window.innerWidth;
            let h = parseInt(container.dataset.fullscreenHeight) || window.innerHeight;
            p.resizeCanvas(w, h);
        } else {
            p.resizeCanvas(700, 700);
        }
    };

    p.draw = function() {
        p.background(18);
        p.lights();
        
        // Apply camera transformations
        p.translate(0, 0, -zoom);
        p.rotateX(angleX);
        p.rotateY(angleY);

        // World axes
        p.push();
        p.translate(-200, -200, -200);
        p.strokeWeight(2);
        p.stroke(255, 0, 0); p.line(0,0,0, 80,0,0);  // X - Red
        p.stroke(0,255,0);   p.line(0,0,0, 0,80,0);  // Y - Green
        p.stroke(0,0,255);   p.line(0,0,0, 0,0,80);  // Z - Blue
        p.pop();

        // Camera housing
        p.push();
        p.noFill();
        p.stroke(180);
        p.strokeWeight(1);
        p.box(boxDistance, boxHeight, boxWidth);
        p.pop();

        // Pinhole
        p.push();
        p.translate(PINHOLE_X, 0, 0);
        p.stroke(255, 200, 0);
        p.strokeWeight(6);
        p.point(0, 0, 0);
        p.pop();

        // Film plane
        p.push();
        p.translate(FILM_X, 0, 0);
        p.rotateY(p.HALF_PI);
        p.noStroke();
        p.fill(255, 255, 255, 200);
        p.rectMode(p.CENTER);
        p.rect(0, 0, boxWidth, boxHeight);
        p.pop();

        // Draw mesh wireframe
        p.push();
        p.translate(objectPos.x, objectPos.y, objectPos.z);
        p.stroke(255);
        p.strokeWeight(2);
        if (objectSelected) {
            p.fill(0, 160, 220, 150);
        } else {
            p.noFill();
        }
        drawMeshWireframe();
        p.pop();

        // Project mesh faces onto film
        let pinhole = p.createVector(PINHOLE_X, 0, 0);
        
        // Transform vertices to world space
        let worldVerts = [];
        for (let v of mesh.verts) {
            worldVerts.push(p5.Vector.add(v, objectPos));
        }

        // Collect and sort projected faces
        let projFaces = [];
        for (let face of mesh.faces) {
            // Compute face normal
            let v0 = worldVerts[face[0]];
            let v1 = worldVerts[face[1]];
            let v2 = worldVerts[face[2]];
            let e1 = p5.Vector.sub(v1, v0);
            let e2 = p5.Vector.sub(v2, v0);
            let normal = e1.cross(e2);
            normal.normalize();

            // Check if front-facing
            let toFace = p5.Vector.sub(v0, pinhole);
            let facing = normal.dot(toFace);
            if (facing >= 0) continue; // Back-facing

            // Project vertices
            let projVerts = [];
            let minDepth = Infinity;
            for (let i = 0; i < face.length; i++) {
                let W = worldVerts[face[i]];
                let hit = intersectWithPlaneX(pinhole, W, FILM_X);
                let clamped = clampToFilm(hit, FILM_X + 1, boxHeight/2.0, boxWidth/2.0);
                projVerts.push(clamped);
                let depth = p5.Vector.dist(pinhole, W);
                if (depth < minDepth) minDepth = depth;
            }

            projFaces.push({
                verts: projVerts,
                normal: normal,
                depth: minDepth
            });
        }

        // Sort by depth (painter's algorithm)
        projFaces.sort((a, b) => b.depth - a.depth);

        // Draw projected faces on film
        for (let pf of projFaces) {
            // Filled polygon
            p.noStroke();
            p.fill(0, 0, 0, 200);
            p.beginShape();
            for (let pv of pf.verts) {
                p.vertex(pv.x, pv.y, pv.z);
            }
            p.endShape(p.CLOSE);

            // Outline
            p.noFill();
            p.stroke(100);
            p.strokeWeight(1);
            p.beginShape();
            for (let pv of pf.verts) {
                p.vertex(pv.x, pv.y, pv.z);
            }
            p.endShape(p.CLOSE);
        }

        // Draw rays (thin, subtle)
        p.stroke(255, 220, 0, 60);
        p.strokeWeight(1);
        for (let pf of projFaces) {
            for (let pv of pf.verts) {
                p.line(pinhole.x, pinhole.y, pinhole.z, pv.x, pv.y, pv.z);
            }
        }

        // HUD
        drawHUD();
    };

    function drawMeshWireframe() {
        for (let face of mesh.faces) {
            p.beginShape();
            for (let i = 0; i < face.length; i++) {
                let a = mesh.verts[face[i]];
                let b = mesh.verts[face[(i + 1) % face.length]];
                p.line(a.x, a.y, a.z, b.x, b.y, b.z);
            }
            p.endShape();
        }
    }

    function intersectWithPlaneX(P, V, planeX) {
        let denom = V.x - P.x;
        if (p.abs(denom) < 1e-6) {
            return p.createVector(planeX, P.y, P.z);
        }
        let t = (planeX - P.x) / denom;
        return p.createVector(
            P.x + t * (V.x - P.x),
            P.y + t * (V.y - P.y),
            P.z + t * (V.z - P.z)
        );
    }

    function clampToFilm(pv, filmX, halfH, halfW) {
        let y = p.constrain(pv.y, -halfH, halfH);
        let z = p.constrain(pv.z, -halfW, halfW);
        return p.createVector(filmX, y, z);
    }

    function drawHUD() {
        p.push();
        p.resetMatrix();
        p.camera();
        p.fill(255);
        p.noStroke();
        p.textSize(13);
        p.textAlign(p.LEFT);
        let msg = "Shape: " + shapeNames[currentShape] + " | P: cycle shapes | O: toggle selection | Click to select | Drag to move | Arrow keys: Y/Z | W/S: X ";
        if (objectSelected) msg += "[SELECTED]";
        if (dragging) msg += " [DRAGGING]";
        p.text(msg, -p.width/2 + 12, p.height/2 - 12);
        p.pop();
    }

    // Mouse interaction
    p.mousePressed = function() {
        if (!isMouseInCanvas()) return;
        
        let objScreenPos = worldToScreen(objectPos);
        let clickDist = p.dist(p.mouseX - p.width/2, p.mouseY - p.height/2, 
                               objScreenPos.x, objScreenPos.y);
        
        if (clickDist < 80) {
            objectSelected = true;
            dragging = true;
        } else {
            objectSelected = false;
            dragging = false;
        }
        
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
    };

    p.mouseReleased = function() {
        dragging = false;
    };

    p.mouseDragged = function() {
        if (!isMouseInCanvas()) return;
        
        if (dragging && objectSelected) {
            let dx = (p.mouseX - lastMouseX) * 2;
            let dy = (p.mouseY - lastMouseY) * 2;
            
            objectPos.y -= dy;
            objectPos.z += dx;
        } else if (!objectSelected) {
            angleY += (p.mouseX - lastMouseX) * 0.01;
            angleX += (p.mouseY - lastMouseY) * 0.01;
            angleX = p.constrain(angleX, -p.HALF_PI + 0.1, p.HALF_PI - 0.1);
        }
        
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
    };

    p.mouseWheel = function(event) {
        if (isMouseInCanvas()) {
            zoom += event.delta * 0.5;
            zoom = p.constrain(zoom, 200, 1200);
            return false;
        }
    };

    p.keyPressed = function() {
        // Toggle selection with O key
        if (p.key === 'o' || p.key === 'O') {
            objectSelected = !objectSelected;
            return;
        }

        // Cycle shapes with P
        if (p.key === 'p' || p.key === 'P') {
            currentShape = (currentShape + 1) % shapeNames.length;
            mesh = generateShape(currentShape);
            return;
        }

        if (!objectSelected) return;
        
        let step = 10.0;
        
        if (p.keyCode === p.UP_ARROW) objectPos.y -= step;
        if (p.keyCode === p.DOWN_ARROW) objectPos.y += step;
        if (p.keyCode === p.LEFT_ARROW) objectPos.z += step;
        if (p.keyCode === p.RIGHT_ARROW) objectPos.z -= step;
        
        if (p.key === 'w' || p.key === 'W') objectPos.x += step;
        if (p.key === 's' || p.key === 'S') objectPos.x -= step;
        if (p.key === 'a' || p.key === 'A') objectPos.z += step;
        if (p.key === 'd' || p.key === 'D') objectPos.z -= step;
    };

    function worldToScreen(pos) {
        let rotatedPos = p.createVector(pos.x, pos.y, pos.z);
        
        let cosY = Math.cos(angleY);
        let sinY = Math.sin(angleY);
        let cosX = Math.cos(angleX);
        let sinX = Math.sin(angleX);
        
        let tempX = rotatedPos.x * cosY - rotatedPos.z * sinY;
        let tempZ = rotatedPos.x * sinY + rotatedPos.z * cosY;
        rotatedPos.x = tempX;
        rotatedPos.z = tempZ;
        
        let tempY = rotatedPos.y * cosX - rotatedPos.z * sinX;
        tempZ = rotatedPos.y * sinX + rotatedPos.z * cosX;
        rotatedPos.y = tempY;
        rotatedPos.z = tempZ;
        
        let scale = 300 / (zoom + rotatedPos.z);
        return p.createVector(rotatedPos.x * scale, rotatedPos.y * scale);
    }

    function isMouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width && 
               p.mouseY >= 0 && p.mouseY <= p.height;
    }

    // ===== SHAPE GENERATION =====
    
    function generateShape(idx) {
        switch(idx) {
            case 0: return makeCube(uniformScale);
            case 1: return makeTetra(uniformScale);
            case 2: return makeOcta(uniformScale);
            case 3: return makeIcosa(uniformScale * 0.9);
            case 4: return makeDodeca(uniformScale * 0.8);
            case 5: return makeCuboid(uniformScale, uniformScale*0.6, uniformScale*1.4);
            case 6: return makeSquarePyramid(uniformScale, uniformScale*1.2);
            case 7: return makeTriangularPrism(uniformScale, uniformScale*0.8);
            default: return makeCube(uniformScale);
        }
    }

    function makeCube(s) {
        let verts = [];
        let faces = [];
        let h = s/2;
        verts.push(p.createVector( h,  h,  h));
        verts.push(p.createVector( h,  h, -h));
        verts.push(p.createVector( h, -h, -h));
        verts.push(p.createVector( h, -h,  h));
        verts.push(p.createVector(-h,  h,  h));
        verts.push(p.createVector(-h,  h, -h));
        verts.push(p.createVector(-h, -h, -h));
        verts.push(p.createVector(-h, -h,  h));
        faces.push([0,1,2,3]);
        faces.push([4,7,6,5]);
        faces.push([4,5,1,0]);
        faces.push([3,2,6,7]);
        faces.push([4,0,3,7]);
        faces.push([1,5,6,2]);
        return {verts: verts, faces: faces};
    }

    function makeTetra(s) {
        let verts = [];
        let faces = [];
        let a = s * 0.57735 * 1.2;
        verts.push(p.createVector( a,  a,  a));
        verts.push(p.createVector( a, -a, -a));
        verts.push(p.createVector(-a,  a, -a));
        verts.push(p.createVector(-a, -a,  a));
        faces.push([0,1,2]);
        faces.push([0,3,1]);
        faces.push([0,2,3]);
        faces.push([1,3,2]);
        return {verts: verts, faces: faces};
    }

    function makeOcta(s) {
        let verts = [];
        let faces = [];
        let h = s/2;
        verts.push(p.createVector( 0,  h, 0));
        verts.push(p.createVector( 0, -h, 0));
        verts.push(p.createVector( h, 0, 0));
        verts.push(p.createVector(-h, 0, 0));
        verts.push(p.createVector(0, 0,  h));
        verts.push(p.createVector(0, 0, -h));
        faces.push([0,2,4]);
        faces.push([0,4,3]);
        faces.push([0,3,5]);
        faces.push([0,5,2]);
        faces.push([1,4,2]);
        faces.push([1,3,4]);
        faces.push([1,5,3]);
        faces.push([1,2,5]);
        return {verts: verts, faces: faces};
    }

    function makeIcosa(s) {
        let verts = [];
        let faces = [];
        let phi = (1.0 + p.sqrt(5)) / 2.0;
        let a = s / 2.0;
        verts.push(p.createVector(-a,  a/phi,  0));
        verts.push(p.createVector( a,  a/phi,  0));
        verts.push(p.createVector(-a, -a/phi,  0));
        verts.push(p.createVector( a, -a/phi,  0));
        verts.push(p.createVector(0, -a,  a/phi));
        verts.push(p.createVector(0,  a,  a/phi));
        verts.push(p.createVector(0, -a, -a/phi));
        verts.push(p.createVector(0,  a, -a/phi));
        verts.push(p.createVector( a/phi, 0, -a));
        verts.push(p.createVector( a/phi, 0,  a));
        verts.push(p.createVector(-a/phi, 0, -a));
        verts.push(p.createVector(-a/phi, 0,  a));
        let f = [
            [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
            [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
            [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
            [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
        ];
        faces.push(...f);
        return {verts: verts, faces: faces};
    }

    function makeDodeca(s) {
        let verts = [];
        let faces = [];
        let phi = (1.0 + p.sqrt(5)) / 2.0;
        let a = s / 2.0;
        let b = a / phi;
        let c = a * phi;
        verts.push(p.createVector( a,  a,  a));
        verts.push(p.createVector( a,  a, -a));
        verts.push(p.createVector( a, -a,  a));
        verts.push(p.createVector( a, -a, -a));
        verts.push(p.createVector(-a,  a,  a));
        verts.push(p.createVector(-a,  a, -a));
        verts.push(p.createVector(-a, -a,  a));
        verts.push(p.createVector(-a, -a, -a));
        verts.push(p.createVector( 0,  b,  c));
        verts.push(p.createVector( 0,  b, -c));
        verts.push(p.createVector( 0, -b,  c));
        verts.push(p.createVector( 0, -b, -c));
        verts.push(p.createVector( b,  c, 0));
        verts.push(p.createVector( b, -c, 0));
        verts.push(p.createVector(-b,  c, 0));
        verts.push(p.createVector(-b, -c, 0));
        verts.push(p.createVector( c, 0,  b));
        verts.push(p.createVector(-c, 0,  b));
        verts.push(p.createVector( c, 0, -b));
        verts.push(p.createVector(-c, 0, -b));
        let f = [
            [0,8,4,17,16], [0,16,2,12,1], [1,12,3,18,9], [2,13,3,12,16],
            [4,8,5,14,17], [5,9,18,7,14], [6,10,11,7,15], [6,15,4,17,10],
            [8,0,1,9,5], [11,10,17,14,7], [13,2,16,0,1], [19,11,7,18,3]
        ];
        faces.push(...f);
        return {verts: verts, faces: faces};
    }

    function makeCuboid(sx, sy, sz) {
        let verts = [];
        let faces = [];
        let hx = sx/2, hy = sy/2, hz = sz/2;
        verts.push(p.createVector( hx,  hy,  hz));
        verts.push(p.createVector( hx,  hy, -hz));
        verts.push(p.createVector( hx, -hy, -hz));
        verts.push(p.createVector( hx, -hy,  hz));
        verts.push(p.createVector(-hx,  hy,  hz));
        verts.push(p.createVector(-hx,  hy, -hz));
        verts.push(p.createVector(-hx, -hy, -hz));
        verts.push(p.createVector(-hx, -hy,  hz));
        faces.push([0,1,2,3]);
        faces.push([4,7,6,5]);
        faces.push([4,5,1,0]);
        faces.push([3,2,6,7]);
        faces.push([4,0,3,7]);
        faces.push([1,5,6,2]);
        return {verts: verts, faces: faces};
    }

    function makeSquarePyramid(baseSize, height) {
        let verts = [];
        let faces = [];
        let h = baseSize / 2;
        verts.push(p.createVector( h, 0,  h));
        verts.push(p.createVector( h, 0, -h));
        verts.push(p.createVector(-h, 0, -h));
        verts.push(p.createVector(-h, 0,  h));
        verts.push(p.createVector( 0, -height/2, 0));
        faces.push([0,1,2,3]);
        faces.push([0,4,1]);
        faces.push([1,4,2]);
        faces.push([2,4,3]);
        faces.push([3,4,0]);
        return {verts: verts, faces: faces};
    }

    function makeTriangularPrism(s, depth) {
        let verts = [];
        let faces = [];
        let r = s / 2.0;
        let h = depth / 2.0;
        verts.push(p.createVector(  r, 0,  h));
        verts.push(p.createVector(-r/2,  r*0.866,  h));
        verts.push(p.createVector(-r/2, -r*0.866,  h));
        verts.push(p.createVector(  r, 0, -h));
        verts.push(p.createVector(-r/2,  r*0.866, -h));
        verts.push(p.createVector(-r/2, -r*0.866, -h));
        faces.push([0,1,2]);
        faces.push([3,5,4]);
        faces.push([0,3,4,1]);
        faces.push([1,4,5,2]);
        faces.push([2,5,3,0]);
        return {verts: verts, faces: faces};
    }
};

// Create the instance
new p5(interactiveSketch);