/**
 * Copyright 2026 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import PublisherNode from './Publisher.node';
import useStore from '../MQPatterns/PubSub/store';
import type { ProducerFlowNode } from '../../types';

const adapter = vi.hoisted(() => ({ publish: vi.fn() }));
const toast = vi.hoisted(() => ({ promise: vi.fn() }));

vi.mock('../../adapters/API.adapter', () => ({
  default: class {
    publish = adapter.publish;
  },
}));

// The real toast.promise swallows a rejection; the mock has to do the same.
vi.mock('react-toastify', () => ({
  toast: {
    promise: (promise: Promise<unknown>, messages: unknown) => {
      toast.promise(messages);
      promise.catch(() => {});
    },
  },
}));

const TOPIC = 'tickets/classic';
const PUBLISHER_ID = '1';

function renderPublisher(connectedQueue = TOPIC) {
  const props: NodeProps<ProducerFlowNode> = {
    id: PUBLISHER_ID,
    type: 'producer',
    data: {
      role: 'Producer',
      label: 'Publisher',
      connectedQueue,
      isActive: false,
    },
    selected: false,
    dragging: false,
    draggable: true,
    selectable: true,
    deletable: true,
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  };
  return render(
    <ReactFlowProvider>
      <PublisherNode {...props} />
    </ReactFlowProvider>
  );
}

const getContentField = () =>
  screen.getByPlaceholderText(/WAITLIST/) as HTMLTextAreaElement;

const getSendButton = () =>
  screen.getByRole('button', { name: 'Send notification' });

const flushPromises = () => act(async () => {});

const flowEvents = () => {
  const edgeIds: string[] = [];
  const listener = (e: Event) => edgeIds.push((e as CustomEvent).detail.edgeId);
  window.addEventListener('mq-message-flow', listener);
  return {
    edgeIds,
    stop: () => window.removeEventListener('mq-message-flow', listener),
  };
};

describe('PublisherNode', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
    adapter.publish.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('shows the title and the two input fields', () => {
      renderPublisher();

      expect(screen.getByText('Publisher app')).toBeInTheDocument();
      expect(screen.getByLabelText('Notification title')).toHaveValue('');
      expect(getContentField()).toHaveValue('');
    });

    it('suggests a title and a content that mentions the topic', () => {
      renderPublisher();

      expect(screen.getByLabelText('Notification title')).toHaveAttribute(
        'placeholder',
        'Waitlist reminder'
      );
      expect(getContentField()).toHaveAttribute(
        'placeholder',
        `Don't forget about our WAITLIST! ${TOPIC}`
      );
    });

    it('lets the user write a title and a content', async () => {
      const user = userEvent.setup();
      renderPublisher();

      await user.type(screen.getByLabelText('Notification title'), 'Hello');
      await user.type(getContentField(), 'World');

      expect(screen.getByLabelText('Notification title')).toHaveValue('Hello');
      expect(getContentField()).toHaveValue('World');
    });
  });

  describe('send button', () => {
    it('is enabled when the publisher is connected to a topic', () => {
      renderPublisher();

      expect(getSendButton()).toBeEnabled();
    });

    it('is disabled without a connected topic', () => {
      renderPublisher('');

      expect(getSendButton()).toBeDisabled();
    });
  });

  describe('publishing', () => {
    it('publishes "<title>|@|<content>" once to the connected topic', async () => {
      const user = userEvent.setup();
      renderPublisher();
      await user.type(screen.getByLabelText('Notification title'), 'Sale');
      await user.type(getContentField(), 'Today');

      await user.click(getSendButton());

      expect(adapter.publish).toHaveBeenCalledTimes(1);
      expect(adapter.publish).toHaveBeenCalledWith(
        'Sale|@|Today',
        1,
        TOPIC,
        PUBLISHER_ID
      );
    });

    it('still publishes when both fields are empty', async () => {
      const user = userEvent.setup();
      renderPublisher();

      await user.click(getSendButton());

      expect(adapter.publish).toHaveBeenCalledWith(
        '|@|',
        1,
        TOPIC,
        PUBLISHER_ID
      );
    });

    it('announces the notification with a toast', async () => {
      const user = userEvent.setup();
      renderPublisher();

      await user.click(getSendButton());

      expect(toast.promise).toHaveBeenCalledWith({
        pending: 'Sending your notification...',
        success: 'Your notification has been sent with success',
        error: 'Error on sending your notification',
      });
    });

    it('plays a message along the publisher edge once the broker accepted it', async () => {
      const user = userEvent.setup();
      const events = flowEvents();
      renderPublisher();

      await user.click(getSendButton());
      await flushPromises();
      events.stop();

      expect(events.edgeIds).toEqual(['1-2']);
    });

    it('plays no message when the publish fails', async () => {
      adapter.publish.mockRejectedValue(new Error('down'));
      const user = userEvent.setup();
      const events = flowEvents();
      renderPublisher();

      await user.click(getSendButton());
      await flushPromises();
      events.stop();

      expect(events.edgeIds).toEqual([]);
    });
  });

  describe('animation', () => {
    it('animates the edge while sending and disables the button', async () => {
      const user = userEvent.setup();
      renderPublisher();

      await user.click(getSendButton());

      expect(
        useStore.getState().edges.find((e) => e.id === '1-2')?.animated
      ).toBe(true);
      expect(getSendButton()).toBeDisabled();
    });

    it('stops the animation and re-enables the button after 1 s', async () => {
      vi.useFakeTimers();
      renderPublisher();

      await act(async () => {
        getSendButton().click();
      });
      expect(getSendButton()).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(
        useStore.getState().edges.find((e) => e.id === '1-2')?.animated
      ).toBe(false);
      expect(getSendButton()).toBeEnabled();
    });

    it('keeps the animation on until the second is over', async () => {
      vi.useFakeTimers();
      renderPublisher();

      await act(async () => {
        getSendButton().click();
      });
      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(
        useStore.getState().edges.find((e) => e.id === '1-2')?.animated
      ).toBe(true);
    });
  });

  describe('sending twice in a row', () => {
    it('ignores a second send while the first is still pending', async () => {
      adapter.publish.mockReturnValue(new Promise(() => {}));
      renderPublisher();

      await act(async () => {
        getSendButton().click();
      });
      await act(async () => {
        getSendButton().click();
      });

      expect(adapter.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete button', () => {
    it('removes the publisher from the store', async () => {
      const user = userEvent.setup();
      renderPublisher();

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(useStore.getState().nodes.some((n) => n.id === PUBLISHER_ID)).toBe(
        false
      );
    });
  });
});
