import * as THREE from 'three';
import { RoomEnvironmentType } from '../../types';

export class VirtualRoom3D {
  public group: THREE.Group;
  public environmentType: RoomEnvironmentType = 'bedroom';

  // Room geometry groups for smooth switching
  private bedroomGroup: THREE.Group;
  private cyberGroup: THREE.Group;
  private gardenGroup: THREE.Group;

  // Sakura particles system
  private sakuraParticles: THREE.Points;
  private particlePositions: Float32Array;

  // Lighting references
  public keyLight: THREE.DirectionalLight;
  public fillLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;
  public roomPointLight: THREE.PointLight;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'VirtualRoom3D';

    // 1. Setup Studio Lighting Rig
    this.fillLight = new THREE.HemisphereLight(0xffd5e5, 0x181024, 0.7);
    this.group.add(this.fillLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.group.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffe6f0, 1.2);
    this.keyLight.position.set(2.5, 4.5, 3.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0005;
    this.group.add(this.keyLight);

    this.roomPointLight = new THREE.PointLight(0xff70a6, 0.8, 6);
    this.roomPointLight.position.set(-1.8, 2.2, -1.2);
    this.group.add(this.roomPointLight);

    // 2. Soft Contact Shadow Plane beneath character
    const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050208,
      transparent: true,
      opacity: 0.45,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.005;
    this.group.add(contactShadow);

    // 3. Build Environments
    this.bedroomGroup = this.createBedroom();
    this.cyberGroup = this.createCyberRoom();
    this.gardenGroup = this.createGarden();

    this.group.add(this.bedroomGroup);
    this.group.add(this.cyberGroup);
    this.group.add(this.gardenGroup);

    // 4. 3D Sakura Petals Particle Cloud
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      this.particlePositions[i * 3] = (Math.random() - 0.5) * 6;
      this.particlePositions[i * 3 + 1] = Math.random() * 4;
      this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    // Petal texture generator
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff70a6';
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    const petalTex = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      map: petalTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sakuraParticles = new THREE.Points(particleGeo, particleMat);
    this.group.add(this.sakuraParticles);

    this.setEnvironment('bedroom');
  }

  private createBedroom(): THREE.Group {
    const room = new THREE.Group();

    // Warm wooden floor
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d2720,
      roughness: 0.7,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Soft Pink Circular Rug
    const rugGeo = new THREE.CircleGeometry(1.4, 32);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0xff6699,
      roughness: 0.9,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, 0);
    rug.receiveShadow = true;
    room.add(rug);

    // Back Wall with Panoramic Window
    const wallGeo = new THREE.PlaneGeometry(8, 4.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x24182e,
      roughness: 0.8,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2.25, -3.2);
    room.add(backWall);

