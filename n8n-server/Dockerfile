FROM ghcr.io/n8n-io/runners:latest

USER root

COPY n8n-task-runners.json /etc/n8n-task-runners.json
COPY n8n-external-packages.json /tmp/n8n-external-packages.json

COPY scripts/install-node.sh /tmp/
COPY scripts/install-python.sh /tmp/

RUN chmod +x /tmp/install-node.sh /tmp/install-python.sh

RUN /tmp/install-node.sh
RUN /tmp/install-python.sh

USER runner
