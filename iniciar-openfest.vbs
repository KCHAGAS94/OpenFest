' Sobe o OpenFest sem mostrar as janelas do backend e do frontend e abre o Caixa.
' A saída de cada um vai para a pasta logs. Para desligar, use parar-openfest.bat.
Option Explicit

Dim shell, fso, pasta
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
pasta = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = pasta

Function Respondendo(url)
  Dim http
  Respondendo = False
  On Error Resume Next
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 1000, 1000, 1000, 1000
  http.open "GET", url, False
  http.send
  If Err.Number = 0 Then Respondendo = (http.status > 0)
  On Error GoTo 0
End Function

Sub EsperarPor(url, segundos)
  Dim i
  For i = 1 To segundos
    If Respondendo(url) Then Exit Sub
    WScript.Sleep 1000
  Next
End Sub

If Not fso.FolderExists(pasta & "\logs") Then fso.CreateFolder(pasta & "\logs")

' Só sobe o que ainda não estiver rodando (clicar de novo apenas abre o Caixa).
If Not Respondendo("http://localhost:3000/api/health") Then
  shell.Run "cmd /c cd /d """ & pasta & "\backend"" && npm run dev > ""..\logs\backend.log"" 2>&1", 0, False
End If
If Not Respondendo("http://localhost:5173/") Then
  shell.Run "cmd /c cd /d """ & pasta & "\frontend"" && npm run dev > ""..\logs\frontend.log"" 2>&1", 0, False
End If

EsperarPor "http://localhost:3000/api/health", 30
EsperarPor "http://localhost:5173/", 30

shell.Run """" & pasta & "\abrir-caixa.bat""", 0, False
