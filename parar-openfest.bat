@echo off
rem Desliga o backend (porta 3000) e o frontend (porta 5173) iniciados sem janela.
rem Sobe dos processos que usam as portas ate o cmd/npm que os iniciou e fecha a arvore toda.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "foreach ($porta in 3000, 5173) {" ^
  "  $conexoes = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue;" ^
  "  foreach ($pid0 in ($conexoes.OwningProcess | Sort-Object -Unique)) {" ^
  "    $topo = $pid0;" ^
  "    $proc = Get-CimInstance Win32_Process -Filter \"ProcessId=$pid0\";" ^
  "    while ($proc) {" ^
  "      $pai = Get-CimInstance Win32_Process -Filter \"ProcessId=$($proc.ParentProcessId)\";" ^
  "      if (-not $pai -or $pai.Name -notin 'node.exe','cmd.exe') { break }" ^
  "      $topo = $pai.ProcessId; $proc = $pai" ^
  "    }" ^
  "    taskkill /PID $topo /T /F | Out-Null" ^
  "  }" ^
  "}"
echo OpenFest desligado.
timeout /t 2 >nul
