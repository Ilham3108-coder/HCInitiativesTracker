@echo off
echo Checking environment... > env_log.txt
echo DATE: %DATE% %TIME% >> env_log.txt
echo. >> env_log.txt

echo CHECKING PYTHON... >> env_log.txt
python --version >> env_log.txt 2>&1
py --version >> env_log.txt 2>&1
where python >> env_log.txt 2>&1

echo. >> env_log.txt
echo CHECKING SSH... >> env_log.txt
ssh -V >> env_log.txt 2>&1

echo. >> env_log.txt
echo CHECKING NODE... >> env_log.txt
node -v >> env_log.txt 2>&1

echo. >> env_log.txt
echo DIAGNOSTIC COMPLETE.
type env_log.txt
pause
