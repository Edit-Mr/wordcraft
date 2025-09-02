// Matter.js physics engine setup
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;
const MouseConstraint = Matter.MouseConstraint;
const Mouse = Matter.Mouse;

// Game state
let engine;
let world;
let render;
let mouseConstraint;
let gravityEnabled = true;
let wordBlocks = [];
let physicsEnabled = false;
let sentenceWords = [];

// Chinese words collection
const chineseWords = [
    '我', '你', '他', '她', '它',
    '愛', '看', '聽','吃','可',
    '吃', '喝','以', '說', '走', '跑',
    '大', '小', '好', '壞', '美',
    '書', '水', '火', '山', '數',
    '天', '地', '人', '家'
];

// Initialize the application
function init() {
    setupPhysics();
    setupControls();
    createInitialWords();
    setupDragAndDrop();
    startRenderLoop();
}

// Setup Matter.js physics engine
function setupPhysics() {
    engine = Engine.create();
    world = engine.world;
    
    // Set initial gravity to 0 (disabled by default)
    engine.world.gravity.y = 0;
    
    // Create renderer
    render = Render.create({
        element: document.getElementById('playground'),
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: 'transparent',
            showAngleIndicator: false,
            showVelocity: false,
            showDebug: false
        }
    });

    // Initially hide the render canvas since physics starts disabled
    render.canvas.style.display = 'none';

    // Create ground and walls (invisible boundaries)
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { 
        isStatic: true,
        render: { visible: false }
    });
    
    const leftWall = Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { 
        isStatic: true,
        render: { visible: false }
    });
    
    const rightWall = Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { 
        isStatic: true,
        render: { visible: false }
    });

    // Create sentence area as a physics platform
    const sentenceAreaTop = window.innerHeight - 120; // Top of the sentence area
    const sentenceAreaWidth = 400;
    const sentenceAreaHeight = 20; // Platform thickness
    const sentenceAreaPlatform = Bodies.rectangle(
        window.innerWidth / 2, 
        sentenceAreaTop, 
        sentenceAreaWidth, 
        sentenceAreaHeight, 
        { 
            isStatic: true,
            label: 'sentenceArea',
            render: { visible: false },
            restitution: 0.3,
            friction: 0.8
        }
    );

    World.add(world, [ground, leftWall, rightWall, sentenceAreaPlatform]);

    // Setup mouse constraint for dragging (disabled since we handle dragging manually)
    const mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    // Don't add mouseConstraint to world to avoid conflicts with manual dragging
    // World.add(world, mouseConstraint);

    // Collision detection
    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            // Add bounce effect to colliding word blocks
            if (bodyA.label === 'wordBlock' && bodyB.label === 'wordBlock') {
                const elementA = document.querySelector(`[data-body-id="${bodyA.id}"]`);
                const elementB = document.querySelector(`[data-body-id="${bodyB.id}"]`);
                
                if (elementA) elementA.classList.add('collision');
                if (elementB) elementB.classList.add('collision');
                
                setTimeout(() => {
                    if (elementA) elementA.classList.remove('collision');
                    if (elementB) elementB.classList.remove('collision');
                }, 500);
            }
            
            // Handle word blocks landing on sentence area
            if ((bodyA.label === 'wordBlock' && bodyB.label === 'sentenceArea') ||
                (bodyA.label === 'sentenceArea' && bodyB.label === 'wordBlock')) {
                const wordBody = bodyA.label === 'wordBlock' ? bodyA : bodyB;
                const wordElement = document.querySelector(`[data-body-id="${wordBody.id}"]`);
                
                if (wordElement) {
                    wordElement.classList.add('in-sentence');
                    // Update sentence after a short delay to allow physics to settle
                    setTimeout(() => {
                        updateSentence();
                    }, 100);
                }
            }
        });
    });
}

// Setup control buttons
function setupControls() {
    document.getElementById('reset-btn').addEventListener('click', resetPlayground);
    document.getElementById('gravity-toggle').addEventListener('click', toggleGravity);
    document.getElementById('add-word').addEventListener('click', addRandomWord);
}

