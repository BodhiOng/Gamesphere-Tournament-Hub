#!/bin/bash
# Installs/updates the CloudWatch agent (with Application Signals enabled)
# and the ADOT .NET auto-instrumentation package.
#
# Runs in "predeploy" (not postdeploy) on purpose: this must finish BEFORE
# the app process (re)starts, otherwise the CORECLR_PROFILER_PATH env var
# points at files that don't exist yet, and the profiler silently fails to
# attach on that deploy. Idempotent — safe to run on every deploy.

set -euo pipefail

echo "[appsignals] Starting CloudWatch agent + ADOT .NET setup..."

CW_AGENT_URL="https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm"

echo "[appsignals] Downloading CloudWatch agent..."
curl -fsSL -o /tmp/amazon-cloudwatch-agent.rpm "$CW_AGENT_URL"
sudo rpm -U /tmp/amazon-cloudwatch-agent.rpm

sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null <<'EOF'
{
  "traces": {
    "traces_collected": {
      "application_signals": {}
    }
  },
  "logs": {
    "metrics_collected": {
      "application_signals": {}
    }
  }
}
EOF

echo "[appsignals] Starting CloudWatch agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

INSTALL_DIR="/opt/aws-otel-dotnet"

if [ ! -d "$INSTALL_DIR" ] || [ -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
  echo "[appsignals] Installing ADOT .NET auto-instrumentation..."
  sudo mkdir -p "$INSTALL_DIR"
  curl -sSL -o /tmp/aws-otel-dotnet-install.sh \
    https://github.com/aws-observability/aws-otel-dotnet-instrumentation/releases/latest/download/aws-otel-dotnet-install.sh
  chmod +x /tmp/aws-otel-dotnet-install.sh

  sudo OTEL_DOTNET_AUTO_HOME="$INSTALL_DIR" /tmp/aws-otel-dotnet-install.sh
else
  echo "[appsignals] ADOT .NET already installed at $INSTALL_DIR, skipping."
fi

echo "[appsignals] Setup complete."
