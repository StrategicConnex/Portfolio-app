$body = @{
  messages = @(
    @{
      id = "msg-1"
      role = "user"
      parts = @(
        @{
          type = "text"
          text = "Hola, quien es Juan?"
        }
      )
    }
  )
  language = "es"
} | ConvertTo-Json -Depth 5

Write-Host "Sending request to /api/ask-ai..."
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ask-ai" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
  Write-Host "STATUS: $($response.StatusCode)"
  Write-Host "CONTENT-TYPE: $($response.Headers['Content-Type'])"
  Write-Host "BODY (first 1000 chars):"
  $content = $response.Content
  if ($content.Length -gt 1000) {
    Write-Host $content.Substring(0, 1000)
  } else {
    Write-Host $content
  }
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "RESPONSE BODY: $($reader.ReadToEnd())"
  }
}

Write-Host ""
Write-Host "===== Testing /api/chat ====="
$chatBody = @{
  messages = @(
    @{
      role = "user"
      content = "Hola"
    }
  )
  language = "es"
} | ConvertTo-Json -Depth 5

try {
  $chatResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body $chatBody -TimeoutSec 30
  Write-Host "STATUS: $($chatResponse.StatusCode)"
  $chatContent = $chatResponse.Content
  if ($chatContent.Length -gt 500) {
    Write-Host $chatContent.Substring(0, 500)
  } else {
    Write-Host $chatContent
  }
} catch {
  Write-Host "CHAT ERROR: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $stream2 = $_.Exception.Response.GetResponseStream()
    $reader2 = New-Object System.IO.StreamReader($stream2)
    Write-Host "RESPONSE: $($reader2.ReadToEnd())"
  }
}

Write-Host ""
Write-Host "===== Testing /api/contact ====="
$contactBody = @{
  name = "Test User"
  email = "test@example.com"
  message = "Test message"
} | ConvertTo-Json -Depth 3

try {
  $contactResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/contact" -Method POST -ContentType "application/json" -Body $contactBody -TimeoutSec 10
  Write-Host "STATUS: $($contactResponse.StatusCode)"
  Write-Host "BODY: $($contactResponse.Content)"
} catch {
  Write-Host "CONTACT ERROR: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $stream3 = $_.Exception.Response.GetResponseStream()
    $reader3 = New-Object System.IO.StreamReader($stream3)
    Write-Host "RESPONSE: $($reader3.ReadToEnd())"
  }
}
