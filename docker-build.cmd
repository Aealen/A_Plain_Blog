@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ============================================================
::  A Plain Blog - Docker 交互式构建与管理脚本 (Windows)
:: ============================================================

set "ENV_FILE=.env"

goto :main

:: ── Utilities ──────────────────────────────────────────────

:info
    echo [INFO] %*
    goto :eof

:success
    echo [OK] %*
    goto :eof

:warn
    echo [WARN] %*
    goto :eof

:error
    echo [ERROR] %*
    goto :eof

:ask
    :: Usage: call :ask "prompt" default_var result_var
    set "ask_prompt=%~1"
    set "ask_default=!%2!"
    set "ask_result=%~3"
    if defined ask_default (
        set /p "ask_answer=!ask_prompt! [!ask_default!]: "
    ) else (
        set /p "ask_answer=!ask_prompt!: "
    )
    if "!ask_answer!"=="" set "ask_answer=!ask_default!"
    set "!ask_result!=!ask_answer!"
    goto :eof

:ask_password
    :: Usage: call :ask_password "prompt" default_var result_var
    set "ap_prompt=%~1"
    set "ap_default=!%2!"
    set "ap_result=%~3"
    echo !ap_prompt! [回车使用默认值]:
    set "ap_chars="
    set "ap_char="
    :pw_loop
    for /f "delims=" %%a in ('copy /b con ^| findstr /r ".*" 2^>nul') do (
        set "ap_char=%%a"
    )
    if defined ap_char (
        set "ap_chars=!ap_chars!!ap_char!"
        goto :pw_loop
    )
    if "!ap_chars!"=="" set "ap_chars=!ap_default!"
    set "!ap_result!=!ap_chars!"
    goto :eof

:check_docker
    where docker >nul 2>&1
    if errorlevel 1 (
        call :error "未检测到 Docker，请先安装 Docker"
        exit /b 1
    )
    docker info >nul 2>&1
    if errorlevel 1 (
        call :error "Docker 未运行，请先启动 Docker"
        exit /b 1
    )
    goto :eof

:get_db_mode
    :: Sets DB_MODE to "builtin" or "external"
    if exist "%ENV_FILE%" (
        findstr /b "POSTGRES_USER=" "%ENV_FILE%" >nul 2>&1
        if not errorlevel 1 (
            set "DB_MODE=builtin"
        ) else (
            set "DB_MODE=external"
        )
    ) else (
        set "DB_MODE=external"
    )
    goto :eof

:read_env_value
    :: Usage: call :read_env_value "KEY" result_var
    set "rev_key=%~1"
    set "rev_result=%~2"
    set "!rev_result!="
    if not exist "%ENV_FILE%" goto :eof
    for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
        set "rev_k=%%a"
        set "rev_v=%%b"
        if "!rev_k!"=="!rev_key!" (
            set "rev_v=!rev_v:"=!"
            set "!rev_result!=!rev_v!"
        )
    )
    goto :eof

:generate_random
    :: Generate a random hex string, usage: call :generate_random length result_var
    set "gr_len=%~1"
    set "gr_result=%~2"
    set "gr_chars=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    set "gr_out="
    for /l %%i in (1,1,!gr_len!) do (
        set /a "gr_idx=!random! %% 62"
        for %%j in (!gr_idx!) do set "gr_out=!gr_out!!gr_chars:~%%j,1!"
    )
    set "!gr_result!=!gr_out!"
    goto :eof

:: ── Configure ──────────────────────────────────────────────

