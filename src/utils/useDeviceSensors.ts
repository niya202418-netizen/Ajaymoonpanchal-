import { useState, useEffect, useRef } from 'react';

export interface DeviceSensorsState {
  isSupported: boolean;
  isEnabled: boolean;
  motionScore: number; // 0 - 100
  micScore: number;    // 0 - 100
  accelX: number;
  accelY: number;
  accelZ: number;
  requestPermission: () => Promise<boolean>;
  toggleEnabled: () => void;
}

export function useDeviceSensors(): DeviceSensorsState {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [motionScore, setMotionScore] = useState<number>(0);
  const [micScore, setMicScore] = useState<number>(0);
  const [accel, setAccel] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  const lastAccelRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const hasMotion = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    setIsSupported(hasMotion);
  }, []);

  // Motion handler
  useEffect(() => {
    if (!isEnabled) {
      setMotionScore(0);
      return;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity || event.acceleration;
      if (!current) return;

      const cx = current.x || 0;
      const cy = current.y || 0;
      const cz = current.z || 0;

      const delta =
        Math.abs(cx - lastAccelRef.current.x) +
        Math.abs(cy - lastAccelRef.current.y) +
        Math.abs(cz - lastAccelRef.current.z);

      lastAccelRef.current = { x: cx, y: cy, z: cz };
      setAccel({ x: cx, y: cy, z: cz });

      // Calculate agitation score (0 - 100)
      const agitation = Math.min(100, Math.round(delta * 12));
      setMotionScore((prev) => Math.round(prev * 0.7 + agitation * 0.3));
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isEnabled]);

  // Request permission (needed on iOS 13+ devices)
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        // @ts-expect-error - iOS specific method
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        // @ts-expect-error - iOS specific method
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setIsEnabled(true);
          return true;
        }
        return false;
      } else {
        // Android or desktop - permission granted automatically
        setIsEnabled(true);
        return true;
      }
    } catch {
      setIsEnabled(true);
      return true;
    }
  };

  const toggleEnabled = () => {
    if (isEnabled) {
      setIsEnabled(false);
      setMotionScore(0);
      setMicScore(0);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    } else {
      requestPermission();
    }
  };

  return {
    isSupported,
    isEnabled,
    motionScore,
    micScore,
    accelX: accel.x,
    accelY: accel.y,
    accelZ: accel.z,
    requestPermission,
    toggleEnabled
  };
}