// Create initial word blocks in the palette
function createInitialWords() {
    const palette = document.getElementById('word-palette');
    
    // Add some initial words to the palette
    const initialWords = chineseWords;
    initialWords.forEach((word, index) => {
        createWordBlock(word, 20 + (index % 2) * 90, 50 + Math.floor(index / 2) * 90, true);
    });
}

// Create a word block element
function createWordBlock(text, x, y, isPalette = false) {
    const wordElement = document.createElement('div');
    wordElement.className = 'word-block';
    if (!isPalette) wordElement.classList.add('new-word');
    wordElement.textContent = text;
    wordElement.style.left = x + 'px';
    wordElement.style.top = y + 'px';
    
    if (isPalette) {
        document.getElementById('word-palette').appendChild(wordElement);
    } else {
        document.getElementById('playground').appendChild(wordElement);
        
        // Create physics body for non-palette words
        const body = Bodies.rectangle(x + 40, y + 40, 80, 80, {
            label: 'wordBlock',
            restitution: 0.6,
            friction: 0.1,
            frictionAir: 0.01,
            render: { visible: false }
        });
        
        wordElement.setAttribute('data-body-id', body.id);
        World.add(world, body);
        wordBlocks.push({ element: wordElement, body: body, text: text });
        
        if (!physicsEnabled) {
            Body.setStatic(body, true);
        }
    }
    
    return wordElement;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    let draggedElement = null;
    let offset = { x: 0, y: 0 };
    let isDragging = false;

    // Mouse/touch event handlers
    document.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events for mobile
    document.addEventListener('touchstart', handleTouch(startDrag));
    document.addEventListener('touchmove', handleTouch(drag));
    document.addEventListener('touchend', handleTouch(endDrag));

    function handleTouch(handler) {
        return function(e) {
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent(e.type.replace('touch', 'mouse'), {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    bubbles: true,
                    cancelable: true
                });
                handler(mouseEvent);
            }
        };
    }

    function startDrag(e) {
        const target = e.target.closest('.word-block');
        if (!target) return;

        e.preventDefault();
        isDragging = true;
        draggedElement = target;
        
        const rect = target.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
        
        target.classList.add('dragging');
        
        // If it's from palette, create a copy in playground
        if (target.parentElement.id === 'word-palette') {
            const clone = createWordBlock(
                target.textContent, 
                e.clientX - 40, 
                e.clientY - 40, 
                false
            );
            draggedElement = clone;
        }
        
        // Disable physics for the dragged element
        const bodyId = draggedElement.getAttribute('data-body-id');
        if (bodyId) {
            const wordBlock = wordBlocks.find(wb => wb.body.id == bodyId);
            if (wordBlock) {
                // Make the body static and clear velocities during drag
                Body.setStatic(wordBlock.body, true);
                Body.setVelocity(wordBlock.body, { x: 0, y: 0 });
                Body.setAngularVelocity(wordBlock.body, 0);
            }
        }
    }

    function drag(e) {
        if (!isDragging || !draggedElement) return;
        
        e.preventDefault();
        const x = e.clientX - offset.x;
        const y = e.clientY - offset.y;
        
        // Always update DOM position for smooth following
        draggedElement.style.left = x + 'px';
        draggedElement.style.top = y + 'px';
        
        // Update physics body position immediately to follow cursor
        const bodyId = draggedElement.getAttribute('data-body-id');
        if (bodyId) {
            const wordBlock = wordBlocks.find(wb => wb.body.id == bodyId);
            if (wordBlock) {
                Body.setPosition(wordBlock.body, { x: x + 40, y: y + 40 });
            }
        }
        
        // Check if dragging over trash can
        const trashCan = document.getElementById('trash-can');
        const trashRect = trashCan.getBoundingClientRect();
        const wordRect = draggedElement.getBoundingClientRect();
        
        const isOverTrash = (
            wordRect.left < trashRect.right &&
            wordRect.right > trashRect.left &&
            wordRect.top < trashRect.bottom &&
            wordRect.bottom > trashRect.top
        );
        
        if (isOverTrash) {
            trashCan.classList.add('drag-over');
            draggedElement.style.opacity = '0.5';
        } else {
            trashCan.classList.remove('drag-over');
            draggedElement.style.opacity = '1';
        }
        
        updateSentence();
    }

    function endDrag(e) {
        if (!isDragging || !draggedElement) return;
        
        isDragging = false;
        draggedElement.classList.remove('dragging');
        
        // Check if dropped on trash can
        const trashCan = document.getElementById('trash-can');
        const trashRect = trashCan.getBoundingClientRect();
        const wordRect = draggedElement.getBoundingClientRect();
        
        const isOverTrash = (
            wordRect.left < trashRect.right &&
            wordRect.right > trashRect.left &&
            wordRect.top < trashRect.bottom &&
            wordRect.bottom > trashRect.top
        );
        
        if (isOverTrash) {
            // Delete the word block
            const bodyId = draggedElement.getAttribute('data-body-id');
            if (bodyId) {
                const wordBlockIndex = wordBlocks.findIndex(wb => wb.body.id == bodyId);
                if (wordBlockIndex !== -1) {
                    const wordBlock = wordBlocks[wordBlockIndex];
                    World.remove(world, wordBlock.body);
                    wordBlocks.splice(wordBlockIndex, 1);
                }
            }
            draggedElement.remove();
            
            // Add deletion animation
            trashCan.classList.add('drag-over');
            setTimeout(() => {
                trashCan.classList.remove('drag-over');
            }, 300);
            
            draggedElement = null;
            updateSentence();
            return;
        }
        
        // Reset trash can state
        trashCan.classList.remove('drag-over');
        draggedElement.style.opacity = '1';
        
        // Re-enable physics for the dropped word if physics is enabled
        const bodyId = draggedElement.getAttribute('data-body-id');
        if (bodyId) {
            const wordBlock = wordBlocks.find(wb => wb.body.id == bodyId);
            if (wordBlock) {
                // Set final position
                Body.setPosition(wordBlock.body, { 
                    x: parseInt(draggedElement.style.left) + 40, 
                    y: parseInt(draggedElement.style.top) + 40 
                });
                
                // Re-enable physics if gravity is on
                if (physicsEnabled) {
                    Body.setStatic(wordBlock.body, false);
                    // Give it a slight velocity based on the release to make it feel natural
                    const releaseVelocity = {
                        x: (Math.random() - 0.5) * 2, // Small random horizontal velocity
                        y: 0 // No initial vertical velocity, let gravity take over
                    };
                    Body.setVelocity(wordBlock.body, releaseVelocity);
                } else {
                    // Keep it static if physics is disabled
                    Body.setStatic(wordBlock.body, true);
                }
            }
        }
        
        draggedElement = null;
        updateSentence();
    }
}

