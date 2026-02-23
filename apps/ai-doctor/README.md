# AI Doctor Microservice
poetry run uvicorn main:app --reload --port 8001

export FEATURE_JWT_AUTH=true
export IAM_SERVICE_URL=http://localhost:8000
poetry run uvicorn main:app --port 8001 --no-access-log --env-file .env
