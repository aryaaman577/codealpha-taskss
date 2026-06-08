'use client';

import React, { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
} from 'framer-motion';
import { MessageSquare, Video, PenTool, Folder } from 'lucide-react';

export default function HeroProductVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateXSpring = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [5, -5]),
    { stiffness: 100, damping: 25 }
  );
  const rotateYSpring = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-5, 5]),
    { stiffness: 100, damping: 25 }
  );

  const { scrollY } = useScroll();
  const scrollRotateX = useTransform(scrollY, [0, 600], [8, 0]);
  const scrollScale = useTransform(scrollY, [0, 600], [0.96, 1]);

  const combinedRotateX = useTransform(
    [scrollRotateX, rotateXSpring],
    ([sr, mr]: number[]) => (sr as number) + (mr as number)
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-4xl mx-auto perspective-hero"
    >
      <motion.div
        className="w-full preserve-3d"
        style={{
          rotateX: combinedRotateX,
          rotateY: rotateYSpring,
          scale: scrollScale,
        }}
      >
        {/* Main workspace frame */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-border-default bg-bg-elevated/80 backdrop-blur-md shadow-elevated overflow-hidden">
          {/* Title bar */}
          <div className="h-9 sm:h-10 border-b border-border-subtle bg-bg-deep/60 flex items-center px-4 justify-between">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-sage/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-warm/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-text-tertiary/20" />
            </div>
            <div className="text-[10px] text-text-tertiary font-mono tracking-wider">
              syncspace.app/workspace
            </div>
            <div className="w-8" />
          </div>

          {/* Workspace content */}
          <div className="grid grid-cols-12 h-[220px] sm:h-[280px] md:h-[340px]">
            {/* Sidebar */}
            <div className="col-span-3 border-r border-border-subtle p-3 sm:p-4 flex flex-col gap-3">
              {/* Channel list */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent-warm/8 border border-accent-warm/10">
                  <MessageSquare size={11} className="text-accent-warm flex-shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-text-primary font-medium truncate">
                    #design
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-surface/50 transition-colors">
                  <Video size={11} className="text-accent-sage flex-shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-text-tertiary truncate">
                    Weekly Sync
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-surface/50 transition-colors">
                  <PenTool size={11} className="text-text-tertiary flex-shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-text-tertiary truncate">
                    Whiteboard
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-surface/50 transition-colors">
                  <Folder size={11} className="text-text-tertiary flex-shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-text-tertiary truncate">
                    File Vault
                  </span>
                </div>
              </div>

              {/* User avatars */}
              <div className="mt-auto flex -space-x-1.5">
                {['bg-accent-warm', 'bg-accent-sage', 'bg-accent-bronze', 'bg-text-tertiary'].map(
                  (bg, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${bg}/60 border border-bg-elevated`}
                    />
                  )
                )}
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-bg-surface border border-bg-elevated flex items-center justify-center">
                  <span className="text-[7px] sm:text-[8px] text-text-tertiary font-medium">+3</span>
                </div>
              </div>
            </div>

            {/* Main content area */}
            <div className="col-span-6 border-r border-border-subtle p-3 sm:p-4 flex flex-col gap-3">
              {/* Chat messages */}
              <div className="flex-1 space-y-3 overflow-hidden">
                <div className="flex gap-2 items-start">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent-warm/40 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-text-primary">Sarah</span>
                      <span className="text-[8px] sm:text-[9px] text-text-tertiary">10:42 AM</span>
                    </div>
                    <div className="mt-1 bg-bg-surface/60 rounded-lg px-2.5 py-1.5 text-[10px] sm:text-[11px] text-text-secondary border border-border-subtle max-w-[180px]">
                      Ready to review the final layout?
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent-sage/40 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-text-primary">Marcus</span>
                      <span className="text-[8px] sm:text-[9px] text-text-tertiary">10:43 AM</span>
                    </div>
                    <div className="mt-1 bg-accent-sage/5 rounded-lg px-2.5 py-1.5 text-[10px] sm:text-[11px] text-text-secondary border border-accent-sage/10 max-w-[180px]">
                      Drawing on whiteboard now ✏️
                    </div>
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent-bronze/40 flex-shrink-0" />
                  <div className="flex gap-0.5 px-2.5 py-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 rounded-full bg-text-tertiary"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Message input */}
              <div className="rounded-xl border border-border-subtle bg-bg-deep/40 px-3 py-2 flex items-center gap-2">
                <div className="flex-1 h-3 bg-text-tertiary/8 rounded" />
                <div className="w-5 h-5 rounded bg-accent-warm/15 flex items-center justify-center">
                  <div className="w-2 h-2 border-r border-t border-accent-warm/60 rotate-45 -translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Right panel — meeting/whiteboard preview */}
            <div className="col-span-3 p-3 sm:p-4 flex flex-col gap-3">
              {/* Live meeting indicator */}
              <div className="rounded-xl border border-accent-sage/15 bg-accent-sage/5 p-2 sm:p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-sage animate-pulse motion-reduce:animate-none" />
                  <span className="text-[9px] sm:text-[10px] font-semibold text-accent-sage uppercase tracking-wider">
                    Live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-video rounded bg-bg-deep/60 border border-border-subtle"
                    />
                  ))}
                </div>
                <p className="text-[8px] sm:text-[9px] text-text-tertiary mt-1.5 text-center">
                  4 participants · 50ms
                </p>
              </div>

              {/* File preview */}
              <div className="rounded-xl border border-border-subtle bg-bg-deep/40 p-2 sm:p-2.5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] sm:text-[10px] text-text-tertiary font-medium">
                    Recent
                  </span>
                  <Folder size={10} className="text-text-tertiary" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-sm bg-accent-warm/40" />
                    <span className="text-[8px] sm:text-[9px] text-text-tertiary truncate">
                      proposal_v2.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-sm bg-accent-sage/40" />
                    <span className="text-[8px] sm:text-[9px] text-text-tertiary truncate">
                      brand_assets.zip
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-sm bg-accent-bronze/40" />
                    <span className="text-[8px] sm:text-[9px] text-text-tertiary truncate">
                      meeting_notes.md
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync trails SVG overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            preserveAspectRatio="none"
          >
            {/* Trail: sidebar → main content */}
            <line
              x1="25%"
              y1="40%"
              x2="50%"
              y2="40%"
              className="sync-trail-line"
            />
            {/* Trail: main content → right panel */}
            <line
              x1="75%"
              y1="55%"
              x2="95%"
              y2="55%"
              className="sync-trail-line"
            />
            {/* Trail: vertical connection */}
            <line
              x1="50%"
              y1="30%"
              x2="50%"
              y2="70%"
              className="sync-trail-line"
              style={{ animationDelay: '0.5s' }}
            />
          </svg>
        </div>

        {/* Surface reflection glow */}
        <div
          aria-hidden="true"
          className="absolute -bottom-12 left-1/4 right-1/4 h-24 bg-accent-warm/[0.04] rounded-full blur-3xl pointer-events-none"
        />
      </motion.div>
    </div>
  );
}
