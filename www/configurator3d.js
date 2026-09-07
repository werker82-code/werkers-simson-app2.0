(() => {
  const CONFIG_KEY = 'ww_s51_config_current_v1';
  const THREE_URL = './assets/vendor/three/three.module.min.js';
  const LOADER_URL = './assets/vendor/three/GLTFLoader.js';
  const ROOM_URL = './assets/vendor/three/RoomEnvironment.js';
  const MODEL_VARIANTS = {
    street: {
      url: 'assets/models/simson-s51-b1-4.glb',
      title: 'S51 B1-4', modelName: 'Simson_S51_B1_4_HD',
      originalNote: 'B1-4-Originalgeometrie · tiefer Auspuff ohne Hitzeschutz · Gepäckträger',
      reference: {
        base: 'street', frontFender: 'chrome', rearFender: 'series', wheelSize: '16',
        wheelType: 'spokes', rim: 'aluminium', tire: 'road', brake: 'drum', fork: 'series',
        shock: 'series', handlebar: 'street', seat: 'standard', exhaust: 'series', light: 'classic'
      }
    },
    enduro: {
      url: 'assets/models/simson-s51-enduro.glb',
      title: 'S51 ENDURO', modelName: 'Simson_S51_Enduro_HD',
      originalNote: 'Enduro-Originalgeometrie · Lenker +5 cm · hoher Auspuff mit Hitzeschutz · Gepäckträger',
      reference: {
        base: 'enduro', frontFender: 'black', rearFender: 'series', wheelSize: '16',
        wheelType: 'spokes', rim: 'aluminium', tire: 'enduro', brake: 'drum', fork: 'enduro',
        shock: 'series', handlebar: 'enduro', seat: 'standard', exhaust: 'enduro', light: 'classic'
      }
    }
  };
  const HD_COMPONENT_ROOT = 'assets/models/hd/';
  const HD_COMPONENT_FILES = {
    tank: 'tank_hd.glb', sidecover: 'sidecover_hd.glb', wheel: 'wheel_hd.glb',
    wheel_road: 'wheel_road_hd.glb', wheel_classic: 'wheel_classic_hd.glb', wheel_enduro: 'wheel_enduro_hd.glb', rim: 'rim_hd.glb',
    spokes: 'spokes_hd.glb', star5: 'star5_hd.glb', star10: 'star10_hd.glb', hub: 'hub_hd.glb',
    brakedisc: 'brakedisc_hd.glb', engine: 'engine_hd.glb', engine_fins: 'engine_fins_hd.glb',
    carb: 'carb_hd.glb', frame: 'frame_hd.glb', frame_street: 'frame_street_hd.glb',
    frame_enduro: 'frame_enduro_hd.glb', swingarm: 'swingarm_hd.glb', fork: 'fork_hd.glb',
    shocks: 'shocks_hd.glb', shocks_long: 'shocks_long_hd.glb', exhaust_series: 'exhaust_series_hd.glb',
    exhaust_enduro: 'exhaust_enduro_hd.glb', exhaust_sport: 'exhaust_sport_hd.glb',
    seat_standard: 'seat_standard_hd.glb', seat_flat: 'seat_flat_hd.glb', seat_sport: 'seat_sport_hd.glb',
    handlebar_street: 'handlebar_street_hd.glb', handlebar_enduro: 'handlebar_enduro_hd.glb',
    handlebar_cross: 'handlebar_cross_hd.glb', cockpit: 'cockpit_hd.glb', headlight_shell: 'headlight_shell_hd.glb',
    headlight_classic: 'headlight_classic_hd.glb', headlight_h4: 'headlight_h4_hd.glb',
    headlight_led: 'headlight_led_hd.glb', indicators_front: 'indicators_front_hd.glb',
    indicators_rear: 'indicators_rear_hd.glb', taillight: 'taillight_hd.glb', licenseplate: 'licenseplate_hd.glb',
    front_fender_classic: 'front_fender_classic_hd.glb', front_fender_enduro: 'front_fender_enduro_hd.glb',
    rear_fender: 'rear_fender_hd.glb', rear_fender_short: 'rear_fender_short_hd.glb',
    luggage_rack: 'luggage_rack_hd.glb'
  };

  let runtimePromise = null;
  let THREE = null, GLTFLoader = null, RoomEnvironment = null;
  let active = false, host = null, canvas = null, renderer = null, scene = null, camera = null;
  let model = null, environment = null, raf = 0, generation = 0, wrapped = false, loadedVariant = null;
  let viewMode = 'hd';
  let yaw = -0.58, pitch = 0.055, distance = 7.65;
  const target = { x: 0, y: -0.18, z: 0 };
  const pointers = new Map();
  let lastPointer = null, lastPinch = 0;

  function config() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function variantForConfig(value = config()) {
    return value.base === 'enduro' ? 'enduro' : 'street';
  }

  function ensureRuntime() {
    if (!runtimePromise) runtimePromise = Promise.all([
      import(THREE_URL), import(LOADER_URL), import(ROOM_URL)
    ]).then(([threeModule, loaderModule, roomModule]) => {
      THREE = threeModule;
      GLTFLoader = loaderModule.GLTFLoader;
      RoomEnvironment = roomModule.RoomEnvironment;
    });
    return runtimePromise;
  }

  function html(variant) {
    const meta = MODEL_VARIANTS[variant];
    const modular = viewMode === 'modular';
    return `<div class="config3dTop">
      <b id="config3dModelTitle">${meta.title} · ${modular ? 'MODULARE HD-WERKSTATT' : 'HD-REFERENZMODELL'}</b>
      <span>Ziehen = drehen · Mausrad/Pinch = zoomen</span>
      <div class="config3dModeSwitch" aria-label="3D-Modus">
        <button class="${modular ? '' : 'active'}" onclick="window.S51ThreeD.setMode('hd')">3D HD</button>
        <button class="${modular ? 'active' : ''}" onclick="window.S51ThreeD.setMode('modular')">3D modular</button>
      </div>
    </div>
    <div class="config3dCamera">
      <button onclick="window.S51ThreeD.camera('side')">Seite</button>
      <button onclick="window.S51ThreeD.camera('three')">3/4</button>
      <button onclick="window.S51ThreeD.camera('front')">Front</button>
      <button onclick="window.S51ThreeD.camera('rear')">Heck</button>
      <button onclick="window.S51ThreeD.camera('reset')">Ansicht zurücksetzen</button>
    </div>
    <div class="config3dStage">
      <canvas id="config3dCanvas" aria-label="Drehbare hochauflösende 3D-Vorschau der Simson ${meta.title}"></canvas>
      <div id="config3dLoad" class="config3dLoad" role="status"><b>${modular ? 'HD-Baugruppen werden geladen' : 'HD-Modell wird geladen'}</b><span>0 %</span></div>
    </div>
    <div class="config3dFoot"><span id="config3dVariantNote">${modular ? 'Modulare Werkstatt auf derselben HD-Grundgeometrie' : meta.originalNote}</span><b id="config3dModelTag">GLB 5.0 · ${meta.title} · ${modular ? 'MODULAR HD' : 'HD'}</b></div>`;
  }

  async function mount(mode = viewMode) {
    viewMode = mode === 'modular' ? 'modular' : 'hd';
    host = document.getElementById('configPreview');
    if (!host) return;
    destroy();
    active = true;
    const variant = variantForConfig();
    const currentGeneration = ++generation;
    host.innerHTML = html(variant);
    canvas = document.getElementById('config3dCanvas');
    try {
      await ensureRuntime();
      if (!active || currentGeneration !== generation) return;
      setupRenderer();
      bind();
      renderLoop();
      if (viewMode === 'modular') await loadModularModel(currentGeneration, variant);
      else await loadModel(currentGeneration, variant);
    } catch (error) {
      showError(error);
    }
  }

  function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);

    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xffffff, 0x7c766c, 1.65));
    const key = new THREE.DirectionalLight(0xffffff, 3.25);
    key.position.set(-3.6, 6.8, 4.8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5;
    key.shadow.camera.top = 4; key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.00035;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdbe8ff, 1.35);
    fill.position.set(4.2, 3.4, -4.8);
    scene.add(fill);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d4ca, roughness: 0.93, metalness: 0 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), floorMaterial);
    floor.name = 'StudioFloor';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.82;
    floor.receiveShadow = true;
    scene.add(floor);
    resize();
    updateCamera();
  }

  function loadModel(currentGeneration, variant) {
    const meta = MODEL_VARIANTS[variant];
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(meta.url, gltf => {
        if (!active || currentGeneration !== generation) return resolve();
        model = gltf.scene;
        model.name = meta.modelName;
        loadedVariant = variant;
        model.rotation.y = Math.PI / 2;
        model.updateMatrixWorld(true);

        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const scale = 5.02 / Math.max(rawSize.x, 0.001);
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y += -1.79 - box.min.y;

        prepareMaterials();
        scene.add(model);
        applyConfig();
        const loading = document.getElementById('config3dLoad');
        if (loading) loading.remove();
        resolve();
      }, event => {
        const label = document.querySelector('#config3dLoad span');
        if (!label) return;
        const percentage = event.total ? Math.min(100, Math.round(event.loaded / event.total * 100)) : null;
        label.textContent = percentage === null ? `${Math.round(event.loaded / 1024)} KB` : `${percentage} %`;
      }, reject);
    });
  }

  function modularPlan(cfg) {
    const plan = [];
    const add = (component, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) =>
      plan.push({ component, position, scale, rotation });
    const wheelRadius = ({16: .82, 17: .85, 18: .88, 19: .91})[cfg.wheelSize || '16'] || .82;
    const wheelScale = wheelRadius / .91;
    const rearY = -1.03 + (cfg.shock === 'long' ? .12 : 0);
    const frontY = -1.03 + (cfg.fork === 'enduro' ? .12 : 0);
    const rearX = -1.68, frontX = 1.72;
    const chassisScale = [.82, .98, 1];
    const addWheel = (x, y, front) => {
      const transformScale = [wheelScale, wheelScale, wheelScale];
      add(cfg.tire === 'enduro' ? 'wheel_enduro' : cfg.tire === 'classic' ? 'wheel_classic' : 'wheel_road', [x, y, 0], transformScale);
      add('rim', [x, y, 0], transformScale);
      add(cfg.wheelType === 'star5' ? 'star5' : cfg.wheelType === 'star10' ? 'star10' : 'spokes', [x, y, 0], transformScale);
      add('hub', [x, y, 0], transformScale);
      if (front && cfg.brake === 'disc') add('brakedisc', [x, y, -.16], transformScale);
    };

    add(cfg.base === 'enduro' ? 'frame_enduro' : 'frame_street', [0, 0, 0], chassisScale);
    add('luggage_rack');
    add('swingarm', [0, rearY + 1.05, 0], chassisScale);
    add('fork', [0, frontY + 1.05, 0], chassisScale);
    add(cfg.shock === 'long' ? 'shocks_long' : 'shocks', [0, 0, 0], chassisScale);
    addWheel(rearX, rearY, false);
    addWheel(frontX, frontY, true);

    add('tank', [-.10, .86, 0], [.88, .90, .92], [0, 0, -.025]);
    add('sidecover', [-.18, .14, -.28], [.78, .84, .86], [0, 0, -.075]);
    add('sidecover', [-.18, .14, .28], [.78, .84, .86], [0, 0, -.075]);
    add('engine', [.02, -.48, 0], [.80, .80, .84]);
    add('engine_fins', [.02, -.48, 0], [.80, .80, .84]);
    add('carb', [.02, -.48, 0], [.80, .80, .84]);
    add(`exhaust_${cfg.exhaust === 'enduro' ? 'enduro' : cfg.exhaust === 'sport' ? 'sport' : 'series'}`, [0, 0, 0], chassisScale);
    add(`seat_${cfg.seat === 'flat' ? 'flat' : cfg.seat === 'sport' ? 'sport' : 'standard'}`, [.05, .02, 0], [.84, .96, .96]);
    add(`handlebar_${cfg.handlebar === 'enduro' ? 'enduro' : cfg.handlebar === 'cross' ? 'cross' : 'street'}`, [0, 0, 0], chassisScale);
    add('cockpit', [0, 0, 0], chassisScale);
    add('headlight_shell', [0, 0, 0], chassisScale);
    add(`headlight_${cfg.light === 'led' ? 'led' : cfg.light === 'h4' ? 'h4' : 'classic'}`, [0, 0, 0], chassisScale);
    add('indicators_front', [0, 0, 0], chassisScale);
    add('indicators_rear', [0, 0, 0], chassisScale);
    add('taillight', [0, 0, 0], chassisScale);
    add('licenseplate', [0, 0, 0], chassisScale);

    const frontFender = cfg.base === 'enduro' || cfg.frontFender === 'black' ? 'front_fender_enduro' : 'front_fender_classic';
    add(frontFender, [-.43, frontY + 1.05, 0]);
    add(cfg.rearFender === 'short' ? 'rear_fender_short' : 'rear_fender', [.37, rearY + 1.05, 0]);
    return plan;
  }

  function loadGltf(loader, url) {
    return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
  }

  async function loadModularModel(currentGeneration, variant) {
    const cfg = config();
    const plan = modularPlan(cfg);
    const loader = new GLTFLoader();
    const cache = new Map();
    const getAsset = component => {
      const url = HD_COMPONENT_ROOT + HD_COMPONENT_FILES[component];
      if (!cache.has(url)) cache.set(url, loadGltf(loader, url));
      return cache.get(url);
    };
    model = new THREE.Group();
    model.name = `Simson_S51_Modular_HD_${variant}`;
    loadedVariant = variant;
    let completed = 0, triangles = 0;
    const parts = await Promise.all(plan.map(async descriptor => {
      const gltf = await getAsset(descriptor.component);
      if (!active || currentGeneration !== generation) return null;
      const part = gltf.scene.clone(true);
      part.name = `HD_${descriptor.component}`;
      part.position.set(...descriptor.position);
      part.scale.set(...descriptor.scale);
      part.rotation.set(...descriptor.rotation);
      part.traverse(object => {
        if (!object.isMesh) return;
        object.userData.component = descriptor.component;
        const geometry = object.geometry;
        triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
      });
      completed++;
      const label = document.querySelector('#config3dLoad span');
      if (label) label.textContent = `${Math.round(completed / plan.length * 100)} %`;
      return part;
    }));
    if (!active || currentGeneration !== generation) return;
    parts.filter(Boolean).forEach(part => model.add(part));
    model.userData.triangleCount = Math.round(triangles);
    prepareMaterials();
    scene.add(model);
    applyConfig();
    const tag = document.getElementById('config3dModelTag');
    if (tag) tag.textContent = `GLB 5.0 · MODULAR HD · ${Math.round(triangles / 1000)}K TRI`;
    document.getElementById('config3dLoad')?.remove();
  }

  function prepareMaterials() {
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    model.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const source = Array.isArray(object.material) ? object.material : [object.material];
      const cloned = source.map(material => {
        const copy = material.clone();
        copy.userData.originalColor = copy.color?.clone();
        copy.userData.originalMetalness = copy.metalness;
        copy.userData.originalRoughness = copy.roughness;
        if (copy.map) { copy.map.anisotropy = anisotropy; copy.map.needsUpdate = true; }
        return copy;
      });
      object.material = Array.isArray(object.material) ? cloned : cloned[0];
    });
  }

  function setMaterialColor(material, value) {
    if (!material?.color) return;
    material.color.set(value);
    material.needsUpdate = true;
  }

  function applyConfig() {
    if (!model) return;
    const cfg = config();
    const tankColor = cfg.tankColor || '#2f608f';
    const sideColor = cfg.sideColor || tankColor;
    const engine = cfg.engine || 'silver';
    model.traverse(object => {
      if (!object.isMesh) return;
      const component = object.userData.component || '';
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if (material.userData.originalColor) material.color.copy(material.userData.originalColor);
        if (material.userData.originalMetalness !== undefined) material.metalness = material.userData.originalMetalness;
        if (material.userData.originalRoughness !== undefined) material.roughness = material.userData.originalRoughness;
        const materialName = String(material.name || '').trim().toLocaleLowerCase('de');
        if (component === 'tank') {
          setMaterialColor(material, tankColor); material.metalness = .18; material.roughness = .24;
        } else if (component === 'sidecover') {
          setMaterialColor(material, sideColor); material.metalness = .16; material.roughness = .25;
        } else if (component === 'engine' || component === 'engine_fins' || component === 'carb') {
          if (engine === 'black') { setMaterialColor(material, '#202425'); material.metalness = .22; material.roughness = .56; }
          else if (engine === 'polished') { setMaterialColor(material, '#dce1e1'); material.metalness = .83; material.roughness = .16; }
          else { setMaterialColor(material, '#8c9292'); material.metalness = .48; material.roughness = .42; }
        } else if (component === 'wheel' || component.startsWith('wheel_')) {
          setMaterialColor(material, '#17191a'); material.metalness = .02; material.roughness = .82;
        } else if (component === 'rim' || component === 'star5' || component === 'star10') {
          setMaterialColor(material, cfg.rim === 'black' ? '#17191a' : cfg.rim === 'polished' ? '#eef1f0' : '#aeb3b3');
          material.metalness = cfg.rim === 'black' ? .32 : .86; material.roughness = cfg.rim === 'polished' ? .12 : .24;
        } else if (component === 'spokes' || component === 'hub' || component === 'brakedisc' || component === 'luggage_rack') {
          setMaterialColor(material, '#d5d9d8'); material.metalness = .9; material.roughness = .14;
        } else if (component === 'frame' || component === 'frame_street' || component === 'frame_enduro' || component === 'swingarm') {
          setMaterialColor(material, '#111314'); material.metalness = .25; material.roughness = .42;
        } else if (component === 'fork') {
          setMaterialColor(material, cfg.fork === 'black' ? '#161819' : '#c8cdcc'); material.metalness = cfg.fork === 'black' ? .28 : .82; material.roughness = .22;
        } else if (component === 'shocks' || component === 'shocks_long') {
          setMaterialColor(material, cfg.shock === 'chrome' ? '#d9dddc' : '#343738'); material.metalness = .74; material.roughness = .2;
        } else if (component.startsWith('exhaust_')) {
          setMaterialColor(material, '#d8dcdb'); material.metalness = .92; material.roughness = .12;
        } else if (component.startsWith('seat_')) {
          setMaterialColor(material, '#171819'); material.metalness = .02; material.roughness = .68;
        } else if (component.startsWith('handlebar_')) {
          setMaterialColor(material, component === 'handlebar_cross' ? '#17191a' : '#d2d6d5'); material.metalness = .82; material.roughness = .18;
        } else if (component === 'cockpit' || component === 'headlight_shell') {
          setMaterialColor(material, '#181a1b'); material.metalness = .18; material.roughness = .46;
        } else if (component === 'headlight_led') {
          setMaterialColor(material, '#d9ff39'); material.emissive?.set('#455e10'); material.emissiveIntensity = .34;
        } else if (component === 'headlight_h4' || component === 'headlight_classic') {
          setMaterialColor(material, component === 'headlight_h4' ? '#edf4f4' : '#f0dfaa'); material.metalness = .05; material.roughness = .18;
        } else if (component.startsWith('indicators_')) {
          setMaterialColor(material, '#f27b08'); material.metalness = .05; material.roughness = .23;
        } else if (component === 'taillight') {
          setMaterialColor(material, '#b51518'); material.metalness = .05; material.roughness = .22;
        } else if (component === 'licenseplate') {
          setMaterialColor(material, '#e9e9e3'); material.metalness = .12; material.roughness = .4;
        } else if (component.startsWith('front_fender_')) {
          setMaterialColor(material, cfg.frontFender === 'paint' ? tankColor : component.endsWith('enduro') ? '#17191a' : '#d5d9d8');
          material.metalness = component.endsWith('classic') && cfg.frontFender !== 'paint' ? .88 : .22; material.roughness = .2;
        } else if (component.startsWith('rear_fender')) {
          setMaterialColor(material, '#d2d6d5'); material.metalness = .86; material.roughness = .18;
        } else if (materialName === 'fuel tank') {
          setMaterialColor(material, object.name === 'Plane03' ? sideColor : tankColor);
        } else if (materialName === 'engine' || materialName === 'motor') {
          if (engine === 'black') {
            setMaterialColor(material, '#202425'); material.metalness = 0.22; material.roughness = 0.56;
          } else if (engine === 'polished') {
            setMaterialColor(material, '#dce1e1'); material.metalness = 0.83; material.roughness = 0.16;
          } else {
            setMaterialColor(material, '#8c9292'); material.metalness = 0.48; material.roughness = 0.42;
          }
        }
        material.needsUpdate = true;
      });
    });

    const variant = loadedVariant || variantForConfig(cfg);
    const meta = MODEL_VARIANTS[variant];
    const changed = Object.entries(meta.reference).filter(([field, value]) => (cfg[field] || value) !== value);
    const note = document.getElementById('config3dVariantNote');
    if (note) {
      note.textContent = viewMode === 'modular'
        ? changed.length
          ? `${meta.title} als modulare HD-Basis · ${changed.length} abweichende Baugruppe${changed.length === 1 ? '' : 'n'} aktiv`
          : `${meta.title} in der modularen HD-Werkstatt · Serienkonfiguration aktiv`
        : changed.length
          ? `${meta.title}-Referenzgeometrie aktiv · Für abweichende Baugruppen „3D modular“ öffnen`
          : `${meta.originalNote} · Lack und Motoroptik synchronisiert`;
      note.classList.toggle('warn', changed.length > 0);
    }
  }

  function updateCamera() {
    if (!camera) return;
    const horizontal = Math.cos(pitch) * distance;
    camera.position.set(
      target.x + Math.sin(yaw) * horizontal,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(yaw) * horizontal
    );
    camera.lookAt(target.x, target.y, target.z);
  }

  function cameraPreset(name) {
    if (name === 'side') { yaw = 0; pitch = 0.035; distance = 7.35; }
    else if (name === 'three') { yaw = -0.58; pitch = 0.055; distance = 7.65; }
    else if (name === 'front') { yaw = -Math.PI / 2; pitch = 0.025; distance = 6.65; }
    else if (name === 'rear') { yaw = Math.PI / 2; pitch = 0.025; distance = 6.65; }
    else { yaw = -0.58; pitch = 0.055; distance = 7.65; }
    updateCamera();
  }

  function resize() {
    if (!renderer || !canvas || !camera) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.floor(width * dpr), pixelHeight = Math.floor(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function renderLoop() {
    if (!active || !renderer || !scene || !camera) return;
    resize();
    updateCamera();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(renderLoop);
  }

  function bind() {
    const down = event => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      canvas.setPointerCapture(event.pointerId);
      lastPointer = { x: event.clientX, y: event.clientY };
      if (pointers.size === 2) lastPinch = pinchDistance();
    };
    const move = event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const next = pinchDistance();
        if (lastPinch) distance = Math.max(4.7, Math.min(11.5, distance + (lastPinch - next) * 0.012));
        lastPinch = next;
      } else if (lastPointer) {
        yaw -= (event.clientX - lastPointer.x) * 0.009;
        pitch = Math.max(-0.28, Math.min(0.62, pitch + (event.clientY - lastPointer.y) * 0.006));
      }
      lastPointer = { x: event.clientX, y: event.clientY };
    };
    const up = event => {
      pointers.delete(event.pointerId);
      lastPinch = 0;
      lastPointer = pointers.size ? [...pointers.values()][0] : null;
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      distance = Math.max(4.7, Math.min(11.5, distance + event.deltaY * 0.006));
    }, { passive: false });
  }

  function pinchDistance() {
    const values = [...pointers.values()];
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  function showError(error) {
    console.error('S51 HD GLB konnte nicht geladen werden', error);
    const loading = document.getElementById('config3dLoad');
    if (loading) loading.innerHTML = `<b>HD-Modell konnte nicht geladen werden</b><span>Bitte Verbindung, Dateipaket und Browser-Hardwarebeschleunigung prüfen.</span><button onclick="window.S51ThreeD.mount()">3D erneut laden</button>`;
  }

  function disposeMaterial(material) {
    if (!material) return;
    for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
    material.dispose?.();
  }

  function destroy() {
    active = false;
    generation++;
    cancelAnimationFrame(raf);
    pointers.clear();
    lastPointer = null; lastPinch = 0;
    if (scene) scene.traverse(object => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
      else disposeMaterial(object.material);
    });
    environment?.dispose?.();
    renderer?.dispose?.();
    renderer?.forceContextLoss?.();
    renderer = null; scene = null; camera = null; model = null; environment = null; canvas = null; loadedVariant = null;
  }

  function close() {
    destroy();
  }

  function setMode(mode) {
    const next = mode === 'modular' ? 'modular' : 'hd';
    if (next === viewMode && active) return;
    mount(next);
  }

  function keep3D() {
    if (!active) return;
    setTimeout(() => {
      if (!active) return;
      if (!document.getElementById('config3dCanvas') || variantForConfig() !== loadedVariant) mount();
      else applyConfig();
    }, 0);
  }

  function wrapConfigurator() {
    if (wrapped) return;
    wrapped = true;
    ['configSet', 'configSetColor', 'configSetCategory', 'configReset', 'configMatchPaint', 'configLoad', 'configSelect', 'configApplyPreset'].forEach(name => {
      const original = window[name];
      if (typeof original !== 'function') return;
      window[name] = function(...args) {
        const result = original.apply(this, args);
        keep3D();
        return result;
      };
    });
  }

  function boot() {
    const preview = document.getElementById('configPreview');
    wrapConfigurator();
    const section = document.getElementById('configurator');
    const syncVisibility = () => {
      const visible = section?.classList?.contains('active');
      if (visible && !active) mount(viewMode);
      else if (!visible && active) destroy();
    };
    if (section) new MutationObserver(syncVisibility).observe(section, { attributes: true, attributeFilter: ['class'] });
    if (preview) syncVisibility();
  }

  window.S51ThreeD = {
    mount, close, destroy, setMode, camera: cameraPreset, applyConfig, isActive: () => active,
    mode: () => viewMode,
    planForConfig: value => modularPlan({ ...config(), ...value }).map(item => item.component)
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
