@echo off
title VPS状态检查工具
color 0A

echo ======================================
echo         VPS状态检查工具 v1.1
echo ======================================
echo.

REM 检查网络连接
echo 正在检查网络连接...
ping -n 1 110.232.84.204 >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [错误] 无法连接到VPS服务器，请检查网络连接。
    goto :end
)
echo [成功] 网络连接正常。

echo.
echo 准备连接到VPS服务器(110.232.84.204)...
echo 请在提示时输入SSH密码。
echo.

REM 定义检查命令
set "CHECK_CMD=uname -a && echo '===================' && echo '系统信息:' && df -h && echo '===================' && echo 'Node版本:' && node -v && echo '===================' && echo 'PM2状态:' && pm2 list && echo '===================' && echo '目录结构:' && ls -la /root/loan-app && echo '===================' && echo '防火墙状态:' && ufw status && echo '===================' && echo '内存使用情况:' && free -m"

echo 正在连接VPS...
ssh -p 22 root@110.232.84.204 "%CHECK_CMD%" > vps_status.log 2>&1

if %errorlevel% neq 0 (
    color 0C
    echo [错误] 连接VPS失败，请检查SSH凭据或服务器状态。
    goto :end
) else (
    echo [成功] VPS状态信息已保存到vps_status.log文件。
    type vps_status.log
)

:end
echo.
echo ======================================
echo         检查完成
echo ======================================
pause 