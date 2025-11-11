/*
 * script.js - FINAL FIXED VERSION (Correct Animation Logic)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Configuration and DOM Elements
    const HERO = document.getElementById('hero');
    const INTERACTIVE = document.getElementById('interactive');
    const INTRO_SECTION = document.getElementById('intro-section');
    const SECTION_CONTENT = INTRO_SECTION.querySelector('.section-content');

    // --- Parallax Variables ---
    const TOTAL_IMAGES_AVAILABLE = 26;
    const SHOW_COUNT = 25;
    const MIN_DISTANCE = 280;
    const PLANE_PADDING = 120;
    const MAX_TRIES = 200;

    // Helper functions for card placement (Must be included)
    function getPlaneSize(){ 
        const rect = INTERACTIVE.getBoundingClientRect();
        return {w: rect.width, h: rect.height};
    }
    function dist(a,b){ const dx=a.x-b.x; const dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
    function pickImageIndices(n){ 
        const pool = Array.from({length: TOTAL_IMAGES_AVAILABLE}, (_, i) => i + 1);
        for(let i=pool.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [pool[i],pool[j]] = [pool[i],pool[j]];
        }
        return pool.slice(0, n);
    }
    function generatePositions(count, planeW, planeH, minDist){ 
        const positions = [];
        const attemptsLimit = MAX_TRIES;
        for(let i=0;i<count;i++){
            let tries = 0;
            while(tries < attemptsLimit){
                const x = Math.random()*(planeW - PLANE_PADDING*2) + PLANE_PADDING;
                const y = Math.random()*(planeH - PLANE_PADDING*2) + PLANE_PADDING;
                let ok = true;
                for(const p of positions){ if(dist(p,{x,y}) < minDist) { ok=false; break; } }
                if(ok){ positions.push({x,y}); break; }
                tries++;
            }
            if(tries >= attemptsLimit){
                const fallbackX = Math.random()*(planeW - PLANE_PADDING*2) + PLANE_PADDING;
                const fallbackY = Math.random()*(planeH - PLANE_PADDING*2) + PLANE_PADDING;
                positions.push({x: fallbackX, y: fallbackY});
            }
        }
        return positions;
    }
    
    function createCards(){ 
        INTERACTIVE.innerHTML = '';
        const plane = getPlaneSize();
        const imgIndices = pickImageIndices(SHOW_COUNT);
        const pos = generatePositions(SHOW_COUNT, plane.w, plane.h, MIN_DISTANCE);

        for(let i=0;i<SHOW_COUNT;i++){
            const idx = imgIndices[i % imgIndices.length]; 
            const p = pos[i];

            const card = document.createElement('div');
            card.className = 'artwork-card';
            
            const w = Math.floor(180 + Math.random()*240);
            const h = Math.floor(w * (0.68 + Math.random()*0.48));
            card.style.width = w + 'px';
            card.style.height = h + 'px';
            
            card.style.left = (p.x - w/2) + 'px';
            card.style.top  = (p.y - h/2) + 'px';

            const baseRot = (Math.random()*28 - 14).toFixed(2);
            const depth = (Math.random()*0.9 + 0.2).toFixed(3); 
            card.dataset.depth = depth;
            card.dataset.baseRot = baseRot;

            const dur = (12 + Math.random()*14).toFixed(2); 
            const delay = (-Math.random()*8).toFixed(2);
            card.style.animation = `drift ${dur}s ease-in-out ${delay}s infinite alternate`;

            const img = document.createElement('img');
            img.draggable = false;
            img.alt = 'artwork ' + idx;
            img.src = `images/${idx}.jpg`; 
            card.appendChild(img);

            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.borderRadius = 'inherit';
            overlay.style.pointerEvents = 'none';
            overlay.style.background = 'linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))';
            card.appendChild(overlay);

            card.style.pointerEvents = 'auto';
            INTERACTIVE.appendChild(card);
        }
    }


    // --- Camera Control and Parallax ---
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let targetScale = 1.0; 
    let currentScale = 1.0; 
    const PAN_RANGE_X = 0.22; 
    const PAN_RANGE_Y = 0.16; 
    const EASE = 0.08;
    const SCALE_EASE = 0.06;

    // Parallax update based on mouse position
    function onMouseMove(e){
        const mx = e.clientX / window.innerWidth; 
        const my = e.clientY / window.innerHeight;
        const cx = (mx - 0.5) * 2;
        const cy = (my - 0.5) * 2;
        const plane = getPlaneSize();
        targetX = -cx * (plane.w * PAN_RANGE_X);
        targetY = -cy * (plane.h * PAN_RANGE_Y);
    }
    // ... inside script.js ...
// ... inside script.js ...

function handleScroll() {
    const scrollY = window.scrollY;
    const heroHeight = HERO.offsetHeight; 

    const section = INTRO_SECTION;
    const content = SECTION_CONTENT;
    
    // Set the scroll range for the animation
    const startScroll = heroHeight * 0.15; // Animation starts at 15% of hero scroll
    const endScroll = heroHeight * 0.85;  // Animation ends at 85% of hero scroll
    let progress = 0;

    if (scrollY > startScroll) {
        progress = (scrollY - startScroll) / (endScroll - startScroll);
        progress = Math.min(1, Math.max(0, progress));
    }

    // Use cubic easing (pow(..., 3)) for a smoother, faster start
    const eased = 1 - Math.pow(1 - progress, 3);
    
    // --- Configuration Values (pulled from CSS or defined here) ---
    const initialBoxSize = 200;       // Starting width/height in px
    const initialBorderRadius = 250;  // Starting border radius in px
    const finalBorderRadius = 20;     // Final, subtle border radius in px
    
    // --- 1. Opacity: Fade in the black box immediately ---
    // Make it fully visible (opacity 1) after 5% scroll progress
    section.style.opacity = eased > 0.05 ? 1 : 0; 

    // --- 2. Vertical Position (TranslateY): Move up from 120% off-screen to 0% on-screen ---
    const translateY = 120 - eased * 120;
    section.style.transform = `translateX(-50%) translateY(${translateY}%)`;

    // --- 3. Size: Grow to fill the viewport ---
    // Calculate the size difference between the viewport and the starting box size
    const widthDiff = window.innerWidth - initialBoxSize;
    const heightDiff = window.innerHeight - initialBoxSize;
    
    // Current size is initial size + (difference * eased progress)
    const currentWidth = initialBoxSize + widthDiff * eased;
    const currentHeight = initialBoxSize + heightDiff * eased;
    
    section.style.width = `${currentWidth}px`;
    section.style.height = `${currentHeight}px`;

    // --- 4. Border Radius: Transition from large to small corner ---
    const radiusDiff = initialBorderRadius - finalBorderRadius;
    const currentBorderRadius = initialBorderRadius - radiusDiff * eased;
    section.style.borderRadius = `${currentBorderRadius}px`;

    // --- 5. Fade Text: Fade content in only when the expansion is nearly complete ---
    content.style.opacity = eased > 0.7 ? (eased - 0.7) / 0.3 : 0;
}
// ... rest of script.js (including the animate function) is the same ...
    // --- Main Animation Loop (for parallax smoothness) ---
    function animate(){
        // Update the mouse/parallax position smoothly
        currentX += (targetX - currentX) * EASE;
        currentY += (targetY - currentY) * EASE;
        currentScale += (targetScale - currentScale) * SCALE_EASE; 

        INTERACTIVE.style.transform = `translate3d(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px), 0) scale(${currentScale})`;

        // Card movement based on depth
        const cards = INTERACTIVE.querySelectorAll('.artwork-card');
        cards.forEach(card => { 
            const depth = parseFloat(card.dataset.depth || 0.6); 
            const px = (currentX) * (1 - depth) * 0.35;
            const py = (currentY) * (1 - depth) * 0.35;
            const baseRot = parseFloat(card.dataset.baseRot || 0);
            const rot = baseRot + (currentX * 0.0006) * (1 - depth) * 40;
            card.style.transform = `translate3d(${px}px, ${py}px, 0) rotateZ(${rot}deg)`;
        });

        requestAnimationFrame(animate);
    }

    // --- Initialization and Event Listeners ---
    let rebuildTimeout;
    function rebuild(){
        clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(()=> {
            createCards();
            handleScroll();
        }, 120);
    }
    window.addEventListener('resize', rebuild);
    
    // Attach the animation logic to the native scroll event
    window.addEventListener('scroll', handleScroll);

    createCards();
    animate();
    handleScroll(); 

    document.addEventListener('mousemove', onMouseMove); 
    
    let lastTouch = null;
    HERO.addEventListener('touchstart', (e)=> lastTouch = e.touches[0]);
    HERO.addEventListener('touchmove', (e)=>{
        if(!lastTouch) lastTouch = e.touches[0];
        const t = e.touches[0];
        const fakeEvt = { clientX: t.clientX, clientY: t.clientY };
        onMouseMove(fakeEvt);
        lastTouch = t;
    }, {passive:true});

});