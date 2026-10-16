<#
  Local-only emergency setup utility for the single adminzz owner.

  It is intentionally not part of the website or Vercel deployment. Run it only
  from a trusted computer while signed in as the Supabase project owner.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[^\s@]+@[^\s@]+\.[^\s@]+$')]
  [string]$OwnerEmail,

  [string]$SupabaseUrl
)

$ErrorActionPreference = 'Stop'

function Read-SecretText([string]$Prompt) {
  $secureValue = Read-Host -Prompt $Prompt -AsSecureString
  try {
    return [System.Net.NetworkCredential]::new('', $secureValue).Password
  }
  finally {
    $secureValue.Dispose()
  }
}

function Read-StrongPassword {
  $password = Read-SecretText 'New owner password'
  $confirmation = Read-SecretText 'Confirm new owner password'
  if ($password -cne $confirmation) { throw 'The passwords do not match.' }
  if ($password.Length -lt 14 -or $password.Length -gt 128) { throw 'Use a password between 14 and 128 characters.' }
  if ($password -notmatch '[a-z]' -or $password -notmatch '[A-Z]' -or $password -notmatch '\d' -or $password -notmatch '[^A-Za-z0-9]') {
    throw 'Use uppercase, lowercase, a number, and a symbol.'
  }
  return $password
}

if ([string]::IsNullOrWhiteSpace($SupabaseUrl)) {
  $SupabaseUrl = Read-Host -Prompt 'Supabase Project URL (https://xxxxx.supabase.co)'
}

$SupabaseUrl = $SupabaseUrl.Trim().TrimEnd('/')
if ($SupabaseUrl -notmatch '^https://[a-z0-9-]+\.supabase\.co$') {
  throw 'Enter the HTTPS Supabase Project URL only, without /rest/v1 or any other path.'
}

$secretKey = $null
$newPassword = $null
try {
  $secretKey = Read-SecretText 'Supabase secret key (sb_secret_...)'
  if ($secretKey -notmatch '^sb_secret_') { throw 'Use the current Supabase secret key beginning with sb_secret_.' }
  $newPassword = Read-StrongPassword

  # Supabase secret keys intentionally reject browser-like user agents. PowerShell's
  # default request agent can be classified that way, so identify this local-only
  # administrator utility explicitly without sending any browser credentials.
  $headers = @{
    apikey = $secretKey
    'Content-Type' = 'application/json'
    'User-Agent' = 'TechnoEdge-Admin-Setup/1.0'
  }
  $lookupUrl = "$SupabaseUrl/auth/v1/admin/users?per_page=1000"
  $users = Invoke-RestMethod -Method Get -Uri $lookupUrl -Headers $headers
  $owner = @($users.users) | Where-Object { $_.email -and $_.email.Trim().ToLowerInvariant() -eq $OwnerEmail.Trim().ToLowerInvariant() } | Select-Object -First 1
  if (-not $owner) { throw "No Supabase Auth user exists for $OwnerEmail. Check the email and try again." }

  $payload = @{ password = $newPassword; email_confirm = $true } | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Put -Uri "$SupabaseUrl/auth/v1/admin/users/$($owner.id)" -Headers $headers -Body $payload | Out-Null
  Write-Host "Password set for $OwnerEmail. You can now sign in at https://www.technoedgels.com/adminzz/login." -ForegroundColor Green
}
finally {
  $secretKey = $null
  $newPassword = $null
}
