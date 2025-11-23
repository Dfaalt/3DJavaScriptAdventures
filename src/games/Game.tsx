import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameDialog } from "@/components/GameDialog";
import { CodeEditor } from "@/components/CodeEditor";
import { GameHUD } from "@/components/GameHUD";
import { GameControls } from "@/components/GameControls";
import { SettingsDialog } from "@/components/SettingsDialog";
import { GameStartScreen } from "@/components/GameStartScreen";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

import elderRowanAvatar from "@/assets/avatars/elder-rowan.png";
import sageMarelinAvatar from "@/assets/avatars/sage-marrelin.png";
import rangerThalenAvatar from "@/assets/avatars/ranger-thalen.png";
import chronoWardenAvatar from "@/assets/avatars/chrono-warden.png";
import oracleAvatar from "@/assets/avatars/oracle.png";

import {
  createPlayerMesh,
  updatePlayer,
  updatePlayerAnimation,
} from "./Player";

import { updateCamera } from "./Camera";
import { loadLevel } from "./World";
import {
  checkInteractions,
  handleInteraction,
  handlePortalEntry,
} from "./Interaction";
import type { GameState, NPC } from "./NPC";

// Map NPC names to their avatar images
const getNPCAvatar = (name: string): string => {
  const avatarMap: Record<string, string> = {
    "Elder Rowan": elderRowanAvatar,
    "Sage Marrelin": sageMarelinAvatar,
    "Ranger Thalen": rangerThalenAvatar,
    "Chrono-Warden": chronoWardenAvatar,
    Oracle: oracleAvatar,
  };
  return avatarMap[name] || "";
};

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
  const clockRef = useRef<THREE.Clock | null>(null);
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

  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const portalCooldownRef = useRef(false);
  const showPortalHintRef = useRef(false);
  const canEnterPortalRef = useRef(false);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const playerVelocity = useRef(new THREE.Vector3());
  const isGrounded = useRef(true);

  // Play background music that changes with level
  useBackgroundMusic(getMusicForLevel(gameState.currentLevel), gameStarted);

  useEffect(() => {
    if (!containerRef.current) return;
    clockRef.current = new THREE.Clock();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - SUPER BRIGHT daylight!
    const ambientLight = new THREE.AmbientLight(0xffffff, 3);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffee, 0xaaccff, 2);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    const accentLight = new THREE.DirectionalLight(0xffffff, 2);
    accentLight.position.set(-10, 15, -10);
    scene.add(accentLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(0, -10, 0);
    scene.add(fillLight);

    const playerLight = new THREE.PointLight(0x00ffff, 3, 25);
    playerLight.position.set(0, 5, 0);
    scene.add(playerLight);
    playerLightRef.current = playerLight;

    // Player
    const player = createPlayerMesh();
    player.position.set(0, 1, 0);
    scene.add(player);
    playerRef.current = player;

    // Load initial level
    loadLevel({
      level: 1,
      scene,
      playerRef,
      cameraRef,
      npcsRef,
      collidablesRef,
      portalRef,
      setGameState,
    });

    const animate = () => {
      const state = gameStateRef.current;
      animationIdRef.current = requestAnimationFrame(animate);

      const clock = clockRef.current;
      const delta = clock ? clock.getDelta() : 0.016;

      // cek input gerak
      const keys = keysPressed.current;
      const isMovingInput = keys["w"] || keys["a"] || keys["s"] || keys["d"];

      const isMoving =
        !state.showDialog && !state.showEditor && !!isMovingInput;

      // update posisi player kalau tidak sedang dialog/editor
      if (!state.showDialog && !state.showEditor) {
        updatePlayer({
          playerRef,
          collidablesRef,
          npcsRef,
          keysPressed,
          playerVelocity,
          isGrounded,
        });
      }

      // 🔥 update animasi setiap frame
      updatePlayerAnimation(delta, isMoving);

      updateCamera(cameraRef, playerRef);

      if (playerRef.current && playerLightRef.current) {
        playerLightRef.current.position.copy(playerRef.current.position);
        playerLightRef.current.position.y += 3;
      }

      checkInteractions({
        playerRef,
        portalRef,
        gameStateRef,
        setGameState,
        showPortalHintRef,
        canEnterPortalRef,
        npcsRef,
      });

      if (portalRef.current && state.portalActive) {
        portalRef.current.rotation.y += 0.02;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key === " " && isGrounded.current) {
        playerVelocity.current.y = 0.25;
        isGrounded.current = false;
      }

      if (
        e.key.toLowerCase() === "e" &&
        !state.showDialog &&
        !state.showEditor
      ) {
        handleInteraction({ playerRef, npcsRef, setGameState });
      }

      if (
        e.key === "Enter" &&
        showPortalHintRef.current &&
        canEnterPortalRef.current &&
        !portalCooldownRef.current
      ) {
        handlePortalEntry({
          playerRef,
          portalRef,
          npcsRef,
          gameStateRef,
          setGameState,
          portalCooldownRef,
          sceneRef,
          cameraRef,
          collidablesRef,
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      const cam = cameraRef.current;
      const rend = rendererRef.current;
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
      rend.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

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

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current && portalRef.current) {
      portalRef.current.visible = gameState.portalActive;
    }
  }, [gameState.portalActive]);

  const handleDialogClose = () => {
    const state = gameStateRef.current;

    if (state.objectiveRevealed) {
      setGameState((prev) => ({
        ...prev,
        showDialog: false,
        objectiveRevealed: false,
      }));
      return;
    }

    if (state.questComplete) {
      setGameState((prev) => ({
        ...prev,
        showDialog: false,
      }));
      return;
    }

    if (state.dialogStage < 3) {
      setGameState((prev) => ({
        ...prev,
        dialogStage: prev.dialogStage + 1,
        showDialog: true,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        showDialog: false,
      }));
    }
  };

  const handleOpenEditor = () => {
    setGameState((prev) => ({
      ...prev,
      showDialog: false,
      showEditor: true,
    }));
  };

  const handleEditorClose = () => {
    setGameState((prev) => ({
      ...prev,
      showEditor: false,
    }));
  };

  const handleValidationFailure = () => {
    setGameState((prev) => {
      const newFailureCount = prev.failureCount + 1;
      return {
        ...prev,
        failureCount: newFailureCount,
        showEditor: false,
        showDialog: true,
        objectiveRevealed: true,
      };
    });
  };

  const getCurrentDialogMessage = () => {
    const npc = gameState.currentNPC;
    if (!npc) return "";

    if (gameState.objectiveRevealed) {
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
      {!gameStarted && <GameStartScreen onStart={() => setGameStarted(true)} />}

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
          showEditorButton={
            !gameState.questComplete &&
            gameState.dialogStage === 3 &&
            !gameState.objectiveRevealed
          }
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
