@echo off
if exist dist rmdir /s /q dist
mkdir dist
copy *.html dist\
mkdir dist\css
copy css\* dist\css\
mkdir dist\js
copy js\* dist\js\
mkdir dist\assets
copy assets\* dist\assets\
echo Distribution folder prepared.
pause
