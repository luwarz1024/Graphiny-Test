import * as THREE from 'three';

export async function launch() {

  let PointerLockControls, OrbitControls, EffectComposer, RenderPass, UnrealBloomPass;
  try {
    const plcModule = await import('three/addons/controls/PointerLockControls.js');
    PointerLockControls = plcModule.PointerLockControls;
    const ocModule = await import('three/addons/controls/OrbitControls.js');
    OrbitControls = ocModule.OrbitControls;
    const ecModule = await import('three/addons/postprocessing/EffectComposer.js');
    EffectComposer = ecModule.EffectComposer;
    const rpModule = await import('three/addons/postprocessing/RenderPass.js');
    RenderPass = rpModule.RenderPass;
    const ubpModule = await import('three/addons/postprocessing/UnrealBloomPass.js');
    UnrealBloomPass = ubpModule.UnrealBloomPass;
  } catch (e) {
    console.error('Could not load required three.js modules! Please check your setup.', e);
    return;
  }

  let container = document.getElementById('three-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'three-container';
    container.style.position = 'fixed';
    container.style.inset = '0';
    document.body.appendChild(container);
  }


  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);


  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a2a3a, 0.0006);
  scene.background = new THREE.Color(0x1a2a3a);

  const cameraFP = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
  const cameraTP = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
  cameraFP.position.set(0, 1.7, 0);
  cameraTP.position.set(0, 6, 12);


  const renderPass = new RenderPass(scene, cameraTP);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.5, 0.7);
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);


  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
  scene.add(hemiLight);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(-150, 250, -150);
  sun.castShadow = true;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  scene.add(sun);


  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a5d23, roughness: 0.85, metalness: 0.05 });
  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);


  function makeRoads() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.98 });
    const roadWidth = 8;
    for (let i = -12; i <= 12; i++) {
      const g = new THREE.PlaneGeometry(1000, roadWidth);
      const m = new THREE.Mesh(g, roadMat);
      m.rotation.x = -Math.PI / 2;
      m.position.z = i * 40;
      scene.add(m);
    }
    for (let j = -12; j <= 12; j++) {
      const g = new THREE.PlaneGeometry(roadWidth, 1000);
      const m = new THREE.Mesh(g, roadMat);
      m.rotation.x = -Math.PI / 2;
      m.position.x = j * 40;
      scene.add(m);
    }
  }
  makeRoads();


  const instBuildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x999999 }), 2000);
  instBuildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  let instIndex = 0;
  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 40; j++) {
      if (instIndex >= 2000) break;
      const x = (i - 25) * 30 + (Math.random() - 0.5) * 10;
      const z = (j - 20) * 30 + (Math.random() - 0.5) * 10;
      const h = 8 + Math.random() * 60;
      dummy.position.set(x, h / 2, z);
      dummy.scale.set(12 + Math.random() * 20, h, 12 + Math.random() * 20);
      dummy.rotation.y = (Math.random() - 0.5) * 0.4;
      dummy.updateMatrix();
      instBuildings.setMatrixAt(instIndex++, dummy.matrix);
    }
    if (instIndex >= 2000) break;
  }
  instBuildings.instanceMatrix.needsUpdate = true;
  scene.add(instBuildings);


  const neighborhood = new THREE.Group();
  function makeHouse(x, z, color) {
    const house = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshStandardMaterial({ color: color || 0xffffff, roughness: 0.7 }));
    body.position.y = 3;
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 2, 4), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 7;
    house.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    door.position.set(0, 1, 5.01);
    door.name = 'door';
    house.add(door);
    house.position.set(x, 0, z);
    return house;
  }
  const myHouse = makeHouse(0, -120, 0xf0efe9);
  neighborhood.add(myHouse);
  scene.add(neighborhood);

  const interiorRoot = new THREE.Group();
  interiorRoot.name = 'interiorRoot';
  function makeInterior() {
    const living = new THREE.Group();
    living.name = 'living';
    const floor = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.2, 9.6), new THREE.MeshStandardMaterial({ color: 0x7c6b5a }));
    floor.position.set(myHouse.position.x, 0.1, myHouse.position.z + 0.0);
    living.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3, 0.2), wallMat);
    backWall.position.set(myHouse.position.x, 1.6, myHouse.position.z - 4.8);
    living.add(backWall);
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.2), new THREE.MeshStandardMaterial({ color: 0x333344 }));
    sofa.position.set(myHouse.position.x - 1.5, 0.6, myHouse.position.z + 1.5);
    living.add(sofa);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x2b2b2b }));
    stand.position.set(myHouse.position.x + 1.5, 0.4, myHouse.position.z + 1.5);
    living.add(stand);
    const tvCanvas = document.createElement('canvas');
    tvCanvas.width = 512; tvCanvas.height = 256;
    const tvCtx = tvCanvas.getContext('2d');
    const tvTex = new THREE.CanvasTexture(tvCanvas);
    tvTex.encoding = THREE.sRGBEncoding;
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), new THREE.MeshStandardMaterial({ map: tvTex, emissive: 0x000000, emissiveIntensity: 0 }));
    tvScreen.position.set(myHouse.position.x + 1.5, 1.05, myHouse.position.z + 1.5 + 0.31);
    tvScreen.name = 'tvScreen';
    living.add(tvScreen);

    const remote = document.createElement('div');
    remote.id = 'remote-ui';
    remote.style.cssText = 'position:absolute; left:12px; top:12px; padding:6px 8px; background:rgba(0,0,0,0.6); color:white; font-family:sans-serif; z-index:40; display:none;';
    remote.innerHTML = '<button id="remoteToggle">Toggle TV</button> <button id="remoteChannel">Channel</button>';
    document.body.appendChild(remote);

    interiorRoot.add(living);
    scene.add(interiorRoot);
    return { tvScreen, tvCanvas, tvCtx, remote };
  }
  const interiorAssets = makeInterior();
  let tvOn = false;


  const player = new THREE.Group();
  player.name = 'player';
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.0, 4, 8), new THREE.MeshStandardMaterial({ color: 0x5577aa, visible: false }));
  body.castShadow = true;
  player.add(body);
  player.position.set(myHouse.position.x + 1.5, 1.0, myHouse.position.z + 3.5);
  cameraFP.position.copy(player.position);
  cameraFP.lookAt(new THREE.Vector3(myHouse.position.x + 1.5, 1.05, myHouse.position.z + 1.5));
  scene.add(player);


  let mode = 'third';
  let controlsFP = null;
  if (PointerLockControls) {
    controlsFP = new PointerLockControls(cameraFP, renderer.domElement);

  }
  function setMode(m) {
    mode = m;
    renderPass.camera = (mode === 'first') ? cameraFP : cameraTP;
    body.material.visible = (mode === 'third');
  }
  setMode('first');


  const state = { forward: false, back: false, left: false, right: false, crouch: false, sprint: false, dash: false };
  const walkSpeed = 5.2, sprintMultiplier = 1.9, dashSpeed = 20.0;
  let dashCooldown = 0;


  function onKeyDown(e) {
    if (e.code === 'KeyW') state.forward = true;
    if (e.code === 'KeyS') state.back = true;
    if (e.code === 'KeyD') state.left = true;
    if (e.code === 'KeyA') state.right = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.sprint = true;
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') { state.crouch = true; player.scale.y = 0.7; }
    if (e.code === 'Space' && dashCooldown <= 0) { dashCooldown = 1.2; state.dash = true; }
    if (e.code === 'KeyV') setMode(mode === 'first' ? 'third' : 'first');

  }
  function onKeyUp(e) {
    if (e.code === 'KeyW') state.forward = false;
    if (e.code === 'KeyS') state.back = false;
    if (e.code === 'KeyD') state.left = false;
    if (e.code === 'KeyA') state.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.sprint = false;
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') { state.crouch = false; player.scale.y = 1.0; }
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  renderer.domElement.addEventListener('click', () => { if (controlsFP && mode === 'first') controlsFP.lock(); });

  let tpYaw = 0, tpPitch = 0.2, isPointerDown = false;
  function onPointerDown(e) { if (e.button === 2) isPointerDown = true; }
  function onPointerUp(e) { if (e.button === 2) isPointerDown = false; }
  function onPointerMove(e) {
    if (mode === 'third' && isPointerDown) {
      tpYaw -= e.movementX * 0.0025;
      tpPitch -= e.movementY * 0.0025;
      tpPitch = Math.max(-0.6, Math.min(1.2, tpPitch));
    }
  }
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('mousemove', onPointerMove);


  let dayTime = 0.2, daySpeed = 0.005;
  function updateDayNight(dt) {
    dayTime = (dayTime + dt * daySpeed) % 1.0;
    const theta = dayTime * Math.PI * 2;
    sun.position.set(Math.cos(theta) * 200, Math.sin(theta) * 200, Math.sin(theta) * 100);
    sun.intensity = Math.max(0.05, Math.sin(theta) * 1.2);
    if (sun.position.y < 0) sun.intensity = 0.05;
    hemiLight.intensity = sun.intensity * 0.5;
    scene.background.set(sun.position.y > 0 ? 0x9fb3c8 : 0x080826).lerp(new THREE.Color(0xbfe8ff), 0.1);
  }


  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function toggleTV() {
    tvOn = !tvOn;
    const ctx = interiorAssets.tvCtx;
    interiorAssets.tvScreen.material.map.needsUpdate = true;
    if (tvOn) {
      interiorAssets.tvScreen.material.emissive.setHex(0xffffff);
      interiorAssets.tvScreen.material.emissiveIntensity = 1.5;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px monospace';
      ctx.fillText('TV: ON. Click to start game.', 20, 80);
    } else {
      interiorAssets.tvScreen.material.emissive.setHex(0x000000);
      interiorAssets.tvScreen.material.emissiveIntensity = 0;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#ffffff';
      ctx.font = '30px monospace';
      ctx.fillText('TV: OFF. Click to turn on.', 20, 50);
      startGameMain();
    }
  }

  let gameRunning = false;
  async function startGameMain() {
    if (gameRunning) return;
    gameRunning = true;

    container.remove();
    const stage = document.getElementById('stage') || document.createElement('div');
    if (!stage.id) {
      stage.id = 'stage';
      document.body.appendChild(stage);
    }
    try {
      const gm = await import('./game_main.js');
      if (gm.start && typeof gm.start === 'function') await gm.start();
      else if (typeof gm === 'function') await gm();
      else if (gm && typeof gm.default === 'function') await gm.default();
      else console.error('game_main export not a function.');
    } catch (e) {
      console.error('Failed launching game_main:', e);
    }

    gameRunning = false;
  }


  const cars = [];
  for (let i = 0; i < 20; i++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1.6), new THREE.MeshStandardMaterial({ color: Math.floor(Math.random() * 0xffffff) }));
    car.position.set(-600 + Math.random() * 1200, 0.6, -220 + Math.random() * 440);
    car.userData.dir = Math.random() > 0.5 ? 1 : -1;
    scene.add(car);
    cars.push(car);
  }


  /* Enhanced Intro Sequence */
  const fullText = ">start Graphiny**\n>>check Drive\n*>>>OK.\n>>check Battery\n*>>>OK.\n>>check Engine\n*>>>OK.\n>>check Fuel\n*>>>OK.\n";
  let currentText = "";
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  let isZooming = false;

  async function typeText() {
    const ori = fullText.length;
    // Faster Typing
    for (let i = 0; i < ori; i++) {
      const char = fullText[i];
      if (char === '*') {
        // Flash Effect on Check
        const ctx = interiorAssets.tvCtx;
        ctx.fillStyle = '#00ff00'; // Flash Green
        ctx.fillRect(0, 0, 512, 256);
        interiorAssets.tvScreen.material.map.needsUpdate = true;
        await sleep(50);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 256);

        await sleep(100); // Drastically reduced wait
      } else {
        currentText += char;
        interiorAssets.tvScreen.material.map.needsUpdate = true;
        // Type faster
        await sleep(5);
      }
    }

    // Glitch Effect before Start
    for (let i = 0; i < 5; i++) {
      interiorAssets.tvScreen.material.emissive.setHex(Math.random() * 0xffffff);
      interiorAssets.tvScreen.position.x += (Math.random() - 0.5) * 0.1;
      await sleep(30);
      interiorAssets.tvScreen.position.x = myHouse.position.x + 1.5;
    }
    interiorAssets.tvScreen.material.emissive.setHex(0x000000);

    await sleep(200);
    currentText += "\nGraphiny Start";

    // Start Zoom
    isZooming = true;

    for (let i = ori; i < fullText.length; i++) {
      currentText += fullText[i];
      interiorAssets.tvScreen.material.map.needsUpdate = true;
      await sleep(10);
    }

    await sleep(800);
    startGameMain();
  }

  if (!tvOn) {
    // Auto-start the sequence immediately
    // toggleTV(); // The logic was slightly mixed, let's just run typeText directly as intended by original code
    typeText();
  }

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    updateDayNight(dt);
    cars.forEach(c => { c.position.x += c.userData.dir * dt * 30; if (Math.abs(c.position.x) > 800) c.position.x *= -0.98; });
    if (dashCooldown > 0) dashCooldown -= dt;

    const speed = walkSpeed * (state.sprint ? sprintMultiplier : 1.0);
    const moveDir = new THREE.Vector3();
    if (state.forward) moveDir.z -= 1;
    if (state.back) moveDir.z += 1;
    if (state.left) moveDir.x -= 1;
    if (state.right) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      const moveVec = new THREE.Vector3();
      if (mode === 'first' && controlsFP) {
        const camDir = new THREE.Vector3();
        controlsFP.getDirection(camDir).setY(0).normalize();
        const right = new THREE.Vector3().crossVectors(cameraFP.up, camDir);
        moveVec.addScaledVector(camDir, -moveDir.z).addScaledVector(right, moveDir.x);
      } else {
        const forward = new THREE.Vector3(Math.sin(tpYaw), 0, Math.cos(tpYaw));
        const right = new THREE.Vector3(forward.z, 0, -forward.x);
        moveVec.addScaledVector(forward, -moveDir.z).addScaledVector(right, moveDir.x);
      }
      player.position.addScaledVector(moveVec, speed * dt);
    }

    const ctx = interiorAssets.tvCtx;
    // Glitchy Text Render
    if (Math.random() > 0.95) {
      ctx.fillStyle = '#001100';
    } else {
      ctx.fillStyle = '#000000';
    }

    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px monospace';

    const lines = currentText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // Simple shake for text
      let ox = 0;
      if (isZooming) ox = (Math.random() - 0.5) * 2;
      ctx.fillText(lines[i], 20 + ox, 50 + i * 15);
    }
    interiorAssets.tvScreen.material.map.needsUpdate = true;

    if (state.dash) {

      state.dash = false;
    }

    player.position.y = 1.0;

    const minX = myHouse.position.x - 4.5;
    const maxX = myHouse.position.x + 4.5;
    const minZ = myHouse.position.z - 5.5;
    const maxZ = myHouse.position.z + 5.5;

    player.position.x = Math.max(minX, Math.min(maxX, player.position.x));
    player.position.z = Math.max(minZ, Math.min(maxZ, player.position.z));

    if (mode === 'first') {
      const targetPos = new THREE.Vector3(interiorAssets.tvScreen.position.x, interiorAssets.tvScreen.position.y, interiorAssets.tvScreen.position.z + 1.5);

      if (isZooming) {
        // Camera Zoom Effect
        cameraFP.position.lerp(targetPos, dt * 1.5);
        cameraFP.lookAt(interiorAssets.tvScreen.position);
      } else {
        cameraFP.position.copy(player.position);
      }
    } else {
      const offset = new THREE.Vector3(Math.sin(tpYaw), -Math.sin(tpPitch), Math.cos(tpYaw)).multiplyScalar(8);
      const desiredCamPos = player.position.clone().add(new THREE.Vector3(0, 3.5, 0)).sub(offset);
      cameraTP.position.lerp(desiredCamPos, dt * 8);
      cameraTP.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
    }

    composer.render(dt);

  }
  animate();
};