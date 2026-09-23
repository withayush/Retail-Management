import { useEffect, useRef } from "react";
import { getProductByBarcode } from "../../../services/product.api";
import toast from "react-hot-toast";

/**
 * Phase 4 - Task T30: Hardware Barcode Scanner Listener Hook
 * Automatically captures rapid keystrokes from USB / Bluetooth handheld barcode scanners
 * anywhere on the screen without requiring explicit input focus.
 */
export default function useBarcodeScanner({ onAddToCart, isModalOpen = false }) {
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Don't intercept when a modal is open or when typing inside an input other than search
      if (isModalOpen) return;

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused = activeTag === "input" || activeTag === "textarea";

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // Hardware scanners type with < 40ms interval between characters
      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= 3) {
          const code = barcodeBuffer.current.trim();
          barcodeBuffer.current = "";

          try {
            const res = await getProductByBarcode(code);
            const product = res.data || res;
            if (product) {
              onAddToCart(product);
              // Play a subtle POS confirmation beep using Web Audio API
              playPOSBeep(1200, 80);
              toast.success(`Scanned: ${product.name}`, { id: `scan-${code}`, duration: 1200 });
            } else {
              toast.error(`No product found for barcode "${code}"`, { id: `scan-err-${code}` });
            }
          } catch {
            // Scanner may have typed into an active input field, let it handle
          }
        }
        return;
      }

      // If user is actively typing in a normal text input, don't hijack unless it's fast scanning
      if (isInputFocused && diff > 60) {
        barcodeBuffer.current = "";
        return;
      }

      // Buffer printable characters
      if (e.key.length === 1) {
        if (diff > 100) {
          barcodeBuffer.current = ""; // reset buffer if typing was slow (manual human typing)
        }
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onAddToCart, isModalOpen]);
}

/**
 * Clean Web Audio API Pos Beep Synthesizer
 */
export function playPOSBeep(frequency = 1000, duration = 60) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Ignore audio context autoplay restrictions
  }
}
