import * as THREE from 'three';
import { EmotionType } from '../../types';

export class ZeroTwoCharacter3D {
  public group: THREE.Group;
  public emotion: EmotionType = 'neutral';
  public isSpeaking: boolean = false;
  public currentGesture: string = 'idle';

  // Key animated body parts
  private headGroup: THREE.Group;
  private hairGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;
  private torsoGroup: THREE.Group;

  // Face elements for expression & lip-sync
  private leftEyelid: THREE.Mesh;
  private rightEyelid: THREE.Mesh;
  private leftIris: THREE.Mesh;
  private rightIris: THREE.Mesh;
  private mouthMesh: THREE.Mesh;
  private mouthOpenMesh: THREE.Mesh;
  private blushLeft: THREE.Mesh;
  private blushRight: THREE.Mesh;
  private horns: THREE.Mesh[];
  private hornPointLight: THREE.PointLight;

  // Eyebrows
  private leftEyebrow: THREE.Mesh;
  private rightEyebrow: THREE.Mesh;

  // Animation clocks & states
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private mouthStep: number = 0;
  private mouthTimer: number = 0;
  private gestureTimer: number = 0;

  // Raycastable interactive meshes
  public interactiveMeshes: THREE.Object3D[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ZeroTwoCharacter';

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffebd9,
      roughness: 0.65,
      metalness: 0.05,
    });

    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xff4d79,
      transparent: true,
      opacity: 0.35,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xff7aa8,
      roughness: 0.45,
      metalness: 0.1,
    });

    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xff0044,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.3,
    });

    const uniformDarkMat = new THREE.MeshStandardMaterial({
      color: 0x181024,
      roughness: 0.5,
      metalness: 0.2,
    });

    const uniformRedMat = new THREE.MeshStandardMaterial({
      color: 0xd91b42,
      roughness: 0.4,
      metalness: 0.3,
    });

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x052e16 });
    const eyelinerMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x661426 });

    // 1. Lower Body & Legs
    const hipsGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.28, 16);
    const hips = new THREE.Mesh(hipsGeo, uniformDarkMat);
    hips.position.y = 1.05;
    hips.castShadow = true;
    this.group.add(hips);

    // Left leg
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.95, 14);
    const leftLeg = new THREE.Mesh(legGeo, uniformDarkMat);
    leftLeg.position.set(-0.13, 0.52, 0);
    leftLeg.castShadow = true;
    this.group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeo, uniformDarkMat);
    rightLeg.position.set(0.13, 0.52, 0);
    rightLeg.castShadow = true;
    this.group.add(rightLeg);

    // Boots (White/Red pilot boots)
    const bootGeo = new THREE.BoxGeometry(0.14, 0.14, 0.26);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.13, 0.07, 0.03);
    leftBoot.castShadow = true;
    this.group.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.13, 0.07, 0.03);
    rightBoot.castShadow = true;
    this.group.add(rightBoot);

    // 2. Torso (Pilot uniform jacket)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 1.18, 0);

    const torsoGeo = new THREE.CylinderGeometry(0.23, 0.2, 0.48, 16);
    const torso = new THREE.Mesh(torsoGeo, uniformDarkMat);
    torso.position.y = 0.24;
    torso.castShadow = true;
    this.torsoGroup.add(torso);
    this.interactiveMeshes.push(torso);

    // Red pilot collar & chest stripes
    const chestStripeGeo = new THREE.BoxGeometry(0.05, 0.42, 0.24);
    const chestStripe = new THREE.Mesh(chestStripeGeo, uniformRedMat);
    chestStripe.position.set(0, 0.25, 0.02);
    this.torsoGroup.add(chestStripe);

    // Unit 02 Emblem badge
    const badgeGeo = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xff3b69 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(-0.11, 0.35, 0.18);
    this.torsoGroup.add(badge);

    // High collar
    const collarGeo = new THREE.CylinderGeometry(0.15, 0.16, 0.12, 16);
    const collar = new THREE.Mesh(collarGeo, uniformRedMat);
    collar.position.y = 0.52;
    this.torsoGroup.add(collar);

    this.group.add(this.torsoGroup);

    // 3. Arms & Hands
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.28, 0.44, 0);
    const upperArmGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.34, 12);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, uniformDarkMat);
    leftUpperArm.position.y = -0.17;
    leftUpperArm.castShadow = true;
    this.leftArmGroup.add(leftUpperArm);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.34, 0);
    const forearmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.32, 12);
    const leftForearm = new THREE.Mesh(forearmGeo, uniformDarkMat);
    leftForearm.position.y = -0.16;
    leftForearm.castShadow = true;
    this.leftForearmGroup.add(leftForearm);

    const handGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.34;
    this.leftForearmGroup.add(leftHand);
    this.leftArmGroup.add(this.leftForearmGroup);
    this.torsoGroup.add(this.leftArmGroup);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.28, 0.44, 0);
    const rightUpperArm = new THREE.Mesh(upperArmGeo, uniformDarkMat);
    rightUpperArm.position.y = -0.17;
    rightUpperArm.castShadow = true;
    this.rightArmGroup.add(rightUpperArm);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.34, 0);
    const rightForearm = new THREE.Mesh(forearmGeo, uniformDarkMat);
    rightForearm.position.y = -0.16;
    rightForearm.castShadow = true;
    this.rightForearmGroup.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.34;
    this.rightForearmGroup.add(rightHand);
    this.rightArmGroup.add(this.rightForearmGroup);
    this.torsoGroup.add(this.rightArmGroup);

    // 4. Head Group (Neck + Head + Face + Horns + Hair)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.62, 0);

    // Slender neck
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.16, 14);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.05;
    this.headGroup.add(neck);

    // Head base (Anime jaw / chin contour)
    const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
    headGeo.scale(0.95, 1.05, 0.95);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.26;
    head.castShadow = true;
    this.headGroup.add(head);
    this.interactiveMeshes.push(head);

    // Cheeks blushing discs
    const blushGeo = new THREE.CircleGeometry(0.045, 16);
    this.blushLeft = new THREE.Mesh(blushGeo, blushMat);
    this.blushLeft.position.set(-0.11, 0.22, 0.22);
    this.blushLeft.rotation.y = -0.3;
    this.headGroup.add(this.blushLeft);

    this.blushRight = new THREE.Mesh(blushGeo, blushMat);
    this.blushRight.position.set(0.11, 0.22, 0.22);
    this.blushRight.rotation.y = 0.3;
    this.headGroup.add(this.blushRight);

    // 5. Eyes & Eyelids
    const eyeWhiteGeo = new THREE.SphereGeometry(0.048, 16, 16);
    eyeWhiteGeo.scale(1, 1.1, 0.4);

    const irisGeo = new THREE.SphereGeometry(0.035, 14, 14);
    irisGeo.scale(1, 1.2, 0.4);

    const pupilGeo = new THREE.SphereGeometry(0.018, 10, 10);
    pupilGeo.scale(1, 1.2, 0.4);

    // Left eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-0.088, 0.27, 0.21);
    leftEyeWhite.rotation.y = -0.15;
    this.headGroup.add(leftEyeWhite);

    this.leftIris = new THREE.Mesh(irisGeo, irisMat);
    this.leftIris.position.set(-0.088, 0.27, 0.225);
    this.leftIris.rotation.y = -0.15;
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.z = 0.01;
    this.leftIris.add(leftPupil);
    this.headGroup.add(this.leftIris);

    // Left Red Eyeliner Wing
    const eyelinerGeo = new THREE.BoxGeometry(0.045, 0.01, 0.01);
    const leftLiner = new THREE.Mesh(eyelinerGeo, eyelinerMat);
    leftLiner.position.set(-0.11, 0.3, 0.225);
    leftLiner.rotation.z = -0.2;
    this.headGroup.add(leftLiner);

    // Left Eyelid (for blinking)
    const eyelidGeo = new THREE.BoxGeometry(0.09, 0.06, 0.02);
    this.leftEyelid = new THREE.Mesh(eyelidGeo, skinMat);
    this.leftEyelid.position.set(-0.088, 0.32, 0.23);
    this.leftEyelid.scale.set(1, 0.01, 1); // open by default
    this.headGroup.add(this.leftEyelid);

    // Right eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.088, 0.27, 0.21);
    rightEyeWhite.rotation.y = 0.15;
    this.headGroup.add(rightEyeWhite);

    this.rightIris = new THREE.Mesh(irisGeo, irisMat);
    this.rightIris.position.set(0.088, 0.27, 0.225);
    this.rightIris.rotation.y = 0.15;
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.z = 0.01;
    this.rightIris.add(rightPupil);
    this.headGroup.add(this.rightIris);

    const rightLiner = new THREE.Mesh(eyelinerGeo, eyelinerMat);
    rightLiner.position.set(0.11, 0.3, 0.225);
    rightLiner.rotation.z = 0.2;
    this.headGroup.add(rightLiner);

    this.rightEyelid = new THREE.Mesh(eyelidGeo, skinMat);
    this.rightEyelid.position.set(0.088, 0.32, 0.23);
    this.rightEyelid.scale.set(1, 0.01, 1);
    this.headGroup.add(this.rightEyelid);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.065, 0.008, 0.01);
    const browMat = new THREE.MeshBasicMaterial({ color: 0xd84877 });
    this.leftEyebrow = new THREE.Mesh(browGeo, browMat);
    this.leftEyebrow.position.set(-0.088, 0.33, 0.23);
    this.headGroup.add(this.leftEyebrow);

    this.rightEyebrow = new THREE.Mesh(browGeo, browMat);
    this.rightEyebrow.position.set(0.088, 0.33, 0.23);
    this.headGroup.add(this.rightEyebrow);

    // Mouth Shapes (Closed line & Talking Open Shape)
    const mouthClosedGeo = new THREE.BoxGeometry(0.05, 0.008, 0.01);
    this.mouthMesh = new THREE.Mesh(mouthClosedGeo, mouthMat);
    this.mouthMesh.position.set(0, 0.18, 0.235);
    this.headGroup.add(this.mouthMesh);

    const mouthOpenGeo = new THREE.SphereGeometry(0.025, 12, 12);
    mouthOpenGeo.scale(1, 0.7, 0.3);
    this.mouthOpenMesh = new THREE.Mesh(mouthOpenGeo, mouthMat);
    this.mouthOpenMesh.position.set(0, 0.18, 0.235);
    this.mouthOpenMesh.visible = false;
    this.headGroup.add(this.mouthOpenMesh);

    // 6. White Headband & Red Demon Horns
    const headbandGeo = new THREE.TorusGeometry(0.24, 0.025, 8, 24, Math.PI);
    const headbandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const headband = new THREE.Mesh(headbandGeo, headbandMat);
    headband.position.set(0, 0.38, 0.05);
    headband.rotation.x = Math.PI / 2.2;
    this.headGroup.add(headband);

    // Horns (Curved Cones)
    this.horns = [];
    const hornGeo = new THREE.ConeGeometry(0.045, 0.2, 16);
    hornGeo.translate(0, 0.1, 0);

    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.11, 0.44, 0.08);
    leftHorn.rotation.set(-0.25, 0, -0.35);
    this.headGroup.add(leftHorn);
    this.horns.push(leftHorn);
    this.interactiveMeshes.push(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.11, 0.44, 0.08);
    rightHorn.rotation.set(-0.25, 0, 0.35);
    this.headGroup.add(rightHorn);
    this.horns.push(rightHorn);
    this.interactiveMeshes.push(rightHorn);

    // Subtle red light emitted from horns
    this.hornPointLight = new THREE.PointLight(0xff0055, 0.8, 1.2);
    this.hornPointLight.position.set(0, 0.48, 0.15);
    this.headGroup.add(this.hornPointLight);

    // 7. Hair (Bangs, Long flowing side locks, Back volume)
    this.hairGroup = new THREE.Group();

    // Bangs
    const bangGeo = new THREE.ConeGeometry(0.08, 0.22, 10);
    const bang1 = new THREE.Mesh(bangGeo, hairMat);
    bang1.position.set(-0.06, 0.34, 0.22);
    bang1.rotation.set(0.1, 0, 0.15);
    this.hairGroup.add(bang1);

    const bang2 = new THREE.Mesh(bangGeo, hairMat);
    bang2.position.set(0.06, 0.34, 0.22);
    bang2.rotation.set(0.1, 0, -0.15);
    this.hairGroup.add(bang2);

    const bangCenter = new THREE.Mesh(bangGeo, hairMat);
    bangCenter.position.set(0, 0.35, 0.23);
    bangCenter.scale.set(0.8, 0.8, 0.8);
    this.hairGroup.add(bangCenter);

    // Long Side locks
    const sideLockGeo = new THREE.CylinderGeometry(0.04, 0.015, 0.7, 10);
    const leftSideLock = new THREE.Mesh(sideLockGeo, hairMat);
    leftSideLock.position.set(-0.22, 0.05, 0.12);
    leftSideLock.rotation.z = -0.08;
    this.hairGroup.add(leftSideLock);

    const rightSideLock = new THREE.Mesh(sideLockGeo, hairMat);
    rightSideLock.position.set(0.22, 0.05, 0.12);
    rightSideLock.rotation.z = 0.08;
    this.hairGroup.add(rightSideLock);

    // Back hair volume
    const backHairGeo = new THREE.SphereGeometry(0.28, 16, 16);
    backHairGeo.scale(1, 1.4, 0.9);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.position.set(0, 0.16, -0.1);
    this.hairGroup.add(backHair);

    // Long lower back strands
    const longBackGeo = new THREE.CylinderGeometry(0.18, 0.08, 1.1, 12);
    const longBackHair = new THREE.Mesh(longBackGeo, hairMat);
    longBackHair.position.set(0, -0.28, -0.16);
    longBackHair.rotation.x = -0.1;
    this.hairGroup.add(longBackHair);

    this.headGroup.add(this.hairGroup);
    this.torsoGroup.add(this.headGroup);
  }

  public setEmotion(newEmotion: EmotionType) {
    this.emotion = newEmotion;

    // Reset default scales & positions
    const blushLeftMat = this.blushLeft.material as THREE.MeshBasicMaterial;
    const blushRightMat = this.blushRight.material as THREE.MeshBasicMaterial;
    if (blushLeftMat) blushLeftMat.opacity = newEmotion === 'shy' ? 0.75 : 0.35;
    if (blushRightMat) blushRightMat.opacity = newEmotion === 'shy' ? 0.75 : 0.35;

    // Eyebrows & pupils adjust to emotion
    switch (newEmotion) {
      case 'happy':
        this.leftEyebrow.position.y = 0.34;
        this.rightEyebrow.position.y = 0.34;
        this.leftIris.position.y = 0.27;
        this.rightIris.position.y = 0.27;
        this.triggerGesture('happy');
        break;
      case 'thinking':
        this.leftEyebrow.position.y = 0.35;
        this.rightEyebrow.position.y = 0.32;
        this.leftIris.position.set(-0.088, 0.285, 0.225);
        this.rightIris.position.set(0.088, 0.285, 0.225);
        this.triggerGesture('thinking');
        break;
      case 'teasing':
        this.leftEyebrow.position.y = 0.33;
        this.rightEyebrow.position.y = 0.345;
        this.triggerGesture('tease');
        break;
      case 'surprised':
        this.leftEyebrow.position.y = 0.355;
        this.rightEyebrow.position.y = 0.355;
        this.triggerGesture('surprised');
        break;
      case 'shy':
        this.leftIris.position.y = 0.255;
        this.rightIris.position.y = 0.255;
        this.triggerGesture('shy');
        break;
      case 'sad':
        this.leftEyebrow.rotation.z = 0.15;
        this.rightEyebrow.rotation.z = -0.15;
        break;
      default:
        this.leftEyebrow.rotation.z = 0;
        this.rightEyebrow.rotation.z = 0;
        this.leftEyebrow.position.y = 0.33;
        this.rightEyebrow.position.y = 0.33;
        this.leftIris.position.set(-0.088, 0.27, 0.225);
        this.rightIris.position.set(0.088, 0.27, 0.225);
        this.triggerGesture('idle');
        break;
    }
  }

  public setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    if (!speaking) {
      this.mouthMesh.visible = true;
      this.mouthOpenMesh.visible = false;
      this.mouthMesh.scale.set(1, 1, 1);
    }
  }

  public triggerGesture(gesture: string) {
    this.currentGesture = gesture;
    this.gestureTimer = 0;
  }

  public update(delta: number, time: number) {
    this.gestureTimer += delta;

    // 1. Idle Breathing (sinusoidal gentle chest rise & fall)
    const breath = Math.sin(time * 2.2) * 0.015;
    this.torsoGroup.position.y = 1.18 + breath;
    this.torsoGroup.rotation.x = Math.sin(time * 1.5) * 0.015;

    // Gentle hair sway
    this.hairGroup.rotation.z = Math.sin(time * 1.8) * 0.02;
    this.hairGroup.rotation.y = Math.cos(time * 1.2) * 0.025;

    // Horn glow pulse
    this.hornPointLight.intensity = 0.6 + Math.sin(time * 3.5) * 0.3;

    // 2. Natural Blinking
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.8 + Math.sin(time) * 1.5) {
      this.isBlinking = true;
      this.blinkTimer = 0;
    }

    if (this.isBlinking) {
      // Rapid close-open eyelid scale
      this.leftEyelid.scale.y = 1.0;
      if (this.emotion !== 'teasing') {
        this.rightEyelid.scale.y = 1.0;
      }
      setTimeout(() => {
        this.isBlinking = false;
        this.leftEyelid.scale.y = 0.01;
        if (this.emotion !== 'teasing') {
          this.rightEyelid.scale.y = 0.01;
        }
      }, 140);
    }

    // Teasing wink: right eye winks permanently while in teasing mode
    if (this.emotion === 'teasing') {
      this.rightEyelid.scale.y = 0.95;
    } else if (!this.isBlinking) {
      this.rightEyelid.scale.y = 0.01;
    }

    // 3. Talking Mouth Animation
    if (this.isSpeaking) {
      this.mouthTimer += delta;
      if (this.mouthTimer > 0.12) {
        this.mouthTimer = 0;
        this.mouthStep = (this.mouthStep + 1) % 4;

        if (this.mouthStep === 0) {
          // Closed rest
          this.mouthMesh.visible = true;
          this.mouthOpenMesh.visible = false;
        } else if (this.mouthStep === 1) {
          // Half open
          this.mouthMesh.visible = false;
          this.mouthOpenMesh.visible = true;
          this.mouthOpenMesh.scale.set(0.8, 0.6, 0.5);
        } else if (this.mouthStep === 2) {
          // Wide open (Aa / Eh)
          this.mouthMesh.visible = false;
          this.mouthOpenMesh.visible = true;
          this.mouthOpenMesh.scale.set(1.1, 1.2, 0.7);
        } else {
          // Round O
          this.mouthMesh.visible = false;
          this.mouthOpenMesh.visible = true;
          this.mouthOpenMesh.scale.set(0.6, 1.0, 0.6);
        }
      }
    } else {
      this.mouthMesh.visible = true;
      this.mouthOpenMesh.visible = false;
    }

    // 4. Kinematic Gestures Animation
    const smoothFactor = Math.min(delta * 4, 1);

    if (this.currentGesture === 'wave') {
      // Waving right arm
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.z,
        -2.2,
        6,
        delta
      );
      this.rightForearmGroup.rotation.z = Math.sin(time * 8) * 0.4 - 0.2;
      this.headGroup.rotation.y = THREE.MathUtils.damp(this.headGroup.rotation.y, 0.15, 4, delta);
    } else if (this.currentGesture === 'thinking') {
      // Hand near chin, head tilted
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.x,
        -1.2,
        4,
        delta
      );
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.z,
        -0.5,
        4,
        delta
      );
      this.rightForearmGroup.rotation.x = THREE.MathUtils.damp(
        this.rightForearmGroup.rotation.x,
        -1.4,
        4,
        delta
      );
      this.headGroup.rotation.z = THREE.MathUtils.damp(this.headGroup.rotation.z, -0.12, 3, delta);
    } else if (this.currentGesture === 'happy') {
      // Cheerful arms slightly out, joyful bounce
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(
        this.leftArmGroup.rotation.z,
        0.5,
        4,
        delta
      );
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.z,
        -0.5,
        4,
        delta
      );
      this.headGroup.rotation.x = Math.sin(time * 6) * 0.05 - 0.05;
    } else if (this.currentGesture === 'tease') {
      // Sassy hip tilt & cocked head
      this.torsoGroup.rotation.z = THREE.MathUtils.damp(this.torsoGroup.rotation.z, 0.06, 3, delta);
      this.headGroup.rotation.z = THREE.MathUtils.damp(this.headGroup.rotation.z, 0.14, 4, delta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.z,
        -0.4,
        3,
        delta
      );
    } else if (this.currentGesture === 'shy') {
      // Hands clasped in front, shy downward head tilt
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(
        this.leftArmGroup.rotation.x,
        -0.5,
        4,
        delta
      );
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.x,
        -0.5,
        4,
        delta
      );
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(
        this.leftArmGroup.rotation.z,
        0.3,
        4,
        delta
      );
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.z,
        -0.3,
        4,
        delta
      );
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, 0.12, 3, delta);
    } else {
      // Idle relaxed anime posture
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, 0, 4, delta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(
        this.leftArmGroup.rotation.z,
        0.08,
        4,
        delta
      );
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.x,
        0,
        4,
        delta
      );
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(
        this.rightArmGroup.rotation.z,
        -0.08,
        4,
        delta
      );
      this.rightForearmGroup.rotation.set(0, 0, 0);
      this.leftForearmGroup.rotation.set(0, 0, 0);
      this.torsoGroup.rotation.z = THREE.MathUtils.damp(this.torsoGroup.rotation.z, 0, 3, delta);
      this.headGroup.rotation.z = THREE.MathUtils.damp(this.headGroup.rotation.z, 0, 3, delta);
    }
  }
}
