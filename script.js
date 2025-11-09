/*
 * script.js
 * LÜIS Creative Agency - Interactive Background Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration and DOM Elements
    const HERO = document.getElementById('hero');
    const INTERACTIVE = document.getElementById('interactive');
    const DOT = document.getElementById('dot-cursor');

    const TOTAL_IMAGES_AVAILABLE = 26; // Image files 1.jpg to 26.jpg
    const SHOW_COUNT = 25; // Number of cards to create (Adjust this number if you need fewer cards)
    const MIN_DISTANCE = 280; // Minimum center-to-center px distance between cards (Slightly increased for more space)
    const PLANE_PADDING = 120; // Padding from plane edges (px)
    const MAX_TRIES = 200; // Attempts to place a card without overlapping

    // --- Card Placement and Generation ---

    function getPlaneSize(){
        const rect = INTERACTIVE.getBoundingClientRect();
        return {w: rect.width, h: rect.height};
    }

    // utility: euclidean distance
    function dist(a,b){ const dx=a.x-b.x; const dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }

    // pick unique random image indices
    function pickImageIndices(n){
        const pool = Array.from({length: TOTAL_IMAGES_AVAILABLE}, (_, i) => i + 1);
        for(let i=pool.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [pool[i],pool[j]] = [pool[j],pool[i]];
        }
        return pool.slice(0, n);
    }

    // Place cards ensuring spacing (identical to your logic)
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

    // create and insert cards into the DOM
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
            
            // randomized width/height 
            const w = Math.floor(180 + Math.random()*240);
            const h = Math.floor(w * (0.68 + Math.random()*0.48));
            card.style.width = w + 'px';
            card.style.height = h + 'px';
            
            // place via left/top
            card.style.left = (p.x - w/2) + 'px';
            card.style.top  = (p.y - h/2) + 'px';

            // random rotation and depth factor (0.2 far..1.1 near)
            const baseRot = (Math.random()*28 - 14).toFixed(2);
            const depth = (Math.random()*0.9 + 0.2).toFixed(3); 
            card.dataset.depth = depth;
            card.dataset.baseRot = baseRot;

            // drift animation timing
            const dur = (12 + Math.random()*14).toFixed(2); 
            const delay = (-Math.random()*8).toFixed(2);
            card.style.animation = `drift ${dur}s ease-in-out ${delay}s infinite alternate`;

            // image element
            const img = document.createElement('img');
            img.draggable = false;
            img.alt = 'artwork ' + idx;
            img.src = `images/${idx}.jpg`; 
            card.appendChild(img);

            // subtle glass overlay gradient
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

    // --- Camera Control (Panning and Zoom) ---

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let targetScale = 1, currentScale = 1;

    const PAN_RANGE_X = 0.22; // Adjusted down from 0.28 for less movement
    const PAN_RANGE_Y = 0.16; // Adjusted down from 0.18 for less movement
    const EASE = 0.08;
    const SCALE_EASE = 0.06;

    // update target pan based on mouse position
    function onMouseMove(e){
        const rect = HERO.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width; 
        const my = (e.clientY - rect.top) / rect.height;
        const cx = (mx - 0.5) * 2;
        const cy = (my - 0.5) * 2;
        const plane = getPlaneSize();
        targetX = -cx * (plane.w * PAN_RANGE_X);
        targetY = -cy * (plane.h * PAN_RANGE_Y);
    }

    // wheel adjusts zoom slightly
    function onWheel(e){
        e.preventDefault();
        targetScale += (e.deltaY < 0) ? 0.03 : -0.03;
        targetScale = Math.max(0.85, Math.min(1.22, targetScale));
    }

    // --- Cursor Tracking ---

    let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
    let dotX = mouseX, dotY = mouseY;
    document.addEventListener('mousemove', (e)=>{
        mouseX = e.clientX; mouseY = e.clientY;
    });

    // enlarge cursor on card hover
    document.addEventListener('mouseover', (ev)=>{
        const card = ev.target.closest && ev.target.closest('.artwork-card');
        if(card){
            DOT.style.width = '26px';
            DOT.style.height = '26px';
            DOT.style.backgroundColor = 'rgba(0,0,0,0.85)';
        }
    });
    document.addEventListener('mouseout', (ev)=>{
        const card = ev.target.closest && ev.target.closest('.artwork-card');
        if(card){
            DOT.style.width = '';
            DOT.style.height = '';
            DOT.style.backgroundColor = '';
        }
    });

    // --- Main Animation Loop (requestAnimationFrame) ---

    function animate(){
        // Smooth Camera Pan & Zoom
        currentX += (targetX - currentX) * EASE;
        currentY += (targetY - currentY) * EASE;
        currentScale += (targetScale - currentScale) * SCALE_EASE;

        INTERACTIVE.style.transform = `translate3d(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px), 0) scale(${currentScale})`;

        // Apply Parallax to Cards
        const cards = INTERACTIVE.querySelectorAll('.artwork-card');
        cards.forEach(card => {
            const depth = parseFloat(card.dataset.depth || 0.6); 
            // Parallax factor
            const px = (currentX) * (1 - depth) * 0.35;
            const py = (currentY) * (1 - depth) * 0.35;
            const baseRot = parseFloat(card.dataset.baseRot || 0);
            const rot = baseRot + (currentX * 0.0006) * (1 - depth) * 40;
            card.style.transform = `translate3d(${px}px, ${py}px, 0) rotateZ(${rot}deg)`;
        });

        // Smooth Cursor
        dotX += (mouseX - dotX) * 0.18;
        dotY += (mouseY - dotY) * 0.18;
        DOT.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

        requestAnimationFrame(animate);
    }

    // --- Initialization and Event Listeners ---
    
    // on resize, rebuild positions
    let rebuildTimeout;
    function rebuild(){
        clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(()=> {
            createCards();
        }, 120);
    }
    window.addEventListener('resize', rebuild);

    createCards();
    animate();

    // Event listeners
    HERO.addEventListener('mousemove', onMouseMove);
    HERO.addEventListener('wheel', onWheel, {passive:false});
    
    // touch drag to pan on mobile
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