:configure
    echo.
    echo ═══════════════════════════════════════════════
    echo        A Plain Blog - Docker 配置向导
    echo ═══════════════════════════════════════════════
    echo.

    :: Load existing defaults
    call :read_env_value "DATABASE_URL" db_url
    call :read_env_value "POSTGRES_USER" pg_user
    call :read_env_value "POSTGRES_PASSWORD" pg_pass
    call :read_env_value "POSTGRES_DB" pg_db
    call :read_env_value "NEXTAUTH_SECRET" auth_secret
    call :read_env_value "NEXTAUTH_URL" auth_url
    call :read_env_value "OSS_REGION" oss_region
    call :read_env_value "OSS_BUCKET" oss_bucket
    call :read_env_value "OSS_ACCESS_KEY_ID" oss_ak
    call :read_env_value "OSS_ACCESS_KEY_SECRET" oss_sk
    call :read_env_value "OSS_ROLE_ARN" oss_arn

    if not defined pg_user set "pg_user=plain_blog"
    if not defined pg_db set "pg_db=plain_blog"
    if not defined auth_url set "auth_url=http://localhost:3000"
    if not defined oss_region set "oss_region=oss-cn-hangzhou"

    if exist "%ENV_FILE%" (
        call :info "检测到已有 .env 文件，当前值将作为默认值"
    )

    :: ── Step 1: Database Mode ──
    echo.
    echo ── Step 1/4: 数据库模式 ──
    echo   1^) 使用内置 PostgreSQL（推荐，Docker 自动管理数据库）
    echo   2^) 使用外部 PostgreSQL（连接已有的数据库实例）
    echo.
    call :ask "  请选择" "mode" "mode"
    if "!mode!"=="" set "mode=1"

    :: ── Step 2: Database Config ──
    echo.
    echo ── Step 2/4: 数据库配置 ──
    if "!mode!"=="2" (
        echo   请输入完整的外部数据库连接地址
        echo   格式: postgresql://用户名:密码@主机:端口/数据库名
        call :ask "  DATABASE_URL" "db_url" "db_url"
        if "!db_url!"=="" (
            call :error "DATABASE_URL 不能为空"
            call :ask "  DATABASE_URL" "" "db_url"
        )
        set "use_builtin=false"
    ) else (
        call :ask "  PostgreSQL 用户名" "pg_user" "pg_user"
        call :ask "  PostgreSQL 密码" "pg_pass" "pg_pass"
        if "!pg_pass!"=="" (
            call :generate_random 16 pg_pass
            call :info "已自动生成随机密码"
        )
        call :ask "  PostgreSQL 数据库名" "pg_db" "pg_db"
        set "db_url=postgresql://!pg_user!:!pg_pass!@db:5432/!pg_db!"
        call :success "DATABASE_URL: !db_url!"
        set "use_builtin=true"
    )

    :: ── Step 3: NextAuth ──
    echo.
    echo ── Step 3/4: NextAuth 认证配置 ──
    call :ask "  NEXTAUTH_SECRET（密钥）" "auth_secret" "auth_secret"
    if "!auth_secret!"=="" (
        call :generate_random 32 auth_secret
        call :info "已自动生成 NEXTAUTH_SECRET"
    )
    call :ask "  NEXTAUTH_URL（站点地址）" "auth_url" "auth_url"

    :: ── Step 4: Aliyun OSS ──
    echo.
    echo ── Step 4/4: 阿里云 OSS（可选，回车跳过） ──
    call :ask "  OSS_REGION" "oss_region" "oss_region"
    call :ask "  OSS_BUCKET" "oss_bucket" "oss_bucket"
    call :ask "  OSS_ACCESS_KEY_ID" "oss_ak" "oss_ak"
    call :ask "  OSS_ACCESS_KEY_SECRET" "oss_sk" "oss_sk"
    call :ask "  OSS_ROLE_ARN" "oss_arn" "oss_arn"

    :: ── Write .env ──
    echo.
    (
        echo # 数据库
        echo DATABASE_URL="!db_url!"
        echo.
        if "!use_builtin!"=="true" (
            echo # 内置 PostgreSQL 配置
            echo POSTGRES_USER=!pg_user!
            echo POSTGRES_PASSWORD=!pg_pass!
            echo POSTGRES_DB=!pg_db!
            echo.
        )
        echo # NextAuth
        echo NEXTAUTH_SECRET="!auth_secret!"
        echo NEXTAUTH_URL="!auth_url!"
        echo.
        echo # 阿里云 OSS
        echo OSS_REGION="!oss_region!"
        echo OSS_BUCKET="!oss_bucket!"
        echo OSS_ACCESS_KEY_ID="!oss_ak!"
        echo OSS_ACCESS_KEY_SECRET="!oss_sk!"
        echo OSS_ROLE_ARN="!oss_arn!"
    ) > "%ENV_FILE%"

    call :success ".env 配置已保存"
    goto :eof

