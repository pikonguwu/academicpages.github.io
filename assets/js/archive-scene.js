import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export async function createArchiveScene(container, files) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#e8e5e0', 20, 55);
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, .1, 100);
  camera.position.set(7, 6, 18);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .48;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fffaf2', '#a99781', .75));
  const key = new THREE.DirectionalLight('#fff7eb', 1.5);
  key.position.set(-6, 14, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#ffffff', .6);
  fill.position.set(7, 5, -10);
  scene.add(fill);

  const racks = new THREE.Group();
  scene.add(racks);
  const rackMaterial = new THREE.MeshStandardMaterial({ color: '#e3dacc', roughness: .48 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#f6f0e6', roughness: .4 });
  const count = 11 * 24;
  const racksBody = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 3.7, .26), rackMaterial, count);
  const racksEdge = new THREE.InstancedMesh(new THREE.BoxGeometry(5.03, .055, .3), edgeMaterial, count);
  const transform = new THREE.Object3D();
  let index = 0;
  for (let column = -5; column <= 5; column++) {
    for (let row = -18; row < 6; row++) {
      transform.position.set(column * 5.35, -4.5 + Math.sin(row * .3 + column) * .12, row * .68);
      transform.updateMatrix();
      racksBody.setMatrixAt(index, transform.matrix);
      transform.position.y += 1.85;
      transform.updateMatrix();
      racksEdge.setMatrixAt(index, transform.matrix);
      index++;
    }
  }
  racks.add(racksBody, racksEdge);

  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync(container.dataset.model);
  } catch (error) {
    environment.dispose();
    scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    renderer.dispose();
    throw error;
  }
  const cassette = new THREE.Group();
  const model = new THREE.Group();
  cassette.add(model);
  model.position.y = -1.85;
  scene.add(cassette);
  gltf.scene.updateMatrixWorld(true);
  const materials = [];
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    const name = object.material.name.replace(/\.\d+$/, '');
    // Replace the source model's lettering with the researcher's own identity.
    if (['Carbon_Ink', 'Moulded_Lettering'].includes(name)) return;
    const material = object.material.clone();
    material.envMapIntensity = .7;
    if (name === 'Frosted_Polymer') {
      material.color.set('#fffdfa');
      material.transmission = .92;
      material.thickness = .12;
      material.roughness = .14;
      material.ior = 1.46;
    }
    if (name === 'Ivory_Edges') {
      material.color.set('#eee5da');
      material.transmission = .3;
      material.roughness = .3;
    }
    if (name === 'Optical_Diffuser') {
      material.color.set('#e0d6c9');
      material.transmission = 0;
      material.roughness = .65;
    }
    if (name === 'Optical_Edges') {
      material.transmission = 0;
      material.color.set('#d4c7b8');
      material.roughness = .28;
    }
    material.userData.lightColor = material.color.clone();
    material.userData.surface = name;
    materials.push(material);
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
    model.add(new THREE.Mesh(geometry, material));
  });
  gltf.scene.traverse(object => {
    if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); }
  });

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 768;
  labelCanvas.height = 330;
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.99, .46), new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false, toneMapped: false }));
  label.position.set(-1.36, 3.04, .255);
  model.add(label);
  label.name = 'personal-label';
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = .075;
  controls.rotateSpeed = .55;
  controls.zoomSpeed = .6;
  controls.minZoom = .6;
  controls.maxZoom = 2.2;
  controls.minPolarAngle = .3;
  controls.maxPolarAngle = Math.PI * .72;
  const glass = materials.find(material => material.userData.surface === 'Frosted_Polymer');
  const cameraTarget = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const outgoing = [];
  const started = performance.now();
  let selectionTime = started;
  let cameraTween = true;
  let targetZoom = 1;
  let lost = false;
  let mobile = false;
  let targetScale = 1;
  let selected = 0;
  let reading = false;
  let dark = false;
  let frame = 0;
  let until = 0;
  let previous = 0;

  function updateLabel() {
    const context = labelCanvas.getContext('2d');
    context.clearRect(0, 0, 768, 330);
    context.fillStyle = '#30342b';
    context.font = '500 45px Arial';
    context.fillText('ZHIMU ZHOU', 18, 55);
    context.font = '23px Arial';
    context.fillText('RESEARCH ARCHIVE', 18, 100);
    context.fillRect(18, 124, 730, 2);
    context.font = '58px Arial';
    context.fillText(files[selected].code.replace('–', '-'), 18, 214);
    context.font = '23px Arial';
    context.fillText(files[selected].title.toUpperCase(), 18, 285);
    labelTexture.needsUpdate = true;
  }

  function position() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    mobile = width <= 760;
    camera.left = -6 * width / height;
    camera.right = -camera.left;
    const compact = width <= 1100;
    const overview = container.closest('.archive-app').querySelector('.archive-overview');
    const mobileAnchor = reading ? 245 : overview.offsetTop + 130;
    container.closest('.archive-app').style.setProperty('--archive-model-y', `${mobileAnchor}px`);
    camera.setViewOffset(width, height, mobile ? -width * .05 : width * (reading ? .09 : compact ? .04 : .02), mobile ? height / 2 - mobileAnchor : height * .02, width, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    targetScale = Math.min(1.4, width * (mobile ? .65 : reading ? .22 : compact ? .29 : .32) * 12 / (5 * height));
    controls.enabled = !(mobile && reading);
    schedule();
  }

  function reset() {
    cameraTween = true;
    cameraTarget.set(0, reading ? .7 : 0, 0);
    cameraPosition.setFromSpherical(new THREE.Spherical(20, reading ? 1.4 : 1.27, reading ? .14 : .37)).add(cameraTarget);
    targetZoom = reading ? 1.04 : 1;
    schedule();
  }

  function disposeOutgoing(item) {
    scene.remove(item.object);
    const oldLabel = item.object.getObjectByName('personal-label');
    oldLabel.material.map.dispose();
    oldLabel.material.dispose();
  }

  function releaseFile(direction) {
    if (reduced.matches) return;
    const object = cassette.clone(true);
    const oldLabel = object.getObjectByName('personal-label');
    const canvas = document.createElement('canvas');
    canvas.width = labelCanvas.width;
    canvas.height = labelCanvas.height;
    canvas.getContext('2d').drawImage(labelCanvas, 0, 0);
    oldLabel.material = label.material.clone();
    oldLabel.material.map = new THREE.CanvasTexture(canvas);
    oldLabel.material.map.colorSpace = THREE.SRGBColorSpace;
    scene.add(object);
    outgoing.push({ object, direction, started: performance.now() });
    if (outgoing.length > 3) disposeOutgoing(outgoing.shift());
    cassette.position.set(direction * 5.35, -4.5, 0);
  }

  function updateRacks(time) {
    const elapsed = reduced.matches ? 10 : (time - selectionTime) / 1000;
    let index = 0;
    for (let column = -5; column <= 5; column++) {
      for (let row = -18; row < 6; row++) {
        const distance = Math.abs(column - selected) + Math.abs(row) * .28;
        const wave = reduced.matches ? 0 : Math.sin(distance * 1.6 - elapsed * 5) * Math.exp(-elapsed * .8) * .4;
        const breath = reduced.matches ? 0 : Math.sin(time * .00065 + row * .3 + column * .5) * .065;
        transform.position.set(column * 5.35, -4.5 + wave + breath, row * .68);
        transform.updateMatrix();
        racksBody.setMatrixAt(index, transform.matrix);
        transform.position.y += 1.85;
        transform.updateMatrix();
        racksEdge.setMatrixAt(index, transform.matrix);
        index++;
      }
    }
    racksBody.instanceMatrix.needsUpdate = true;
    racksEdge.instanceMatrix.needsUpdate = true;
  }

  function draw(time) {
    frame = 0;
    if (document.hidden || lost) return;
    if (!reduced.matches && time - previous < 1000 / 30) { frame = requestAnimationFrame(draw); return; }
    const delta = Math.min((time - previous) / 1000 || .016, .08);
    previous = time;
    const ease = reduced.matches ? 1 : 1 - Math.exp(-delta * 5);
    const breath = reduced.matches ? 0 : Math.sin(time * .0008) * .035;
    cassette.position.x = THREE.MathUtils.lerp(cassette.position.x, 0, ease);
    cassette.position.y = THREE.MathUtils.lerp(cassette.position.y, (reading ? 1 : 0) + breath, ease);
    const scale = THREE.MathUtils.lerp(cassette.scale.x, targetScale, ease);
    cassette.scale.setScalar(scale);
    glass.roughness = THREE.MathUtils.lerp(glass.roughness, reading ? .035 : .14, ease);
    racks.position.x = THREE.MathUtils.lerp(racks.position.x, -selected * 5.35, ease);
    racks.position.y = THREE.MathUtils.lerp(racks.position.y, 0, ease);
    if (cameraTween) {
      controls.target.lerp(cameraTarget, ease);
      camera.position.lerp(cameraPosition, ease);
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, ease);
      camera.updateProjectionMatrix();
      if (camera.position.distanceTo(cameraPosition) < .002 && Math.abs(camera.zoom - targetZoom) < .001) cameraTween = false;
    }
    controls.update();
    for (let i = outgoing.length - 1; i >= 0; i--) {
      const item = outgoing[i];
      item.object.position.x = THREE.MathUtils.lerp(item.object.position.x, -item.direction * 5.35, ease);
      item.object.position.y = THREE.MathUtils.lerp(item.object.position.y, -5, ease);
      if (time - item.started > 1800) { disposeOutgoing(item); outgoing.splice(i, 1); }
    }
    updateRacks(time);
    renderer.render(scene, camera);
    if (!reduced.matches || time < until) frame = requestAnimationFrame(draw);
  }

  function schedule() {
    until = performance.now() + (reduced.matches ? 0 : 1400);
    if (!frame && !document.hidden && !lost) frame = requestAnimationFrame(draw);
  }
  controls.addEventListener('start', () => {
    cameraTween = false;
    container.classList.add('is-dragging');
    schedule();
  });
  controls.addEventListener('end', () => { container.classList.remove('is-dragging'); schedule(); });
  controls.addEventListener('change', schedule);
  const observer = new ResizeObserver(position);
  observer.observe(container);
  reduced.addEventListener('change', () => { controls.enableDamping = !reduced.matches; schedule(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    container.classList.remove('is-ready');
    container.closest('.archive-app').querySelector('.archive-inspect').hidden = true;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    lost = false;
    container.classList.add('is-ready');
    container.closest('.archive-app').querySelector('.archive-inspect').hidden = false;
    schedule();
  });
  updateLabel();
  position();
  reset();
  cassette.position.y = reduced.matches ? 0 : -5;
  racks.position.y = reduced.matches ? 0 : -3;
  cassette.scale.setScalar(targetScale);
  container.appendChild(renderer.domElement);
  renderer.render(scene, camera);
  container.classList.add('is-ready');

  return {
    select(index, open) {
      if (selected !== index) {
        releaseFile(index > selected ? 1 : -1);
        selectionTime = performance.now();
      }
      const changed = selected !== index || reading !== open;
      selected = index;
      reading = open;
      updateLabel();
      position();
      if (changed) reset();
    },
    reset,
    enter() {
      if (!reduced.matches) {
        cassette.position.y = -5;
        racks.position.y = -4;
        camera.position.setFromSpherical(new THREE.Spherical(20, .94, .9));
        selectionTime = performance.now();
      }
      reset();
    },
    zoom(factor) {
      cameraTween = false;
      camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom);
      camera.updateProjectionMatrix();
      schedule();
    },
    setTheme(value) {
      dark = value;
      scene.fog.color.set(dark ? '#182024' : '#e8e5e0');
      rackMaterial.color.set(dark ? '#3e4a4d' : '#e3dacc');
      edgeMaterial.color.set(dark ? '#6c7779' : '#f6f0e6');
      materials.forEach(material => {
        material.color.copy(material.userData.lightColor);
        if (dark && !material.userData.surface.includes('Amber')) material.color.multiplyScalar(.38);
      });
      updateLabel();
      schedule();
    }
  };
}
