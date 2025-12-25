// New handler to ensure click starts and ends on the overlay
export const handleOverlayClick = (
  e: React.MouseEvent,
  onClose: () => void,
) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};
