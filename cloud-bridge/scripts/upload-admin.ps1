$password = ConvertTo-SecureString "Brfj0114" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ("root@115.190.158.182", $password)
$session = New-PSSession -ComputerName 115.190.158.182 -Credential $credential
Copy-Item -Path "d:\网站部署\chaowuqiong-project\apps\react-admin\dist\*" -Destination "\\115.190.158.182\c$\var\www\chaowuqiong\apps\admin\" -ToSession $session -Recurse
Remove-PSSession $session
