"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// react-p5 debe cargarse sin SSR
const Sketch = dynamic(() => import("react-p5"), { ssr: false });

export default function GenerativeNature() {
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (dragging) e.preventDefault();
    };

    const opts: AddEventListenerOptions & EventListenerOptions = {
      passive: false,
    };

    window.addEventListener("touchmove", preventDefault, opts);
    return () => window.removeEventListener("touchmove", preventDefault, opts);
  }, [dragging]);

  const setup = (p5: any, canvasParentRef: any) => {
    const canvas = p5
      .createCanvas(window.innerWidth, window.innerHeight)
      .parent(canvasParentRef);

    canvas.style("position", "fixed");
    canvas.style("top", "0");
    canvas.style("left", "0");
    canvas.style("z-index", "-1");
    canvas.style("display", "block");

    p5.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
    p5.smooth();
    p5.noiseDetail(4, 0.5);
    p5.strokeWeight(1.1);
  };

  const draw = (p5: any) => {
    p5.background(8, 12, 18, 16);

    const cx = origin.x || p5.width / 2;
    const cy = origin.y || p5.height / 2;

    const season = p5.constrain(p5.map(cy, 0, p5.height, 0, 1), 0, 1);
    const t = p5.frameCount * 0.02;

    p5.push();
    p5.translate(cx, cy);

    const wingBeat = 0.6 + p5.sin(t * 2.2) * 0.25;

    p5.push();
    p5.stroke(70, 55, 60, 220);
    p5.strokeWeight(1.6);
    p5.line(0, -38, 0, 42);
    p5.strokeWeight(1.2);
    p5.circle(0, -40, 8);
    p5.circle(0, -20, 10);
    p5.circle(0, 10, 12);
    p5.pop();

    p5.push();
    p5.stroke(180, 160, 140, 140);
    p5.noFill();
    p5.bezier(0, -40, -12, -62, -28, -76, -42, -90);
    p5.bezier(0, -40, 12, -62, 28, -76, 42, -90);
    p5.pop();

    const ribs = 140;
    const maxH = 160;

    for (let i = 0; i < ribs; i++) {
      const y = p5.map(i, 0, ribs - 1, -maxH * 0.1, maxH);
      const profile = Math.pow(1 - i / ribs, 0.4);
      const baseW = p5.lerp(120, 170, season) * (0.6 + 0.4 * profile);
      const flow = p5.noise(i * 0.06, t * 0.5);
      const curl = p5.sin(t * 1.4 + i * 0.15) * 6;
      const w = baseW * wingBeat * (1 + flow * 0.25) + curl;

      const leftX = -w;
      const rightX = w;

      const rr = p5.lerp(220, 70, season) * (0.55 + 0.45 * (1 - profile));
      const gg = p5.lerp(140, 160, season) * (0.6 + 0.4 * flow);
      const bb = p5.lerp(80, 210, season) * (0.5 + 0.5 * profile);

      p5.stroke(rr, gg, bb, 170);
      p5.strokeWeight(1.1);
      p5.line(0, y, leftX, y);
      p5.line(0, y, rightX, y);

      if (i % 16 === 0) {
        p5.push();
        p5.noStroke();
        p5.fill(rr * 0.7, gg * 0.7, bb * 0.7, 180);
        p5.circle(leftX, y, 8 + p5.noise(i * 0.1) * 6);
        p5.circle(rightX, y, 8 + p5.noise(i * 0.1 + 50) * 6);
        p5.pop();
      }

      if (i % 9 === 0) {
        p5.push();
        p5.blendMode(p5.ADD);
        p5.stroke(255, 220, 180, 40);
        p5.point(leftX, y);
        p5.point(rightX, y);
        p5.pop();
      }
    }

    p5.pop();

    p5.push();
    p5.translate(cx, cy);
    p5.blendMode(p5.ADD);
    p5.stroke(250, 220, 180, 50);
    for (let k = 0; k < 18; k++) {
      const tip = p5.lerp(80, 140, season);
      const beat = 1 + p5.sin(t * 2.2 + k) * 0.2;
      const ang = (k / 18) * p5.PI - p5.PI / 2;
      const px = p5.cos(ang) * tip * beat;
      const py = p5.sin(ang) * tip * beat;
      p5.point(px, py);
      p5.point(-px, py);
    }
    p5.pop();
  };

  const mousePressed = (p5: any) => {
    setDragging(true);
    setOrigin({ x: p5.mouseX, y: p5.mouseY });
  };

  const mouseReleased = () => {
    setDragging(false);
  };

  const mouseDragged = (p5: any) => {
    if (dragging) {
      setOrigin({ x: p5.mouseX, y: p5.mouseY });
    }
  };

  const windowResized = (p5: any) => {
    p5.resizeCanvas(window.innerWidth, window.innerHeight);
  };

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mousePressed={mousePressed}
      mouseReleased={mouseReleased}
      mouseDragged={mouseDragged}
      windowResized={windowResized}
    />
  );
}
