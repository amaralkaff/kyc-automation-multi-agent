$ErrorActionPreference = "Stop"

function Log-Msg {
    param($msg)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg"
}

try {
    Log-Msg "Authenticating..."
    $authBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/authenticate" -Method Post -Body $authBody -ContentType "application/json"
    $token = $response.token
    Log-Msg "Authentication Successful."

    $headers = @{Authorization="Bearer $token"}

    1..15 | ForEach-Object {
        $cid = $_
        try {
            $apps = Invoke-RestMethod -Uri "http://localhost:8080/api/kyc/customer/$cid" -Headers $headers -ErrorAction SilentlyContinue
            
            if ($apps) {
                # Force apps to likely be an array
                if ($apps -isnot [array]) { $apps = @($apps) }

                foreach ($app in $apps) {
                    $aid = $app.id
                    $status = $app.status
                    Log-Msg "Customer $cid | App $aid | Current Status: $status"

                    if ($status -in @("DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED")) {
                        Log-Msg "  -> Submitting App $aid to Agentic Service..."
                        try {
                            $res = Invoke-RestMethod -Uri "http://localhost:8080/api/kyc/$aid/submit" -Method Post -Headers $headers -TimeoutSec 60
                            Log-Msg "  -> DONE. New Status: $($res.status) | Risk: $($res.riskScore) | Logic: $($res.adminComments)"
                        } catch {
                            Log-Msg "  -> ERROR submitting: $($_.Exception.Message)"
                            if ($_.Exception.Response) {
                                $stream = $_.Exception.Response.GetResponseStream()
                                $reader = New-Object System.IO.StreamReader($stream)
                                Log-Msg "  -> Details: $($reader.ReadToEnd())"
                            }
                        }
                    } else {
                        Log-Msg "  -> Skipping (Already Finalized)"
                    }
                }
            } else {
                Log-Msg "Customer ${cid}: No applications found."
            }
        } catch {
            Log-Msg "Customer ${cid}: Error fetching apps: $($_.Exception.Message)"
        }
    }
    Log-Msg "Automation Script Completed."
} catch {
    Log-Msg "FATAL ERROR: $($_.Exception.Message)"
}