    // Window Frame
    const winFrameGeo = new THREE.BoxGeometry(3.2, 2.4, 0.08);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a3250, roughness: 0.5 });
    const windowFrame = new THREE.Mesh(winFrameGeo, frameMat);
    windowFrame.position.set(0, 2.3, -3.15);
    room.add(windowFrame);

    // Window Night Sky Backdrop
    const skyGeo = new THREE.PlaneGeometry(3.0, 2.2);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x080414,
    });
    const skyBackdrop = new THREE.Mesh(skyGeo, skyMat);
    skyBackdrop.position.set(0, 2.3, -3.12);
    room.add(skyBackdrop);

    // Crescent Moon in window
    const moonGeo = new THREE.CircleGeometry(0.3, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfff0c4 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(0.8, 2.7, -3.11);
    room.add(moon);

    // Cozy Anime Bed
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-1.8, 0, -1.8);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.35, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x5c3a2e, roughness: 0.6 })
    );
    frame.position.y = 0.18;
    bedGroup.add(frame);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.28, 2.1),
      new THREE.MeshStandardMaterial({ color: 0xffe6f0, roughness: 0.8 })
    );
    mattress.position.y = 0.45;
    bedGroup.add(mattress);

    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.15, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xff70a6, roughness: 0.9 })
    );
    pillow.position.set(0, 0.62, -0.7);
    bedGroup.add(pillow);

    room.add(bedGroup);

    return room;
  }

  private createCyberRoom(): THREE.Group {
    const room = new THREE.Group();

    // Hexagonal Grid Cyber Floor
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0614,
      roughness: 0.2,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Glowing Cyan Tech Ring on floor
    const ringGeo = new THREE.RingGeometry(1.2, 1.35, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
    });
    const techRing = new THREE.Mesh(ringGeo, ringMat);
    techRing.rotation.x = -Math.PI / 2;
    techRing.position.set(0, 0.015, 0);
    room.add(techRing);

    // Secondary Pink Inner Ring
    const innerRingGeo = new THREE.RingGeometry(0.65, 0.72, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.set(0, 0.016, 0);
    room.add(innerRing);

    // Futuristic Hexagonal Back Panels
    const wallGeo = new THREE.PlaneGeometry(8, 4.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f091c,
      roughness: 0.4,
      metalness: 0.8,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2.25, -3.2);
    room.add(backWall);

    // Glowing Neon Hologram Strip
    const stripGeo = new THREE.BoxGeometry(6, 0.08, 0.05);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 2.5, -3.15);
    room.add(strip);

    const strip2 = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: 0xff0055 }));
    strip2.position.set(0, 1.2, -3.15);
    room.add(strip2);

    return room;
  }

  private createGarden(): THREE.Group {
    const room = new THREE.Group();

    // Night Grass Floor
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x162619,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Wooden Veranda Deck
    const deckGeo = new THREE.BoxGeometry(3.6, 0.12, 2.8);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1d,
      roughness: 0.65,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 0.06, -0.2);
    deck.receiveShadow = true;
    room.add(deck);

    // Stone Lantern with warm flame
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(1.8, 0, -1.5);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x5a6065, roughness: 0.8 })
    );
    base.position.y = 0.4;
    lanternGroup.add(base);

    const flameBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xff9933 })
    );
    flameBox.position.y = 0.9;
    lanternGroup.add(flameBox);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.25, 4),
      new THREE.MeshStandardMaterial({ color: 0x40454a, roughness: 0.8 })
    );
    roof.position.y = 1.15;
    roof.rotation.y = Math.PI / 4;
    lanternGroup.add(roof);

    room.add(lanternGroup);

    return room;
  }

  public setEnvironment(type: RoomEnvironmentType) {
    this.environmentType = type;
    this.bedroomGroup.visible = type === 'bedroom';
    this.cyberGroup.visible = type === 'cyber';
    this.gardenGroup.visible = type === 'garden';

    if (type === 'bedroom') {
      this.keyLight.color.setHex(0xffe6f0);
      this.fillLight.color.setHex(0xffd5e5);
      this.roomPointLight.color.setHex(0xff70a6);
      this.roomPointLight.intensity = 0.8;
    } else if (type === 'cyber') {
      this.keyLight.color.setHex(0x00f0ff);
      this.fillLight.color.setHex(0xff0055);
      this.roomPointLight.color.setHex(0x00f0ff);
      this.roomPointLight.intensity = 1.2;
    } else if (type === 'garden') {
      this.keyLight.color.setHex(0xd4e9ff);
      this.fillLight.color.setHex(0xffb3cc);
      this.roomPointLight.color.setHex(0xffaa44);
      this.roomPointLight.intensity = 1.0;
    }
  }

  public update(delta: number, time: number) {
    // Animate falling sakura petals in 3D
    const pos = this.sakuraParticles.geometry.attributes.position.array as Float32Array;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      // Downward drift
      pos[i * 3 + 1] -= delta * (0.35 + (i % 3) * 0.1);
      // Gentle horizontal sway
      pos[i * 3] += Math.sin(time + i) * 0.005;

      // Respawn at top
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 3.8 + Math.random() * 0.5;
        pos[i * 3] = (Math.random() - 0.5) * 6;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
    }
    this.sakuraParticles.geometry.attributes.position.needsUpdate = true;
  }
}
