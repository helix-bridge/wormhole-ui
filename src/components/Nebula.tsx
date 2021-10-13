/* eslint-disable */
import { useEffect } from 'react';

function draw() {
  const canvas = document.querySelector('canvas');
  if (typeof canvas?.getContext === 'undefined') {
    return;
  }
  const ctx = canvas.getContext('2d');

  // Canvas Resize
  function fitCanvasSize() {
    canvas!.width = document.documentElement.clientWidth;
    canvas!.height = document.documentElement.clientHeight;
  }
  fitCanvasSize();
  window.onresize = fitCanvasSize;

  // RequestAnimationFrame
  (function () {
    const requestAnimationFrame =
      window.requestAnimationFrame ||
      (window as any).mozRequestAnimationFrame ||
      (window as any).webkitRequestAnimationFrame ||
      (window as any).msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
  })();

  const colors = ['#000030', '#4d4398', '#4784bf', '#000030', '#4d4398', '#ffffff'];

  function randomIntFromRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function randomColor(colors: string | any[]) {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Objects
  function Particle(this: any, x: number, y: number, radius: number, color: any) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.radians = Math.random() * Math.PI * 2;
    this.velocity = 0.001;
    this.distanceFormCenter = randomIntFromRange(10, canvas!.width / 2 + 100);

    this.update = () => {
      // Move points over time
      this.radians += this.velocity;

      //Circular Motion
      this.x = Math.cos(this.radians) * this.distanceFormCenter + canvas!.width / 2;
      this.y = Math.sin(this.radians) * this.distanceFormCenter + canvas!.height / 2;
      this.draw();
    };

    this.draw = () => {
      ctx!.beginPath();
      ctx!.fillStyle = this.color;
      ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx!.globalAlpha = 0.8;
      ctx!.fill();
    };
  }

  // Implementation
  let perticles: any[];
  function init() {
    perticles = [];

    for (let i = 0; i < 1200; i++) {
      const radius = Math.random() + 0.5;
      // @ts-ignore
      perticles.push(new Particle(canvas.width / 2, canvas.height / 2, radius, randomColor(colors)));
    }
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const g = ctx!.createLinearGradient(0, 0, canvas!.width, canvas!.height);
    g.addColorStop(0, 'rgba(19,27,35,.05)');
    g.addColorStop(1, 'rgba(10,20,67,.05)');
    ctx!.fillStyle = g;
    ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
    perticles.forEach((perticles: { update: () => void }) => {
      perticles.update();
    });
  }

  init();
  animate();
}

export function Nebula() {
  useEffect(() => {
    draw();
  }, []);
  return <canvas id="nebula" className="fixed inset-0 opacity-40"></canvas>;
}
