$PROJECT_ID = "job-screening-app-2025"
$REGION = "us-central1"
$REPO_NAME = "kyc-agents"
$IMAGE_NAME = "agent-service"

# API Key should be set as environment variable
if (-not $env:GOOGLE_API_KEY) {
    Write-Host "ERROR: GOOGLE_API_KEY environment variable not set" -ForegroundColor Red
    exit 1
}
$API_KEY = $env:GOOGLE_API_KEY

Write-Host "1. Enabling APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project $PROJECT_ID

Write-Host "2. Creating Artifact Registry Repository..."
# Check if repo exists, if not create it
$repoCheck = gcloud artifacts repositories list --project=$PROJECT_ID --location=$REGION --filter="name:projects/$PROJECT_ID/locations/$REGION/repositories/$REPO_NAME" --format="value(name)"
if (-not $repoCheck) {
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository for KYC Agents" --project=$PROJECT_ID
}

Write-Host "3. Building and Pushing Container..."
# Use Cloud Build to build and push
gcloud builds submit .\agent-service --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME`:`latest" --project $PROJECT_ID

Write-Host "4. Deploying to Cloud Run..."
gcloud run deploy kyc-agent-service `
    --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME`:`latest" `
    --platform managed `
    --region $REGION `
    --project $PROJECT_ID `
    --allow-unauthenticated `
    --set-env-vars "GOOGLE_API_KEY=$API_KEY" `
    --port 8000