:: ── Actions ────────────────────────────────────────────────

:do_build
    call :info "开始构建 Docker 镜像..."
    docker compose build
    if errorlevel 1 (
        call :error "构建失败"
        goto :eof
    )
    call :success "镜像构建完成"
    goto :eof

:do_start
    call :get_db_mode
    if "!DB_MODE!"=="builtin" (
        call :info "启动服务（内置数据库模式）..."
        docker compose --profile builtin-db up -d
    ) else (
        call :info "启动服务（外部数据库模式）..."
        docker compose up -d
    )
    if errorlevel 1 (
        call :error "启动失败"
        goto :eof
    )
    call :success "服务已启动"
    call :do_status
    goto :eof

:do_stop
    call :info "停止服务..."
    docker compose --profile builtin-db down
    if errorlevel 1 (
        call :error "停止失败"
        goto :eof
    )
    call :success "服务已停止"
    goto :eof

:do_status
    echo.
    docker compose --profile builtin-db ps
    goto :eof

:do_logs
    echo 选择查看日志的服务:
    echo   1^) app   - 应用服务
    echo   2^) db    - 数据库服务
    echo   3^) 全部
    call :ask "请选择" "" "log_choice"
    if "!log_choice!"=="" set "log_choice=3"
    if "!log_choice!"=="1" (
        docker compose logs -f app
    ) else if "!log_choice!"=="2" (
        docker compose --profile builtin-db logs -f db
    ) else (
        docker compose --profile builtin-db logs -f
    )
    goto :eof

:do_migrate
    call :info "执行数据库迁移..."
    call :get_db_mode
    if "!DB_MODE!"=="builtin" (
        docker compose --profile builtin-db exec app npx prisma migrate deploy
    ) else (
        docker compose exec app npx prisma migrate deploy
    )
    if errorlevel 1 (
        call :error "迁移失败"
        goto :eof
    )
    call :success "数据库迁移完成"
    goto :eof

:: ── Main Menu ──────────────────────────────────────────────

:show_menu
    echo.
    echo ═══════════════════════════════════════════════
    echo        A Plain Blog - Docker 管理面板
    echo ═══════════════════════════════════════════════
    echo.
    echo   1^) 构建镜像
    echo   2^) 启动服务
    echo   3^) 停止服务
    echo   4^) 查看状态
    echo   5^) 查看日志
    echo   6^) 数据库迁移
    echo   7^) 重新配置
    echo   0^) 退出
    echo.
    goto :eof

:main
    call :check_docker
    if errorlevel 1 exit /b 1

    :: First run: auto configure
    if not exist "%ENV_FILE%" (
        call :warn "未检测到 .env 配置文件，进入配置向导"
        call :configure
        echo.
    )

    :menu_loop
    call :show_menu
    call :ask "请选择操作" "" "choice"
    if "!choice!"=="" set "choice=0"

    if "!choice!"=="1" call :do_build
    if "!choice!"=="2" call :do_start
    if "!choice!"=="3" call :do_stop
    if "!choice!"=="4" call :do_status
    if "!choice!"=="5" call :do_logs
    if "!choice!"=="6" call :do_migrate
    if "!choice!"=="7" call :configure
    if "!choice!"=="0" (
        call :info "再见！"
        exit /b 0
    )
    goto :menu_loop
