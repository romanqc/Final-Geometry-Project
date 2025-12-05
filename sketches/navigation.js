// navigation.js - Slide Navigation and Fullscreen Management

let currentSlide = 0;
const totalSlides = 13;
const slides = document.querySelectorAll('.slide');
const slideIndicatorsContainer = document.getElementById('slide-indicators');
const slideCounter = document.getElementById('slide-counter');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const navControls = document.querySelector('.nav-controls');
const fullscreenExitBtn = document.getElementById('fullscreen-exit');

// Store the currently fullscreen canvas
let currentFullscreenCanvas = null;
let originalCanvasSize = { width: 0, height: 0 };

// Initialize slide indicators
function initSlideIndicators() {
    for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        if (i === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(i));
        slideIndicatorsContainer.appendChild(indicator);
    }
}

// Update slide display
function updateSlideDisplay() {
    slides.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });

    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });

    slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
}

function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
        currentSlide = index;
        updateSlideDisplay();
    }
}

function previousSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlideDisplay();
    }
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlideDisplay();
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (currentFullscreenCanvas) {
        if (e.key === 't' || e.key === 'T' || 
            e.key === 'w' || e.key === 'W' || 
            e.key === 's' || e.key === 'S' ||
            e.key === 'a' || e.key === 'A' ||
            e.key === 'd' || e.key === 'D') {
            return;
        }
        if (e.key === 'Escape') {
            exitFullscreen();
            e.preventDefault();
            return;
        }
        if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 37 || e.keyCode === 39) {
            return;
        }
    }
    
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch(e.key) {
        case 'ArrowRight':
        case ' ':
            e.preventDefault();
            nextSlide();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            previousSlide();
            break;
        case 'Home':
            e.preventDefault();
            goToSlide(0);
            break;
        case 'End':
            e.preventDefault();
            goToSlide(totalSlides - 1);
            break;
    }
});

// Fullscreen functionality
function setupFullscreenButtons() {
    const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');
    
    fullscreenBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const canvasNum = this.getAttribute('data-canvas');
            toggleFullscreen(canvasNum);
        });
    });
    
    fullscreenExitBtn.addEventListener('click', exitFullscreen);
}

function toggleFullscreen(canvasNumber) {
    const container = document.getElementById(`canvas-${canvasNumber}`);
    
    if (currentFullscreenCanvas) {
        exitFullscreen();
    }
    
    enterFullscreen(container, canvasNumber);
}

function enterFullscreen(container, canvasNumber) {
    // Get the canvas element
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    
    // Store original size
    originalCanvasSize.width = canvas.width;
    originalCanvasSize.height = canvas.height;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Add fullscreen class
    container.classList.add('fullscreen');
    currentFullscreenCanvas = container;
    
    // Hide navigation
    navControls.classList.add('hidden');
    slideCounter.classList.add('hidden');
    
    // Show exit button
    fullscreenExitBtn.style.display = 'block';
    
    // Get the p5 instance and resize it
    // The canvas has a reference to the p5 instance via the id
    const canvasId = canvas.id;
    
    // Calculate size maintaining aspect ratio
    const aspectRatio = originalCanvasSize.width / originalCanvasSize.height;
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;
    
    if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
    } else {
        newHeight = newWidth / aspectRatio;
    }
    
    // Trigger the p5 resize by dispatching a custom event
    setTimeout(() => {
        container.dataset.fullscreenWidth = newWidth;
        container.dataset.fullscreenHeight = newHeight;
        window.dispatchEvent(new Event('resize'));
    }, 50);
}

function exitFullscreen() {
    if (!currentFullscreenCanvas) return;
    
    // Unlock body scroll
    document.body.style.overflow = '';
    
    // Remove fullscreen class
    currentFullscreenCanvas.classList.remove('fullscreen');
    
    // Show navigation
    navControls.classList.remove('hidden');
    slideCounter.classList.remove('hidden');
    
    // Hide exit button
    fullscreenExitBtn.style.display = 'none';
    
    // Clear fullscreen data
    delete currentFullscreenCanvas.dataset.fullscreenWidth;
    delete currentFullscreenCanvas.dataset.fullscreenHeight;
    
    // Trigger resize to restore original size
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 50);
    
    currentFullscreenCanvas = null;
}

window.addEventListener('keydown', (e) => {
    if (!currentFullscreenCanvas) {
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }
    }
}, false);

document.addEventListener('DOMContentLoaded', () => {
    initSlideIndicators();
    updateSlideDisplay();
    setupFullscreenButtons();
});