// Update sentence display based on word positions
function updateSentence() {
    const sentenceAreaTop = window.innerHeight - 120; // Top of the sentence area platform
    const sentenceAreaBottom = window.innerHeight - 60; // Bottom tolerance for sentence area
    
    const wordsInSentence = wordBlocks
        .filter(wb => {
            if (physicsEnabled) {
                // When physics is enabled, check if word is on or near the sentence platform
                const wordY = wb.body.position.y;
                return wordY >= sentenceAreaTop - 80 && wordY <= sentenceAreaBottom;
            } else {
                // When physics is disabled, use DOM positioning
                const rect = wb.element.getBoundingClientRect();
                return rect.top >= sentenceAreaTop - 50 && rect.top <= sentenceAreaBottom;
            }
        })
        .sort((a, b) => {
            if (physicsEnabled) {
                return a.body.position.x - b.body.position.x;
            } else {
                const rectA = a.element.getBoundingClientRect();
                const rectB = b.element.getBoundingClientRect();
                return rectA.left - rectB.left;
            }
        });
    
    // Update visual indication
    wordBlocks.forEach(wb => {
        wb.element.classList.remove('in-sentence');
    });
    
    wordsInSentence.forEach(wb => {
        wb.element.classList.add('in-sentence');
    });
    
    // Update sentence display
    const sentence = wordsInSentence.map(wb => wb.text).join('');
    document.getElementById('sentence-display').textContent = sentence || '将汉字拖到下方创建句子...';
    
    sentenceWords = wordsInSentence;
}

