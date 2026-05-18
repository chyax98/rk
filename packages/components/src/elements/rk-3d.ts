// ─── rk-3d — Interactive 3D scene (Three.js CDN) ──────────────────

type Vec3Like = { set: (x: number, y: number, z: number) => void };
type MeshLike = { rotation: { x: number; y: number }; position: Vec3Like; type?: string };
type RendererLike = {
  setPixelRatio: (ratio: number) => void;
  setSize: (width: number, height: number) => void;
  render: (scene: SceneLike, camera: CameraLike) => void;
};
type CameraLike = { position: Vec3Like; aspect: number; updateProjectionMatrix: () => void };
type DirectionalLightLike = { position: Vec3Like };
type SceneLike = { background: null; add: (object: unknown) => void; children: MeshLike[] };
type ThreeModule = {
  WebGLRenderer: new (options: {
    canvas: HTMLCanvasElement;
    antialias: boolean;
    alpha: boolean;
  }) => RendererLike;
  PerspectiveCamera: new (fov: number, aspect: number, near: number, far: number) => CameraLike;
  Scene: new () => SceneLike;
  AmbientLight: new (color: number, intensity: number) => unknown;
  DirectionalLight: new (color: number, intensity: number) => DirectionalLightLike;
  SphereGeometry: new (...args: number[]) => unknown;
  TorusGeometry: new (...args: number[]) => unknown;
  IcosahedronGeometry: new (...args: number[]) => unknown;
  BoxGeometry: new (...args: number[]) => unknown;
  MeshPhongMaterial: new (options: { color: number; shininess: number }) => unknown;
  Mesh: new (geometry: unknown, material: unknown) => MeshLike;
};

class RkThreeD extends HTMLElement {
  private _rendered = false;

  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this._render();
  }

  private _render() {
    const scene = this.getAttribute('scene') || 'cube';
    const height = this.getAttribute('height') || '360';
    const caption = this.getAttribute('caption') || '';
    const color = this.getAttribute('color') || '#6366f1';
    const uid = Math.random().toString(36).slice(2, 9);

    this.innerHTML = `
      <div class="rk-3d">
        <canvas class="rk-3d__canvas" id="rk3d-${uid}" height="${height}" style="width:100%;height:${height}px;display:block;"></canvas>
        ${caption ? `<p class="rk-3d__caption">${this._escape(caption)}</p>` : ''}
      </div>`;

    this._loadThree(uid, scene, color, parseInt(height, 10));
  }

  private async _loadThree(uid: string, scene: string, color: string, height: number) {
    try {
      const THREE = (await import(
        'https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js'
      )) as unknown as ThreeModule;
      const canvas = this.querySelector(`#rk3d-${uid}`) as HTMLCanvasElement;
      if (!canvas) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth || 600, height);

      const camera = new THREE.PerspectiveCamera(
        60,
        (canvas.clientWidth || 600) / height,
        0.1,
        100,
      );
      camera.position.set(0, 0, 3);

      const threeScene = new THREE.Scene();
      threeScene.background = null;

      // Lighting
      threeScene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(5, 5, 5);
      threeScene.add(dirLight);

      // Geometry based on scene type
      let geo: unknown;
      if (scene === 'sphere') geo = new THREE.SphereGeometry(1, 32, 32);
      else if (scene === 'torus') geo = new THREE.TorusGeometry(0.7, 0.3, 16, 100);
      else if (scene === 'orbit') geo = new THREE.IcosahedronGeometry(0.8, 1);
      else geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);

      const hex = parseInt(color.replace('#', ''), 16);
      const mat = new THREE.MeshPhongMaterial({ color: hex, shininess: 80 });
      const mesh = new THREE.Mesh(geo, mat);
      threeScene.add(mesh);

      // Orbit: add orbiting spheres
      if (scene === 'orbit') {
        const orbitGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d];
        for (let i = 0; i < 3; i++) {
          const orbitMat = new THREE.MeshPhongMaterial({ color: colors[i] });
          const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
          const angle = (i / 3) * Math.PI * 2;
          orbitMesh.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
          threeScene.add(orbitMesh);
        }
      }

      // Mouse interaction
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;
      canvas.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      canvas.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isDragging) return;
        mesh.rotation.y += (e.clientX - lastX) * 0.01;
        mesh.rotation.x += (e.clientY - lastY) * 0.01;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      canvas.addEventListener('mouseup', () => {
        isDragging = false;
      });
      canvas.addEventListener('mouseleave', () => {
        isDragging = false;
      });

      // Touch support
      canvas.addEventListener(
        'touchstart',
        (e: TouchEvent) => {
          if (e.touches.length === 1) {
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
          }
        },
        { passive: true },
      );
      canvas.addEventListener(
        'touchmove',
        (e: TouchEvent) => {
          if (!isDragging || e.touches.length !== 1) return;
          mesh.rotation.y += (e.touches[0].clientX - lastX) * 0.01;
          mesh.rotation.x += (e.touches[0].clientY - lastY) * 0.01;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        },
        { passive: true },
      );
      canvas.addEventListener('touchend', () => {
        isDragging = false;
      });

      // Animate
      const animate = () => {
        requestAnimationFrame(animate);
        if (!isDragging) {
          mesh.rotation.x += 0.005;
          mesh.rotation.y += 0.008;
        }
        // Animate orbit children
        if (scene === 'orbit') {
          const children = threeScene.children.filter(
            (c: MeshLike) => c !== mesh && c.type === 'Mesh',
          );
          children.forEach((child: MeshLike, i: number) => {
            const t = Date.now() * 0.001 + (i / 3) * Math.PI * 2;
            child.position.set(Math.cos(t) * 1.5, Math.sin(t * 0.7) * 0.3, Math.sin(t) * 1.5);
          });
        }
        renderer.render(threeScene, camera);
      };
      animate();

      // Resize observer
      const ro = new ResizeObserver(() => {
        const w = canvas.clientWidth || 600;
        renderer.setSize(w, height);
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
      });
      if (canvas.parentElement) ro.observe(canvas.parentElement);
    } catch {
      const canvas = this.querySelector('.rk-3d__canvas');
      if (canvas) {
        canvas.insertAdjacentHTML(
          'afterend',
          '<p style="color:#999;font-size:0.8rem;text-align:center;padding:1rem">3D 需要 WebGL 支持和 Three.js CDN 加载</p>',
        );
      }
    }
  }

  private _escape(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

customElements.define('rk-3d', RkThreeD);

export { RkThreeD };
