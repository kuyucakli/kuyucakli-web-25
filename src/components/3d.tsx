import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useSmoothCamera } from "../hooks/useSmoothCamera";
import { getElementProgress } from "../utils/scroll";
import { lerp } from "three/src/math/MathUtils.js";
import { createRollingMotion, createRollingMotionByPos } from "../utils/3d";
import { fade } from "astro/virtual-modules/transitions.js";

export default function ThreeScene() {
  const [glbLoaded, setGlbLoaded] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);

  const rollingMotion = createRollingMotion(0.5, 0.5, 1);
  const rollingMotionWithScroll = createRollingMotionByPos(0.5);

  // call hook at top level
  const getCameraTransform = useSmoothCamera();

  useEffect(() => {
    const stickyHomeIntroEl = document.getElementById(
      "sticky-home-intro-container"
    );
    if (!stickyHomeIntroEl) return;

    const mount = mountRef.current;

    if (!mount) return;

    let mixer: THREE.AnimationMixer | null = null;
    let clip: THREE.AnimationClip | undefined;
    const textures = loadTextures();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );

    const renderer = createRenderer(mount.clientWidth, mount.clientHeight);

    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const sun = createSun();
    scene.add(sun);
    scene.add(ambientLight);

    loadGLTFModel().then((gltf) => {
      setGlbLoaded(true);

      const sceneModel = scene.add(gltf.scene);
      const bigBall = createBall(sceneModel);
      const surface = createSurfacePlane(sceneModel);

      if (!bigBall) return;

      renderer.render(scene, camera);

      let clock = new THREE.Clock();

      mixer = new THREE.AnimationMixer(bigBall);
      clip = createBallDistortionClip(gltf.animations, mixer);

      const material = createBallMaterial(bigBall, textures[0]);
      const continuesTextureChange = createTextureSwapAnimation(
        material,
        textures
      );

      function animate(animTime: number) {
        if (!bigBall) return;
        requestAnimationFrame(animate);

        //Continues texture change
        if (Math.min(490, animTime % 500) == 490) {
          continuesTextureChange();
        }

        const t = clock.getElapsedTime();

        const { position } = getCameraTransform(t);

        const progress = getElementProgress(stickyHomeIntroEl!);

        //fadeBall(material, progress);

        updateCameraWithScroll({
          camera,
          basePosition: position as THREE.Vector3,
          ballPosition: bigBall.position,
          time: t,
          progress,
        });

        if (progress >= 0.5 && progress <= 1) {
          sun.position.x = lerp(-5, 5, progress);
          sun.position.y = lerp(5, 10, progress);
          const { position: ballPos, rotation } = rollingMotionWithScroll(
            bigBall.position.x + progress * 0.05,
            bigBall.position.y
          );

          bigBall.position.copy(ballPos);
          bigBall.rotation.z += rotation.z;
        } else {
          const { position: ballPos, rotation } = rollingMotion(
            t,
            bigBall.position.y
          );

          bigBall.position.copy(ballPos);
          bigBall.rotation.z += rotation.z;
        }

        if (mixer && clip) {
          mixer.setTime(clip.duration * progress);
        }

        renderer.render(scene, camera);
      }

      animate(0);
    });

    return () => {
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        style={{
          width: "100dvw",
          height: "100dvh",
          position: "fixed",
          top: "0",
          left: "0",
          zIndex: 10,
          filter: "blur(1.2px)",
        }}
      />
      {!glbLoaded && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "300px",
            height: "300px",
            border: "10px solid red",
            borderRadius: "50%",
            filter: "blur(3.8px)",
            zIndex: 10000,
            opacity: "0.8",
            animation: "fade 0.2s alternate infinite",
          }}
        >
          <style>
            {`
    @keyframes fade {
      0% { border-color:white; }
      50% { border-color:black; border-width:0px; }
      100% { border-color:green }
    }
  `}
          </style>
        </div>
      )}
    </>
  );
}

function createTextureSwapAnimation(
  material: THREE.MeshStandardMaterial,
  textures: THREE.Texture[]
) {
  let i = 0;

  return () => {
    i = (i + 1) % textures.length;
    material.map = textures[i];
  };
}

