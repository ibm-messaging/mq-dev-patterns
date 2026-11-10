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

import { render, screen, within } from '@testing-library/react';
import DevHandbookContent from './DevHandbookContent';

const section = (title: string) => {
  const heading = screen.getByRole('heading', { level: 3, name: title });
  return within(heading.closest('section') as HTMLElement);
};

describe('DevHandbookContent', () => {
  beforeEach(() => {
    render(<DevHandbookContent />);
  });

  it('renders the seven handbook sections in order', () => {
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);

    expect(titles).toEqual([
      'How this playground works',
      'MQ concepts glossary',
      'Pattern comparison',
      'What happens when you click Send',
      'Try it yourself',
      'Common errors and what they mean',
      'Learn more & next steps',
    ]);
  });

  it('explains the three patterns in the overview', () => {
    const overview = section('How this playground works');

    expect(overview.getByText('Point-to-point')).toBeInTheDocument();
    expect(overview.getByText('Publish / Subscribe')).toBeInTheDocument();
    expect(overview.getByText('Request / Response')).toBeInTheDocument();
    expect(overview.getAllByRole('listitem')).toHaveLength(3);
  });

  it('lists every glossary term with its definition', () => {
    const glossary = section('MQ concepts glossary');

    [
      'Queue manager',
      'Queue',
      'Topic',
      'Message',
      'Channel',
      'Producer / Publisher',
      'Consumer / Subscriber',
      'Reply-to queue',
    ].forEach((term) => {
      expect(glossary.getByText(term)).toBeInTheDocument();
    });
    expect(
      glossary.getByText(/named destination where messages are stored/)
    ).toBeInTheDocument();
    // header row + 8 terms
    expect(glossary.getAllByRole('row')).toHaveLength(9);
  });

  it('compares the three patterns across the headline dimensions', () => {
    const comparison = section('Pattern comparison');

    [
      'Pattern',
      'Direction',
      'Delivery',
      'Typical use case',
      'Protocols',
    ].forEach((header) => {
      expect(comparison.getByText(header)).toBeInTheDocument();
    });
    expect(comparison.getByText('One-to-one')).toBeInTheDocument();
    expect(comparison.getByText('One-to-many')).toBeInTheDocument();
    expect(comparison.getByText('Bidirectional')).toBeInTheDocument();
    expect(comparison.getAllByRole('row')).toHaveLength(4);
  });

  it('traces the send flow and links to the backend source', () => {
    const flow = section('What happens when you click Send');

    expect(flow.getAllByRole('listitem')).toHaveLength(5);
    expect(flow.getByText('PUT /api/send')).toBeInTheDocument();
    const backend = flow.getByRole('link', {
      name: /backend\/AWS-showcase-backend/,
    });
    expect(backend).toHaveAttribute(
      'href',
      'https://github.com/ibm-messaging/mq-dev-patterns/tree/master/ibm-messaging-mq-cloud-showcase-app/backend'
    );
  });

  it('links to the code samples for each language', () => {
    const samples = section('Try it yourself');
    const base = 'https://github.com/ibm-messaging/mq-dev-patterns/tree/master';

    expect(
      samples.getByRole('link', { name: 'Node.js samples (ibmmq)' })
    ).toHaveAttribute('href', `${base}/Node.js`);
    expect(
      samples.getByRole('link', { name: 'Python samples (pymqi)' })
    ).toHaveAttribute('href', `${base}/Python`);
    expect(
      samples.getByRole('link', { name: 'Java JMS samples' })
    ).toHaveAttribute('href', `${base}/JMS`);
    expect(
      samples.getByRole('link', { name: 'Java samples (MQ classes)' })
    ).toHaveAttribute('href', `${base}/Java-MQ`);
    expect(samples.getByRole('link', { name: 'Go samples' })).toHaveAttribute(
      'href',
      `${base}/Go`
    );
    expect(samples.getByText('localhost:1414')).toBeInTheDocument();
    expect(samples.getByText('DEV.APP.SVRCONN')).toBeInTheDocument();
  });

  it('documents the common MQRC error codes', () => {
    const errors = section('Common errors and what they mean');

    ['2035', '2058', '2059', '2085', '2195', '2033'].forEach((code) => {
      expect(errors.getByText(code)).toBeInTheDocument();
    });
    expect(errors.getByText('MQRC_NOT_AUTHORIZED')).toBeInTheDocument();
    expect(errors.getByText('MQRC_NO_MSG_AVAILABLE')).toBeInTheDocument();
    expect(errors.getAllByRole('row')).toHaveLength(7);
    expect(
      errors.getByRole('link', { name: 'IBM MQ reason codes reference' })
    ).toHaveAttribute(
      'href',
      'https://www.ibm.com/docs/en/ibm-mq/latest?topic=codes-reason-mqrc'
    );
  });

  it('lists the learning resources with a tag each', () => {
    const resources = section('Learn more & next steps');

    expect(resources.getAllByRole('listitem')).toHaveLength(7);
    expect(
      resources.getByRole('link', {
        name: 'MQ Developer Essentials learning path',
      })
    ).toHaveAttribute(
      'href',
      'https://developer.ibm.com/learningpaths/ibm-mq-badge/'
    );
    expect(resources.getAllByText('Challenge')).toHaveLength(2);
    expect(resources.getAllByText('Learning path')).toHaveLength(2);
    expect(resources.getByText('GitHub')).toBeInTheDocument();
  });

  it('opens every external link in a new tab without leaking the opener', () => {
    const external = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('https://'));

    expect(external.length).toBeGreaterThan(0);
    external.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
