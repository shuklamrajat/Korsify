import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Star, 
  Award, 
  CheckCircle, 
  Zap, 
  Target,
  Crown,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
}

interface CelebrationEffectProps {
  isVisible: boolean;
  type: 'lesson' | 'module' | 'course' | 'quiz' | 'achievement';
  title: string;
  description?: string;
  points?: number;
  onComplete?: () => void;
  duration?: number;
}

const COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'
];

const ACHIEVEMENT_ICONS = {
  lesson: CheckCircle,
  module: Target,
  course: Trophy,
  quiz: Star,
  achievement: Award
};

export function CelebrationEffect({ 
  isVisible, 
  type, 
  title, 
  description, 
  points = 0, 
  onComplete,
  duration = 4000 
}: CelebrationEffectProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showCard, setShowCard] = useState(false);
  const [animate, setAnimate] = useState(false);
  const animationRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cardTimeoutRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>();

  const Icon = ACHIEVEMENT_ICONS[type];

  // Generate confetti particles
  const generateConfetti = () => {
    const particles: Confetti[] = [];
    const particleCount = type === 'course' ? 100 : type === 'module' ? 80 : 60;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.8 + 0.6,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: Math.random() * 3 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle'
      });
    }
    
    return particles;
  };

  // Update confetti animation
  const updateConfetti = () => {
    setConfetti(prev => 
      prev.map(particle => ({
        ...particle,
        x: particle.x + particle.velocityX,
        y: particle.y + particle.velocityY,
        rotation: particle.rotation + 2,
        velocityY: particle.velocityY + 0.1 // gravity
      })).filter(particle => particle.y < window.innerHeight + 50)
    );
  };

  // Play achievement sound
  const playSound = () => {
    try {
      // Create different sounds for different achievements
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different types
      const frequencies = {
        lesson: [523.25, 659.25, 783.99], // C, E, G
        module: [523.25, 659.25, 783.99, 1046.50], // C, E, G, C
        course: [523.25, 659.25, 783.99, 1046.50, 1318.51], // C, E, G, C, E
        quiz: [659.25, 783.99, 1046.50], // E, G, C
        achievement: [523.25, 698.46, 880.00, 1174.66] // C, F, A, D
      };
      
      const notes = frequencies[type];
      let noteIndex = 0;
      
      const playNote = () => {
        if (noteIndex < notes.length) {
          oscillator.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          noteIndex++;
          setTimeout(playNote, 150);
        } else {
          oscillator.stop();
        }
      };
      
      oscillator.start();
      playNote();
    } catch (error) {
      console.log('Audio not supported or blocked');
    }
  };

  useEffect(() => {
    if (isVisible) {
      // Generate confetti and start animation
      setConfetti(generateConfetti());
      setAnimate(true);
      
      // Play sound effect
      playSound();
      
      // Show achievement card after a brief delay
      cardTimeoutRef.current = setTimeout(() => {
        setShowCard(true);
      }, 500);
      
      // Start confetti animation loop
      const animateConfetti = () => {
        updateConfetti();
        animationRef.current = requestAnimationFrame(animateConfetti);
      };
      animationRef.current = requestAnimationFrame(animateConfetti);
      
      // Hide everything after duration
      timeoutRef.current = setTimeout(() => {
        setAnimate(false);
        setShowCard(false);
        setTimeout(() => {
          setConfetti([]);
          onComplete?.();
        }, 500);
      }, duration);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cardTimeoutRef.current) {
        clearTimeout(cardTimeoutRef.current);
      }
    };
  }, [isVisible, type, duration]);

  if (!isVisible) return null;

  const getAchievementColor = () => {
    switch (type) {
      case 'lesson': return 'from-blue-500 to-purple-600';
      case 'module': return 'from-green-500 to-teal-600';
      case 'course': return 'from-yellow-400 to-orange-500';
      case 'quiz': return 'from-purple-500 to-pink-600';
      case 'achievement': return 'from-indigo-500 to-purple-700';
      default: return 'from-blue-500 to-purple-600';
    }
  };

  const renderConfettiParticle = (particle: Confetti) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: `${particle.x}px`,
      top: `${particle.y}px`,
      transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
      backgroundColor: particle.color,
      transition: 'all 0.1s ease-out',
      pointerEvents: 'none' as const,
    };

    switch (particle.shape) {
      case 'circle':
        return (
          <div
            key={particle.id}
            style={{
              ...baseStyle,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
            }}
          />
        );
      case 'square':
        return (
          <div
            key={particle.id}
            style={{
              ...baseStyle,
              width: '6px',
              height: '6px',
            }}
          />
        );
      case 'triangle':
        return (
          <div
            key={particle.id}
            style={{
              ...baseStyle,
              width: '0',
              height: '0',
              backgroundColor: 'transparent',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: `8px solid ${particle.color}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Confetti particles */}
      {confetti.map(renderConfettiParticle)}
      
      {/* Achievement card */}
      {showCard && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <Card 
            className={cn(
              "max-w-md mx-auto shadow-2xl border-0 overflow-hidden transform transition-all duration-700 ease-out",
              animate ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-8"
            )}
          >
            <div className={cn("h-2 bg-gradient-to-r", getAchievementColor())} />
            <CardContent className="p-8 text-center relative">
              {/* Background sparkles */}
              <div className="absolute inset-0 overflow-hidden">
                <Sparkles className="absolute top-4 left-4 w-4 h-4 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute top-8 right-6 w-3 h-3 text-purple-400 animate-pulse delay-300" />
                <Sparkles className="absolute bottom-8 left-8 w-4 h-4 text-blue-400 animate-pulse delay-700" />
                <Sparkles className="absolute bottom-4 right-4 w-3 h-3 text-pink-400 animate-pulse delay-500" />
              </div>
              
              {/* Achievement icon */}
              <div className={cn(
                "w-20 h-20 rounded-full bg-gradient-to-r mx-auto mb-4 flex items-center justify-center transform transition-all duration-1000",
                getAchievementColor(),
                animate ? "scale-100 rotate-0" : "scale-75 rotate-180"
              )}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              
              {/* Achievement text */}
              <div className="space-y-3 relative z-10">
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {type === 'lesson' && 'Lesson Complete!'}
                  {type === 'module' && 'Module Mastered!'}
                  {type === 'course' && 'Course Champion!'}
                  {type === 'quiz' && 'Quiz Conquered!'}
                  {type === 'achievement' && 'Achievement Unlocked!'}
                </h2>
                
                <p className="text-lg font-semibold text-gray-800">{title}</p>
                
                {description && (
                  <p className="text-gray-600">{description}</p>
                )}
                
                {points > 0 && (
                  <Badge variant="secondary" className="text-lg px-4 py-2 bg-yellow-100 text-yellow-800">
                    <Crown className="w-4 h-4 mr-2" />
                    +{points} XP
                  </Badge>
                )}
                
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={cn(
                          "w-5 h-5 transition-all duration-300 delay-300",
                          i < (type === 'course' ? 5 : type === 'module' ? 4 : 3)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>,
    document.body
  );
}