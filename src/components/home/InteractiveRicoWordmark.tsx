"use client";

import React, { useEffect, useRef } from "react";

const RICO_PATH_D =
  "M60 16h126c36 0 60 22 60 52 0 26-18 46-48 51l52 65h-38l-48-62h-72v62h-32V16zm32 28v50h90c20 0 32-10 32-25 0-15-12-25-32-25H92z M320 16h34v168h-34V16z M608 64h-34c-8-16-28-22-54-22-44 0-64 24-64 58 0 34 20 58 64 58 26 0 46-6 54-22h34c-10 32-42 50-88 50-64 0-98-34-98-86 0-52 34-86 98-86 46 0 78 18 88 50z M788 14c68 0 106 34 106 86 0 52-38 86-106 86-68 0-106-34-106-86 0-52 38-86 106-86zm0 28c-48 0-72 24-72 58 0 34 24 58 72 58 48 0 72-24 72-58 0-34-24-58-72-58z";

interface ErosionNode {
  x: number;
  y: number;
  radius: number;
  age: number;
  holdDuration: number;
  fadeDuration: number;
  lobes: { dx: number; dy: number; r: number }[];
}

interface SmokePlume {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
  maxLife: number;
  swirlFreq: number;
  swirlAmp: number;
  phase: number;
  rotation: number;
  vRot: number;
}

