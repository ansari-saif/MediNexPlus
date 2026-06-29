#!/bin/sh
# End-to-end smoke test against a running MediNexPlus instance.
set -e

BASE="${1:-http://127.0.0.1:3000}"
COOKIE="/tmp/medinex-e2e-cookies.txt"
rm -f "$COOKIE"

pass() { echo "✓ $1"; }
fail() { echo "✗ $1"; exit 1; }

echo "=== MediNexPlus E2E Smoke Test ==="
echo "Base URL: $BASE"

# Health
health=$(curl -sf "$BASE/api/health")
echo "$health" | grep -q '"ok":true' && pass "Health check" || fail "Health check"

# Superadmin login
sa_res=$(curl -sf -c "$COOKIE" -X POST "$BASE/api/auth/superadmin" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medinex.com","password":"Medinex@123","securityKey":"medinex-dev-key-2026"}')
echo "$sa_res" | grep -q '"success":true' && pass "Superadmin login" || fail "Superadmin login: $sa_res"

# Superadmin dashboard (Prisma hospital.findMany)
dash=$(curl -sf -b "$COOKIE" "$BASE/api/superadmin/dashboard")
echo "$dash" | grep -q '"success":true' && pass "Superadmin dashboard (Prisma OK)" || fail "Superadmin dashboard: $dash"

# Create hospital
ts=$(date +%s)
phone_suffix=$(printf '%03d' $((ts % 1000)))
new_email="e2e-hospital-${ts}@test.com"
create_h=$(curl -sf -b "$COOKIE" -X POST "$BASE/api/hospital/create" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Hospital ${ts}\",\"email\":\"${new_email}\",\"mobile\":\"+9198765432${phone_suffix}\"}")
echo "$create_h" | grep -q '"success":true' && pass "Create hospital" || fail "Create hospital: $create_h"

# Hospital admin login (seeded demo hospital)
rm -f "$COOKIE"
ha_res=$(curl -sf -c "$COOKIE" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"Medinex@123"}')
echo "$ha_res" | grep -q '"success":true' && pass "Hospital admin login" || fail "Hospital admin login: $ha_res"

# Create patient
phone_patient="+9199$(printf '%07d' $((ts % 10000000)))"
patient_res=$(curl -sf -b "$COOKIE" -X POST "$BASE/api/patients" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Patient ${ts}\",\"phone\":\"${phone_patient}\",\"email\":\"patient-${ts}@test.com\",\"gender\":\"MALE\"}")
echo "$patient_res" | grep -q '"success":true' && pass "Create patient" || fail "Create patient: $patient_res"
patient_id=$(echo "$patient_res" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)

# Create doctor
doc_email="doctor-${ts}@test.com"
phone_doctor="+9198$(printf '%07d' $((ts % 10000000)))"
doctor_res=$(curl -sf -b "$COOKIE" -X POST "$BASE/api/config/doctors" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dr E2E ${ts}\",\"email\":\"${doc_email}\",\"phone\":\"${phone_doctor}\",\"specialization\":\"General\",\"consultationFee\":500}")
echo "$doctor_res" | grep -q '"success":true' && pass "Create doctor" || fail "Create doctor: $doctor_res"
doctor_id=$(echo "$doctor_res" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)

# Create appointment (tomorrow)
tomorrow=$(date -u -d "+1 day" +%Y-%m-%d 2>/dev/null || date -u -v+1d +%Y-%m-%d)
appt_res=$(curl -sf -b "$COOKIE" -X POST "$BASE/api/appointments" \
  -H "Content-Type: application/json" \
  -d "{\"patientId\":\"${patient_id}\",\"doctorId\":\"${doctor_id}\",\"appointmentDate\":\"${tomorrow}\",\"timeSlot\":\"10:30\",\"type\":\"OPD\",\"consultationFee\":500}")
echo "$appt_res" | grep -q '"success":true' && pass "Create appointment" || fail "Create appointment: $appt_res"

# Auth me
me=$(curl -sf -b "$COOKIE" "$BASE/api/auth/me")
echo "$me" | grep -q '"success":true' && pass "Auth /me" || fail "Auth /me: $me"

echo ""
echo "=== All smoke tests passed ==="
