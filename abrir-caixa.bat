@echo off
rem Abre o Caixa num Chrome separado que imprime direto na impressora padrao,
rem sem mostrar a tela de impressao. O perfil proprio faz funcionar mesmo com
rem outro Chrome aberto. A impressora termica precisa ser a padrao do Windows.
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --user-data-dir="%LOCALAPPDATA%\OpenFestCaixa" --app=http://localhost:5173/caixa
