"use client";

import { motion } from "framer-motion";

interface MahjongTileProps {
  symbol?: string;
  revealed: boolean;
  glow?: "gold" | "ember" | "jade" | "none";
  delay?: number;
  isEmpty?: boolean; // Kartu kosong tanpa simbol
  customColor?: string; // Custom background color
}

export default function MahjongTile({ 
  symbol, 
  revealed, 
  glow = "none", 
  delay = 0,
  isEmpty = false,
  customColor = "bg-lacquer"
}: MahjongTileProps) {
  const glowClass =
    glow === "gold" ? "shadow-glow" : glow === "ember" ? "shadow-emberglow" : glow === "jade" ? "shadow-[0_0_20px_rgba(21,128,102,0.6)]" : "";

  return (
    <motion.div
      className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-md"
      style={{ perspective: 800 }}
      initial={{ y: -6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.35 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.5, delay }}
      >
        {/* Back (hidden side, showing before reveal) */}
        <div
          className="tile-back absolute inset-0 rounded-md flex items-center justify-center text-gold text-2xl bg-gradient-to-b from-amber-900 to-amber-950 border-2 border-gold/30"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="seal-stamp">麻</span>
        </div>
        
        {/* Face (revealed result) */}
        {isEmpty ? (
          // KARTU KOSONG - No symbols
          <div
            className={`tile-face absolute inset-0 rounded-md flex items-center justify-center ${customColor} border-2 border-gold/20 ${glowClass}`}
            style={{ 
              backfaceVisibility: "hidden", 
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #f5f1de 0%, #e8dcc8 100%)"
            }}
          >
            {/* Empty tile - bisa ada subtle pattern */}
            <div className="absolute inset-0 rounded-md opacity-10 bg-gradient-to-br from-gold to-transparent"></div>
          </div>
        ) : (
          // KARTU NORMAL - dengan simbol
          <div
            className={`tile-face absolute inset-0 rounded-md flex items-center justify-center text-lacquer text-3xl font-display font-bold ${customColor} border-2 border-gold/20 ${glowClass}`}
            style={{ 
              backfaceVisibility: "hidden", 
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #f5f1de 0%, #e8dcc8 100%)"
            }}
          >
            {symbol}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
