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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import TopicNode from './Topic.node';
import useStore from '../MQPatterns/PubSub/store';
import type { QueueFlowNode } from '../../types';

// Ids from the default graph: topic '2' (tickets/classic) publishes to the
// subscribers '3' and '4' through the edges '2-3' and '2-4'.
const TOPIC_ID = '2';

/**
 * The node reads `data` from its props, which the real flow takes from the
 * store, so render it through a small wrapper that does the same.
 */
function renderTopic(id = TOPIC_ID) {
  const Connected = () => {
    const node = useStore((state) => state.nodes.find((n) => n.id === id));
    if (!node) return null; // the node was deleted
    const props = {
      id,
      type: 'queue',
      data: node?.data,
      selected: false,
      dragging: false,
      draggable: true,
      selectable: true,
      deletable: true,
      zIndex: 0,
      isConnectable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    } as NodeProps<QueueFlowNode>;
    return <TopicNode {...props} />;
  };

  return render(
    <ReactFlowProvider>
      <Connected />
    </ReactFlowProvider>
  );
}

const getInput = () => screen.getByPlaceholderText('tickets/classic');
const topicName = (id = TOPIC_ID) =>
  useStore.getState().nodes.find((n) => n.id === id)?.data.queueName;
const hasEdge = (edgeId: string) =>
  useStore.getState().edges.some((e) => e.id === edgeId);

describe('TopicNode', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
  });

  describe('rendering', () => {
    it('shows the topic label and its current name', () => {
      renderTopic();

      expect(screen.getByText('TOPIC')).toBeInTheDocument();
      expect(getInput()).toHaveValue('tickets/classic');
    });

    it('has both a target and a source handle for a plain topic', () => {
      const { container } = renderTopic();

      expect(
        container.querySelector('.topic-node__handle--left')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.topic-node__handle--right')
      ).toBeInTheDocument();
    });

    it('hides the target handle for a wildcard topic', () => {
      const { container } = renderTopic('8');

      expect(getInput()).toHaveValue('tickets/#');
      expect(
        container.querySelector('.topic-node__handle--left')
      ).not.toBeInTheDocument();
      expect(
        container.querySelector('.topic-node__handle--right')
      ).toBeInTheDocument();
    });

    it('does not show an error for a valid name', () => {
      renderTopic();

      expect(screen.queryByText('Invalid topic name')).not.toBeInTheDocument();
    });
  });

  describe('renaming', () => {
    it('stores a valid name in the topic', async () => {
      const user = userEvent.setup();
      renderTopic();

      await user.clear(getInput());
      await user.type(getInput(), 'news/sport');

      expect(getInput()).toHaveValue('news/sport');
      expect(topicName()).toBe('news/sport');
      expect(screen.queryByText('Invalid topic name')).not.toBeInTheDocument();
    });

    it('accepts a "#" wildcard at the end of a level', async () => {
      const user = userEvent.setup();
      renderTopic();

      await user.clear(getInput());
      await user.type(getInput(), 'news/#');

      expect(topicName()).toBe('news/#');
      expect(screen.queryByText('Invalid topic name')).not.toBeInTheDocument();
    });

    it('hides the target handle once the name becomes a wildcard', async () => {
      const user = userEvent.setup();
      const { container } = renderTopic();
      expect(
        container.querySelector('.topic-node__handle--left')
      ).toBeInTheDocument();

      await user.clear(getInput());
      await user.type(getInput(), 'news/#');

      expect(
        container.querySelector('.topic-node__handle--left')
      ).not.toBeInTheDocument();
    });

    it.each(['news.sport', 'news sport!', 'a@b', 'a,b', 'a|b', 'a+b'])(
      'rejects "%s" because of an invalid character',
      async (name) => {
        const user = userEvent.setup();
        renderTopic();

        await user.clear(getInput());
        await user.type(getInput(), name);

        expect(screen.getByText('Invalid topic name')).toBeInTheDocument();
      }
    );

    it.each(['#', 'news#', 'news/#/more', '#/news'])(
      'rejects "%s" because "#" is not the last level',
      async (name) => {
        const user = userEvent.setup();
        renderTopic();

        await user.clear(getInput());
        await user.type(getInput(), name);

        expect(screen.getByText('Invalid topic name')).toBeInTheDocument();
      }
    );

    it('keeps the last valid name in the topic when the input turns invalid', async () => {
      const user = userEvent.setup();
      renderTopic();

      await user.clear(getInput());
      await user.type(getInput(), 'bad.name');

      expect(topicName()).toBe('bad');
      expect(getInput()).toHaveValue('bad.name');
    });

    it('recovers from an error once the name is valid again', async () => {
      const user = userEvent.setup();
      renderTopic();
      await user.clear(getInput());
      await user.type(getInput(), 'bad.');
      expect(screen.getByText('Invalid topic name')).toBeInTheDocument();

      await user.type(getInput(), '{Backspace}');

      expect(screen.queryByText('Invalid topic name')).not.toBeInTheDocument();
    });

    it('disconnects the topic from its publishers and subscribers', async () => {
      const user = userEvent.setup();
      renderTopic();
      expect(hasEdge('1-2')).toBe(true);
      expect(hasEdge('2-3')).toBe(true);

      await user.type(getInput(), 'x');

      expect(hasEdge('1-2')).toBe(false);
      expect(hasEdge('2-3')).toBe(false);
      expect(hasEdge('2-4')).toBe(false);
    });
  });

  describe('deleting', () => {
    it('removes the topic and its connections', async () => {
      const user = userEvent.setup();
      renderTopic();

      await user.click(screen.getByRole('button', { name: 'Delete Topic' }));

      expect(
        useStore.getState().nodes.find((n) => n.id === TOPIC_ID)
      ).toBeUndefined();
      expect(hasEdge('1-2')).toBe(false);
      expect(hasEdge('2-3')).toBe(false);
      expect(hasEdge('2-4')).toBe(false);
    });
  });
});