function createBallDistortionClip(
  animations: THREE.AnimationClip[],
  mixer: THREE.AnimationMixer
) {
  const clip = animations.find((c) => c.name === "Sphere.001Action");
  if (!clip) throw new Error("No clip found");

  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.clampWhenFinished = false;
  action.play();

  return clip;
}

function createSurfacePlane(sceneModel: THREE.Scene) {
  const surface = sceneModel.getObjectByName("Cube");
  surface!.receiveShadow = true;
  surface!.material = new THREE.ShadowMaterial({ opacity: 0.6 });

  return surface;
}

function createBall(sceneModel: THREE.Scene) {
  const obj = sceneModel.getObjectByName("BigBall") as THREE.Mesh | null;
  obj!.castShadow = true;

  return obj;
}

function createBallMaterial(obj: THREE.Mesh, initialTexture: THREE.Texture) {
  const material = obj.material as THREE.MeshStandardMaterial; // reference to its existing material
  material.metalness = 0.1;
  material.roughness = 0.5;
  material.transparent = true;
  material.map = initialTexture;
  material.needsUpdate = true;

  return material;
}

function createSun() {
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.radius = 4;
  sun.shadow.mapSize.set(2048, 2048);
  sun.position.set(1, 1, -1);

  return sun;
}

function createRenderer(w: number, h: number) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(w, h);
  return renderer;
}

function loadTextures() {
  const loader = new THREE.TextureLoader();

  // preload textures
  const textures = [
    loader.load(
      "https://res.cloudinary.com/derfbfm9n/image/upload/v1759845551/Buttons_ewpnnp.png"
    ),
    loader.load(
      "https://res.cloudinary.com/derfbfm9n/image/upload/v1759847198/Symbols_koszhs.png"
    ),
  ];

  return textures;
}

async function loadGLTFModel() {
  const loader = new GLTFLoader();

  const gltf = await loader.loadAsync(
    "https://res.cloudinary.com/derfbfm9n/image/upload/v1759840414/intro-home-section_mio37d.glb"
  );

  return gltf;
}

function fadeBall(material: THREE.MeshStandardMaterial, progress: number) {
  const FADE_START = 0.8;
  const FADE_END = 0.95;

  if (progress >= FADE_START) {
    material.opacity =
      1 - Math.min(1, (progress - FADE_START) / (FADE_END - FADE_START));
  } else {
    material.opacity = 1;
  }
}

let wasFollowing = false;
const lookTarget = new THREE.Vector3();
let transitionProgress = 0; // Track transition between modes

function updateCameraWithScroll(params: {
  camera: THREE.PerspectiveCamera;
  basePosition: THREE.Vector3;
  ballPosition: THREE.Vector3;
  time: number;
  progress: number;
}) {
  const { camera, basePosition, progress, ballPosition } = params;

  const lerpFactor = 0.04;
  const followMode = progress >= 0.6;

  // Smoothly transition between modes
  if (followMode && transitionProgress < 1) {
    transitionProgress = Math.min(1, transitionProgress + 0.02); // Adjust speed here
  } else if (!followMode && transitionProgress > 0) {
    transitionProgress = Math.max(0, transitionProgress - 0.02);
  }

  // Detect transition INTO follow mode
  if (followMode && !wasFollowing) {
    lookTarget
      .copy(camera.position)
      .add(new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
  }

  wasFollowing = followMode;

  // Calculate both camera positions
  const cinematicPosition = new THREE.Vector3(
    basePosition.x,
    basePosition.y,
    basePosition.z
  );

  const height = lerp(3, 6, progress);
  const distance = lerp(6, 142, progress);
  const followOffset = new THREE.Vector3(0, height, distance);
  const followPosition = ballPosition.clone().add(followOffset);

  // Blend between the two positions based on transition progress
  const targetPosition = new THREE.Vector3().lerpVectors(
    cinematicPosition,
    followPosition,
    transitionProgress
  );

  camera.position.lerp(targetPosition, lerpFactor);

  // Blend look targets
  const cinematicLookTarget = new THREE.Vector3(0, 0, 0);
  const followLookTarget = ballPosition.clone();

  lookTarget.lerpVectors(
    cinematicLookTarget,
    followLookTarget,
    transitionProgress
  );

  camera.lookAt(lookTarget);
}
