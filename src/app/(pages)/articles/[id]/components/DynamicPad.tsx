"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useArticleDetail } from "@/hooks/useArticles";
import type p5Types from "p5";

// Dynamically import react-p5 with no SSR
const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

interface DynamicPadProps {
  theme?: string;
}

const colorPalettes: Record<string, { text_secondary: string }> = {
  dark: { text_secondary: "#ffffff" },
  light: { text_secondary: "#000000" },
};

const DynamicPad: React.FC<DynamicPadProps> = ({ theme = "dark" }) => {
  const params = useParams();
  const id = Number(params?.id);
  const selectedColors = colorPalettes[theme]?.text_secondary || "#000000";
  const hex = selectedColors;
  const alpha = 100;

  const { data: article, isLoading, error } = useArticleDetail(id);

  const [loadedSounds, setLoadedSounds] = useState<any[]>([]);
  const [loadedImage, setLoadedImage] = useState<any>(null);
  const [loadedVideo, setLoadedVideo] = useState<any>(null);
  const [soundStates, setSoundStates] = useState<boolean[]>([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [imageAngle, setImageAngle] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const canvasRef = useRef<any>(null);

  const images = article?.image || [];
  const videos = article?.video || [];
  const audios = article?.audio || [];

  const audioCount = Math.min(audios?.length || 0, 6);
  const keys = [75, 66, 83, 72, 78, 77]; // K, B, S, H, N, M

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      setIsMobile(isMobileDevice);
    };

    checkMobile();
  }, []);

  const preload = (p5: any) => {
    if (audios && audios.length > 0) {
      const sounds: any[] = [];
      const states: boolean[] = [];
      const hasP5Sound = typeof (p5 as any).loadSound === "function";
      for (let i = 0; i < audioCount; i++) {
        try {
          if (hasP5Sound) {
            sounds[i] = (p5 as any).loadSound(audios[i]);
          } else {
            const audio = new Audio(audios[i]);
            audio.loop = true;
            sounds[i] = {
              loop: () => { audio.currentTime = 0; audio.play(); },
              stop: () => { audio.pause(); },
              isPlaying: () => !audio.paused,
              _audio: audio,
            } as any;
          }
          states[i] = false;
        } catch (error) {
          console.error(`Error loading sound ${i}:`, error);
        }
      }
      setLoadedSounds(sounds);
      setSoundStates(states);
    }

    if (images.length > 0) {
      try {
        const img = p5.loadImage(images[0]);
        setLoadedImage(img);
      } catch (error) {
        console.error("Error loading image:", error);
      }
    }

    if (videos.length > 0) {
      try {
        const video = (p5 as any).createVideo([videos[0]]);
        video.hide();
        video.volume(0);
        video.elt.muted = true;
        setLoadedVideo(video);
      } catch (error) {
        console.error("Error loading video:", error);
      }
    }
  };

  const setup = (p5: any, canvasParentRef: Element) => {
    const canvas = p5.createCanvas(
      p5.windowWidth - 180,
      p5.windowHeight * 0.8,
      (p5 as any).WEBGL
    );
    canvas.parent(canvasParentRef);
    canvasRef.current = canvas;

    if ((canvas as any).elt) {
      (canvas as any).elt.addEventListener("touchstart", () => {
        setIsTouching(true);
      });

      (canvas as any).elt.addEventListener("touchend", () => {
        setIsTouching(false);
      });

      (canvas as any).elt.addEventListener("touchmove", (e: TouchEvent) => {
        e.preventDefault();
      });

      (canvas as any).elt.addEventListener("touchcancel", () => {
        setIsTouching(false);
      });
    }
  };

  const windowResized = (p5: any) => {
    p5.resizeCanvas(p5.windowWidth - 40, p5.windowHeight * 0.7);
  };

  useEffect(() => {
    return () => {
      if (loadedVideo) {
        loadedVideo.remove();
      }
    };
  }, [loadedVideo]);

  const draw = (p5: any) => {
    const strokeColor = p5.color(hex);
    strokeColor.setAlpha(alpha);
    p5.background(strokeColor);

    if (isMobile) {
      if (isTouching) {
        if (!soundStates[0] && loadedSounds[0]) {
          loadedSounds[0].loop();
          const newStates = [...soundStates];
          newStates[0] = true;
          setSoundStates(newStates);
        }
      } else {
        if (soundStates[0] && loadedSounds[0]) {
          loadedSounds[0].stop();
          const newStates = [...soundStates];
          newStates[0] = false;
          setSoundStates(newStates);
        }
      }
    }

    if (soundStates[0] && loadedSounds[0]?.isPlaying()) {
      if (!isVideoPlaying && loadedVideo) {
        loadedVideo.volume(0);
        loadedVideo.elt.muted = true;
        loadedVideo.loop();
        setIsVideoPlaying(true);
      }
    } else if (isVideoPlaying && loadedVideo) {
      loadedVideo.pause();
      setIsVideoPlaying(false);
    }

    if (isVideoPlaying && loadedVideo) {
      const aspectRatio = loadedVideo.width / loadedVideo.height || 16 / 9;
      const videoWidth = p5.width;
      const videoHeight = p5.width / aspectRatio;
      const offsetY = -videoHeight / 2;

      p5.push();
      p5.translate(-p5.width / 2, offsetY);
      p5.image(loadedVideo, 0, 0, videoWidth, videoHeight);
      p5.pop();
    }

    for (let i = 0; i < audioCount; i++) {
      if (!isMobile) {
        const key = keys[i];
        if (p5.keyIsDown(key) && !soundStates[i] && loadedSounds[i]) {
          loadedSounds[i].loop();
          const newStates = [...soundStates];
          newStates[i] = true;
          setSoundStates(newStates);
        } else if (!p5.keyIsDown(key) && soundStates[i] && loadedSounds[i]) {
          loadedSounds[i].stop();
          const newStates = [...soundStates];
          newStates[i] = false;
          setSoundStates(newStates);
        }
      }

      if (soundStates[i] && loadedSounds[i]?.isPlaying()) {
        if (i === 0 && loadedImage) {
          p5.push();
          const alpha = p5.map(p5.sin(imageAngle), -1, 1, 100, 255);
          setImageAngle((prev) => prev + 0.02);
          p5.tint(255, alpha);

          const imgW = loadedImage.width;
          const imgH = loadedImage.height;
          const canvasW = p5.width;
          const canvasH = p5.height;
          const scale = Math.max(canvasW / imgW, canvasH / imgH);
          const drawW = imgW * scale;
          const drawH = imgH * scale;

          p5.image(loadedImage, -drawW / 2, -drawH / 2, drawW, drawH);

          p5.noTint();
          p5.pop();
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <span className="mb-4 text-center">
        {audioCount > 0
          ? isMobile
            ? "Touch the screen"
            : `Press the keys: ${audioCount >= 1 ? "K" : ""}${
                audioCount >= 2 ? ", B" : ""
              }${audioCount >= 3 ? ", S" : ""}${audioCount >= 4 ? ", H" : ""}${
                audioCount >= 5 ? ", N" : ""
              }${audioCount >= 6 ? ", M" : ""}.`
          : "No audios available."}
      </span>
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </div>
  );
};

export default DynamicPad;