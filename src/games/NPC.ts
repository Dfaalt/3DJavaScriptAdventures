import * as THREE from "three";

export interface NPC {
  name: string;
  position: THREE.Vector3;
  mesh: THREE.Group;
  dialog1: string;
  dialog2: string;
  dialog3: string;
  completedDialog: string;
  objective: string;
  hint1: string;
  hint2: string;
  hint3: string;
  validator: (code: string, output: string) => boolean;
}

export interface GameState {
  currentLevel: number;
  questComplete: boolean;
  showDialog: boolean;
  showEditor: boolean;
  currentNPC: NPC | null;
  portalActive: boolean;
  showPortalHint: boolean;
  canEnterPortal: boolean;
  dialogStage: number;
  failureCount: number;
  objectiveRevealed: boolean;
}

// NPC visual meshes (persis dari kode kamu)
export const createNpcMeshForLevel = (level: number): THREE.Group => {
  const npcGroup = new THREE.Group();

  switch (level) {
    case 1: {
      // Teacher - Traditional blue cylinder
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
        new THREE.MeshPhongMaterial({
          color: 0x5ba3ff,
          emissive: 0x3b82f6,
          emissiveIntensity: 0.6,
        })
      );
      body.position.y = 1;
      body.castShadow = true;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0x8ec5ff,
          emissive: 0x60a5fa,
          emissiveIntensity: 0.5,
        })
      );
      head.position.y = 2.5;
      head.castShadow = true;

      npcGroup.add(body);
      npcGroup.add(head);
      break;
    }

    case 2: {
      // Sage - Tall green robed figure
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 2.5, 8),
        new THREE.MeshPhongMaterial({
          color: 0x52c41a,
          emissive: 0x389e0d,
          emissiveIntensity: 0.5,
        })
      );
      body.position.y = 1.25;
      body.castShadow = true;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0x95de64,
          emissive: 0x73d13d,
          emissiveIntensity: 0.4,
        })
      );
      head.position.y = 2.8;
      head.castShadow = true;

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0xfff566,
          emissive: 0xfadb14,
          emissiveIntensity: 0.8,
        })
      );
      orb.position.set(0.8, 2, 0);
      orb.castShadow = true;

      npcGroup.add(body);
      npcGroup.add(head);
      npcGroup.add(orb);
      break;
    }

    case 3: {
      // Ranger - Brown/Forest theme
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.5, 1.8, 8),
        new THREE.MeshPhongMaterial({
          color: 0xa0522d,
          emissive: 0x6b3410,
          emissiveIntensity: 0.4,
        })
      );
      body.position.y = 0.9;
      body.castShadow = true;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0xd4a373,
          emissive: 0x9b6b3f,
          emissiveIntensity: 0.3,
        })
      );
      head.position.y = 2.1;
      head.castShadow = true;

      const hat = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 0.5, 8),
        new THREE.MeshPhongMaterial({
          color: 0x654321,
          emissive: 0x3d2613,
          emissiveIntensity: 0.3,
        })
      );
      hat.position.y = 2.6;
      hat.castShadow = true;

      npcGroup.add(body);
      npcGroup.add(head);
      npcGroup.add(hat);
      break;
    }

    case 4: {
      // Debugger - Red/corrupted glitchy appearance
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2.2, 0.8),
        new THREE.MeshPhongMaterial({
          color: 0xff4d4f,
          emissive: 0xcf1322,
          emissiveIntensity: 0.7,
        })
      );
      body.position.y = 1.1;
      body.castShadow = true;

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 0.7),
        new THREE.MeshPhongMaterial({
          color: 0xff7875,
          emissive: 0xff4d4f,
          emissiveIntensity: 0.6,
        })
      );
      head.position.y = 2.6;
      head.castShadow = true;

      const glitch1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshPhongMaterial({
          color: 0xff4d4f,
          emissive: 0xff4d4f,
          emissiveIntensity: 1,
        })
      );
      glitch1.position.set(0.6, 2, 0.3);

      const glitch2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 0.15),
        new THREE.MeshPhongMaterial({
          color: 0xff4d4f,
          emissive: 0xff4d4f,
          emissiveIntensity: 1,
        })
      );
      glitch2.position.set(-0.5, 1.5, 0.4);

      npcGroup.add(body);
      npcGroup.add(head);
      npcGroup.add(glitch1);
      npcGroup.add(glitch2);
      break;
    }

    case 5: {
      // Architect - Sleek white/blue futuristic
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 2.5, 6),
        new THREE.MeshPhongMaterial({
          color: 0xf0f0f0,
          emissive: 0x1890ff,
          emissiveIntensity: 0.8,
        })
      );
      body.position.y = 1.25;
      body.castShadow = true;

      const head = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.MeshPhongMaterial({
          color: 0xffffff,
          emissive: 0x40a9ff,
          emissiveIntensity: 0.9,
        })
      );
      head.position.y = 3;
      head.castShadow = true;

      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.05, 8, 16),
        new THREE.MeshPhongMaterial({
          color: 0x1890ff,
          emissive: 0x1890ff,
          emissiveIntensity: 1,
        })
      );
      ring1.position.y = 1.5;
      ring1.rotation.x = Math.PI / 2;

      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.05, 8, 16),
        new THREE.MeshPhongMaterial({
          color: 0x40a9ff,
          emissive: 0x40a9ff,
          emissiveIntensity: 1,
        })
      );
      ring2.position.y = 2;
      ring2.rotation.x = Math.PI / 2;

      npcGroup.add(body);
      npcGroup.add(head);
      npcGroup.add(ring1);
      npcGroup.add(ring2);
      break;
    }

    default: {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
        new THREE.MeshPhongMaterial({
          color: 0x5ba3ff,
          emissive: 0x3b82f6,
          emissiveIntensity: 0.6,
        })
      );
      body.position.y = 1;
      body.castShadow = true;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0x8ec5ff,
          emissive: 0x60a5fa,
          emissiveIntensity: 0.5,
        })
      );
      head.position.y = 2.5;
      head.castShadow = true;

      npcGroup.add(body);
      npcGroup.add(head);
    }
  }

  return npcGroup;
};
