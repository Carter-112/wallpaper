// Initialize Three.js Scene
let scene, camera, renderer;
let iceberg;
let clock = new THREE.Clock();

// Water drops variables
const waterDropsContainer = document.querySelector('.water-drops');
const dropInterval = 300; // ms between drops
let lastDropTime = 0;

// Check if user is on mobile
const isMobile = window.innerWidth <= 768;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x001f3f, 0.05);
    
    // Create camera - position differently for mobile
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    
    if (isMobile) {
        // For mobile, position to see iceberg from below
        camera.position.set(0, -2, 4);
        camera.lookAt(0, 0, 0);
    } else {
        camera.position.set(0, 0, 4);
        camera.lookAt(0, 0, 0);
    }
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('scene'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setClearColor(0x000000, 0);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x7fcdff, 1, 10);
    pointLight.position.set(0, 2, 3);
    scene.add(pointLight);
    
    // Create iceberg
    createIceberg();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Create the iceberg mesh
function createIceberg() {
    // Use a geometry that looks like an iceberg
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    
    // Modify vertices to make it more jagged like an iceberg
    const vertices = geometry.attributes.position;
    
    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const y = vertices.getY(i);
        const z = vertices.getZ(i);
        
        // Make the bottom more pointy like an icicle
        const distortion = (1 - y) * 0.2 * Math.random();
        
        vertices.setX(i, x + (Math.random() - 0.5) * distortion);
        vertices.setZ(i, z + (Math.random() - 0.5) * distortion);
        
        // Keep top flat but push down the bottom into an icicle shape
        if (y < -0.3) {
            vertices.setY(i, y - distortion * 0.5);
        }
    }
    
    // Create material that looks like ice
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x7fcdff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.5,
    });
    
    // Create mesh
    iceberg = new THREE.Mesh(geometry, material);
    
    // Position iceberg at the top of the screen
    iceberg.position.y = isMobile ? 1.5 : 1.2;
    
    scene.add(iceberg);
    
    // Add melting animation
    animateMelting();
}

// Animate the iceberg melting
function animateMelting() {
    // Scale animation - make it pulse slightly
    gsap.to(iceberg.scale, {
        y: 0.95,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: function() {
            // Decrease opacity slightly as it pulses
            iceberg.material.opacity = 0.7 + iceberg.scale.y * 0.1;
        }
    });
    
    // Slow rotation
    gsap.to(iceberg.rotation, {
        y: Math.PI * 2,
        duration: 40,
        repeat: -1,
        ease: "none"
    });
}

// Create water drops
function createWaterDrop() {
    // Get drop starting position based on iceberg position
    const viewportY = 20; // percent from top
    const x = (Math.random() - 0.5) * window.innerWidth * 0.3;
    const bottom = window.innerHeight * 0.9;
    
    // Create drop element
    const drop = document.createElement('div');
    drop.className = 'drop';
    
    // Set random size and position
    const size = isMobile ? (3 + Math.random() * 5) : (5 + Math.random() * 15);
    drop.style.width = `${size}px`;
    drop.style.height = `${size}px`;
    drop.style.left = `${window.innerWidth / 2 + x}px`;
    drop.style.top = `${window.innerHeight * (viewportY / 100)}px`;
    
    // Add to container
    waterDropsContainer.appendChild(drop);
    
    // Animate falling - faster on mobile
    const duration = isMobile ? (0.8 + Math.random() * 1.2) : (1 + Math.random() * 2);
    
    gsap.to(drop, {
        top: `${bottom}px`,
        duration: duration,
        ease: "power1.in",
        onComplete: function() {
            // Create ripple effect when drop hits the bottom
            createRipple(window.innerWidth / 2 + x, bottom);
            waterDropsContainer.removeChild(drop);
        }
    });
}

// Create ripple effect
function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    
    // Size and position - smaller on mobile
    const size = isMobile ? (5 + Math.random() * 10) : (10 + Math.random() * 20);
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    
    // Add to container
    waterDropsContainer.appendChild(ripple);
    
    // Remove after animation completes
    setTimeout(() => {
        waterDropsContainer.removeChild(ripple);
    }, 1000);
}

// Handle window resize
function onWindowResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update isMobile status
    const wasMobile = isMobile;
    const nowMobile = window.innerWidth <= 768;
    
    // Only adjust camera if mobile status changed
    if (wasMobile !== nowMobile) {
        // Reposition camera based on new device type
        if (nowMobile) {
            camera.position.set(0, -2, 4);
        } else {
            camera.position.set(0, 0, 4);
        }
        camera.lookAt(0, 0, 0);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate iceberg slightly
    if (iceberg) {
        iceberg.rotation.y += 0.002;
    }
    
    // Create water drops at intervals - more frequent on mobile
    const interval = isMobile ? 200 : 300;
    const now = Date.now();
    if (now - lastDropTime > interval) {
        createWaterDrop();
        lastDropTime = now;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Start everything when the page loads
window.addEventListener('load', init); 