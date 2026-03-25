#!/bin/bash
# ──────────────────────────────────────────────
# CoreMQ QoS Packet ID Stress Test — 10,000 requests
# ──────────────────────────────────────────────

API="http://localhost:18083"
TOTAL=0
PASS=0
FAIL=0
CONCURRENCY=50

echo "============================================"
echo "  CoreMQ — QoS Stress Test (10,000 reqs)"
echo "============================================"
echo ""

# Step 1: Login
echo "[1/4] Logging in..."
RESPONSE=$(curl -s -X POST "$API/api/v1/public/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"public"}')

TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "FAILED to login. Is the server running? (make dev)"
  echo "Response: $RESPONSE"
  exit 1
fi
echo "Token acquired."
echo ""

# Helper: fire N requests with C concurrency
fire() {
  local QOS=$1
  local COUNT=$2
  local CONC=$3
  local TAG=$4
  local ok=0
  local err=0
  local batch=0

  while [ $batch -lt $COUNT ]; do
    local jobs=0
    while [ $jobs -lt $CONC ] && [ $batch -lt $COUNT ]; do
      batch=$((batch + 1))
      ( curl -s -o /dev/null -w "%{http_code}" \
          -X POST "$API/api/v1/publish" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{\"topic\":\"stress/$TAG\",\"payload\":\"msg-$batch\",\"qos\":$QOS,\"retain\":false}" \
          > /tmp/qos_${TAG}_${batch}.out ) &
      jobs=$((jobs + 1))
    done
    wait

    local start=$((batch - jobs + 1))
    for j in $(seq $start $batch); do
      local s=$(cat /tmp/qos_${TAG}_${j}.out 2>/dev/null)
      if [ "$s" = "200" ]; then
        ok=$((ok + 1))
      else
        err=$((err + 1))
      fi
      rm -f /tmp/qos_${TAG}_${j}.out
    done

    if [ $((batch % 500)) -eq 0 ] || [ $batch -eq $COUNT ]; then
      printf "\r  %d/%d  (ok: %d, fail: %d)" "$batch" "$COUNT" "$ok" "$err"
    fi
  done

  echo ""
  TOTAL=$((TOTAL + COUNT))
  PASS=$((PASS + ok))
  FAIL=$((FAIL + err))
  echo "  Result: $ok/$COUNT passed, $err failed"
}

# Step 2: 3,000 per QoS level (9,000 total)
echo "[2/4] Stress testing — 3,000 per QoS level..."
echo ""

START_TIME=$(date +%s)

echo "--- QoS 0: 3,000 requests ($CONCURRENCY concurrent) ---"
fire 0 3000 $CONCURRENCY "qos0"
echo ""

echo "--- QoS 1: 3,000 requests ($CONCURRENCY concurrent) ---"
fire 1 3000 $CONCURRENCY "qos1"
echo ""

echo "--- QoS 2: 3,000 requests ($CONCURRENCY concurrent) ---"
fire 2 3000 $CONCURRENCY "qos2"
echo ""

# Step 3: Mixed QoS burst — 1,000
echo "[3/4] Mixed QoS burst — 1,000 requests ($CONCURRENCY concurrent)..."
MIXED_OK=0
MIXED_FAIL=0
MIXED_BATCH=0
MIXED_COUNT=1000

while [ $MIXED_BATCH -lt $MIXED_COUNT ]; do
  jobs=0
  while [ $jobs -lt $CONCURRENCY ] && [ $MIXED_BATCH -lt $MIXED_COUNT ]; do
    MIXED_BATCH=$((MIXED_BATCH + 1))
    QOS=$((MIXED_BATCH % 3))
    ( curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API/api/v1/publish" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"topic\":\"stress/mix\",\"payload\":\"mix-$MIXED_BATCH\",\"qos\":$QOS,\"retain\":false}" \
        > /tmp/qos_mix_${MIXED_BATCH}.out ) &
    jobs=$((jobs + 1))
  done
  wait

  start=$((MIXED_BATCH - jobs + 1))
  for j in $(seq $start $MIXED_BATCH); do
    s=$(cat /tmp/qos_mix_${j}.out 2>/dev/null)
    if [ "$s" = "200" ]; then
      MIXED_OK=$((MIXED_OK + 1))
    else
      MIXED_FAIL=$((MIXED_FAIL + 1))
    fi
    rm -f /tmp/qos_mix_${j}.out
  done

  if [ $((MIXED_BATCH % 500)) -eq 0 ] || [ $MIXED_BATCH -eq $MIXED_COUNT ]; then
    printf "\r  %d/%d  (ok: %d, fail: %d)" "$MIXED_BATCH" "$MIXED_COUNT" "$MIXED_OK" "$MIXED_FAIL"
  fi
done

echo ""
TOTAL=$((TOTAL + MIXED_COUNT))
PASS=$((PASS + MIXED_OK))
FAIL=$((FAIL + MIXED_FAIL))
echo "  Result: $MIXED_OK/$MIXED_COUNT passed, $MIXED_FAIL failed"
echo ""

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Step 4: Server health check
echo "[4/4] Checking server is still alive..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/v1/public/login" \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"public"}')

if [ "$HEALTH" = "200" ]; then
  echo "Server is alive."
else
  echo "SERVER DOWN! (HTTP $HEALTH)"
  FAIL=$((FAIL + 1))
fi

# Summary
echo ""
echo "============================================"
echo "  RESULTS"
echo "============================================"
echo "  Total requests:  $TOTAL"
echo "  Passed:          $PASS"
echo "  Failed:          $FAIL"
echo "  Duration:        ${DURATION}s"
echo "  Throughput:      ~$((TOTAL / (DURATION > 0 ? DURATION : 1))) req/s"
echo "============================================"

if [ "$FAIL" -eq 0 ]; then
  echo "  ALL 10,000 PASSED"
else
  echo "  SOME FAILURES ($FAIL)"
  exit 1
fi
