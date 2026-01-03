import React, { useState, useEffect, useMemo } from 'react';
import { Play, ArrowRight, Star, Hexagon, Zap, Globe, Sparkles, ChevronRight } from 'lucide-react';

// --- HSR UI Components ---

const HsrButton = React.memo(({ 
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
});
HsrButton.displayName = 'HsrButton';

const TechDecoration = React.memo(({ className }: { className?: string }) => (
  <div className={`absolute pointer-events-none opacity-40 ${className}`}>
    <div className="flex gap-1">
      <div className="w-1 h-1 bg-white rounded-full animate-ping" />
      <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="w-1 h-1 bg-white rounded-full" />
    </div>
  </div>
));
TechDecoration.displayName = 'TechDecoration';

const Navbar = React.memo(() => (
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
));
Navbar.displayName = 'Navbar';

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = React.useRef<number | null>(null);
  const latestMousePos = React.useRef({ x: 0, y: 0 });
  
  // Mouse sensitivity for parallax effect (lower = more subtle)
  const MOUSE_SENSITIVITY = 0.5;
  
  // Memoize transform style to avoid recreation on every render
  const cardTransformStyle = useMemo(() => ({
    transform: `perspective(1000px) rotateY(${mousePos.x * MOUSE_SENSITIVITY}deg) rotateX(${mousePos.y * -MOUSE_SENSITIVITY}deg)`,
    boxShadow: '0 0 50px rgba(0, 200, 255, 0.1)',
    backfaceVisibility: 'hidden' as const
  }), [mousePos.x, mousePos.y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Store latest mouse coordinates
      latestMousePos.current = {
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20
      };

      // Throttle with requestAnimationFrame for performance
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        setMousePos(latestMousePos.current);
        rafRef.current = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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
          
          {/* Rotating Rings (Simulated) - GPU accelerated */}
          <div className="absolute w-[500px] h-[500px] rounded-full border border-white/10 animate-[spin_10s_linear_infinite] gpu-accelerate" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-cyan-500/20 animate-[spin_15s_linear_infinite_reverse] gpu-accelerate" />
          <div className="absolute w-[600px] h-[600px] rounded-full border border-dashed border-white/5 animate-[spin_30s_linear_infinite] gpu-accelerate" />

          {/* Main Card Floating - GPU accelerated */}
          <div className="relative w-[320px] h-[480px] bg-gray-900/80 backdrop-blur-xl border border-white/10 rotate-y-12 transition-transform duration-500 hover:rotate-y-0 group gpu-accelerate"
               style={cardTransformStyle}>
            
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

const FeatureCard = ({ title, sub, icon: Icon, color, delay }: any) => (
  <div className={`relative group p-1 ${delay}`}>
    {/* Hover Border Glow */}
    <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
    
    {/* Card Container */}
    <div className="relative h-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 clip-path-slant-left hover:bg-white/5 transition-all duration-300 group-hover:-translate-y-2">
      
      {/* Top Decoration */}
      <div className="absolute top-0 right-0 p-2 opacity-50">
        <Icon className="text-white/20" size={64} />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Icon Badge */}
        <div className="w-12 h-12 bg-white/10 flex items-center justify-center border border-white/20 rotate-45 group-hover:rotate-90 transition-transform duration-500">
          <Icon className="text-white -rotate-45 group-hover:-rotate-90 transition-transform duration-500" size={24} />
        </div>

        <div className="pt-4">
          <h3 className="text-xl font-black italic uppercase tracking-wider text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-mono">{sub}</p>
        </div>

        <div className="pt-4 flex items-center text-xs font-bold text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
          Access Module <ChevronRight size={14} />
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/10 group-hover:border-cyan-400/50 transition-colors" />
    </div>
  </div>
);

const FeaturesSection = () => {
  return (
    <div className="relative py-32 border-t border-white/5 bg-black/40">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
             <div className="flex items-center gap-2 mb-4">
               <div className="w-2 h-2 bg-amber-400 rotate-45" />
               <span className="text-amber-400 font-mono text-xs tracking-widest uppercase">System Architecture</span>
             </div>
             <h2 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
               Main <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Modules</span>
             </h2>
          </div>
          <p className="max-w-md text-gray-400 text-sm md:text-right font-mono border-r-2 border-white/20 pr-4">
            Initialize core protocols. Accessing database... <br />
            Select a module to begin simulation.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <FeatureCard 
             title="Stellar Warp"
             sub="High-probability quantum rendering engine. Calculate drop rates and simulate gacha probabilities with 99.9% accuracy."
             icon={Star}
             color="from-purple-500 to-pink-500"
             delay="delay-0"
           />
           <FeatureCard 
             title="Relic Analysis"
             sub="AI-powered artifact scoring. Optimize your build with deep-learning algorithms trained on top-tier player data."
             icon={Database}
             color="from-amber-400 to-orange-500"
             delay="delay-100"
           />
           <FeatureCard 
             title="Security Matrix"
             sub="End-to-end encryption for user data. Your UID and inventory stats are protected by quantum-key distribution."
             icon={Shield}
             color="from-cyan-400 to-blue-500"
             delay="delay-200"
           />
        </div>

        {/* Secondary Info Bar */}
        <div className="mt-20 p-6 border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 clip-path-slant-right">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
              <Radio className="text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-white uppercase">Live Signal Detected</h4>
              <p className="text-xs text-gray-400 font-mono">Incoming transmission from Astral Express...</p>
            </div>
          </div>
          <div className="flex gap-8">
             <div className="text-center">
               <div className="text-2xl font-black text-white">88%</div>
               <div className="text-[10px] text-gray-500 uppercase tracking-widest">Download</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-black text-white">12ms</div>
               <div className="text-[10px] text-gray-500 uppercase tracking-widest">Ping</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RosterSection = () => {
  const [activeUnit, setActiveUnit] = useState(0);

  const units = [
    {
      id: 0,
      name: "Void Drifter",
      role: "Quantum / Hunt",
      desc: "Specializes in single-target burst damage. Can manipulate quantum entanglement fields.",
      stats: { atk: 90, def: 40, spd: 85 },
      color: "from-indigo-500 to-purple-600",
      icon: Crosshair
    },
    {
      id: 1,
      name: "Solar Cleric",
      role: "Imaginary / Abundance",
      desc: "Provides team-wide healing and buffs. Harnesses the power of dying stars.",
      stats: { atk: 30, def: 80, spd: 60 },
      color: "from-amber-300 to-yellow-500",
      icon: Activity
    },
    {
      id: 2,
      name: "Null Tank",
      role: "Physical / Preservation",
      desc: "Generates massive shields. Reflects incoming damage back to attackers.",
      stats: { atk: 50, def: 95, spd: 30 },
      color: "from-gray-400 to-slate-600",
      icon: Shield
    }
  ];

  const current = units[activeUnit];

  return (
    <div className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
         {/* Header */}
         <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-1 bg-cyan-500" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Deployable Units</h2>
         </div>

         <div className="flex flex-col lg:flex-row gap-8 min-h-[500px]">
            {/* List Selection (Left) */}
            <div className="w-full lg:w-1/3 space-y-2">
               {units.map((unit, idx) => (
                 <button 
                   key={unit.id}
                   onClick={() => setActiveUnit(idx)}
                   className={`w-full group relative h-20 flex items-center px-6 transition-all duration-300 ${
                     activeUnit === idx 
                       ? 'bg-gradient-to-r from-white/10 to-transparent border-l-4 border-cyan-400 translate-x-2' 
                       : 'bg-black/40 hover:bg-white/5 border-l-4 border-transparent hover:border-white/20'
                   }`}
                 >
                    <div className="mr-4">
                       <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${unit.color} flex items-center justify-center`}>
                          <unit.icon size={20} className="text-white" />
                       </div>
                    </div>
                    <div className="text-left">
                       <h3 className={`font-bold uppercase text-sm ${activeUnit === idx ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                         {unit.name}
                       </h3>
                       <p className="text-[10px] text-gray-500 font-mono tracking-widest">{unit.role}</p>
                    </div>
                    
                    {/* Active Indicator Arrow */}
                    {activeUnit === idx && (
                      <ChevronRight className="absolute right-4 text-cyan-400 animate-pulse" size={16} />
                    )}
                 </button>
               ))}
            </div>

            {/* Main Display (Right) */}
            <div className="w-full lg:w-2/3 relative">
               {/* Background Card */}
               <div className="absolute inset-0 bg-white/5 clip-path-slant-right backdrop-blur-sm border border-white/10" />
               
               {/* Content */}
               <div className="relative z-10 p-12 flex flex-col md:flex-row gap-8 h-full items-center">
                  
                  {/* Character "Image" Placeholder (Abstract) */}
                  <div className="w-64 h-64 md:w-80 md:h-full flex-shrink-0 relative group">
                     <div className={`absolute inset-0 bg-gradient-to-b ${current.color} opacity-20 rounded-full blur-3xl group-hover:opacity-40 transition-opacity`} />
                     <div className="relative w-full h-full border-2 border-white/10 bg-black/50 flex items-center justify-center clip-path-hexagon">
                        <current.icon size={80} className={`text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]`} />
                     </div>
                     
                     {/* Floating Particles */}
                     <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full animate-ping" />
                     <div className="absolute bottom-10 left-0 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-6">
                     <div>
                        <h3 className="text-4xl font-black italic text-white mb-2">{current.name}</h3>
                        <div className="inline-block px-3 py-1 bg-white/10 rounded text-xs font-mono text-cyan-400 border border-cyan-500/30">
                           {current.role}
                        </div>
                     </div>
                     
                     <p className="text-gray-400 leading-relaxed text-sm border-l-2 border-white/10 pl-4">
                        {current.desc}
                     </p>

                     {/* Stats Bars */}
                     <div className="space-y-3 pt-4">
                        {Object.entries(current.stats).map(([key, val]) => (
                           <div key={key} className="flex items-center gap-3">
                              <span className="w-8 text-xs font-bold uppercase text-gray-500">{key}</span>
                              <div className="flex-1 h-2 bg-white/10 skew-x-[-20deg] overflow-hidden">
                                 <div 
                                    className={`h-full bg-gradient-to-r ${current.color}`} 
                                    style={{ width: `${val}%` }} 
                                 />
                              </div>
                              <span className="text-xs font-mono text-white">{val}</span>
                           </div>
                        ))}
                     </div>
                     
                     <button className="mt-4 px-8 py-2 bg-white text-black font-bold uppercase text-xs hover:bg-cyan-400 transition-colors skew-x-[-20deg]">
                        <span className="inline-block skew-x-[20deg]">View Profile</span>
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const WarpSection = () => {
  return (
    <div className="relative py-32 overflow-hidden flex items-center justify-center">
      {/* Background with warp tunnel effect */}
      <div className="absolute inset-0 bg-black">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black" />
         {/* Speed lines */}
         <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.1) 50px)' 
              }} 
         />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        
        {/* Ticket Visual */}
        <div className="relative mx-auto w-full max-w-2xl bg-gradient-to-r from-amber-200 to-amber-500 rounded-lg p-1 shadow-[0_0_50px_rgba(251,191,36,0.3)] transform hover:scale-105 transition-transform duration-500 mb-12 cursor-pointer group">
           <div className="bg-black/90 h-full w-full rounded border border-amber-300/50 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              
              {/* Ticket Stub (Left) */}
              <div className="flex-1 text-left space-y-2 relative z-10">
                 <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
                    <Ticket size={12} fill="currentColor" />
                    <span>Star Rail Pass</span>
                 </div>
                 <h2 className="text-3xl md:text-4xl font-black italic text-white uppercase">
                    Board the <br/> <span className="text-amber-400">Express</span>
                 </h2>
                 <p className="text-gray-400 text-sm max-w-sm">
                    Get the latest updates, character leaks, and design resources sent to your inbox.
                 </p>
              </div>

              {/* QR / Barcode Decoration (Right) */}
              <div className="hidden md:block w-32 h-32 border-l-2 border-dashed border-white/20 pl-8 relative">
                 <div className="w-full h-full bg-white/5 rounded flex items-center justify-center">
                    <div className="text-5xl font-black text-white/10">QR</div>
                 </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
           </div>
        </div>

        {/* Input Field */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
           <input 
             type="email" 
             placeholder="Enter your email..." 
             className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all placeholder:text-gray-600"
           />
           <button className="bg-white text-black font-bold uppercase text-xs px-8 py-3 hover:bg-cyan-400 transition-colors clip-path-slant-right">
             Subscribe
           </button>
        </div>
        
        <p className="mt-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
           Join 50,000+ Trailblazers
        </p>

      </div>
    </div>
  )
}
export default Hero;