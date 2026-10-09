# Synthesizes text with the Windows OneCore voice "Microsoft Andika" (id-ID) via WinRT. Args: <text> <out.wav>
param([string]$Text, [string]$Out)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$s = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$s.Voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | ? { $_.DisplayName -like '*Andika*' } | Select -First 1
$op = $s.SynthesizeTextToStreamAsync($Text)
$t = $asTask.MakeGenericMethod([Windows.Media.SpeechSynthesis.SpeechSynthesisStream]).Invoke($null, @($op)); $t.Wait()
$st = $t.Result; $rs = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($st)
$fs = [System.IO.File]::Create($Out); $rs.CopyTo($fs); $fs.Close()
