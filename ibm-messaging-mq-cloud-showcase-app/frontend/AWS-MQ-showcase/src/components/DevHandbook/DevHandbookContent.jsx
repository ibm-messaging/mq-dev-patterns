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
  CodeSnippet,
  InlineNotification,
  Link,
  ListItem,
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
  Theme,
  UnorderedList,
} from '@carbon/react';

const ROOT_ENV = [
  {
    name: 'APP_PASSWORD',
    note: (
      <>
        Compose injects into MQ (<code>MQ_APP_PASSWORD</code>) and backend
      </>
    ),
  },
  {
    name: 'ADMIN_PASSWORD',
    note: 'MQ Web Console login - Compose injects into MQ and backend',
  },
  {
    name: 'IMAGE_ECS_REGISTRY_URI',
    note: 'AWS ECS only - any non-empty string for local use',
  },
  { name: 'CLUSTER_NAME', note: 'AWS ECS only - not needed locally' },
];

const FRONTEND_ENV = [
  {
    name: 'VITE_BE_HOST',
    note: 'Backend hostname - local dev only, not used in Docker',
  },
  {
    name: 'VITE_BE_PORT',
    note: 'Backend port (8080) - local dev only, not used in Docker',
  },
];

const BACKEND_ENV = [
  {
    name: 'HOST',
    note: (
      <>
        Set to <code>localhost</code> for local dev (Mode A). Not needed when
        running via Compose - Compose sets <code>HOST=mq</code> automatically.
      </>
    ),
  },
  {
    name: 'MQ_QMGR_PORT_MQI',
    note: (
      <>
        MQI listener port - set manually for Mode A; Compose injects{' '}
        <code>1414</code>
      </>
    ),
  },
  {
    name: 'MQ_QMGR_PORT_API',
    note: (
      <>
        REST API port - set manually for Mode A; Compose injects{' '}
        <code>9443</code>
      </>
    ),
  },
  {
    name: 'APP_PASSWORD',
    note: 'Set manually for Mode A. Must match root .env value - Compose injects it into the container.',
  },
  {
    name: 'ADMIN_PASSWORD',
    note: 'Set manually for Mode A. Must match root .env value - Compose injects it into the container.',
  },
];

const ACCESS_POINTS = [
  { service: 'Playground UI', url: 'http://localhost:3000' },
  { service: 'Backend API', url: 'http://localhost:8080' },
  { service: 'MQ Web Console', url: 'https://localhost:9443/ibmmq/console' },
];

const HandbookSection = ({ title, children }) => (
  <section className="dev-handbook__section">
    <h3 className="dev-handbook__section-title">{title}</h3>
    {children}
  </section>
);

const HandbookCode = ({ children }) => (
  <Theme theme="g100" className="dev-handbook__code">
    <CodeSnippet type="multi" feedback="Copied">
      {children}
    </CodeSnippet>
  </Theme>
);

const HandbookNote = ({ kind = 'info', children }) => (
  <InlineNotification
    className="dev-handbook__note"
    kind={kind}
    lowContrast
    hideCloseButton
    statusIconDescription={kind}
    subtitle={children}
  />
);

const EnvTable = ({ rows }) => (
  <StructuredListWrapper className="dev-handbook__table" isCondensed>
    <StructuredListHead>
      <StructuredListRow head>
        <StructuredListCell head>Variable</StructuredListCell>
        <StructuredListCell head>Notes</StructuredListCell>
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {rows.map(({ name, note }) => (
        <StructuredListRow key={name}>
          <StructuredListCell noWrap>
            <code>{name}</code>
          </StructuredListCell>
          <StructuredListCell>{note}</StructuredListCell>
        </StructuredListRow>
      ))}
    </StructuredListBody>
  </StructuredListWrapper>
);

const EnvGroup = ({ label, path, description, rows, snippet, children }) => (
  <div className="dev-handbook__env-group">
    <div className="dev-handbook__env-group-header">
      <h4 className="dev-handbook__subtitle">{label}</h4>
      <code>{path}</code>
    </div>
    <p className="dev-handbook__text">{description}</p>
    <EnvTable rows={rows} />
    <HandbookCode>{snippet}</HandbookCode>
    {children}
  </div>
);

