import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState } from "react";
import './App.css';

function App() {
  const [color, setColor] = useState(0x156289);
  // use radians internally, show degrees on sliders
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);

  const mountRef = useRef(null);
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const cubeRef = useRef();
  //
  const [fruitAffinities, setFruitAffinities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function handleColorChange(event) {
    console.log(event.target.value);
    setColor(event.target.value);
  }

  function handleXRotationChange(event) {
    // console.log(event.target.value);
    const x_rad = THREE.MathUtils.degToRad(parseInt(event.target.value));
    console.log("x rad: ", x_rad);
    setRotationX(x_rad);
  }

  function handleYRotationChange(event) {
    const y_rad = THREE.MathUtils.degToRad(parseInt(event.target.value));
    console.log("x rad: ", y_rad);
    setRotationY(y_rad);
  }

  function handleZRotationChange(event) {
    const z_rad = THREE.MathUtils.degToRad(parseInt(event.target.value));
    console.log("z rad: ", z_rad);
    setRotationZ(z_rad);
  }

  const rotationRef = useRef({x: 0, y: 0, z: 0});
  const colorRef = useRef(color);

  useEffect(() => {
    console.log('rotation ref useEffect');
    rotationRef.current = { x: rotationX, y: rotationY, z: rotationZ };
  },[rotationX,rotationY,rotationZ]);

  useEffect(() => {
    colorRef.current = color
  },[color]);

  useEffect(() => {
    const url = "https://datafruits.streampusher.com/api/djs/mcfiredrill.json?name=mcfiredrill";
    fetch(url).then((res) => {
      console.log(res);
      if(!res.ok) {
        throw new Error('fetch error: ', res.status);
      }
      return res.json();
    }).then((data) => {
      console.log('data: ', data);
      setFruitAffinities(data.data.attributes.fruits_affinity);
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {};
  }, []);

  useEffect(() => {
    if (rendererRef.current) return;

    const mount = mountRef.current;
    if(!mount) return;
    console.log('hey');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7fafc);
    sceneRef.current = scene;

    // Ground (subtle) so the standard material has something to reflect
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.51;
    scene.add(ground);

    //lights
    const ambient = new THREE.AmbientLight(0x222222, 4);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(0, 0, 6);
    scene.add(light);

    const light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(120, 130, -130);
    scene.add(light2);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 1, 6);
    cameraRef.current = camera;

    // webgl renderer
    console.log("making new renderer...");
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    //document.body.appendChild(renderer.domElement);
    console.log('this is the mount: ', mount);
    mount.appendChild(renderer.domElement);
    console.log('appended renderer');
    rendererRef.current = renderer;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const geometry = new THREE.BufferGeometry();
    // const vertices = new Float32Array([
    //   -1.0, -1.0,  1.0, // v0
    //   1.0, -1.0,  1.0, // v1
    //   1.0,  1.0,  1.0, // v2
    //   1.0,  1.0,  1.0, // v3
    //   -1.0,  1.0,  1.0, // v4
    //   -1.0, -1.0,  1.0  // v5
    // ]);

    // geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.MeshStandardMaterial({
      // color: 0x156289,
      color: color,
      metalness: 0.6,
      roughness: 0.25
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controls.autoRotate = true;

    let reqId = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      console.log("rotationX ref: ", rotationRef.current.x);
      //cube.rotation.x = rotationX;
      // cube.rotation.y += 0.01;
      cube.rotation.x = rotationRef.current.x;
      cube.rotation.y = rotationRef.current.y;
      cube.rotation.z = rotationRef.current.z;
      cube.material.color.set(colorRef.current);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      console.log('teardown');
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer) {
        renderer.forceContextLoss(); // 🔥 critical
        renderer.dispose();
      }

      if(renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      rendererRef.current = null;
      scene.clear();
    };
  }, [color]);

  return (
    <div className="App">
      <div className="sidebar">
        <h1>hey</h1>
        <div key="loading">
          {loading && <p>Loading…</p>}
        </div>
        <div key="error">
          {error && <p>Error: {error}</p>}
        </div>
        {Object.entries(fruitAffinities).map(([fruit, score]) => (
          <li key={fruit}>
            <strong>{fruit}: </strong>{score}
          </li>
        ))}
        <div>
          <input type="color" onChange={handleColorChange} />
        </div>
        <div key="x-rotate">
          <input type="range" id="x-rotate" onChange={handleXRotationChange} min="0" max="360" />
          <label htmlFor="x-rotate">X</label>
        </div>
        <div key="y-rotate">
          <input id="y-rotate" type="range" onChange={handleYRotationChange} min="0" max="360" />
          <label htmlFor="y-rotate">Y</label>
        </div>
        <div key="z-rotate">
          <input id="z-rotate" type="range" onChange={handleZRotationChange} min="0" max="360" />
          <label htmlFor="z-rotate">Z</label>
        </div>
      </div>
      <div className="viewport" ref={mountRef}>
      </div>
    </div>
  );
}

export default App;
