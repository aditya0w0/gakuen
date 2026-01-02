import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, Star, Hexagon, Zap, Globe, Sparkles } from 'lucide-react';

// --- HSR UI Components ---

const HsrButton = ({ 
  children, 
  variant = 'primary', 
  icon: Icon 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'gold';
  icon?: any;
}) => {
  const baseStyles = "relative group px-8 py-3 font-bold uppercase tracking-wider text-sm transition-all duration-300 transform hover:-translate-y-1 overflow-hidden";
  
  const variants = {
    primary: "bg-white text-black hover:bg-cyan-50 clip-path-slant-right",
    secondary: "bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 clip-path-slant-left",
    gold: "bg-gradient-to-r from-amber-200 to-amber-500 text-black hover:brightness-110 clip-path-slant-right"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]}`}>
      <div className="flex items-center gap-2 relative z-10">
        {Icon && <Icon size={16} className={variant === 'gold' ? 'animate-pulse' : ''} />}
        {children}
      </div>
      {/* Hover Flash Effect */}
      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
    </button>
  );
};

const TechDecoration = ({ className }: { className?: string }) => (
  <div className={`absolute pointer-events-none opacity-40 ${className}`}>
    <div className="flex gap-1">
      <div className="w-1 h-1 bg-white rounded-full animate-ping" />
      <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="w-1 h-1 bg-white rounded-full" />
    </div>
  </div>
);

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 h-20 flex items-center border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
    <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black text-xl clip-path-hexagon">
          <Star fill="black" size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold tracking-[0.2em] text-lg uppercase leading-none">Astral</span>
          <span className="text-cyan-400 text-[10px] tracking-[0.3em] uppercase">Express UI</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="hidden md:flex items-center gap-8">
        {['Missions', 'Characters', 'Warp', 'Archives'].map((item) => (
          <a key={item} href="#" className="text-gray-400 hover:text-white uppercase text-xs font-bold tracking-widest transition-colors relative group">
            {item}
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-400 group-hover:w-full transition-all duration-300" />
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="hidden md:block">
        <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-md clip-path-slant-right transition-all">
          Launch Game
        </button>
      </div>
    </div>
  </nav>
);

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth) * 20, 
        y: (e.clientY / window.innerHeight) * 20 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050510] text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* --- Dynamic Space Background --- */}
      <div className="absolute inset-0 z-0">
        {/* Deep Space Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050510] to-black" />
        
        {/* Animated Stars/Particles (CSS substitute) */}
        <div className="absolute inset-0 opacity-30" 
             style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
        
        {/* Planet/Orb Element */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-cyan-500/10 to-purple-600/10 blur-[100px]" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* --- Main Content --- */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col md:flex-row items-center min-h-screen">
        
        {/* Left: Text Content */}
        <div className="w-full md:w-1/2 space-y-8" style={{ transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px)` }}>
          
          {/* Decorative Label */}
          <div className="flex items-center gap-3 animate-fade-in-up">
            <div className="h-[1px] w-12 bg-amber-400/50" />
            <span className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">Version 2.0 Update</span>
            <div className="h-[1px] w-12 bg-amber-400/50" />
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            JOURNEY <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">BEYOND</span> <br />
            STARS
          </h1>

          {/* Description Glass Panel */}
          <div className="relative max-w-md p-6 bg-gradient-to-r from-black/60 to-black/20 backdrop-blur-md border-l-2 border-cyan-500">
            <p className="text-gray-300 leading-relaxed text-sm">
              Embark on an astral adventure. The galaxy is vast, and the data is infinite. 
              Manage your fleet with the new Nexus dashboard system.
            </p>
            {/* Corner Deco */}
            <div className="absolute top-0 right-0 p-1">
              <div className="w-2 h-2 border-t border-r border-white/30" />
            </div>
            <div className="absolute bottom-0 right-0 p-1">
              <div className="w-2 h-2 border-b border-r border-white/30" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <HsrButton variant="gold" icon={Sparkles}>
              Start Journey
            </HsrButton>
            <HsrButton variant="secondary" icon={Play}>
              Watch Trailer
            </HsrButton>
          </div>

          {/* Stat Readouts */}
          <div className="flex gap-8 pt-8 border-t border-white/10">
            {[
              { label: 'Active Users', value: '1.2M+' },
              { label: 'Systems', value: '840+' },
              { label: 'Latency', value: '12ms' }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold font-mono text-white">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Character/Feature Graphic */}
        <div className="w-full md:w-1/2 relative mt-12 md:mt-0 h-[600px] flex items-center justify-center perspective-1000">
          
          {/* Rotating Rings (Simulated) */}
          <div className="absolute w-[500px] h-[500px] rounded-full border border-white/10 animate-[spin_10s_linear_infinite]" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-cyan-500/20 animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute w-[600px] h-[600px] rounded-full border border-dashed border-white/5 animate-[spin_30s_linear_infinite]" />

          {/* Main Card Floating */}
          <div className="relative w-[320px] h-[480px] bg-gray-900/80 backdrop-blur-xl border border-white/10 rotate-y-12 transition-transform duration-500 hover:rotate-y-0 group"
               style={{ 
                 transform: `perspective(1000px) rotateY(${mousePos.x * 2}deg) rotateX(${mousePos.y * -2}deg)`,
                 boxShadow: '0 0 50px rgba(0, 200, 255, 0.1)' 
               }}>
            
            {/* Card Header */}
            <div className="h-1/2 bg-gradient-to-b from-indigo-900 to-black relative overflow-hidden p-6 flex flex-col justify-end">
               <div className="absolute top-4 right-4">
                  <Hexagon className="text-white/20" size={32} />
               </div>
               <h3 className="text-2xl font-bold text-white italic">ASTRAL CARD</h3>
               <p className="text-cyan-400 text-xs font-mono">LV. 80 // MAX</p>
               
               {/* Shine Effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-white/10">
                 <span className="text-xs text-gray-400 uppercase">Attributes</span>
                 <Zap size={14} className="text-amber-400" />
               </div>
               
               <div className="space-y-2">
                 {['ATK', 'DEF', 'SPD'].map(stat => (
                   <div key={stat} className="flex items-center gap-2 text-sm">
                     <span className="w-8 text-gray-500 font-mono text-xs">{stat}</span>
                     <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-cyan-400 w-3/4" />
                     </div>
                   </div>
                 ))}
               </div>

               <button className="w-full mt-4 bg-white text-black font-bold py-2 text-xs uppercase hover:bg-cyan-400 transition-colors">
                 Details
               </button>
            </div>

            {/* Floating Badges */}
            <div className="absolute -right-12 top-20 bg-black/80 backdrop-blur border border-amber-500/50 p-2 transform rotate-12">
               <Star className="text-amber-400 fill-amber-400" size={20} />
            </div>
            <div className="absolute -left-8 bottom-20 bg-black/80 backdrop-blur border border-cyan-500/50 p-3 transform -rotate-6">
               <Globe className="text-cyan-400" size={20} />
            </div>
          </div>

        </div>
      </div>

      {/* Floating UI Elements */}
      <TechDecoration className="top-1/4 left-10" />
      <TechDecoration className="bottom-1/4 right-10 rotate-180" />
      
      {/* Bottom Ticker */}
      <div className="absolute bottom-0 w-full h-12 border-t border-white/10 bg-black/80 backdrop-blur flex items-center overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-12 px-4">
           {[1,2,3,4].map(i => (
             <span key={i} className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               SYSTEM STATUS: NORMAL // SECTOR {i}4-X // CONNECTED
             </span>
           ))}
        </div>
      </div>

      <style jsx global>{`
        .clip-path-slant-right { clip-path: polygon(15% 0, 100% 0, 100% 100%, 0% 100%); }
        .clip-path-slant-left { clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%); }
        .clip-path-hexagon { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Hero;