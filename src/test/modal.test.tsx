import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Modal, hasOpenModal } from '../components/ui';

describe('Modal stacking', () => {
  it('Escape closes only the topmost modal', () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    render(
      <>
        <Modal open onClose={closeOuter} title="Outer">
          outer
        </Modal>
        <Modal open onClose={closeInner} title="Inner">
          inner
        </Modal>
      </>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeInner).toHaveBeenCalledTimes(1);
    expect(closeOuter).not.toHaveBeenCalled();
    cleanup();
  });

  it('tracks open state for the global Escape suppressor', () => {
    expect(hasOpenModal()).toBe(false);
    const { unmount } = render(
      <Modal open onClose={() => {}} title="Solo">
        content
      </Modal>,
    );
    expect(hasOpenModal()).toBe(true);
    unmount();
    expect(hasOpenModal()).toBe(false);
  });
});
