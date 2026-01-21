
import React, { useEffect, useRef, useCallback } from 'react';
import { GameStatus, Pipe } from '../types.ts';
import { 
  GRAVITY, 
  JUMP_STRENGTH, 
  PIPE_WIDTH, 
  PIPE_GAP, 
  PIPE_SPACING, 
  INITIAL_SPEED, 
  SHIP_WIDTH, 
  SHIP_HEIGHT,
  SPEED_INCREMENT_FACTOR
} from '../constants.ts';

interface GameCanvasProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shipRef = useRef({ 
    y: 0, 
    velocity: 0, 
    rotation: 0 
  });
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const starsRef = useRef<{ x: number, y: number, size: number, speed: number, opacity: number }[]>([]);

  // Initialize stars for background
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.5,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
    starsRef.current = stars;
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    shipRef.current = {
      y: canvas.height / 2,
      velocity: 0,
      rotation: 0
    };
    pipesRef.current = [];
    scoreRef.current = 0;
    onScoreUpdate(0);
  }, [onScoreUpdate]);

  const jump = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    shipRef.current.velocity = JUMP_STRENGTH;
  }, [status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      resetGame();
    }
  }, [status, resetGame]);

  useEffect(() => {
    const handleInput = (e: MouseEvent | TouchEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          jump();
        }
      } else {
        // Only prevent default on touch to avoid issues with buttons in overlay
        if (status === GameStatus.PLAYING) {
          e.preventDefault();
          jump();
        }
      }
    };
    
    window.addEventListener('keydown', handleInput);
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', handleInput, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('mousedown', handleInput);
      window.removeEventListener('touchstart', handleInput);
    };
  }, [jump, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (status === GameStatus.START) {
        shipRef.current.y = canvas.height / 2;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      if (!ctx || !canvas) return;
      
      // 1. Draw Space Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars Parallax
      starsRef.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (status === GameStatus.PLAYING) {
          star.x -= star.speed;
          if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * canvas.height;
          }
        }
      });

      if (status === GameStatus.PLAYING) {
        // 2. Physics & Logic
        const difficultyLevel = Math.floor(scoreRef.current / 5);
        // Speed scales 20% faster than before (0.5 -> 0.6)
        const currentSpeed = INITIAL_SPEED + (difficultyLevel * 0.6);

        // Update Ship
        shipRef.current.velocity += GRAVITY;
        shipRef.current.y += shipRef.current.velocity;
        // Ship tilts based on velocity
        shipRef.current.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, shipRef.current.velocity * 0.08));

        // Generate Pipes
        if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < canvas.width - PIPE_SPACING) {
          const margin = 150;
          const gapTop = margin + Math.random() * (canvas.height - PIPE_GAP - margin * 2);
          pipesRef.current.push({
            x: canvas.width,
            y: 0,
            width: PIPE_WIDTH,
            height: canvas.height,
            gapTop: gapTop,
            passed: false
          });
        }

        // Update Pipes
        pipesRef.current.forEach((pipe) => {
          pipe.x -= currentSpeed;

          // Score check
          if (!pipe.passed && pipe.x + PIPE_WIDTH < 100) {
            pipe.passed = true;
            scoreRef.current += 1;
            onScoreUpdate(scoreRef.current);
          }

          // Collision check
          const shipX = 100;
          const shipY = shipRef.current.y;
          const padding = 8; // Friendly collision box
          
          const isCollidingPipe = (
            shipX + SHIP_WIDTH - padding > pipe.x &&
            shipX + padding < pipe.x + pipe.width &&
            (shipY + padding < pipe.gapTop || shipY + SHIP_HEIGHT - padding > pipe.gapTop + PIPE_GAP)
          );

          if (isCollidingPipe || shipY < -50 || shipY + SHIP_HEIGHT > canvas.height + 50) {
            onGameOver(scoreRef.current);
          }
        });

        // Remove offscreen pipes
        if (pipesRef.current[0] && pipesRef.current[0].x < -PIPE_WIDTH - 100) {
          pipesRef.current.shift();
        }
      }

      // 3. Render
      // Draw Pipes
      pipesRef.current.forEach(pipe => {
        ctx.save();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';

        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        pipeGradient.addColorStop(0, '#1e293b');
        pipeGradient.addColorStop(0.5, '#3b82f6');
        pipeGradient.addColorStop(1, '#1e293b');

        ctx.fillStyle = pipeGradient;
        
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapTop);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.gapTop + PIPE_GAP, pipe.width, canvas.height - (pipe.gapTop + PIPE_GAP));
        
        // Detail lines on pipes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for(let i=1; i<4; i++) {
            const lx = pipe.x + (pipe.width * i / 4);
            ctx.beginPath();
            ctx.moveTo(lx, 0); ctx.lineTo(lx, pipe.gapTop);
            ctx.moveTo(lx, pipe.gapTop + PIPE_GAP); ctx.lineTo(lx, canvas.height);
            ctx.stroke();
        }

        // Pipe caps
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(pipe.x - 4, pipe.gapTop - 12, pipe.width + 8, 12);
        ctx.fillRect(pipe.x - 4, pipe.gapTop + PIPE_GAP, pipe.width + 8, 12);
        
        ctx.restore();
      });

      // Draw Ship
      const shipX = 100;
      const shipY = shipRef.current.y;
      
      ctx.save();
      ctx.translate(shipX + SHIP_WIDTH / 2, shipY + SHIP_HEIGHT / 2);
      ctx.rotate(shipRef.current.rotation);

      // Ship Engine Glow
      if (status === GameStatus.PLAYING) {
        ctx.save();
        const flicker = Math.random() * 10;
        const engineGrad = ctx.createRadialGradient(-SHIP_WIDTH/2, 0, 0, -SHIP_WIDTH/2, 0, 20 + flicker);
        engineGrad.addColorStop(0, '#fbbf24');
        engineGrad.addColorStop(0.5, '#f59e0b');
        engineGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = engineGrad;
        ctx.beginPath();
        ctx.arc(-SHIP_WIDTH/2, 0, 20 + flicker, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ship Body (Futuristic Jet Shape)
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#3b82f6';
      
      // Main Hull
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-SHIP_WIDTH/2, -SHIP_HEIGHT/3);
      ctx.lineTo(SHIP_WIDTH/2, 0); // Nose
      ctx.lineTo(-SHIP_WIDTH/2, SHIP_HEIGHT/3);
      ctx.lineTo(-SHIP_WIDTH/3, 0);
      ctx.closePath();
      ctx.fill();

      // Wing details
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(-SHIP_WIDTH/4, -SHIP_HEIGHT/4);
      ctx.lineTo(0, -SHIP_HEIGHT/8);
      ctx.lineTo(-SHIP_WIDTH/4, 0);
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(SHIP_WIDTH/8, 0, SHIP_WIDTH/6, SHIP_HEIGHT/10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Cockpit Shine
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(SHIP_WIDTH/6, -2, SHIP_WIDTH/12, SHIP_HEIGHT/20, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [status, onGameOver, onScoreUpdate]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full cursor-pointer"
    />
  );
};

export default GameCanvas;
