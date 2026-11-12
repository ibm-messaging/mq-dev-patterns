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

import initialNodes from './nodes';
import initialEdges from './edges';

// The coding-challenge flag is inlined at build time and is off for tests, so
// these tests cover the default graph only.
describe('PointToPoint initial graph', () => {
  describe('nodes', () => {
    it('has one producer, one consumer and one queue', () => {
      const types = initialNodes.map((node) => node.type).sort();

      expect(types).toEqual(['consumer', 'producer', 'queue']);
    });

    it('uses unique node ids', () => {
      const ids = initialNodes.map((node) => node.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('connects the producer and the consumer to DEV.QUEUE.1', () => {
      const producer = initialNodes.find((n) => n.type === 'producer');
      const consumer = initialNodes.find((n) => n.type === 'consumer');

      expect(producer?.data).toMatchObject({
        role: 'Producer',
        connectedQueue: 'DEV.QUEUE.1',
        isActive: false,
      });
      expect(consumer?.data).toMatchObject({
        role: 'Consumer',
        connectedQueue: 'DEV.QUEUE.1',
        isActive: false,
      });
    });

    it('starts with an empty DEV.QUEUE.1', () => {
      const queue = initialNodes.find((n) => n.type === 'queue');

      expect(queue?.data).toMatchObject({
        role: 'q',
        queueName: 'DEV.QUEUE.1',
        depth: 0,
      });
    });

    it('places the queue at the default position', () => {
      const queue = initialNodes.find((n) => n.type === 'queue');

      expect(queue?.position).toEqual({ x: 650, y: 220 });
    });

    it('makes every node draggable', () => {
      expect(initialNodes.every((node) => node.draggable)).toBe(true);
    });
  });

  describe('edges', () => {
    it('connects producer -> queue and queue -> consumer', () => {
      const producer = initialNodes.find((n) => n.type === 'producer');
      const consumer = initialNodes.find((n) => n.type === 'consumer');
      const queue = initialNodes.find((n) => n.type === 'queue');

      expect(initialEdges).toHaveLength(2);
      expect(initialEdges).toContainEqual(
        expect.objectContaining({ source: producer?.id, target: queue?.id })
      );
      expect(initialEdges).toContainEqual(
        expect.objectContaining({ source: queue?.id, target: consumer?.id })
      );
    });

    it('only references nodes that exist', () => {
      const ids = new Set(initialNodes.map((node) => node.id));

      initialEdges.forEach((edge) => {
        expect(ids.has(edge.source)).toBe(true);
        expect(ids.has(edge.target)).toBe(true);
      });
    });

    it('uses the custom edge type and starts not animated', () => {
      initialEdges.forEach((edge) => {
        expect(edge.type).toBe('custom');
        expect(edge.animated).toBe(false);
      });
    });

    it('uses "<source>-<target>" ids, as the store relies on this format', () => {
      initialEdges.forEach((edge) => {
        expect(edge.id).toBe(`${edge.source}-${edge.target}`);
      });
    });
  });
});