export function InteractiveRicoWordmark() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Extra vertical headroom at top so rising smoke isn't clipped
    const W = 960;
    const H = 260;
    const Y_OFFSET = 46;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;

    // Offscreen canvas for the solid RICO letters
    const wordCanvas = document.createElement("canvas");
    wordCanvas.width = W * dpr;
    wordCanvas.height = H * dpr;
    const wordCtx = wordCanvas.getContext("2d");
    if (!wordCtx) return;

    // Static hit-mask of the RICO letters (1x resolution)
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = W;
    maskCanvas.height = H;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const path = new Path2D(RICO_PATH_D);
    maskCtx.save();
    maskCtx.translate(0, Y_OFFSET);
    maskCtx.fillStyle = "#FFFFFF";
    maskCtx.fill(path, "evenodd");
    maskCtx.lineWidth = 4;
    maskCtx.strokeStyle = "#FFFFFF";
    maskCtx.stroke(path);
    maskCtx.restore();
    const maskData = maskCtx.getImageData(0, 0, W, H).data;

    const isInsideLetter = (x: number, y: number) => {
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= W || iy < 0 || iy >= H) return false;
      return maskData[(iy * W + ix) * 4 + 3] > 20;
    };

    const erosionNodes: ErosionNode[] = [];
    const smokePlumes: SmokePlume[] = [];

    // Check if a point is already completely eroded so we only burst fresh smoke when solid letter dissolves
    const isAlreadyEroded = (x: number, y: number) => {
      for (let i = 0; i < erosionNodes.length; i++) {
        const n = erosionNodes[i];
        if (n.age < n.holdDuration) {
          const dist = Math.hypot(x - n.x, y - n.y);
          if (dist < n.radius * 0.55) return true;
        }
      }
      return false;
    };

    const mouse = {
      x: -9999,
      y: -9999,
      px: -9999,
      py: -9999,
      vx: 0,
      vy: 0,
      inside: false,
    };

    const dissolveAtPoint = (cx: number, cy: number, vx: number, vy: number) => {
      const touchRadius = 56;

      // Create an organic multi-lobe erosion node that 100% erases the solid letter where touched
      const lobes: { dx: number; dy: number; r: number }[] = [];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + Math.random() * 0.8;
        const d = 10 + Math.random() * 18;
        lobes.push({
          dx: Math.cos(a) * d,
          dy: Math.sin(a) * d,
          r: 28 + Math.random() * 18,
        });
      }

      // Convert any solid letter pixels inside this touch zone into smoke plumes
      let hitSolidLetter = false;
      for (let s = 0; s < 22; s++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * touchRadius;
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist;

        if (isInsideLetter(sx, sy)) {
          hitSolidLetter = true;
          const fresh = !isAlreadyEroded(sx, sy);
          if ((fresh || Math.random() < 0.25) && smokePlumes.length < 450) {
            // Spawn both dense core smoke and wide billowing smoke clouds
            smokePlumes.push({
              x: sx + (Math.random() - 0.5) * 6,
              y: sy + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.8 + vx * 0.12,
              vy: -0.9 - Math.random() * 2.4 + Math.min(0, vy * 0.08),
              radius: 10 + Math.random() * 12,
              maxRadius: 42 + Math.random() * 38,
              alpha: fresh ? 0.65 + Math.random() * 0.25 : 0.3 + Math.random() * 0.2,
              life: 0,
              maxLife: 50 + Math.random() * 45,
              swirlFreq: 0.05 + Math.random() * 0.06,
              swirlAmp: 0.5 + Math.random() * 0.9,
              phase: Math.random() * Math.PI * 2,
              rotation: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.04,
            });
          }
        }
      }

      if (hitSolidLetter) {
        erosionNodes.push({
          x: cx,
          y: cy,
          radius: touchRadius,
          age: 0,
          holdDuration: 95, // Stays 100% converted to smoke for ~1.6s before reforming
          fadeDuration: 75, // Smoothly reforms over ~1.2s
          lobes,
        });
        if (erosionNodes.length > 260) {
          erosionNodes.shift();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const nx = (e.clientX - rect.left) * scaleX;
      const ny = (e.clientY - rect.top) * scaleY;

      if (!mouse.inside) {
        mouse.px = nx;
        mouse.py = ny;
      } else {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
      }

      mouse.vx = nx - mouse.px;
      mouse.vy = ny - mouse.py;
      mouse.x = nx;
      mouse.y = ny;
      mouse.inside = true;

      // Interpolate along the cursor path so fast sweeps completely turn the touched path into smoke
      const dist = Math.hypot(nx - mouse.px, ny - mouse.py);
      const steps = Math.max(1, Math.ceil(dist / 14));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const ix = mouse.px + (nx - mouse.px) * t;
        const iy = mouse.py + (ny - mouse.py) * t;
        dissolveAtPoint(ix, iy, mouse.vx, mouse.vy);
      }
    };

    const handleMouseLeave = () => {
      mouse.inside = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let rafId = 0;

    const render = () => {
      if (mouse.inside) {
        dissolveAtPoint(mouse.x, mouse.y, mouse.vx * 0.5, mouse.vy * 0.5);
      }

      // 1. Draw the 100% solid, razor-sharp RICO wordmark onto wordCanvas
      wordCtx.save();
      wordCtx.scale(dpr, dpr);
      wordCtx.clearRect(0, 0, W, H);

      wordCtx.save();
      wordCtx.translate(0, Y_OFFSET);

      const fillGrad = wordCtx.createLinearGradient(0, 14, 0, 186);
      fillGrad.addColorStop(0, "rgba(255, 255, 255, 0.94)");
      fillGrad.addColorStop(0.55, "rgba(226, 238, 251, 0.58)");
      fillGrad.addColorStop(1, "rgba(180, 207, 238, 0.22)");

      const strokeGrad = wordCtx.createLinearGradient(0, 14, 0, 186);
      strokeGrad.addColorStop(0, "rgba(255, 255, 255, 0.96)");
      strokeGrad.addColorStop(0.6, "rgba(226, 238, 251, 0.55)");
      strokeGrad.addColorStop(1, "rgba(255, 255, 255, 0.18)");

      wordCtx.fillStyle = fillGrad;
      wordCtx.fill(path, "evenodd");
      wordCtx.strokeStyle = strokeGrad;
      wordCtx.lineWidth = 1.6;
      wordCtx.lineJoin = "round";
      wordCtx.stroke(path);
      wordCtx.restore();

      // 2. Completely erase (100% alpha destination-out) whatever part the mouse touched
      wordCtx.globalCompositeOperation = "destination-out";
      for (let i = erosionNodes.length - 1; i >= 0; i--) {
        const node = erosionNodes[i];
        node.age += 1;
        const totalLife = node.holdDuration + node.fadeDuration;
        if (node.age >= totalLife) {
          erosionNodes.splice(i, 1);
          continue;
        }

        // During holdDuration, strength is 1.0 (100% complete erasure of the solid letter)
        const strength =
          node.age <= node.holdDuration
            ? 1.0
            : 1.0 - (node.age - node.holdDuration) / node.fadeDuration;

        // Draw main core erasure + organic cloud lobes so the edge looks like vaporizing smoke
        const drawErodeCircle = (cx: number, cy: number, r: number) => {
          const g = wordCtx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
          g.addColorStop(0, `rgba(0, 0, 0, ${strength.toFixed(3)})`);
          g.addColorStop(0.7, `rgba(0, 0, 0, ${(strength * 0.92).toFixed(3)})`);
          g.addColorStop(1, "rgba(0, 0, 0, 0)");
          wordCtx.fillStyle = g;
          wordCtx.beginPath();
          wordCtx.arc(cx, cy, r, 0, Math.PI * 2);
          wordCtx.fill();
        };

        drawErodeCircle(node.x, node.y, node.radius);
        for (let l = 0; l < node.lobes.length; l++) {
          const lobe = node.lobes[l];
          drawErodeCircle(node.x + lobe.dx, node.y + lobe.dy, lobe.r);
        }
      }
      wordCtx.globalCompositeOperation = "source-over";
      wordCtx.restore();

      // 3. Draw the remaining solid wordmark + the billowing smoke onto the visible canvas
      ctx.save();
      ctx.clearRect(0, 0, W * dpr, H * dpr);
      ctx.drawImage(wordCanvas, 0, 0);

      ctx.scale(dpr, dpr);
      for (let i = smokePlumes.length - 1; i >= 0; i--) {
        const p = smokePlumes[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          smokePlumes.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        // Curl-like turbulent horizontal drift + upward buoyancy
        p.x += p.vx + Math.sin(p.life * p.swirlFreq + p.phase) * p.swirlAmp;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.992;
        p.rotation += p.vRot;

        const curR = p.radius + (p.maxRadius - p.radius) * Math.pow(progress, 0.75);
        const fadeIn = Math.min(1, p.life / 4);
        const fadeOut = Math.pow(1 - progress, 1.35);
        const curA = p.alpha * fadeIn * fadeOut;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, curR);
        sg.addColorStop(0, `rgba(244, 248, 255, ${curA.toFixed(3)})`);
        sg.addColorStop(0.38, `rgba(210, 228, 248, ${(curA * 0.68).toFixed(3)})`);
        sg.addColorStop(0.72, `rgba(165, 195, 230, ${(curA * 0.28).toFixed(3)})`);
        sg.addColorStop(1, "rgba(165, 195, 230, 0)");

        ctx.fillStyle = sg;
        ctx.beginPath();
        // Slightly elliptical puff for realistic swirling smoke texture
        ctx.ellipse(0, 0, curR * 1.15, curR * 0.88, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      mouse.vx *= 0.8;
      mouse.vy *= 0.8;
      ctx.restore();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      data-pencil-id="x8NFzs"
      data-pencil-name="Footer Giant Wordmark Wrap"
      className="box-border w-full py-2 sm:h-[184px] shrink-0 overflow-visible relative flex justify-center items-center"
    >
      <canvas
        ref={canvasRef}
        className="w-full max-w-[780px] h-auto aspect-[960/260] select-none"
        style={{
          filter: "drop-shadow(0px 8px 32px rgba(226, 238, 251, 0.16))",
        }}
      />
    </div>
  );
}
