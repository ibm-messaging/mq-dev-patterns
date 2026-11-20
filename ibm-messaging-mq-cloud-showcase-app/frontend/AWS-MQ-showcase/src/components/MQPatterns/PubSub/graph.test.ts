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

// Tests the starting graph (PubSub/nodes.ts and edges.ts). It checks the two
// publishers, the three topics and the four subscribers. It checks their data
// and how they are linked. It checks the six edges that join them.

import initialNodes from './nodes';
import initialEdges from './edges';

const byType = (type: string) => initialNodes.filter((n) => n.type === type);
const byLabel = (label: string) =>
  initialNodes.find((n) => n.data.role !== 'q' && n.data.label === label);
const topic = (name: string) =>
  initialNodes.find((n) => n.data.role === 'q' && n.data.queueName === name);

describe('PubSub initial graph', () => {
  describe('nodes', () => {
    it('has two publishers, three topics and four subscribers', () => {
      expect(byType('producer')).toHaveLength(2);
      expect(byType('queue')).toHaveLength(3);
      expect(byType('consumer')).toHaveLength(4);
    });

    it('uses unique node ids', () => {
      const ids = initialNodes.map((node) => node.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('makes every node draggable', () => {
      expect(initialNodes.every((node) => node.draggable)).toBe(true);
    });

    it('offers the topics tickets/classic, tickets/VIP and tickets/#', () => {
      const names = byType('queue').map(
        (n) => n.data.role === 'q' && n.data.queueName
      );

      expect(names).toEqual(['tickets/classic', 'tickets/VIP', 'tickets/#']);
    });

    it('starts every topic with a depth of 0', () => {
      byType('queue').forEach((node) => {
        expect(node.data).toMatchObject({ role: 'q', depth: 0 });
      });
    });

    it('starts every publisher idle', () => {
      byType('producer').forEach((node) => {
        expect(node.data).toMatchObject({
          role: 'Producer',
          label: 'Publisher',
          isActive: false,
        });
      });
    });

    it('starts every subscriber with subscriptionState 0', () => {
      byType('consumer').forEach((node) => {
        expect(node.data).toMatchObject({
          role: 'Consumer',
          subscriptionState: 0,
        });
      });
    });

    it('wires the publishers and subscribers to their topic by name', () => {
      const connected = initialNodes
        .filter((n) => n.data.role !== 'q')
        .map((n) => [
          n.data.role === 'q' ? '' : n.data.label,
          n.data.role === 'q' ? '' : n.data.connectedQueue,
        ]);

      expect(connected).toEqual([
        ['Publisher', 'tickets/classic'],
        ['Classic consumer 1', 'tickets/classic'],
        ['Classic consumer 2', 'tickets/classic'],
        ['VIP Consumer', 'tickets/VIP'],
        ['Publisher', 'tickets/VIP'],
        ['Administrator', 'tickets/#'],
      ]);
    });

    it('has an Administrator subscriber on the wildcard topic', () => {
      expect(byLabel('Administrator')?.data).toMatchObject({
        connectedQueue: 'tickets/#',
      });
      expect(topic('tickets/#')).toBeDefined();
    });
  });

  describe('edges', () => {
    it('has six edges', () => {
      expect(initialEdges).toHaveLength(6);
    });

    it('connects each publisher to its topic', () => {
      expect(initialEdges).toContainEqual(
        expect.objectContaining({ id: '1-2', source: '1', target: '2' })
      );
      expect(initialEdges).toContainEqual(
        expect.objectContaining({ id: '6-7', source: '6', target: '7' })
      );
    });

    it('fans the classic topic out to both classic subscribers', () => {
      const fromClassic = initialEdges.filter((e) => e.source === '2');

      expect(fromClassic.map((e) => e.target).sort()).toEqual(['3', '4']);
    });

    it('only references nodes that exist', () => {
      const ids = new Set(initialNodes.map((node) => node.id));

      initialEdges.forEach((edge) => {
        expect(ids.has(edge.source)).toBe(true);
        expect(ids.has(edge.target)).toBe(true);
      });
    });

    it('agrees with the topic names stored on the nodes', () => {
      initialEdges.forEach((edge) => {
        const source = initialNodes.find((n) => n.id === edge.source);
        const target = initialNodes.find((n) => n.id === edge.target);
        const topicNode = source?.data.role === 'q' ? source : target;
        const appNode = source?.data.role === 'q' ? target : source;

        expect(topicNode?.data.role).toBe('q');
        expect(appNode?.data).toMatchObject({
          connectedQueue:
            topicNode?.data.role === 'q' && topicNode.data.queueName,
        });
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