// Control functions
function resetPlayground() {
    // Remove all word blocks from playground (keep palette)
    wordBlocks.forEach(wb => {
        World.remove(world, wb.body);
        wb.element.remove();
    });
    wordBlocks = [];
    sentenceWords = [];
    updateSentence();
}

function toggleGravity() {
    physicsEnabled = !physicsEnabled;
    const button = document.getElementById('gravity-toggle');
    
    if (physicsEnabled) {
        button.textContent = '關閉重力';
        engine.world.gravity.y = 1;
        
        // Start the Matter.js renderer
        Render.run(render);
        
        // Enable physics for all word blocks (except currently dragged ones)
        wordBlocks.forEach(wb => {
            // Don't enable physics for currently dragged elements
            if (!wb.element.classList.contains('dragging')) {
                Body.setStatic(wb.body, false);
                wb.element.classList.add('physics-enabled');
            }
        });
        
        // Show Matter.js renderer canvas
        render.canvas.style.display = 'block';
    } else {
        button.textContent = '开启重力 Enable Gravity';
        engine.world.gravity.y = 0;
        
        // Stop the Matter.js renderer
        Render.stop(render);
        
        // Disable physics for all word blocks
        wordBlocks.forEach(wb => {
            Body.setStatic(wb.body, true);
            Body.setVelocity(wb.body, { x: 0, y: 0 });
            Body.setAngularVelocity(wb.body, 0);
            wb.element.classList.remove('physics-enabled');
        });
        
        // Hide Matter.js renderer canvas
        render.canvas.style.display = 'none';
    }
}

function addRandomWord() {
    const randomWord = chineseWords[Math.floor(Math.random() * chineseWords.length)];
    const x = Math.random() * (window.innerWidth - 200) + 100;
    const y = Math.random() * 200 + 100;
    
    createWordBlock(randomWord, x, y, false);
}

// Animation loop
function startRenderLoop() {
    function animate() {
        Engine.update(engine);
        
        // Sync DOM elements with physics bodies
        if (physicsEnabled) {
            wordBlocks.forEach(wb => {
                const pos = wb.body.position;
                wb.element.style.left = (pos.x - 40) + 'px';
                wb.element.style.top = (pos.y - 40) + 'px';
                
                // Add rotation based on angular velocity
                const angle = wb.body.angle;
                wb.element.style.transform = `rotate(${angle}rad) perspective(1000px) rotateX(${Math.sin(angle) * 10}deg) rotateY(${Math.cos(angle) * 10}deg)`;
            });
            
            updateSentence();
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Handle window resize
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;
    
    // Update boundaries
    World.remove(world, world.bodies.filter(body => body.isStatic && !body.label));
    
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { 
        isStatic: true,
        render: { visible: false }
    });
    
    const leftWall = Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { 
        isStatic: true,
        render: { visible: false }
    });
    
    const rightWall = Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { 
        isStatic: true,
        render: { visible: false }
    });

    // Recreate sentence area platform
    const sentenceAreaTop = window.innerHeight - 120;
    const sentenceAreaWidth = 400;
    const sentenceAreaHeight = 20;
    const sentenceAreaPlatform = Bodies.rectangle(
        window.innerWidth / 2, 
        sentenceAreaTop, 
        sentenceAreaWidth, 
        sentenceAreaHeight, 
        { 
            isStatic: true,
            label: 'sentenceArea',
            render: { visible: false },
            restitution: 0.3,
            friction: 0.8
        }
    );

    World.add(world, [ground, leftWall, rightWall, sentenceAreaPlatform]);
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
