Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
Dim scriptDir
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Dim sFilePath
sFilePath = scriptDir & "\ulticlient.xlsb"

Dim objExcel
Set objExcel = CreateObject("Excel.Application")

objExcel.Visible = False

Dim objWorkbook
Set objWorkbook = objExcel.Workbooks.Open(sFilePath)

objWorkbook.RefreshAll

objExcel.CalculateUntilAsyncQueriesDone

objWorkbook.Save

objWorkbook.Close

objExcel.Quit

Set objWorkbook = Nothing
Set objExcel = Nothing