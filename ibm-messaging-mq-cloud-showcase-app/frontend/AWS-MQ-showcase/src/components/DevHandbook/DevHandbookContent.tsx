/**
 * Copyright 2022, 2026 IBM Corp.
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

import React from 'react';
import {
  Link,
  ListItem,
  OrderedList,
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
  Tag,
  UnorderedList,
} from '@carbon/react';
import {
  ArrowRight,
  Book,
  Certificate,
  Code,
  Launch,
  LogoGithub,
  Trophy,
} from '@carbon/icons-react';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const GLOSSARY = [
  {
    term: 'Queue manager',
    definition:
      'The server-side component that hosts queues and topics, manages connections, and routes messages. In this playground it runs as a container.',
  },
  {
    term: 'Queue',
    definition:
      'A named destination where messages are stored until a consumer retrieves them. Messages are delivered in FIFO order and each message is consumed by exactly one application.',
  },
  {
    term: 'Topic',
    definition:
      'A named subject that publishers write to and subscribers read from. Unlike a queue, every active subscriber receives its own copy of each published message.',
  },
  {
    term: 'Message',
    definition:
      'A unit of data exchanged between applications. It has three parts: a descriptor (routing metadata), optional properties (key/value pairs), and a payload (your application data).',
  },
  {
    term: 'Channel',
    definition:
      'A logical link that moves data between two queue managers (message channels) or between an MQ client and a queue manager (MQI channels). AMQP channels connect AMQP clients to a queue manager. This playground connects clients through the SVRCONN channel DEV.APP.SVRCONN.',
  },
  {
    term: 'Producer / Publisher',
    definition:
      'An application that puts messages onto a queue (producer) or publishes events to a topic (publisher).',
  },
  {
    term: 'Consumer / Subscriber',
    definition:
      'An application that gets messages from a queue (consumer) or receives published events from a topic (subscriber).',
  },
  {
    term: 'Reply-to queue',
    definition:
      'A temporary destination created by the requestor in a request-response exchange. The requestor puts its address in the message so the responder knows where to send the reply.',
  },
];

const PATTERN_COMPARISON = [
  {
    pattern: 'Point-to-point',
    direction: 'One-to-one',
    coupling: 'Loose',
    delivery: 'Exactly once',
    persistence: 'Queue-backed',
    useCase: 'Order processing, task queues',
    protocols: 'REST, JMS, AMQP',
  },
  {
    pattern: 'Pub / Sub',
    direction: 'One-to-many',
    coupling: 'Very loose',
    delivery: 'Copy per subscriber',
    persistence: 'Topic-based',
    useCase: 'Event distribution, notifications',
    protocols: 'MQTT, REST, JMS, AMQP',
  },
  {
    pattern: 'Request / Response',
    direction: 'Bidirectional',
    coupling: 'Loose',
    delivery: 'Exactly once (each leg)',
    persistence: 'Temporary reply queue',
    useCase: 'Service calls, async RPC',
    protocols: 'REST, JMS, AMQP',
  },
];

const REPO_BASE =
  'https://github.com/ibm-messaging/mq-dev-patterns/tree/master';

const CODE_SAMPLE_LINKS = [
  { label: 'Node.js samples (ibmmq)', href: `${REPO_BASE}/Node.js` },
  { label: 'Python samples (pymqi)', href: `${REPO_BASE}/Python` },
  { label: 'Java JMS samples', href: `${REPO_BASE}/JMS` },
  { label: 'Java samples (MQ classes)', href: `${REPO_BASE}/Java-MQ` },
  { label: 'Go samples', href: `${REPO_BASE}/Go` },
];

const MQRC_ERRORS = [
  {
    code: '2035',
    name: 'MQRC_NOT_AUTHORIZED',
    meaning:
      'The application credentials are wrong, or the app user lacks permission on the queue/channel. Check APP_PASSWORD and channel security settings.',
  },
  {
    code: '2058',
    name: 'MQRC_Q_MGR_NAME_ERROR',
    meaning:
      'The queue manager name does not match. The default name in this playground is QM1.',
  },
  {
    code: '2059',
    name: 'MQRC_Q_MGR_NOT_AVAILABLE',
    meaning:
      'The queue manager is not running or the MQ container has stopped. Check docker compose ps.',
  },
  {
    code: '2085',
    name: 'MQRC_UNKNOWN_OBJECT_NAME',
    meaning:
      'The queue or topic name you specified does not exist on the queue manager.',
  },
  {
    code: '2195',
    name: 'MQRC_UNEXPECTED_ERROR',
    meaning:
      'A general connectivity failure. Usually means the host or port is wrong, or a firewall is blocking port 1414.',
  },
  {
    code: '2033',
    name: 'MQRC_NO_MSG_AVAILABLE',
    meaning:
      'The queue is empty. No messages were available within the wait interval.',
  },
];

const IBM_DEV_LINKS = [
  {
    icon: <Trophy size={20} />,
    label: 'MQ Developer Essentials learning path',
    description:
      'End-to-end guide: fundamentals, queue manager setup, first Java app, and the coding challenge.',
    href: 'https://developer.ibm.com/learningpaths/ibm-mq-badge/',
    tag: 'Learning path',
  },
  {
    icon: <Code size={20} />,
    label: 'Take the MQ coding challenge',
    description:
      'Build a real-world JMS ticket-reseller app and earn the IBM MQ Developer Essentials badge.',
    href: 'https://developer.ibm.com/learningpaths/ibm-mq-badge/mq-coding-challenge/',
    tag: 'Challenge',
  },
  {
    icon: <ArrowRight size={20} />,
    label: 'Deploy this app to AWS',
    description:
      'Deploy the messaging playground to AWS ECS Fargate with a single CDK command.',
    href: 'https://developer.ibm.com/learningpaths/ibm-mq-on-aws-badge/build-deploy-mq-app-aws-cloud/',
    tag: 'Tutorial',
  },
  {
    icon: <Code size={20} />,
    label: 'MQ on AWS coding challenge',
    description:
      'Extend the playground app with message properties and selectors, then redeploy to AWS.',
    href: 'https://developer.ibm.com/learningpaths/ibm-mq-on-aws-badge/mq-on-aws-coding-challenge/',
    tag: 'Challenge',
  },
  {
    icon: <Book size={20} />,
    label: 'MQ developer cheat sheet',
    description:
      'Quick-reference tips for connecting, debugging, TLS, persistence, and transactions.',
    href: 'https://developer.ibm.com/learningpaths/ibm-mq-badge/mq-dev-cheat-sheet/',
    tag: 'Reference',
  },
  {
    icon: <Certificate size={20} />,
    label: 'IBM MQ on AWS — Developer Essentials',
    description:
      'Full learning path: queue manager on AWS, deploy the app, coding challenge, and badge.',
    href: 'https://developer.ibm.com/learningpaths/ibm-mq-on-aws-badge/',
    tag: 'Learning path',
  },
  {
    icon: <LogoGithub size={20} />,
    label: 'MQ dev patterns on GitHub',
    description:
      'Source code for this app and a wide range of MQ samples across Node.js, Java, Python, Go, and more.',
    href: 'https://github.com/ibm-messaging/mq-dev-patterns',
    tag: 'GitHub',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface HandbookSectionProps {
  title: string;
  children: React.ReactNode;
}

const HandbookSection: React.FC<HandbookSectionProps> = ({
  title,
  children,
}) => (
  <section className="dev-handbook__section">
    <h3 className="dev-handbook__section-title">{title}</h3>
    {children}
  </section>
);

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

const DevHandbookContent: React.FC = () => (
  <div className="dev-handbook__body" tabIndex={-1}>
    {/* ── 1. How this playground works ─────────────────────────────────── */}
    <HandbookSection title="How this playground works">
      <p className="dev-handbook__text">
        This app connects to a <strong>live IBM MQ queue manager</strong>{' '}
        running in a container. Every action you take — sending a message,
        toggling a consumer on, dragging a subscriber onto the canvas — calls a
        real MQ REST API on the backend, which in turn puts or gets an actual
        message from the queue manager.
      </p>
      <p className="dev-handbook__text">
        The three tabs each demonstrate a different messaging pattern. Drag
        components from the sidebar onto the canvas, connect them, and interact
        with the controls to see live message counts update in real time.
      </p>
      <OrderedList className="dev-handbook__list">
        <ListItem>
          <strong>Point-to-point</strong> — drag a producer and a consumer onto
          the canvas, connect both to a queue, then send messages and watch them
          flow through.
        </ListItem>
        <ListItem>
          <strong>Publish / Subscribe</strong> — connect a publisher to a topic,
          add one or more subscribers, then publish and watch every subscriber
          receive a copy.
        </ListItem>
        <ListItem>
          <strong>Request / Response</strong> — connect a requestor to a queue,
          toggle the responder on, send a request and observe the automatic
          reply-to queue lifecycle.
        </ListItem>
      </OrderedList>
    </HandbookSection>

    {/* ── 2. MQ concepts glossary ──────────────────────────────────────── */}
    <HandbookSection title="MQ concepts glossary">
      <p className="dev-handbook__text">
        Key terms used throughout this app and IBM MQ documentation.
      </p>
      <StructuredListWrapper className="dev-handbook__table" isCondensed>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Term</StructuredListCell>
            <StructuredListCell head>Definition</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {GLOSSARY.map(({ term, definition }) => (
            <StructuredListRow key={term}>
              <StructuredListCell noWrap>
                <strong>{term}</strong>
              </StructuredListCell>
              <StructuredListCell>{definition}</StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
    </HandbookSection>

    {/* ── 3. Pattern comparison ─────────────────────────────────────────── */}
    <HandbookSection title="Pattern comparison">
      <p className="dev-handbook__text">
        Compare the three patterns shown in this playground across the
        dimensions that matter most when choosing one for your application.
      </p>
      <StructuredListWrapper className="dev-handbook__table" isCondensed>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Pattern</StructuredListCell>
            <StructuredListCell head>Direction</StructuredListCell>
            <StructuredListCell head>Delivery</StructuredListCell>
            <StructuredListCell head>Typical use case</StructuredListCell>
            <StructuredListCell head>Protocols</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {PATTERN_COMPARISON.map(
            ({ pattern, direction, delivery, useCase, protocols }) => (
              <StructuredListRow key={pattern}>
                <StructuredListCell noWrap>
                  <strong>{pattern}</strong>
                </StructuredListCell>
                <StructuredListCell noWrap>{direction}</StructuredListCell>
                <StructuredListCell noWrap>{delivery}</StructuredListCell>
                <StructuredListCell>{useCase}</StructuredListCell>
                <StructuredListCell noWrap>{protocols}</StructuredListCell>
              </StructuredListRow>
            )
          )}
        </StructuredListBody>
      </StructuredListWrapper>
    </HandbookSection>

    {/* ── 4. What happens when you click Send ──────────────────────────── */}
    <HandbookSection title="What happens when you click Send">
      <p className="dev-handbook__text">
        Tracing a point-to-point message end-to-end through the stack:
      </p>
      <OrderedList className="dev-handbook__list">
        <ListItem>
          <strong>Frontend</strong> — the producer node calls the backend REST
          API: <code>PUT /api/send</code> with the queue name and message body.
        </ListItem>
        <ListItem>
          <strong>Backend (Node.js)</strong> — the message session manager
          receives the request and opens a connection to the queue manager using
          the <code>ibmmq</code> Node.js client library.
        </ListItem>
        <ListItem>
          <strong>Queue manager (MQ container)</strong> — the queue manager
          authenticates the connection, authorises access to the queue, and
          persists the message to <code>DEV.QUEUE.1</code>.
        </ListItem>
        <ListItem>
          <strong>Queue depth</strong> — the frontend polls{' '}
          <code>GET /api/queueStatus</code> to read the current depth and
          renders it as the percentage-full indicator on the queue node.
        </ListItem>
        <ListItem>
          <strong>Consumer</strong> — when you toggle a consumer on, the backend
          calls <code>GET /api/receive</code>, which issues an MQ{' '}
          <code>MQGET</code> and returns the message body to the frontend for
          display.
        </ListItem>
      </OrderedList>
      <p className="dev-handbook__text">
        The full backend source lives in{' '}
        <Link
          href="https://github.com/ibm-messaging/mq-dev-patterns/tree/master/ibm-messaging-mq-cloud-showcase-app/backend"
          target="_blank"
          rel="noopener noreferrer"
          renderIcon={Launch}>
          backend/AWS-showcase-backend
        </Link>{' '}
        on GitHub.
      </p>
    </HandbookSection>

    {/* ── 5. Try it yourself — code samples ────────────────────────────── */}
    <HandbookSection title="Try it yourself">
      <p className="dev-handbook__text">
        Connect to the same queue manager running in this playground from your
        own application. The queue manager listens on{' '}
        <code>localhost:1414</code> with channel <code>DEV.APP.SVRCONN</code>,
        user <code>app</code>, and the password you set in{' '}
        <code>APP_PASSWORD</code>.
      </p>
      <UnorderedList className="dev-handbook__list">
        {CODE_SAMPLE_LINKS.map(({ label, href }) => (
          <ListItem key={label}>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              renderIcon={Launch}>
              {label}
            </Link>
          </ListItem>
        ))}
      </UnorderedList>
      <p className="dev-handbook__text">
        More language samples (.NET, MQTT, REST) are in the{' '}
        <Link
          href="https://github.com/ibm-messaging/mq-dev-patterns"
          target="_blank"
          rel="noopener noreferrer"
          renderIcon={Launch}>
          mq-dev-patterns repository
        </Link>
        .
      </p>
    </HandbookSection>

    {/* ── 6. Common errors ─────────────────────────────────────────────── */}
    <HandbookSection title="Common errors and what they mean">
      <p className="dev-handbook__text">
        IBM MQ uses reason codes (MQRC) to describe errors. Here are the ones
        you are most likely to encounter while exploring this playground.
      </p>
      <StructuredListWrapper className="dev-handbook__table" isCondensed>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Code</StructuredListCell>
            <StructuredListCell head>Name</StructuredListCell>
            <StructuredListCell head>What it means</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {MQRC_ERRORS.map(({ code, name, meaning }) => (
            <StructuredListRow key={code}>
              <StructuredListCell noWrap>
                <code>{code}</code>
              </StructuredListCell>
              <StructuredListCell noWrap>
                <code>{name}</code>
              </StructuredListCell>
              <StructuredListCell>{meaning}</StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
      <p className="dev-handbook__text">
        For a full list see the{' '}
        <Link
          href="https://www.ibm.com/docs/en/ibm-mq/latest?topic=codes-reason-mqrc"
          target="_blank"
          rel="noopener noreferrer"
          renderIcon={Launch}>
          IBM MQ reason codes reference
        </Link>
        .
      </p>
    </HandbookSection>

    {/* ── 7. Learn more & next steps ───────────────────────────────────── */}
    <HandbookSection title="Learn more &amp; next steps">
      <p className="dev-handbook__text">
        Ready to go deeper? These resources from IBM Developer take you from
        playground to production.
      </p>
      <ul className="dev-handbook__link-list">
        {IBM_DEV_LINKS.map(({ icon, label, description, href, tag }) => (
          <li key={href} className="dev-handbook__link-card">
            <div className="dev-handbook__link-card-icon">{icon}</div>
            <div className="dev-handbook__link-card-body">
              <div className="dev-handbook__link-card-header">
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  renderIcon={Launch}
                  className="dev-handbook__link-card-title">
                  {label}
                </Link>
                <Tag size="sm" type="blue" className="dev-handbook__link-tag">
                  {tag}
                </Tag>
              </div>
              <p className="dev-handbook__link-card-desc">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </HandbookSection>
  </div>
);

export default DevHandbookContent;
