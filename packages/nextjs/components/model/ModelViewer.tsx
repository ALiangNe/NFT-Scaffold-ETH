
'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ModelViewerProps {
  modelPath: string;
}

const ModelViewer = ({ modelPath }: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.001, // 降低近平面距离，允许更近的观察
      10000   // 增加远平面距离，允许更远的观察
    );
    camera.position.z = 10;

    // 创建渲染器并启用物理光照
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    containerRef.current.appendChild(renderer.domElement);

    // 光照系统
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(0, 5, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, 0, 2);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 2, -5);
    scene.add(backLight);

    // 修改轨道控制器设置
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // 移除最小和最大距离限制
    controls.minDistance = 0;  // 允许无限接近
    controls.maxDistance = Infinity; // 允许无限远离
    // 添加平滑缩放
    controls.zoomSpeed = 1.0; // 调整缩放速度
    controls.enableZoom = true; // 确保启用缩放

    // 加载模型
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        scene.add(gltf.scene);
        
        // 材质调整
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              child.material.metalness = 0.3;
              child.material.roughness = 0.4;
              child.material.envMapIntensity = 1.2;
            }
          }
        });
        
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const scale = 1.2;
        gltf.scene.scale.set(scale, scale, scale);
        
        const maxDim = Math.max(size.x, size.y, size.z) * scale;
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2) / 2);
        
        camera.position.z = cameraZ * 2.5;
        camera.updateProjectionMatrix();
        
        gltf.scene.position.x = -center.x * scale;
        gltf.scene.position.y = -center.y * scale;
        gltf.scene.position.z = -center.z * scale;
        
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0;
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
    };
  }, [modelPath]);

  return <div ref={containerRef} className="w-full h-full absolute inset-0" />;
};

export default ModelViewer;