const DevHandbookContent = () => (
  <div className="dev-handbook__body" tabIndex={-1}>
    <HandbookSection title="Prerequisites">
      <UnorderedList>
        <ListItem>
          Docker runtime (Docker Engine on Linux, Docker Desktop or Rancher
          Desktop on Mac/Windows) - required for all modes
        </ListItem>
        <ListItem>
          Node.js 22 + npm - required for <strong>Mode A</strong> (local dev
          server) only
        </ListItem>
        <ListItem>
          A root <code>.env</code> file - required for all modes (docker compose
          reads it for MQ passwords)
        </ListItem>
      </UnorderedList>
    </HandbookSection>

    <HandbookSection title="Environment files">
      <p className="dev-handbook__text">
        There are{' '}
        <strong>
          three separate <code>.env</code> locations
        </strong>
        , each serving a different layer. All three are gitignored - create them
        manually.
      </p>

      <EnvGroup
        label="Root .env"
        path="ibm-messaging-mq-cloud-showcase-app/.env"
        description="Docker Compose secrets - shared between the MQ container and backend."
        rows={ROOT_ENV}
        snippet={`APP_PASSWORD=passw0rd
ADMIN_PASSWORD=passw0rd
IMAGE_ECS_REGISTRY_URI=image_ecs
CLUSTER_NAME=cluster_name`}
      />

      <EnvGroup
        label="Frontend .env"
        path="frontend/AWS-MQ-showcase/.env"
        description="Vite local dev server only - not used inside Docker."
        rows={FRONTEND_ENV}
        snippet={`VITE_BE_HOST=localhost
VITE_BE_PORT=8080`}>
        <HandbookNote>
          Docker builds use <code>REACT_APP_*</code> variables injected at
          container start via <code>docker-entrypoint.sh</code> - do not confuse
          the two.
        </HandbookNote>
      </EnvGroup>

      <EnvGroup
        label="Backend .env"
        path="backend/AWS-showcase-backend/.env"
        description="Local dev server only - Compose injects these at container start."
        rows={BACKEND_ENV}
        snippet={`HOST=localhost
MQ_QMGR_PORT_MQI=1414
MQ_QMGR_PORT_API=9443
APP_PASSWORD=passw0rd
ADMIN_PASSWORD=passw0rd`}>
        <HandbookNote>
          This file is only needed for Mode A (local backend dev). When running
          via Docker Compose, these values are injected automatically - do not
          set <code>HOST=localhost</code> in that case or the backend container
          will fail to reach the MQ service.
        </HandbookNote>
      </EnvGroup>
    </HandbookSection>

    <HandbookSection title="MQ Web Console">
      <p className="dev-handbook__text">
        Available whenever the MQ container is running (any mode):
      </p>
      <HandbookCode>{`https://localhost:9443/ibmmq/console

Username: admin
Password: <your ADMIN_PASSWORD>`}</HandbookCode>
      <HandbookNote>
        The console uses a self-signed certificate - accept the browser warning
        on first visit.
      </HandbookNote>
    </HandbookSection>

    <HandbookSection title="Mode A - Local dev servers">
      <p className="dev-handbook__text">
        Use when actively developing frontend or backend code. The MQ container
        still runs in Docker. Hot-reload is active for both frontend and
        backend.
      </p>
      <HandbookCode>{`cd ibm-messaging-mq-cloud-showcase-app/
docker compose -f docker-compose.yaml up mq

cd backend/AWS-showcase-backend/
npm install
npm start

cd frontend/AWS-MQ-showcase/
npm install
npm run start`}</HandbookCode>
    </HandbookSection>

    <HandbookSection title="Mode B - Standalone frontend Docker image">
      <p className="dev-handbook__text">
        Use to test the frontend container in isolation while the backend runs
        separately.
      </p>
      <HandbookCode>{`cd ibm-messaging-mq-cloud-showcase-app/frontend/
docker build -t frontend:test .

docker run -p 3000:80 \\
  -e REACT_APP_FE_AS_PROXY=false \\
  -e REACT_APP_BE_HOST=localhost \\
  -e REACT_APP_BE_PORT=8080 \\
  -e REACT_APP_BE_TLS=false \\
  frontend:test`}</HandbookCode>
      <HandbookNote>
        Rancher Desktop manages its own Docker context. The first{' '}
        <code>docker build</code> will pull base images into Rancher's registry
        - normal, happens once only.
      </HandbookNote>
    </HandbookSection>

    <HandbookSection title="Apple Silicon (ARM64)">
      <p className="dev-handbook__text">
        <code>icr.io/ibm-messaging/mq:latest</code> is <strong>x86-only</strong>
        . On Apple Silicon you must build a local ARM64 image first. Full build
        instructions:{' '}
        <Link
          href="https://community.ibm.com/community/user/blogs/richard-coppen/2023/06/30/ibm-mq-9330-container-image-now-available-for-appl"
          target="_blank"
          rel="noopener noreferrer">
          IBM MQ ARM64 container image guide
        </Link>
        .
      </p>
      <p className="dev-handbook__text">
        Once built, update the <code>mq</code> service image line in{' '}
        <code>docker-compose.yaml</code>:
      </p>
      <HandbookCode>{`image: "ibm-mqadvanced-server-dev:10.0.0.5-arm64"`}</HandbookCode>
      <HandbookNote>
        This edit is <strong>local only</strong> - do not commit it. CI/CD and
        AWS use the <code>icr.io</code> image on <code>linux/amd64</code>.
      </HandbookNote>
    </HandbookSection>

    <HandbookSection title="Mode C - Full Docker Compose stack">
      <p className="dev-handbook__text">
        Complete self-contained deployment, exactly as it runs in production.
      </p>
      <h4 className="dev-handbook__subtitle">Standard build + run</h4>
      <HandbookCode>{`cd ibm-messaging-mq-cloud-showcase-app/
docker-compose --file docker-compose.yaml build --no-cache
docker-compose --file docker-compose.yaml up`}</HandbookCode>
      <h4 className="dev-handbook__subtitle">
        One-liner (no .env file needed)
      </h4>
      <HandbookCode>{`APP_PASSWORD=passw0rd ADMIN_PASSWORD=passw0rd docker compose up --build`}</HandbookCode>
      <h4 className="dev-handbook__subtitle">Access points</h4>
      <StructuredListWrapper className="dev-handbook__table" isCondensed>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Service</StructuredListCell>
            <StructuredListCell head>URL</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {ACCESS_POINTS.map(({ service, url }) => (
            <StructuredListRow key={service}>
              <StructuredListCell noWrap>{service}</StructuredListCell>
              <StructuredListCell>
                <code>{url}</code>
              </StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
    </HandbookSection>

    <HandbookSection title="Stopping containers">
      <HandbookCode>{`docker compose down`}</HandbookCode>
      <p className="dev-handbook__text">
        Stops and removes containers. Volumes are preserved - MQ queue data
        persists across restarts.
      </p>
      <HandbookCode>{`docker compose down -v`}</HandbookCode>
      <HandbookNote kind="warning">
        <strong>Destructive:</strong> the <code>-v</code> flag also deletes
        volumes, wiping all MQ queue data. Use only when you want a clean slate.
      </HandbookNote>
    </HandbookSection>
  </div>
);

export default DevHandbookContent;
