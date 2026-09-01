import { useCallback, useEffect, useState } from 'react';

/** Intercepts close attempts so dirty forms ask before discarding. */
export function useDiscardGuard(opened: boolean, dirty: boolean, onClose: () => void) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!opened) setConfirming(false);
  }, [opened]);

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirming(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  const discard = useCallback(() => {
    setConfirming(false);
    onClose();
  }, [onClose]);

  const keepEditing = useCallback(() => {
    setConfirming(false);
  }, []);

  return { requestClose, confirming, discard, keepEditing };
}
