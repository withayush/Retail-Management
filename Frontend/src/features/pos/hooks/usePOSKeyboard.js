import { useEffect } from "react";

/**
 * Phase 4 - Task T30: POS High-Speed Keyboard Shortcuts Hook
 * Enables experienced cashiers to operate the entire billing terminal without a mouse.
 *
 * Supported Shortcuts:
 * - F2: Focus Search / Barcode Scanner input
 * - F4: Open Customer Selection Modal
 * - F8: Focus / Toggle Order Discount input
 * - F9 / Ctrl+Enter: Complete Sale / Trigger Checkout
 * - Ctrl+D: Clear Cart
 * - Ctrl+1: Switch to CASH payment
 * - Ctrl+2: Switch to UPI payment
 * - Ctrl+3: Switch to CARD payment
 * - Ctrl+4: Switch to UDHAAR / CREDIT payment
 * - F1 / ?: Toggle Shortcuts Cheat Sheet Modal
 * - Esc: Close open modals / blur focus
 */
export default function usePOSKeyboard({
  onFocusSearch,
  onOpenCustomerModal,
  onFocusDiscount,
  onCheckout,
  onClearCart,
  onSelectPaymentMode,
  onToggleShortcutsModal,
  onCloseModal,
  isModalOpen = false,
  checkingOut = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Allow Esc to close active modals
      if (e.key === "Escape") {
        if (onCloseModal) {
          e.preventDefault();
          onCloseModal();
          return;
        }
      }

      // F1 or Shift + ? for shortcuts guide
      if (e.key === "F1" || (e.shiftKey && e.key === "?")) {
        e.preventDefault();
        if (onToggleShortcutsModal) onToggleShortcutsModal();
        return;
      }

      // F2: Focus Product Search
      if (e.key === "F2") {
        e.preventDefault();
        if (onFocusSearch) onFocusSearch();
        return;
      }

      // F4: Focus / Open Customer Modal
      if (e.key === "F4") {
        e.preventDefault();
        if (onOpenCustomerModal) onOpenCustomerModal();
        return;
      }

      // F8: Focus Discount
      if (e.key === "F8") {
        e.preventDefault();
        if (onFocusDiscount) onFocusDiscount();
        return;
      }

      // F9 or Ctrl+Enter: Complete Sale Checkout
      if (e.key === "F9" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        if (onCheckout && !checkingOut) onCheckout();
        return;
      }

      // Ctrl + D: Clear Cart
      if (e.ctrlKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (onClearCart) onClearCart();
        return;
      }

      // Ctrl + 1..4: Quick Payment Mode Switch
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          if (onSelectPaymentMode) onSelectPaymentMode("CASH");
        } else if (e.key === "2") {
          e.preventDefault();
          if (onSelectPaymentMode) onSelectPaymentMode("UPI");
        } else if (e.key === "3") {
          e.preventDefault();
          if (onSelectPaymentMode) onSelectPaymentMode("CARD");
        } else if (e.key === "4") {
          e.preventDefault();
          if (onSelectPaymentMode) onSelectPaymentMode("UDHAR");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onFocusSearch,
    onOpenCustomerModal,
    onFocusDiscount,
    onCheckout,
    onClearCart,
    onSelectPaymentMode,
    onToggleShortcutsModal,
    onCloseModal,
    isModalOpen,
    checkingOut,
  ]);
}
