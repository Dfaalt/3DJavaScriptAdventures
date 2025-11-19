import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameDialog } from "./GameDialog";
import { CodeEditor } from "./CodeEditor";
import { GameHUD } from "./GameHUD";
import { GameControls } from "./GameControls";
import { SettingsDialog } from "./SettingsDialog";
import { GameStartScreen } from "./GameStartScreen";
import { levelData, finalDialog } from "../data";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import elderRowanAvatar from "@/assets/avatars/elder-rowan.png";
import sageMarelinAvatar from "@/assets/avatars/sage-marrelin.png";
import rangerThalenAvatar from "@/assets/avatars/ranger-thalen.png";
import chronoWardenAvatar from "@/assets/avatars/chrono-warden.png";
import oracleAvatar from "@/assets/avatars/oracle.png";

interface NPC {
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

// Map NPC names to their avatar images
const getNPCAvatar = (name: string): string => {
  const avatarMap: Record<string, string> = {
    "Elder Rowan": elderRowanAvatar,
    "Sage Marrelin": sageMarelinAvatar,
    "Ranger Thalen": rangerThalenAvatar,
    "Chrono-Warden": chronoWardenAvatar,
    "Oracle": oracleAvatar,
  };
  return avatarMap[name] || "";
};

interface GameState {
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

export const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);
  const npcsRef = useRef<NPC[]>([]);
  const portalRef = useRef<THREE.Mesh | null>(null);
  const playerLightRef = useRef<THREE.PointLight | null>(null);
  const animationIdRef = useRef<number>();
  const collidablesRef = useRef<THREE.Object3D[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    questComplete: false,
    showDialog: false,
    showEditor: false,
    currentNPC: null,
    portalActive: false,
    showPortalHint: false,
    canEnterPortal: false,
    dialogStage: 1,
    failureCount: 0,
    objectiveRevealed: false,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  const portalCooldownRef = useRef(false);
  const showPortalHintRef = useRef(false);
  const canEnterPortalRef = useRef(false);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const playerVelocity = useRef(new THREE.Vector3());
  const isGrounded = useRef(true);

  // Get background music path based on current level
  const getMusicForLevel = (level: number): string => {
    const musicMap: Record<number, string> = {
      1: "/sounds/village-ambient.mp3",
      2: "/sounds/field-ambient.mp3",
      3: "/sounds/forest-ambient.mp3",
      4: "/sounds/dungeon-ambient.mp3",
      5: "/sounds/control-room-ambient.mp3",
    };
    return musicMap[level] || "/sounds/village-ambient.mp3";
  };

  // Play background music that changes with level
  useBackgroundMusic(getMusicForLevel(gameState.currentLevel), gameStarted);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup - Will be configured per level
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - SUPER BRIGHT daylight!
    const ambientLight = new THREE.AmbientLight(0xffffff, 3);
    scene.add(ambientLight);

    // Hemisphere light for natural daylight
    const hemisphereLight = new THREE.HemisphereLight(0xffffee, 0xaaccff, 2);
    scene.add(hemisphereLight);

    // Main sun light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    // Secondary sun from other side
    const accentLight = new THREE.DirectionalLight(0xffffff, 2);
    accentLight.position.set(-10, 15, -10);
    scene.add(accentLight);

    // Fill light from below for no shadows
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(0, -10, 0);
    scene.add(fillLight);

    // Player spotlight
    const playerLight = new THREE.PointLight(0x00ffff, 3, 25);
    playerLight.position.set(0, 5, 0);
    scene.add(playerLight);
    playerLightRef.current = playerLight;

    // Create player
    const player = createPlayerMesh();
    player.position.set(0, 1, 0);
    scene.add(player);
    playerRef.current = player;

    // Load initial level
    loadLevel(1, scene);

    // Animation loop
    const animate = () => {
      const state = gameStateRef.current;
      animationIdRef.current = requestAnimationFrame(animate);

      // Update player movement
      if (!state.showDialog && !state.showEditor) {
        updatePlayer();
      }

      // Update camera to follow player
      updateCamera();

      // Update player light position
      if (playerRef.current && playerLightRef.current) {
        playerLightRef.current.position.copy(playerRef.current.position);
        playerLightRef.current.position.y += 3;
      }

      // Check interactions
      checkInteractions();

      // Rotate portal if active
      if (portalRef.current && state.portalActive) {
        portalRef.current.rotation.y += 0.02;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;

      keysPressed.current[e.key.toLowerCase()] = true;
      
      // Jump with spacebar
      if (e.key === " " && isGrounded.current) {
        playerVelocity.current.y = 0.25; // Jump strength
        isGrounded.current = false;
      }
      
      if (e.key.toLowerCase() === "e" && !state.showDialog && !state.showEditor) {
        handleInteraction();
      }
      
      if (
        e.key === "Enter" &&
        showPortalHintRef.current &&
        canEnterPortalRef.current &&
        !portalCooldownRef.current
      ) {
        handlePortalEntry();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }

      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  // Update when game state changes
  useEffect(() => {
    if (sceneRef.current) {
      // Update portal visibility
      if (portalRef.current) {
        portalRef.current.visible = gameState.portalActive;
      }
    }
  }, [gameState.portalActive]);

  // Helper function to generate random spawn position avoiding NPCs and obstacles
  const generateRandomSpawnPosition = (
    npcPosition: THREE.Vector3, 
    collidables: THREE.Object3D[],
    minDistance: number = 8
  ): THREE.Vector3 => {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      // Generate random position within spawn area
      const x = (Math.random() - 0.5) * 20; // Range: -10 to 10
      const z = (Math.random() - 0.5) * 20; // Range: -10 to 10
      const testPosition = new THREE.Vector3(x, 1, z);
      
      // Check distance from NPC
      const distanceToNPC = testPosition.distanceTo(new THREE.Vector3(npcPosition.x, 1, npcPosition.z));
      if (distanceToNPC < minDistance) {
        attempts++;
        continue;
      }
      
      // Check distance from collidables
      let tooClose = false;
      for (const collidable of collidables) {
        const collidablePos = new THREE.Vector3(
          collidable.position.x, 
          1, 
          collidable.position.z
        );
        if (testPosition.distanceTo(collidablePos) < 5) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        return testPosition;
      }
      
      attempts++;
    }
    
    // Fallback to safe position if no valid spawn found
    return new THREE.Vector3(-8, 1, -8);
  };

  const loadLevel = (level: number, scene: THREE.Scene) => {
    // Clear previous level objects
    npcsRef.current = [];
    collidablesRef.current = [];
    
    // Remove old objects except player and camera
    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (object !== playerRef.current && object.type !== "Light" && object !== scene && object !== cameraRef.current) {
        objectsToRemove.push(object);
      }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));
    
    // Configure level atmosphere
    const atmospheres = {
      1: { bg: 0xffa366, fog: 0xffa366, fogDensity: [30, 80], groundColor: 0x7ec850, ambientIntensity: 2.5 },
      2: { bg: 0x5ab88c, fog: 0x5ab88c, fogDensity: [40, 90], groundColor: 0x4a9f6f, ambientIntensity: 2 },
      3: { bg: 0x6b4f9e, fog: 0x6b4f9e, fogDensity: [35, 85], groundColor: 0x4a3d6f, ambientIntensity: 1.8 },
      4: { bg: 0x1a1a3e, fog: 0x1a1a3e, fogDensity: [25, 70], groundColor: 0x2d2d5f, ambientIntensity: 1.5 },
      5: { bg: 0xd4e8ff, fog: 0xd4e8ff, fogDensity: [50, 100], groundColor: 0xaaccee, ambientIntensity: 3 }
    };
    
    const atmosphere = atmospheres[level as keyof typeof atmospheres] || atmospheres[1];
    scene.background = new THREE.Color(atmosphere.bg);
    scene.fog = new THREE.Fog(atmosphere.fog, atmosphere.fogDensity[0], atmosphere.fogDensity[1]);
    
    // Update ambient light intensity per level
    scene.traverse((object) => {
      if (object instanceof THREE.AmbientLight) {
        object.intensity = atmosphere.ambientIntensity;
      }
    });

    // Create ground with level-specific color
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: atmosphere.groundColor,
      emissive: atmosphere.groundColor,
      emissiveIntensity: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add some trees
    for (let i = 0; i < 8; i++) {
      const tree = createTree();
      const angle = (i / 8) * Math.PI * 2;
      const radius = 15 + Math.random() * 5;
      tree.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      scene.add(tree);
      collidablesRef.current.push(tree);
    }

    // Build level-specific environment
    if (level === 1) buildVillage(scene);
    else if (level === 2) buildField(scene);
    else if (level === 3) buildLogicForest(scene);
    else if (level === 4) buildDungeon(scene);
    else if (level === 5) buildControlRoom(scene);

    // Define NPC spawn positions per level (safe from environment obstacles)
    const npcSpawnPositions: Record<number, THREE.Vector3> = {
      1: new THREE.Vector3(5, 0, 0),    // Village - open space
      2: new THREE.Vector3(-5, 0, 3),   // Fields - clear area
      3: new THREE.Vector3(0, 0, -5),   // Forest - clearing
      4: new THREE.Vector3(6, 0, -2),   // Dungeon - away from walls
      5: new THREE.Vector3(0, 0, 5),    // Control Room - center
    };

    // Create NPC from data
    const npcConfig = levelData[level];
    const npc: NPC = {
      name: npcConfig.name,
      position: npcSpawnPositions[level] || new THREE.Vector3(5, 0, 0),
      mesh: createNpcMeshForLevel(level),
      dialog1: npcConfig.dialog1,
      dialog2: npcConfig.dialog2,
      dialog3: npcConfig.dialog3,
      completedDialog: npcConfig.completedDialog,
      objective: npcConfig.objective,
      hint1: npcConfig.hint1,
      hint2: npcConfig.hint2,
      hint3: npcConfig.hint3,
      validator: (code: string, output: string) => {
        if (npcConfig.validator(code, output)) {
          setGameState(prev => ({ ...prev, questComplete: true, portalActive: true }));
          return true;
        }
        return false;
      }
    };
    
    // Generate random spawn position for player that avoids NPC and obstacles
    const playerSpawnPosition = generateRandomSpawnPosition(
      npc.position,
      collidablesRef.current
    );
    
    // Reset player position to random spawn
    if (playerRef.current) {
      playerRef.current.position.copy(playerSpawnPosition);
      playerVelocity.current.set(0, 0, 0);
      isGrounded.current = true;
    }

    npc.mesh.position.copy(npc.position);
    scene.add(npc.mesh);
    npcsRef.current.push(npc);

    // Create portal (initially hidden)
    const portalGeometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
    const portalMaterial = new THREE.MeshPhongMaterial({
      color: 0xaa00ff,
      emissive: 0xaa00ff,
      emissiveIntensity: 0.5,
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(-8, 2, 0);
    portal.rotation.x = Math.PI / 2;
    portal.visible = false;
    scene.add(portal);
    portalRef.current = portal;
  };

  // TODO: Replace this placeholder mesh with GLB model using GLTFLoader in the future
  // Example: loader.load("/models/player.glb", (gltf) => { ... })
  const createPlayerMesh = () => {
    // Player mesh - Much brighter and glowing cyan cube
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.castShadow = true;
    
    return player;
  };

  // TODO: Replace these placeholder meshes with GLB models using GLTFLoader in the future
  // Example: loader.load(`/models/npc_level${level}.glb`, (gltf) => { ... })
  const createNpcMeshForLevel = (level: number) => {
    const npcGroup = new THREE.Group();
    
    switch(level) {
      case 1: // Teacher - Traditional blue cylinder
        {
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0x5ba3ff,
              emissive: 0x3b82f6,
              emissiveIntensity: 0.6
            })
          );
          body.position.y = 1;
          body.castShadow = true;
          
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0x8ec5ff,
              emissive: 0x60a5fa,
              emissiveIntensity: 0.5
            })
          );
          head.position.y = 2.5;
          head.castShadow = true;
          
          npcGroup.add(body);
          npcGroup.add(head);
        }
        break;
        
      case 2: // Sage - Tall green robed figure
        {
          const body = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 2.5, 8),
            new THREE.MeshPhongMaterial({ 
              color: 0x52c41a,
              emissive: 0x389e0d,
              emissiveIntensity: 0.5
            })
          );
          body.position.y = 1.25;
          body.castShadow = true;
          
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0x95de64,
              emissive: 0x73d13d,
              emissiveIntensity: 0.4
            })
          );
          head.position.y = 2.8;
          head.castShadow = true;
          
          // Floating orb for mystical effect
          const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0xfff566,
              emissive: 0xfadb14,
              emissiveIntensity: 0.8
            })
          );
          orb.position.set(0.8, 2, 0);
          orb.castShadow = true;
          
          npcGroup.add(body);
          npcGroup.add(head);
          npcGroup.add(orb);
        }
        break;
        
      case 3: // Ranger - Brown/Forest theme, shorter and sturdy
        {
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.5, 1.8, 8),
            new THREE.MeshPhongMaterial({ 
              color: 0xa0522d,
              emissive: 0x6b3410,
              emissiveIntensity: 0.4
            })
          );
          body.position.y = 0.9;
          body.castShadow = true;
          
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 16, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0xd4a373,
              emissive: 0x9b6b3f,
              emissiveIntensity: 0.3
            })
          );
          head.position.y = 2.1;
          head.castShadow = true;
          
          // Hood/hat
          const hat = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 0.5, 8),
            new THREE.MeshPhongMaterial({ 
              color: 0x654321,
              emissive: 0x3d2613,
              emissiveIntensity: 0.3
            })
          );
          hat.position.y = 2.6;
          hat.castShadow = true;
          
          npcGroup.add(body);
          npcGroup.add(head);
          npcGroup.add(hat);
        }
        break;
        
      case 4: // Debugger - Red/corrupted glitchy appearance
        {
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2.2, 0.8),
            new THREE.MeshPhongMaterial({ 
              color: 0xff4d4f,
              emissive: 0xcf1322,
              emissiveIntensity: 0.7
            })
          );
          body.position.y = 1.1;
          body.castShadow = true;
          
          const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.7, 0.7),
            new THREE.MeshPhongMaterial({ 
              color: 0xff7875,
              emissive: 0xff4d4f,
              emissiveIntensity: 0.6
            })
          );
          head.position.y = 2.6;
          head.castShadow = true;
          
          // Glitch cubes floating around
          const glitch1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.MeshPhongMaterial({ 
              color: 0xff4d4f,
              emissive: 0xff4d4f,
              emissiveIntensity: 1
            })
          );
          glitch1.position.set(0.6, 2, 0.3);
          
          const glitch2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.15, 0.15),
            new THREE.MeshPhongMaterial({ 
              color: 0xff4d4f,
              emissive: 0xff4d4f,
              emissiveIntensity: 1
            })
          );
          glitch2.position.set(-0.5, 1.5, 0.4);
          
          npcGroup.add(body);
          npcGroup.add(head);
          npcGroup.add(glitch1);
          npcGroup.add(glitch2);
        }
        break;
        
      case 5: // Architect - Sleek white/blue futuristic
        {
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.6, 2.5, 6),
            new THREE.MeshPhongMaterial({ 
              color: 0xf0f0f0,
              emissive: 0x1890ff,
              emissiveIntensity: 0.8
            })
          );
          body.position.y = 1.25;
          body.castShadow = true;
          
          const head = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5, 0),
            new THREE.MeshPhongMaterial({ 
              color: 0xffffff,
              emissive: 0x40a9ff,
              emissiveIntensity: 0.9
            })
          );
          head.position.y = 3;
          head.castShadow = true;
          
          // Holographic rings
          const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(0.7, 0.05, 8, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0x1890ff,
              emissive: 0x1890ff,
              emissiveIntensity: 1
            })
          );
          ring1.position.y = 1.5;
          ring1.rotation.x = Math.PI / 2;
          
          const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.05, 8, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0x40a9ff,
              emissive: 0x40a9ff,
              emissiveIntensity: 1
            })
          );
          ring2.position.y = 2;
          ring2.rotation.x = Math.PI / 2;
          
          npcGroup.add(body);
          npcGroup.add(head);
          npcGroup.add(ring1);
          npcGroup.add(ring2);
        }
        break;
        
      default:
        // Fallback generic NPC
        {
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0x5ba3ff,
              emissive: 0x3b82f6,
              emissiveIntensity: 0.6
            })
          );
          body.position.y = 1;
          body.castShadow = true;
          
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshPhongMaterial({ 
              color: 0x8ec5ff,
              emissive: 0x60a5fa,
              emissiveIntensity: 0.5
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

  const createTree = () => {
    const treeGroup = new THREE.Group();
    
    // Trunk - Bright brown
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xa87c4f,
      emissive: 0x6b4423,
      emissiveIntensity: 0.4
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    
    // Leaves - Bright vibrant green
    const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x5cb85c,
      emissive: 0x3a8f3a,
      emissiveIntensity: 0.5
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 3;
    leaves.castShadow = true;
    
    treeGroup.add(trunk);
    treeGroup.add(leaves);
    
    return treeGroup;
  };

  // Environment builders
  const buildVillage = (scene: THREE.Scene) => {
    // Houses
    for (let i = 0; i < 4; i++) {
      const house = new THREE.Group();
      
      // House body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 3),
        new THREE.MeshPhongMaterial({ color: 0x8b4513, emissive: 0x5a2d0a, emissiveIntensity: 0.3 })
      );
      body.position.y = 1;
      body.castShadow = true;
      
      // Roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 1.5, 4),
        new THREE.MeshPhongMaterial({ color: 0xa0522d, emissive: 0x6b3410, emissiveIntensity: 0.3 })
      );
      roof.position.y = 2.75;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      
      house.add(body);
      house.add(roof);
      
      const angle = (i / 4) * Math.PI * 2;
      house.position.set(Math.cos(angle) * 12, 0, Math.sin(angle) * 12);
      house.rotation.y = -angle;
      scene.add(house);
      collidablesRef.current.push(house);
    }
    
    // Well
    const well = new THREE.Group();
    const wellBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1, 1.5, 16),
      new THREE.MeshPhongMaterial({ color: 0x696969, emissive: 0x404040, emissiveIntensity: 0.2 })
    );
    wellBase.position.y = 0.75;
    wellBase.castShadow = true;
    
    const wellRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.1, 8, 16),
      new THREE.MeshPhongMaterial({ color: 0x8b7355 })
    );
    wellRim.position.y = 1.5;
    wellRim.rotation.x = Math.PI / 2;
    
    well.add(wellBase);
    well.add(wellRim);
    well.position.set(-10, 0, -10);
    scene.add(well);
    collidablesRef.current.push(well);
    
    // Fences
    for (let i = 0; i < 12; i++) {
      const fence = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1, 2),
        new THREE.MeshPhongMaterial({ color: 0x654321, emissive: 0x3d2613, emissiveIntensity: 0.2 })
      );
      const angle = (i / 12) * Math.PI * 2;
      fence.position.set(Math.cos(angle) * 18, 0.5, Math.sin(angle) * 18);
      fence.rotation.y = -angle + Math.PI / 2;
      fence.castShadow = true;
      scene.add(fence);
      collidablesRef.current.push(fence);
    }
    
    // Dirt road
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 3),
      new THREE.MeshPhongMaterial({ color: 0x8b7355, emissive: 0x5a4a35, emissiveIntensity: 0.2 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    scene.add(road);
  };

  const buildField = (scene: THREE.Scene) => {
    // Tall grass patches
    for (let i = 0; i < 30; i++) {
      const grass = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.5, 4),
        new THREE.MeshPhongMaterial({ color: 0x7ec850, emissive: 0x5a9438, emissiveIntensity: 0.4 })
      );
      grass.position.set(
        (Math.random() - 0.5) * 35,
        0.75,
        (Math.random() - 0.5) * 35
      );
      grass.castShadow = true;
      scene.add(grass);
    }
    
    // Large rocks
    for (let i = 0; i < 8; i++) {
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1 + Math.random()),
        new THREE.MeshPhongMaterial({ color: 0x808080, emissive: 0x404040, emissiveIntensity: 0.2 })
      );
      rock.position.set(
        (Math.random() - 0.5) * 30,
        rock.geometry.parameters.radius / 2,
        (Math.random() - 0.5) * 30
      );
      rock.castShadow = true;
      scene.add(rock);
      collidablesRef.current.push(rock);
    }
    
    // Hills
    for (let i = 0; i < 3; i++) {
      const hill = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 6),
        new THREE.MeshPhongMaterial({ color: 0x6b9f4a, emissive: 0x4a7030, emissiveIntensity: 0.3 })
      );
      hill.position.set(
        (Math.random() - 0.5) * 30,
        1.5,
        (Math.random() - 0.5) * 30
      );
      hill.castShadow = true;
      scene.add(hill);
      collidablesRef.current.push(hill);
    }
  };

  const buildLogicForest = (scene: THREE.Scene) => {
    // Giant trees
    for (let i = 0; i < 6; i++) {
      const tree = new THREE.Group();
      
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 6, 8),
        new THREE.MeshPhongMaterial({ color: 0x4a2511, emissive: 0x2d1509, emissiveIntensity: 0.3 })
      );
      trunk.position.y = 3;
      trunk.castShadow = true;
      
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(4, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0x2d5016, emissive: 0x1a300d, emissiveIntensity: 0.4 })
      );
      leaves.position.y = 8;
      leaves.castShadow = true;
      
      tree.add(trunk);
      tree.add(leaves);
      
      const angle = (i / 6) * Math.PI * 2;
      tree.position.set(Math.cos(angle) * 15, 0, Math.sin(angle) * 15);
      scene.add(tree);
      collidablesRef.current.push(tree);
    }
    
    // Glowing mushrooms
    for (let i = 0; i < 15; i++) {
      const mushroom = new THREE.Group();
      
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 0.5, 8),
        new THREE.MeshPhongMaterial({ color: 0xf5f5dc })
      );
      stem.position.y = 0.25;
      
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshPhongMaterial({ 
          color: 0x9370db, 
          emissive: 0x9370db, 
          emissiveIntensity: 0.8 
        })
      );
      cap.position.y = 0.5;
      cap.scale.y = 0.5;
      
      mushroom.add(stem);
      mushroom.add(cap);
      
      mushroom.position.set(
        (Math.random() - 0.5) * 30,
        0,
        (Math.random() - 0.5) * 30
      );
      scene.add(mushroom);
      
      // Add point light for glow
      const light = new THREE.PointLight(0x9370db, 0.5, 3);
      light.position.copy(cap.position);
      light.position.y += 0.5;
      mushroom.add(light);
    }
    
    // Tree roots
    for (let i = 0; i < 10; i++) {
      const root = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 3, 6),
        new THREE.MeshPhongMaterial({ color: 0x654321, emissive: 0x3d2613, emissiveIntensity: 0.3 })
      );
      root.position.set(
        (Math.random() - 0.5) * 25,
        0.2,
        (Math.random() - 0.5) * 25
      );
      root.rotation.z = Math.random() * 0.5;
      root.castShadow = true;
      scene.add(root);
      collidablesRef.current.push(root);
    }
  };

  const buildDungeon = (scene: THREE.Scene) => {
    // Dungeon walls
    for (let i = 0; i < 8; i++) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(3, 5, 0.5),
        new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x1a1a1a, emissiveIntensity: 0.2 })
      );
      const angle = (i / 8) * Math.PI * 2;
      wall.position.set(Math.cos(angle) * 18, 2.5, Math.sin(angle) * 18);
      wall.rotation.y = -angle;
      wall.castShadow = true;
      scene.add(wall);
      collidablesRef.current.push(wall);
    }
    
    // Pillars
    for (let i = 0; i < 6; i++) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 4, 8),
        new THREE.MeshPhongMaterial({ color: 0x3a3a3a, emissive: 0x202020, emissiveIntensity: 0.2 })
      );
      const angle = (i / 6) * Math.PI * 2;
      pillar.position.set(Math.cos(angle) * 12, 2, Math.sin(angle) * 12);
      pillar.castShadow = true;
      scene.add(pillar);
      collidablesRef.current.push(pillar);
      
      // Torch on pillar
      const torch = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshPhongMaterial({ 
          color: 0xff4500, 
          emissive: 0xff4500, 
          emissiveIntensity: 1 
        })
      );
      torch.position.copy(pillar.position);
      torch.position.y = 4.5;
      scene.add(torch);
      
      // Torch light
      const torchLight = new THREE.PointLight(0xff4500, 2, 10);
      torchLight.position.copy(torch.position);
      scene.add(torchLight);
    }
    
    // Checker floor tiles
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.2, 2),
          new THREE.MeshPhongMaterial({ 
            color: (x + z) % 2 === 0 ? 0x1a1a1a : 0x2a2a2a,
            emissive: (x + z) % 2 === 0 ? 0x0a0a0a : 0x151515,
            emissiveIntensity: 0.2
          })
        );
        tile.position.set(x * 2, 0.1, z * 2);
        tile.receiveShadow = true;
        scene.add(tile);
      }
    }
  };

  const buildControlRoom = (scene: THREE.Scene) => {
    // Holographic panels
    for (let i = 0; i < 8; i++) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3),
        new THREE.MeshPhongMaterial({ 
          color: 0x00ffff, 
          emissive: 0x00ffff, 
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.6
        })
      );
      const angle = (i / 8) * Math.PI * 2;
      panel.position.set(Math.cos(angle) * 15, 2, Math.sin(angle) * 15);
      panel.rotation.y = -angle + Math.PI;
      scene.add(panel);
      collidablesRef.current.push(panel);
      
      // Panel light
      const panelLight = new THREE.PointLight(0x00ffff, 1, 8);
      panelLight.position.copy(panel.position);
      scene.add(panelLight);
    }
    
    // Floating cubes
    for (let i = 0; i < 12; i++) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshPhongMaterial({ 
          color: 0x4da6ff, 
          emissive: 0x4da6ff, 
          emissiveIntensity: 0.6 
        })
      );
      cube.position.set(
        (Math.random() - 0.5) * 20,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 20
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(cube);
    }
    
    // LED lines
    for (let i = 0; i < 16; i++) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 20),
        new THREE.MeshPhongMaterial({ 
          color: 0x00ffff, 
          emissive: 0x00ffff, 
          emissiveIntensity: 0.9 
        })
      );
      line.position.set(
        (i - 8) * 2,
        0.05,
        0
      );
      line.receiveShadow = false;
      scene.add(line);
    }
    
    // Glossy floor
    const glossyFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        emissive: 0xaaccee, 
        emissiveIntensity: 0.3,
        shininess: 100 
      })
    );
    glossyFloor.rotation.x = -Math.PI / 2;
    glossyFloor.position.y = 0.01;
    glossyFloor.receiveShadow = true;
    scene.add(glossyFloor);
  };

  const updatePlayer = () => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    const moveSpeed = 0.1;
    const rotateSpeed = 0.05;
    const jumpStrength = 0.25;

    // Rotation
    if (keysPressed.current["a"]) {
      player.rotation.y += rotateSpeed;
    }
    if (keysPressed.current["d"]) {
      player.rotation.y -= rotateSpeed;
    }

    // Movement in player's local direction
    const direction = new THREE.Vector3(0, 0, 0);
    
    if (keysPressed.current["w"]) {
      direction.z -= moveSpeed;
    }
    if (keysPressed.current["s"]) {
      direction.z += moveSpeed * 0.5; // Slower backwards
    }

    // Apply rotation to movement direction
    direction.applyEuler(new THREE.Euler(0, player.rotation.y, 0));
    
    // Store original position for collision detection
    const originalPosition = player.position.clone();
    player.position.add(direction);

    // Collision detection with environment objects
    let collided = false;
    for (const obj of collidablesRef.current) {
      const distance = player.position.distanceTo(obj.position);
      const collisionRadius = 2.5; // Adjust based on object size
      
      if (distance < collisionRadius) {
        collided = true;
        break;
      }
    }

    // NPC collision detection
    for (const npc of npcsRef.current) {
      const distance = player.position.distanceTo(npc.position);
      if (distance < 2) {
        collided = true;
        break;
      }
    }

    // If collision detected, revert to original position
    if (collided) {
      player.position.copy(originalPosition);
    }

    // Simple gravity
    if (!isGrounded.current) {
      playerVelocity.current.y -= 0.01;
    }
    player.position.y += playerVelocity.current.y;

    // Ground collision
    if (player.position.y <= 1) {
      player.position.y = 1;
      playerVelocity.current.y = 0;
      isGrounded.current = true;
    }

    // Boundary check
    const boundary = 20;
    player.position.x = Math.max(-boundary, Math.min(boundary, player.position.x));
    player.position.z = Math.max(-boundary, Math.min(boundary, player.position.z));
  };

  const updateCamera = () => {
    if (!cameraRef.current || !playerRef.current) return;

    const camera = cameraRef.current;
    const player = playerRef.current;

    // Calculate camera position behind player
    const cameraOffset = new THREE.Vector3(0, 3, 8);
    cameraOffset.applyEuler(new THREE.Euler(0, player.rotation.y, 0));
    
    const targetPosition = player.position.clone().add(cameraOffset);
    
    // Smooth follow
    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(player.position);
  };

  const checkInteractions = () => {
    if (!playerRef.current) return;

    const state = gameStateRef.current;

    // Check portal proximity
    if (portalRef.current && state.portalActive) {
      const distance = playerRef.current.position.distanceTo(portalRef.current.position);
      if (distance < 4) {
        showPortalHintRef.current = true;
        canEnterPortalRef.current = true;
        setGameState(prev => ({ ...prev, showPortalHint: true, canEnterPortal: true }));
      } else {
        showPortalHintRef.current = false;
        canEnterPortalRef.current = false;
        setGameState(prev => ({ ...prev, showPortalHint: false, canEnterPortal: false }));
      }
    } else {
      showPortalHintRef.current = false;
      canEnterPortalRef.current = false;
      setGameState(prev => ({ ...prev, showPortalHint: false, canEnterPortal: false }));
    }
  };
  
  const handlePortalEntry = () => {
    const state = gameStateRef.current;
    if (!state.canEnterPortal || portalCooldownRef.current) return;
    
    portalCooldownRef.current = true;
    
    // Level complete, move to next
    if (state.currentLevel < 5) {
      const nextLevel = state.currentLevel + 1;
      setGameState({
        currentLevel: nextLevel,
        questComplete: false,
        showDialog: false,
        showEditor: false,
        currentNPC: null,
        portalActive: false,
        showPortalHint: false,
        canEnterPortal: false,
        dialogStage: 1,
        failureCount: 0,
        objectiveRevealed: false,
      });
      if (sceneRef.current) {
        loadLevel(nextLevel, sceneRef.current);
      }
    } else {
      // Game complete!
      setGameState(prev => ({ ...prev, showDialog: true, currentNPC: {
        name: finalDialog.name,
        position: new THREE.Vector3(0, 0, 0),
        mesh: new THREE.Group(),
        dialog1: finalDialog.dialog,
        dialog2: finalDialog.dialog,
        dialog3: finalDialog.dialog,
        completedDialog: finalDialog.dialog,
        objective: finalDialog.objective,
        hint1: finalDialog.hint1,
        hint2: finalDialog.hint2,
        hint3: finalDialog.hint3,
        validator: finalDialog.validator
      }}));
    }
    
    setTimeout(() => {
      portalCooldownRef.current = false;
    }, 1000);
  };

  const handleInteraction = () => {
    if (!playerRef.current) return;

    const state = gameStateRef.current;

    // Check NPC proximity
    for (const npc of npcsRef.current) {
      const distance = playerRef.current.position.distanceTo(npc.position);
      if (distance < 3) {
        setGameState(prev => ({
          ...prev,
          showDialog: true,
          currentNPC: npc,
        }));
        return;
      }
    }
  };

  const handleDialogClose = () => {
    const state = gameStateRef.current;
    
    // If showing objective after failures, close and reset
    if (state.objectiveRevealed) {
      setGameState(prev => ({
        ...prev,
        showDialog: false,
        objectiveRevealed: false,
      }));
      return;
    }
    
    // If quest is complete, just close dialog
    if (state.questComplete) {
      setGameState(prev => ({
        ...prev,
        showDialog: false,
      }));
      return;
    }

    // If not on stage 3 yet, advance to next stage
    if (state.dialogStage < 3) {
      setGameState(prev => ({
        ...prev,
        dialogStage: prev.dialogStage + 1,
        showDialog: true, // Keep dialog open
      }));
    } else {
      // Stage 3 complete, just close - player can choose to open editor
      setGameState(prev => ({
        ...prev,
        showDialog: false,
      }));
    }
  };

  const handleOpenEditor = () => {
    setGameState(prev => ({
      ...prev,
      showDialog: false,
      showEditor: true,
    }));
  };

  const handleEditorClose = () => {
    setGameState(prev => ({
      ...prev,
      showEditor: false,
    }));
  };

  const handleValidationFailure = () => {
    setGameState(prev => {
      const newFailureCount = prev.failureCount + 1;
      
      // Close editor and show NPC with progressive hint after each failure
      return {
        ...prev,
        failureCount: newFailureCount,
        showEditor: false,
        showDialog: true,
        objectiveRevealed: true
      };
    });
  };

  const getCurrentDialogMessage = () => {
    const npc = gameState.currentNPC;
    if (!npc) return "";
    
    if (gameState.objectiveRevealed) {
      // Show progressive hints based on failure count
      let hint = "";
      if (gameState.failureCount === 1) {
        hint = npc.hint1;
      } else if (gameState.failureCount === 2) {
        hint = npc.hint2;
      } else if (gameState.failureCount >= 3) {
        hint = npc.hint3;
      }
      
      return `The spell is not working as expected. Let me help you:\n\n${hint}`;
    }
    
    if (gameState.questComplete) {
      return npc.completedDialog;
    }
    
    switch (gameState.dialogStage) {
      case 1:
        return npc.dialog1;
      case 2:
        return npc.dialog2;
      case 3:
        return npc.dialog3;
      default:
        return npc.dialog1;
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {!gameStarted && (
        <GameStartScreen onStart={() => setGameStarted(true)} />
      )}
      
      <div ref={containerRef} className="w-full h-full" />
      
      <GameHUD 
        level={gameState.currentLevel} 
        questComplete={gameState.questComplete}
        onOpenSettings={() => setShowSettings(true)}
      />
      <GameControls />
      
      {gameState.showPortalHint && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
          <div className="bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-2xl font-bold animate-pulse border-4 border-primary-foreground/30">
            Press ENTER to enter the portal
          </div>
        </div>
      )}
      
      {gameState.showDialog && gameState.currentNPC && (
        <GameDialog
          npcName={gameState.currentNPC.name}
          message={getCurrentDialogMessage()}
          onClose={handleDialogClose}
          showEditorButton={!gameState.questComplete && gameState.dialogStage === 3 && !gameState.objectiveRevealed}
          onOpenEditor={handleOpenEditor}
          avatarUrl={getNPCAvatar(gameState.currentNPC.name)}
        />
      )}
      
      {gameState.showEditor && gameState.currentNPC && (
        <CodeEditor
          objective={gameState.currentNPC.objective}
          onValidate={gameState.currentNPC.validator}
          onClose={handleEditorClose}
          onFailure={handleValidationFailure}
        />
      )}

      <SettingsDialog 
        open={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};
