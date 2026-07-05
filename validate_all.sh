#!/usr/bin/env bash

# validate_all.sh
# Controlled validation suite for Otter Delivery microservices.
# This script runs local compile, test, and validation suites in a non-destructive manner.

set -e

# Setup formatting colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE} Otter Delivery microservices controlled validation suite${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Check for general requirements
check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}ERROR: '$1' dependency is missing. Please install it to run validation.${NC}"
        exit 1
    fi
}

check_cmd node
check_cmd npm
check_cmd java
check_cmd mvn
check_cmd python3

ROOT_DIR="$(pwd)"

# 1. Frontend validation
echo -e "\n${YELLOW}[1/6] Running Frontend Validation...${NC}"
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Running npm install...${NC}"
    npm install
fi
echo -e "${GREEN}Building frontend...${NC}"
npm run build
echo -e "${GREEN}Running validate:restaurant-labels...${NC}"
npm run validate:restaurant-labels
echo -e "${GREEN}Running validate:order-history-flow...${NC}"
npm run validate:order-history-flow

# 2. Restaurant Service validation
echo -e "\n${YELLOW}[2/6] Running Restaurant Service tests...${NC}"
cd "$ROOT_DIR/backend/restaurant-service"
mvn -DskipTests compile
mvn test

# 3. Order Service validation
echo -e "\n${YELLOW}[3/6] Running Order Service tests...${NC}"
cd "$ROOT_DIR/backend/order-service"
mvn test

# 4. Profile Service validation
echo -e "\n${YELLOW}[4/6] Running Profile Service tests...${NC}"
cd "$ROOT_DIR/backend/profile-service"
mvn test

# 5. Recommendation Service validation
echo -e "\n${YELLOW}[5/6] Running Recommendation Service tests...${NC}"
cd "$ROOT_DIR/backend/recommendation-service"
if [ ! -d ".venv" ]; then
    echo -e "${RED}ERROR: recommendation-service/.venv is missing. Please setup the virtualenv.${NC}"
    exit 1
fi
.venv/bin/python3 -m compileall app tests
.venv/bin/python3 -m unittest discover -s tests -v

# 6. Driver Service validation
echo -e "\n${YELLOW}[6/6] Running Driver Service tests...${NC}"
cd "$ROOT_DIR/backend/driver-service"
if [ ! -d ".venv" ]; then
    echo -e "${RED}ERROR: driver-service/.venv is missing. Please setup the virtualenv.${NC}"
    exit 1
fi
.venv/bin/python3 -m compileall app tests
.venv/bin/pytest

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN} SUCCESS: All microservices validations and tests passed successfully!${NC}"
echo -e "${GREEN}======================================================================${NC}"
