import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useSmoothCamera } from "../hooks/useSmoothCamera";
import { getElementProgress } from "../utils/scroll";
import { lerp } from "three/src/math/MathUtils.js";
import { createRollingMotion, createRollingMotionByPos } from "../utils/3d";

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
    let mixer: THREE.AnimationMixer | null = null;
    let clip: THREE.AnimationClip | undefined;

    if (!mount) return;

    const texLoader = new THREE.TextureLoader();

    // preload textures
    const textures = [
      texLoader.load(
        "https://res.cloudinary.com/derfbfm9n/image/upload/v1759845551/Buttons_ewpnnp.png"
      ),
      texLoader.load(
        "https://res.cloudinary.com/derfbfm9n/image/upload/v1759847198/Symbols_koszhs.png"
      ),
    ];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.castShadow = true;
    sun.shadow.radius = 4;
    sun.shadow.mapSize.set(2048, 2048);
    sun.position.set(1, 1, -1);
    scene.add(sun);
    scene.add(ambientLight);

    const loader = new GLTFLoader();

    loader.load(
      "https://res.cloudinary.com/derfbfm9n/image/upload/v1759840414/intro-home-section_mio37d.glb",
      (gltf) => {
        setGlbLoaded(true);
        const sceneModel = scene.add(gltf.scene);
        const bigBall = sceneModel.getObjectByName(
          "BigBall"
        ) as THREE.Mesh | null;

        const surface = sceneModel.getObjectByName("Cube");
        bigBall!.castShadow = true;
        surface!.receiveShadow = true;
        surface!.material = new THREE.ShadowMaterial({ opacity: 0.6 });

        renderer.render(scene, camera);
        let clock = new THREE.Clock();

        if (bigBall) {
          mixer = new THREE.AnimationMixer(bigBall);
          clip = gltf.animations.find((c) => c.name === "Sphere.001Action");
          if (clip) {
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.clampWhenFinished = false;
            action.play();
          }

          //change texture
          const material = bigBall.material as THREE.MeshStandardMaterial; // reference to its existing material
          material.metalness = 0.8;
          material.roughness = 0.2;
          material.map = textures[0];
          material.needsUpdate = true;

          let currentIndex = 0;

          setInterval(() => {
            currentIndex = (currentIndex + 1) % textures.length;
            material.map = textures[currentIndex];
            material.needsUpdate = true;
          }, 500);
        }

        function animate() {
          if (!bigBall) return;
          requestAnimationFrame(animate);

          const t = clock.getElapsedTime();

          const { position } = getCameraTransform(t);

          const progress = getElementProgress(stickyHomeIntroEl!);

          const target =
            progress >= 0.5
              ? new THREE.Vector3(0, lerp(0, 5, progress), 0.01) // scroll-controlled target
              : position; // time-controlled target

          camera.position.lerp(target, 0.1); // smooth 10% toward target per frame

          // Optionally update lookAt smoothly too:
          const lookAtTarget = new THREE.Vector3(0, 0, 0); // or blend with your `lookAt`
          camera.lookAt(lookAtTarget);

          if (progress >= 0.5 && progress <= 1) {
            //camera.position.y = lerp(1, 3, camera.position.y);
            sun.position.x = lerp(-5, 5, progress);
            sun.position.y = lerp(5, 10, progress);
            const { position: ballPos, rotation } = rollingMotionWithScroll(
              bigBall.position.x + progress * 0.05,
              bigBall.position.y
            );

            bigBall.position.copy(ballPos);
            bigBall.rotation.z += rotation.z;
          } else {
            //camera.position.set(position.x, position.y, position.z);
            //camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
            //camera.lookAt(0, 0, 0);
            const { position: ballPos, rotation } = rollingMotion(
              t,
              bigBall.position.y
            );

            bigBall.position.copy(ballPos);
            bigBall.rotation.z += rotation.z;
          }
          if (mixer && clip) {
            const totalFrames = clip.tracks[0].times.length;
            const frameIndex = Math.floor(progress * (totalFrames - 1));

            mixer.setTime(clip.duration * progress);
          }

          //if (mixer) mixer.update(delta * 1200);
          renderer.render(scene, camera);
        }

        //animate();
      }
    );

    // camera.position.z = 6.5;
    // camera.position.y = 1.4;
    // camera.position.x = 0;

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
            width: "200px",
            height: "200px",
            background: "blue",
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
      0% { background:white; }
      50% { background:#869997; }
      100% { background:#5cbfb8 }
    }
  `}
          </style>
        </div>
      )}
    </>
  );
}
