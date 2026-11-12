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

import Cookies from 'js-cookie';

const SESSION_ID = 'a'.repeat(32);
const REQUESTOR_ID = 'b'.repeat(32);

// Session cookies are read once at module load, so set them before import.
Cookies.set('sessionID', SESSION_ID);
Cookies.set('requestorSessionID', REQUESTOR_ID);

const { default: useStore } = await import('./store');

const TMP_QUEUE = 'amq.gen-tmp';

describe('RequestResponse store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState(useStore.getInitialState());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initial graph', () => {
    it('uses the session cookies as requestor and responder node IDs', () => {
      const { nodes } = useStore.getState();
      const requestor = nodes.find((n) => n.id === REQUESTOR_ID);
      const responder = nodes.find((n) => n.id === SESSION_ID);

      expect(requestor?.type).toBe('producer');
      expect(responder?.type).toBe('consumer');
    });

    it('starts with one queue (DEV.QUEUE.3) wired to both applications', () => {
      const { nodes, edges } = useStore.getState();
      const queue = nodes.find((n) => n.id === '17');

      expect(queue?.type).toBe('queue');
      expect(queue?.data.queueName).toBe('DEV.QUEUE.3');
      expect(edges.map((e) => e.id)).toEqual([
        `17-${SESSION_ID}`,
        `${REQUESTOR_ID}-17`,
      ]);
    });
  });

  describe('creteTmpQueue', () => {
    it('adds a reply queue node and connects it to the requestor', () => {
      useStore.getState().creteTmpQueue(TMP_QUEUE, REQUESTOR_ID);

      const { nodes, edges } = useStore.getState();
      const reply = nodes.find((n) => n.id === '10');

      expect(reply?.type).toBe('queue');
      expect(reply?.data.queueName).toBe(TMP_QUEUE);
      expect(reply?.data.isReplyQueue).toBe(true);
      expect(edges).toContainEqual(
        expect.objectContaining({ source: '10', target: REQUESTOR_ID })
      );
    });
  });

  describe('drawTmpConnection', () => {
    beforeEach(() => {
      useStore.getState().creteTmpQueue(TMP_QUEUE, REQUESTOR_ID);
    });

    it('draws a requestor → reply-queue edge when isResp is false', () => {
      useStore.getState().drawTmpConnection(TMP_QUEUE, REQUESTOR_ID, false);

      expect(useStore.getState().edges).toContainEqual(
        expect.objectContaining({ source: REQUESTOR_ID, target: '10' })
      );
    });

    it('draws a responder → reply-queue edge when isResp is true', () => {
      useStore.getState().drawTmpConnection(TMP_QUEUE, SESSION_ID, true);

      expect(useStore.getState().edges).toContainEqual(
        expect.objectContaining({ source: SESSION_ID, target: '10' })
      );
    });

    it('does nothing when the reply queue does not exist', () => {
      const before = useStore.getState().edges;
      useStore.getState().drawTmpConnection('missing', SESSION_ID, true);

      expect(useStore.getState().edges).toBe(before);
    });
  });

  describe('animateTmpConnection', () => {
    beforeEach(() => {
      useStore.getState().creteTmpQueue(TMP_QUEUE, REQUESTOR_ID);
      useStore.getState().drawTmpConnection(TMP_QUEUE, SESSION_ID, true);
    });

    it('increments the reply queue landCount after the flow animation', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      useStore.getState().animateTmpConnection(TMP_QUEUE, SESSION_ID);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'mq-message-flow' })
      );
      expect(
        useStore.getState().nodes.find((n) => n.id === '10')?.data.landCount
      ).toBeUndefined();

      vi.advanceTimersByTime(950);

      expect(
        useStore.getState().nodes.find((n) => n.id === '10')?.data.landCount
      ).toBe(1);
    });

    it('animates the responder → reply-queue edge', () => {
      useStore.getState().animateTmpConnection(TMP_QUEUE, SESSION_ID);

      const edge = useStore
        .getState()
        .edges.find((e) => e.source === SESSION_ID && e.target === '10');
      expect(edge?.animated).toBe(true);
    });

    it('does nothing when the reply queue does not exist', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      useStore.getState().animateTmpConnection('missing', SESSION_ID);

      expect(dispatchSpy).not.toHaveBeenCalled();
      vi.advanceTimersByTime(950);
      expect(
        useStore.getState().nodes.find((n) => n.id === '10')?.data.landCount
      ).toBeUndefined();
    });
  });

  describe('deleteEdgeFromConnection', () => {
    beforeEach(() => {
      useStore.getState().creteTmpQueue(TMP_QUEUE, REQUESTOR_ID);
      useStore.getState().drawTmpConnection(TMP_QUEUE, SESSION_ID, true);
    });

    it('removes the responder → reply-queue edge', () => {
      useStore.getState().deleteEdgeFromConnection(TMP_QUEUE, SESSION_ID);

      expect(useStore.getState().edges).not.toContainEqual(
        expect.objectContaining({ source: SESSION_ID, target: '10' })
      );
    });

    it('leaves other edges untouched', () => {
      useStore.getState().deleteEdgeFromConnection(TMP_QUEUE, SESSION_ID);

      expect(useStore.getState().edges).toContainEqual(
        expect.objectContaining({ source: '10', target: REQUESTOR_ID })
      );
      expect(useStore.getState().edges).toContainEqual(
        expect.objectContaining({ source: '17', target: SESSION_ID })
      );
    });

    it('does nothing when the reply queue does not exist', () => {
      const before = useStore.getState().edges;
      useStore.getState().deleteEdgeFromConnection('missing', SESSION_ID);

      expect(useStore.getState().edges).toBe(before);
    });
  });

  describe('deleteTmpQueueFromTmpQueueName', () => {
    it('removes the reply queue node by its queue name', () => {
      useStore.getState().creteTmpQueue(TMP_QUEUE, REQUESTOR_ID);

      useStore.getState().deleteTmpQueueFromTmpQueueName(TMP_QUEUE);

      expect(
        useStore.getState().nodes.find((n) => n.id === '10')
      ).toBeUndefined();
    });

    it('does nothing when no node has that queue name', () => {
      const before = useStore.getState().nodes;
      useStore.getState().deleteTmpQueueFromTmpQueueName('missing');

      expect(useStore.getState().nodes).toBe(before);
    });
  });

  describe('drainMessageFromQueue', () => {
    it('decrements the local depth and bumps drainCount on the inbound queue', () => {
      useStore.setState({ localDepths: { '17': 3 } });

      useStore.getState().drainMessageFromQueue(SESSION_ID);

      expect(useStore.getState().localDepths['17']).toBe(2);
      expect(
        useStore.getState().nodes.find((n) => n.id === '17')?.data.drainCount
      ).toBe(1);
    });

    it('never drops the local depth below zero', () => {
      useStore.setState({ localDepths: { '17': 0 } });

      useStore.getState().drainMessageFromQueue(SESSION_ID);

      expect(useStore.getState().localDepths['17']).toBe(0);
    });

    it('does nothing when the responder has no inbound edge', () => {
      useStore.setState({ edges: [] });
      const before = useStore.getState().nodes;

      useStore.getState().drainMessageFromQueue(SESSION_ID);

      expect(useStore.getState().nodes).toBe(before);
    });
  });

  describe('sendMessages', () => {
    it('adds the requested count to the local depth of the queue', () => {
      useStore.getState().sendMessages(REQUESTOR_ID, 2);

      expect(useStore.getState().localDepths['17']).toBe(2);
    });

    it('emits one flow event per message, spaced one second apart', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      useStore.getState().sendMessages(REQUESTOR_ID, 2);
      vi.advanceTimersByTime(0);
      expect(dispatchSpy).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
    });

    it('increments landCount on the queue after each message lands', () => {
      useStore.getState().sendMessages(REQUESTOR_ID, 1);

      vi.advanceTimersByTime(950);

      expect(
        useStore.getState().nodes.find((n) => n.id === '17')?.data.landCount
      ).toBe(1);
    });

    it('does nothing when the node has no outgoing edge', () => {
      useStore.setState({ edges: [] });

      useStore.getState().sendMessages(REQUESTOR_ID, 1);

      expect(useStore.getState().localDepths).toEqual({});
    });
  });

  describe('onClick', () => {
    it('toggles the isActive flag of the node', () => {
      useStore.getState().onClick(SESSION_ID);
      expect(
        useStore.getState().nodes.find((n) => n.id === SESSION_ID)?.data
          .isActive
      ).toBe(true);

      useStore.getState().onClick(SESSION_ID);
      expect(
        useStore.getState().nodes.find((n) => n.id === SESSION_ID)?.data
          .isActive
      ).toBe(false);
    });
  });

  describe('onDeleteNode', () => {
    it('removes a non-queue node without touching edges', () => {
      useStore.getState().onDeleteNode(REQUESTOR_ID);

      expect(
        useStore.getState().nodes.find((n) => n.id === REQUESTOR_ID)
      ).toBeUndefined();
      expect(useStore.getState().edges).toHaveLength(2);
    });

    it('removes a queue node and every edge attached to it', () => {
      useStore.getState().onDeleteNode('17', true);

      expect(
        useStore.getState().nodes.find((n) => n.id === '17')
      ).toBeUndefined();
      expect(useStore.getState().edges).toHaveLength(0);
    });
  });
});
